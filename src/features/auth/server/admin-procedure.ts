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

// Admin profile schema
export const adminProfileSchema = z.object({
  firstName: z.string().min(2).max(50),
  lastName: z.string().min(2).max(50),
  adminRole: z.enum(["super_admin", "admin", "manager", "staff"]),
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
  ),
  notes: z.string().optional(),
});

// Team management schemas
export const createTeamMemberSchema = z.object({
  name: z.string().min(2).max(100),
  email: z.string().email(),
  phone: z.string().regex(/^[+]?[0-9\s\-\(\)]{7,15}$/),
  role: z.enum(["admin", "staff", "teacher", "manager", "assistant", "coordinator"]),
  jobTitle: z.string().min(2).max(100),
  employmentType: z.enum(["full_time", "part_time", "contract", "volunteer", "consultant"]),
  hasSystemAccess: z.boolean().default(false),
});

export const updateTeamMemberSchema = createTeamMemberSchema.partial().extend({
  teamId: z.string(),
});

// Admin webhook schema
export const adminUserWebhookSchema = z.object({
  eventType: z.enum(["user.created", "user.updated"]),
  clerkUserId: z.string(),
  email: z.string(),
  firstName: z.string(),
  lastName: z.string(),
  adminRole: z.string().default("admin"),
  permissions: z.array(z.string()).default(["manage_orders"]),
});

