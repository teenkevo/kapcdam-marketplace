import { TRPCError } from "@trpc/server";
import {
  createTRPCRouter,
  protectedProcedure,
  baseProcedure,
  adminProcedure,
} from "@/trpc/init";
import { z } from "zod";
import { client } from "@/sanity/lib/client";
import { groq } from "next-sanity";
import { createClerkClient } from "@clerk/nextjs/server";

// Team member schemas
export const teamMemberSchema = z.object({
  name: z.string().min(2).max(100),
  email: z.string().email().optional(),
  phone: z.string().regex(/^[+]?[0-9\s\-\(\)]{7,15}$/).optional(),
  role: z.enum(["admin", "staff", "teacher", "manager", "assistant", "coordinator"]),
  jobTitle: z.string().min(2).max(100).optional(),
  employmentType: z.enum(["full_time", "part_time", "contract", "volunteer", "consultant"]).optional(),
  clerkId: z.string().optional(),
  adminRole: z.enum(["super_admin", "admin", "manager", "staff"]).optional(),
  permissions: z.array(
    z.enum([
      "manage_orders",
      "manage_products", 
      "manage_users",
      "manage_content",
      "manage_team",
      "view_reports",
      "system_settings",
    ])
  ).optional(),
  notes: z.string().optional(),
});

export const updateTeamMemberSchema = teamMemberSchema.partial().extend({
  teamId: z.string(),
});

// Admin webhook schema - now for team members
export const teamAdminWebhookSchema = z.object({
  eventType: z.enum(["user.created", "user.updated"]),
  clerkUserId: z.string(),
  email: z.string(),
  firstName: z.string(),
  lastName: z.string(),
  adminRole: z.string().default("admin"),
  permissions: z.array(z.string()).default(["manage_orders"]),
});