export const adminUserRouter = createTRPCRouter({
  /**
   * Sync admin user from webhook
   * @deprecated Use team.syncAdminTeamMemberWebhook instead
   */
  syncAdminUserWebhook: baseProcedure
    .input(adminUserWebhookSchema)
    .mutation(async ({ input }) => {
      try {
        if (input.eventType === "user.created" || input.eventType === "user.updated") {
          const fullName = `${input.firstName} ${input.lastName}`.trim();
          
          // Check if admin team member already exists
          const existingTeamMember = await client.fetch(
            groq`*[_type == "team" && clerkId == $clerkId && role == "admin"][0]`,
            { clerkId: input.clerkUserId }
          );

          let syncedTeamMember;

          if (existingTeamMember) {
            // Update existing admin team member
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
            // Create new admin team member
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
        console.error("Failed to sync admin user:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to sync admin user",
        });
      }
    }),

  /**
   * Deactivate admin user from webhook
   * @deprecated Use team.deactivateAdminTeamMemberWebhook instead
   */
  deactivateAdminUserWebhook: baseProcedure
    .input(z.object({ clerkUserId: z.string() }))
    .mutation(async ({ input }) => {
      try {
        const adminTeamMemberToDeactivate = await client.fetch(
          groq`*[_type == "team" && clerkId == $clerkId && role == "admin"][0]`,
          { clerkId: input.clerkUserId }
        );

        if (!adminTeamMemberToDeactivate) {
          return { deactivated: false, message: "Admin team member not found in Sanity" };
        }

        // Deactivate the admin team member
        const deactivatedTeamMember = await client
          .patch(adminTeamMemberToDeactivate._id)
          .set({
            isActive: false,
          })
          .commit();

        return {
          deactivated: true,
          deactivatedId: adminTeamMemberToDeactivate._id,
          adminUser: deactivatedTeamMember,
        };
      } catch (error) {
        console.error("Failed to deactivate admin user:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to deactivate admin user",
        });
      }
    }),

  /**
   * Get admin user profile
   * @deprecated Use team.getAdminProfile instead
   */
  getProfile: adminProcedure.query(async ({ ctx }) => {
    const { auth } = ctx;
    try {
      const adminTeamMember = await client.fetch(
        groq`*[_type == "team" && clerkId == $clerkId && role == "admin"][0]`,
        { clerkId: auth.userId }
      );

      if (!adminTeamMember) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Admin user profile not found",
        });
      }

      // Return in the same format as before for backward compatibility
      return {
        _id: adminTeamMember._id,
        clerkUserId: adminTeamMember.clerkId,
        email: adminTeamMember.email,
        firstName: adminTeamMember.name?.split(' ')[0] || '',
        lastName: adminTeamMember.name?.split(' ').slice(1).join(' ') || '',
        adminRole: adminTeamMember.adminRole,
        permissions: adminTeamMember.permissions,
        status: adminTeamMember.isActive ? "active" : "deactivated",
        lastLoginAt: adminTeamMember.lastLoginAt,
        teamMember: {
          _id: adminTeamMember._id,
          name: adminTeamMember.name,
          jobTitle: adminTeamMember.jobTitle,
          role: adminTeamMember.role,
          email: adminTeamMember.email,
          phone: adminTeamMember.phone,
        }
      };
    } catch (error) {
      if (error instanceof TRPCError) {
        throw error;
      }
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to get admin user profile",
      });
    }
  }),

  /**
   * Update admin user profile
   */
  updateProfile: adminProcedure
    .input(adminProfileSchema)
    .mutation(async ({ input, ctx }) => {
      const { auth } = ctx;

      try {
        // Get the admin user
        const adminUser = await client.fetch(
          groq`*[_type == "adminUser" && clerkUserId == $clerkUserId][0]`,
          { clerkUserId: auth.userId }
        );

        if (!adminUser) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Admin user not found",
          });
        }

        // Update Clerk user
        const clerkClient = createClerkClient({
          secretKey: process.env.CLERK_SECRET_KEY,
        });

        if (!auth.userId) {
          throw new TRPCError({
            code: "UNAUTHORIZED",
            message: "User ID not found",
          });
        }

        await clerkClient.users.updateUser(auth.userId, {
          firstName: input.firstName,
          lastName: input.lastName,
        });

        // Update admin user in Sanity
        const updatedAdminUser = await client
          .patch(adminUser._id)
          .set({
            firstName: input.firstName,
            lastName: input.lastName,
            adminRole: input.adminRole,
            permissions: input.permissions,
            notes: input.notes,
          })
          .commit();

        // Update team member name if linked
        if (adminUser.teamMember?._ref) {
          await client
            .patch(adminUser.teamMember._ref)
            .set({
              name: `${input.firstName} ${input.lastName}`,
              updatedAt: new Date().toISOString(),
            })
            .commit();
        }

        return updatedAdminUser;
      } catch (error) {
        console.error("Failed to update admin user profile:", error);

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
   * @deprecated Use team.findAdminByClerkId instead
   */
  findByClerkId: baseProcedure
    .input(z.object({ clerkUserId: z.string() }))
    .query(async ({ input }) => {
      try {
        const adminTeamMember = await client.fetch(
          groq`*[_type == "team" && clerkId == $clerkId && role == "admin"][0]`,
          { clerkId: input.clerkUserId }
        );
        
        if (!adminTeamMember) {
          return null;
        }

        // Return in the same format as before for backward compatibility
        return {
          _id: adminTeamMember._id,
          clerkUserId: adminTeamMember.clerkId,
          email: adminTeamMember.email,
          firstName: adminTeamMember.name?.split(' ')[0] || '',
          lastName: adminTeamMember.name?.split(' ').slice(1).join(' ') || '',
          adminRole: adminTeamMember.adminRole,
          permissions: adminTeamMember.permissions,
          status: adminTeamMember.isActive ? "active" : "deactivated",
          lastLoginAt: adminTeamMember.lastLoginAt,
        };
      } catch (error) {
        console.error("Failed to find admin user by Clerk ID:", error);
        return null;
      }
    }),

  /**
   * Get all admin users (super admin only)
   */
  getAllAdmins: adminProcedure.query(async ({ ctx }) => {
    const { auth } = ctx;

    try {
      // Check if current user is super admin
      const currentAdmin = await client.fetch(
        groq`*[_type == "adminUser" && clerkUserId == $clerkUserId][0]`,
        { clerkUserId: auth.userId }
      );

      if (!currentAdmin || currentAdmin.adminRole !== "super_admin") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Only super admins can view all admin users",
        });
      }

      const adminUsers = await client.fetch(
        groq`*[_type == "adminUser" && status == "active"] | order(_createdAt desc) {
          ...,
          teamMember->{
            _id,
            name,
            jobTitle,
            role,
            email,
            phone,
            isActive
          }
        }`
      );

      return adminUsers;
    } catch (error) {
      if (error instanceof TRPCError) {
        throw error;
      }
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to fetch admin users",
      });
    }
  }),

  /**
   * Get all team members
   */
  getTeamMembers: adminProcedure.query(async ({ ctx }) => {
    try {
      const teamMembers = await client.fetch(
        groq`*[_type == "team"] | order(name asc) {
          ...,
          adminUser->{
            _id,
            firstName,
            lastName,
            adminRole,
            status,
            lastLoginAt
          }
        }`
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
    .input(createTeamMemberSchema)
    .mutation(async ({ input, ctx }) => {
      const { auth } = ctx;

      try {
        // Check if email already exists
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
          employmentInfo: {
            startDate: new Date().toISOString().split('T')[0],
            employmentType: input.employmentType,
          },
          isActive: true,
          hasSystemAccess: input.hasSystemAccess,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
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

        const updatedTeamMember = await client
          .patch(teamId)
          .set({
            ...updateData,
            updatedAt: new Date().toISOString(),
          })
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
          groq`*[_type == "team" && _id == $teamId][0]{
            ...,
            adminUser->{_id, clerkUserId}
          }`,
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
            hasSystemAccess: false,
            updatedAt: new Date().toISOString(),
          })
          .commit();

        // If they have system access, deactivate admin user too
        if (teamMember.adminUser?._id) {
          await client
            .patch(teamMember.adminUser._id)
            .set({
              status: "deactivated",
              deactivatedAt: new Date().toISOString(),
            })
            .commit();

          // Optionally, you could also delete/suspend the Clerk user
          // But that might be too aggressive for a team member deactivation
        }

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
   * @deprecated Use team.updateLastLogin instead
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

  /**
   * Manual admin conversion endpoint - converts existing customer to admin
   * IMMEDIATE FIX for webhook timing issue
   */
  convertToAdmin: baseProcedure
    .input(z.object({ 
      clerkUserId: z.string().optional(),
      email: z.string().email().optional() 
    }))
    .mutation(async ({ input, ctx }) => {
      try {
        const clerkClient = createClerkClient({
          secretKey: process.env.CLERK_SECRET_KEY,
        });

        let targetClerkUserId = input.clerkUserId;

        // If no clerkUserId provided, find by email
        if (!targetClerkUserId && input.email) {
          const users = await clerkClient.users.getUserList({
            emailAddress: [input.email],
          });
          
          if (users.data.length === 0) {
            throw new TRPCError({
              code: "NOT_FOUND",
              message: "No Clerk user found with this email",
            });
          }
          
          targetClerkUserId = users.data[0].id;
        }

        if (!targetClerkUserId) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Either clerkUserId or email must be provided",
          });
        }

        // Get the Clerk user to check metadata and get details
        const clerkUser = await clerkClient.users.getUser(targetClerkUserId);
        
        // Check if user has admin role in metadata
        const userRole = clerkUser.publicMetadata?.role as string || 
                        clerkUser.privateMetadata?.role as string ||
                        clerkUser.unsafeMetadata?.role as string;

        if (userRole !== "admin") {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: `User does not have admin role in Clerk metadata. Current role: ${userRole || "none"}`,
          });
        }

        // Check if admin user already exists
        const existingAdminUser = await client.fetch(
          groq`*[_type == "adminUser" && clerkUserId == $clerkUserId][0]`,
          { clerkUserId: targetClerkUserId }
        );

        if (existingAdminUser) {
          return {
            success: true,
            message: "User is already an admin",
            adminUser: existingAdminUser,
          };
        }

        // Find existing customer user
        const existingCustomerUser = await client.fetch(
          groq`*[_type == "user" && clerkUserId == $clerkUserId][0]`,
          { clerkUserId: targetClerkUserId }
        );

        // Create admin user
        const adminUser = await client.create({
          _id: `admin-${targetClerkUserId}`,
          _type: "adminUser",
          clerkUserId: targetClerkUserId,
          email: clerkUser.emailAddresses[0]?.emailAddress || "",
          firstName: clerkUser.firstName || "",
          lastName: clerkUser.lastName || "",
          adminRole: "admin",
          permissions: ["manage_orders"],
          status: "active",
          createdAt: new Date().toISOString(),
        });

        let teamMember = null;

        // Try to find and link to team member
        if (adminUser) {
          teamMember = await client.fetch(
            groq`*[_type == "team" && email == $email][0]`,
            { email: clerkUser.emailAddresses[0]?.emailAddress }
          );

          if (teamMember) {
            // Update team member to link to admin user
            await client
              .patch(teamMember._id)
              .set({
                adminUser: {
                  _type: "reference",
                  _ref: adminUser._id,
                },
                hasSystemAccess: true,
              })
              .commit();

            // Update admin user to reference team member
            await client
              .patch(adminUser._id)
              .set({
                teamMember: {
                  _type: "reference",
                  _ref: teamMember._id,
                },
              })
              .commit();
          } else {
            // Create team member for admin user
            teamMember = await client.create({
              _type: "team",
              name: `${clerkUser.firstName || ""} ${clerkUser.lastName || ""}`.trim() || clerkUser.emailAddresses[0]?.emailAddress || "Admin User",
              slug: {
                _type: "slug",
                current: `${(clerkUser.firstName || "").toLowerCase()}-${(clerkUser.lastName || "").toLowerCase()}-${Date.now()}`,
              },
              email: clerkUser.emailAddresses[0]?.emailAddress || "",
              role: "admin",
              jobTitle: "System Administrator",
              employmentInfo: {
                startDate: new Date().toISOString().split('T')[0],
                employmentType: "full_time",
              },
              isActive: true,
              hasSystemAccess: true,
              adminUser: {
                _type: "reference",
                _ref: adminUser._id,
              },
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            });

            // Update admin user to reference new team member
            await client
              .patch(adminUser._id)
              .set({
                teamMember: {
                  _type: "reference",
                  _ref: teamMember._id,
                },
              })
              .commit();
          }
        }

        // Clean up customer data if exists
        if (existingCustomerUser) {
          // Delete customer's cart
          const customerCart = await client.fetch(
            groq`*[_type == "cart" && user._ref == $userId][0]`,
            { userId: existingCustomerUser._id }
          );

          if (customerCart) {
            await client.delete(customerCart._id);
          }

          // Delete customer's addresses
          const customerAddresses = await client.fetch(
            groq`*[_type == "address" && user._ref == $userId]`,
            { userId: existingCustomerUser._id }
          );

          for (const address of customerAddresses) {
            await client.delete(address._id);
          }

          // Deactivate customer user
          await client
            .patch(existingCustomerUser._id)
            .set({
              status: "deactivated",
              deactivatedAt: new Date().toISOString(),
              deactivationReason: "converted_to_admin",
            })
            .commit();
        }

        return {
          success: true,
          message: "Successfully converted user to admin",
          adminUser,
          teamMember,
          cleanedUpCustomer: !!existingCustomerUser,
        };
      } catch (error) {
        console.error("Failed to convert user to admin:", error);
        
        if (error instanceof TRPCError) {
          throw error;
        }
        
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to convert user to admin",
        });
      }
    }),
});