export const teamRouter = createTRPCRouter({
  /**
   * Sync admin user as team member from webhook
   */
  syncAdminTeamMemberWebhook: baseProcedure
    .input(teamAdminWebhookSchema)
    .mutation(async ({ input }) => {
      try {
        if (input.eventType === "user.created" || input.eventType === "user.updated") {
          const fullName = `${input.firstName} ${input.lastName}`.trim();
          
          // Check if team member with this clerkId already exists
          const existingTeamMember = await client.fetch(
            groq`*[_type == "team" && clerkId == $clerkId][0]`,
            { clerkId: input.clerkUserId }
          );

          let syncedTeamMember;

          if (existingTeamMember) {
            // Update existing team member
            syncedTeamMember = await client
              .patch(existingTeamMember._id)
              .set({
                name: fullName,
                email: input.email,
                adminRole: input.adminRole,
                permissions: input.permissions,
                isActive: true,
              })
              .commit();
          } else {
            // Create new team member for admin
            syncedTeamMember = await client.create({
              _id: `team-admin-${input.clerkUserId}`,
              _type: "team",
              name: fullName,
              slug: {
                _type: "slug",
                current: `${fullName.toLowerCase().replace(/\s+/g, '-')}-${Date.now()}`,
              },
              clerkId: input.clerkUserId,
              email: input.email,
              role: "admin",
              adminRole: input.adminRole,
              permissions: input.permissions,
              jobTitle: "System Administrator",
              employmentInfo: {
                startDate: new Date().toISOString().split('T')[0],
                employmentType: "full_time",
              },
              isActive: true,
            });
          }

          return syncedTeamMember;
        }

        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Unexpected event type",
        });
      } catch (error) {
        console.error("Failed to sync admin team member:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to sync admin team member",
        });
      }
    }),

  /**
   * Deactivate admin team member from webhook
   */
  deactivateAdminTeamMemberWebhook: baseProcedure
    .input(z.object({ clerkUserId: z.string() }))
    .mutation(async ({ input }) => {
      try {
        const teamMemberToDeactivate = await client.fetch(
          groq`*[_type == "team" && clerkId == $clerkId][0]`,
          { clerkId: input.clerkUserId }
        );

        if (!teamMemberToDeactivate) {
          return { deactivated: false, message: "Admin team member not found in Sanity" };
        }

        // Deactivate the team member
        const deactivatedTeamMember = await client
          .patch(teamMemberToDeactivate._id)
          .set({
            isActive: false,
          })
          .commit();

        return {
          deactivated: true,
          deactivatedId: teamMemberToDeactivate._id,
          teamMember: deactivatedTeamMember,
        };
      } catch (error) {
        console.error("Failed to deactivate admin team member:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to deactivate admin team member",
        });
      }
    }),

  /**
   * Find admin team member by Clerk ID
   */
  findAdminByClerkId: baseProcedure
    .input(z.object({ clerkUserId: z.string() }))
    .query(async ({ input }) => {
      try {
        const teamMember = await client.fetch(
          groq`*[_type == "team" && clerkId == $clerkId && role == "admin"][0]`,
          { clerkId: input.clerkUserId }
        );
        return teamMember || null;
      } catch (error) {
        console.error("Failed to find admin team member by Clerk ID:", error);
        return null;
      }
    }),

  /**
   * Get admin profile (from team collection)
   */
  getAdminProfile: adminProcedure.query(async ({ ctx }) => {
    const { auth } = ctx;
    try {
      const adminTeamMember = await client.fetch(
        groq`*[_type == "team" && clerkId == $clerkId && role == "admin"][0]`,
        { clerkId: auth.userId }
      );

      if (!adminTeamMember) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Admin profile not found",
        });
      }

      return adminTeamMember;
    } catch (error) {
      if (error instanceof TRPCError) {
        throw error;
      }
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to get admin profile",
      });
    }
  }),

  /**
   * Update admin profile (team member with admin role)
   */
  updateAdminProfile: adminProcedure
    .input(teamMemberSchema.partial())
    .mutation(async ({ input, ctx }) => {
      const { auth } = ctx;

      try {
        // Get the admin team member
        const adminTeamMember = await client.fetch(
          groq`*[_type == "team" && clerkId == $clerkId && role == "admin"][0]`,
          { clerkId: auth.userId }
        );

        if (!adminTeamMember) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Admin team member not found",
          });
        }

        // Update Clerk user if name fields provided
        if (input.name) {
          const clerkClient = createClerkClient({
            secretKey: process.env.CLERK_SECRET_KEY,
          });

          if (!auth.userId) {
            throw new TRPCError({
              code: "UNAUTHORIZED",
              message: "User ID not found",
            });
          }

          const [firstName, ...lastNameParts] = input.name.split(' ');
          const lastName = lastNameParts.join(' ');

          await clerkClient.users.updateUser(auth.userId, {
            firstName: firstName || '',
            lastName: lastName || '',
          });
        }

        // Update team member in Sanity
        const updatedTeamMember = await client
          .patch(adminTeamMember._id)
          .set({
            ...input,
          })
          .commit();

        return updatedTeamMember;
      } catch (error) {
        console.error("Failed to update admin profile:", error);

        if (error instanceof TRPCError) {
          throw error;
        }

        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to update admin profile",
        });
      }
    }),

  /**
   * Get all admin team members
   */
  getAllAdmins: adminProcedure.query(async ({ ctx }) => {
    const { auth } = ctx;

    try {
      // Check if current user is super admin
      const currentAdmin = await client.fetch(
        groq`*[_type == "team" && clerkId == $clerkId && role == "admin"][0]`,
        { clerkId: auth.userId }
      );

      if (!currentAdmin || currentAdmin.adminRole !== "super_admin") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Only super admins can view all admin users",
        });
      }

      const adminTeamMembers = await client.fetch(
        groq`*[_type == "team" && role == "admin" && isActive == true] | order(_createdAt desc)`
      );

      return adminTeamMembers;
    } catch (error) {
      if (error instanceof TRPCError) {
        throw error;
      }
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to fetch admin team members",
      });
    }
  }),

  /**
   * Get all team members
   */
  getTeamMembers: adminProcedure.query(async ({ ctx }) => {
    try {
      const teamMembers = await client.fetch(
        groq`*[_type == "team"] | order(name asc)`
      );

      return teamMembers;
    } catch (error) {
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to fetch team members",
      });
    }
  }),

  /**
   * Create team member
   */
  createTeamMember: adminProcedure
    .input(teamMemberSchema)
    .mutation(async ({ input, ctx }) => {
      const { auth } = ctx;

      try {
        // Check if email already exists (if provided)
        if (input.email) {
          const existingTeamMember = await client.fetch(
            groq`*[_type == "team" && email == $email][0]`,
            { email: input.email }
          );

          if (existingTeamMember) {
            throw new TRPCError({
              code: "BAD_REQUEST",
              message: "Team member with this email already exists",
            });
          }
        }

        // Check if clerkId already exists (if provided)
        if (input.clerkId) {
          const existingClerkTeamMember = await client.fetch(
            groq`*[_type == "team" && clerkId == $clerkId][0]`,
            { clerkId: input.clerkId }
          );

          if (existingClerkTeamMember) {
            throw new TRPCError({
              code: "BAD_REQUEST",
              message: "Team member with this Clerk ID already exists",
            });
          }
        }

        const newTeamMember = await client.create({
          _type: "team",
          name: input.name,
          slug: {
            _type: "slug",
            current: `${input.name.toLowerCase().replace(/\s+/g, '-')}-${Date.now()}`,
          },
          email: input.email,
          phone: input.phone,
          role: input.role,
          jobTitle: input.jobTitle,
          clerkId: input.clerkId,
          adminRole: input.adminRole,
          permissions: input.permissions,
          employmentInfo: input.employmentType ? {
            startDate: new Date().toISOString().split('T')[0],
            employmentType: input.employmentType,
          } : undefined,
          isActive: true,
          notes: input.notes,
        });

        return newTeamMember;
      } catch (error) {
        if (error instanceof TRPCError) {
          throw error;
        }
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to create team member",
        });
      }
    }),

  /**
   * Update team member
   */
  updateTeamMember: adminProcedure
    .input(updateTeamMemberSchema)
    .mutation(async ({ input, ctx }) => {
      try {
        const { teamId, ...updateData } = input;

        // Check if team member exists
        const teamMember = await client.fetch(
          groq`*[_type == "team" && _id == $teamId][0]`,
          { teamId }
        );

        if (!teamMember) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Team member not found",
          });
        }

        // If email is being changed, check for conflicts
        if (updateData.email && updateData.email !== teamMember.email) {
          const existingTeamMember = await client.fetch(
            groq`*[_type == "team" && email == $email && _id != $teamId][0]`,
            { email: updateData.email, teamId }
          );

          if (existingTeamMember) {
            throw new TRPCError({
              code: "BAD_REQUEST",
              message: "Team member with this email already exists",
            });
          }
        }

        // If clerkId is being changed, check for conflicts
        if (updateData.clerkId && updateData.clerkId !== teamMember.clerkId) {
          const existingClerkTeamMember = await client.fetch(
            groq`*[_type == "team" && clerkId == $clerkId && _id != $teamId][0]`,
            { clerkId: updateData.clerkId, teamId }
          );

          if (existingClerkTeamMember) {
            throw new TRPCError({
              code: "BAD_REQUEST",
              message: "Team member with this Clerk ID already exists",
            });
          }
        }

        const updatedTeamMember = await client
          .patch(teamId)
          .set(updateData)
          .commit();

        return updatedTeamMember;
      } catch (error) {
        if (error instanceof TRPCError) {
          throw error;
        }
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to update team member",
        });
      }
    }),

  /**
   * Deactivate team member
   */
  deactivateTeamMember: adminProcedure
    .input(z.object({ teamId: z.string() }))
    .mutation(async ({ input, ctx }) => {
      try {
        const teamMember = await client.fetch(
          groq`*[_type == "team" && _id == $teamId][0]`,
          { teamId: input.teamId }
        );

        if (!teamMember) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Team member not found",
          });
        }

        // Deactivate team member
        const updatedTeamMember = await client
          .patch(input.teamId)
          .set({
            isActive: false,
          })
          .commit();

        return updatedTeamMember;
      } catch (error) {
        if (error instanceof TRPCError) {
          throw error;
        }
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to deactivate team member",
        });
      }
    }),

  /**
   * Update admin user's last login
   */
  updateLastLogin: baseProcedure
    .input(z.object({ clerkUserId: z.string() }))
    .mutation(async ({ input }) => {
      try {
        const adminTeamMember = await client.fetch(
          groq`*[_type == "team" && clerkId == $clerkId && role == "admin"][0]`,
          { clerkId: input.clerkUserId }
        );

        if (adminTeamMember) {
          await client
            .patch(adminTeamMember._id)
            .set({
              lastLoginAt: new Date().toISOString(),
            })
            .commit();
        }

        return { success: true };
      } catch (error) {
        // Don't throw error for this - it's not critical
        console.error("Failed to update admin last login:", error);
        return { success: false };
      }
    }),
});