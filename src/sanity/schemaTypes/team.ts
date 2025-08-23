import { defineType, defineField } from "sanity";

export const team = defineType({
  name: "team",
  title: "KAPCDAM Team",
  type: "document",
  description:
    "KAPCDAM team members including staff, admins, teachers, and other personnel",
  fields: [
    defineField({
      name: "name",
      title: "Full Name",
      type: "string",
      description: "Full name of the team member",
      validation: (rule) =>
        rule
          .required()
          .min(2)
          .max(100)
          .error("Full name is required (2-100 characters)"),
    }),

    defineField({
      name: "clerkId",
      title: "Clerk User ID",
      type: "string",
      description: "Unique identifier from Clerk authentication (required for admin role)",
      validation: (rule) =>
        rule.custom(async (value, context) => {
          const { document } = context;
          
          // clerkId is required if role is admin
          if (document?.role === "admin" && !value) {
            return "Clerk User ID is required for admin users";
          }
          
          // Check for uniqueness if clerkId is provided
          if (value) {
            const { getClient } = context;
            const client = getClient({ apiVersion: "2025-02-06" });
            const currentId = document?._id?.replace(/^drafts\./, "") || "";
            
            const existingClerkUsers = await client.fetch(
              `count(*[_type == "team" && clerkId == $clerkId && !(_id in [$draftId, $publishedId])])`,
              {
                clerkId: value,
                draftId: `drafts.${currentId}`,
                publishedId: currentId,
              }
            );

            if (existingClerkUsers > 0) {
              return `A team member with Clerk ID "${value}" already exists.`;
            }
          }
          
          return true;
        }),
    }),

    defineField({
      name: "slug",
      title: "URL Slug",
      type: "slug",
      description: "URL-friendly identifier",
      options: {
        source: "name",
        maxLength: 96,
      },
      validation: (rule) => rule.required().error("URL slug is required"),
    }),

    defineField({
      name: "email",
      title: "Email Address",
      type: "email",
      description: "Work email address",
    }),

    defineField({
      name: "phone",
      title: "Phone Number",
      type: "string",
      description: "Primary contact phone number",
      validation: (rule) =>
        rule
          .regex(/^[+]?[0-9\s\-\(\)]{7,15}$/)
          .error("Enter a valid phone number"),
    }),

    defineField({
      name: "photo",
      title: "Profile Photo",
      type: "image",
      description: "Profile photo of the team member",
      options: {
        hotspot: true,
      },
    }),

    defineField({
      name: "role",
      title: "Role Type",
      type: "string",
      description: "Primary role/position type",
      options: {
        list: [
          { title: "Admin", value: "admin" },
          { title: "Staff", value: "staff" },
          { title: "Teacher", value: "teacher" },
          { title: "Manager", value: "manager" },
          { title: "Assistant", value: "assistant" },
          { title: "Coordinator", value: "coordinator" },
        ],
        layout: "dropdown",
      },
      validation: (rule) => rule.required().error("Role type is required"),
    }),

    // Admin-specific fields (only shown for admin role)
    defineField({
      name: "adminRole",
      title: "Admin Role",
      type: "string",
      description: "Type of admin access level",
      options: {
        list: [
          { title: "Super Admin", value: "super_admin" },
          { title: "Admin", value: "admin" },
          { title: "Manager", value: "manager" },
          { title: "Staff", value: "staff" },
        ],
        layout: "dropdown",
      },
      hidden: ({ document }) => document?.role !== "admin",
      validation: (rule) =>
        rule.custom((value, context) => {
          const { document } = context;
          if (document?.role === "admin" && !value) {
            return "Admin role is required for admin users";
          }
          return true;
        }),
      initialValue: "admin",
    }),

    defineField({
      name: "permissions",
      title: "Admin Permissions",
      type: "array",
      description: "Specific admin permissions",
      of: [
        {
          type: "string",
          options: {
            list: [
              { title: "Manage Orders", value: "manage_orders" },
              { title: "Manage Products", value: "manage_products" },
              { title: "Manage Users", value: "manage_users" },
              { title: "Manage Content", value: "manage_content" },
              { title: "Manage Team", value: "manage_team" },
              { title: "View Reports", value: "view_reports" },
              { title: "System Settings", value: "system_settings" },
            ],
          },
        },
      ],
      hidden: ({ document }) => document?.role !== "admin",
      initialValue: ["manage_orders"],
    }),

    defineField({
      name: "lastLoginAt",
      title: "Last Login",
      type: "datetime",
      description: "When the admin user last logged in",
      hidden: ({ document }) => document?.role !== "admin",
      readOnly: true,
    }),

    defineField({
      name: "jobTitle",
      title: "Job Title",
      type: "string",
      description:
        "Specific job title (e.g., 'Senior Dressmaking Instructor', 'Operations Manager')",
      validation: (rule) =>
        rule.min(2).max(100).error("Job title must be 2-100 characters"),
    }),

    defineField({
      name: "employmentInfo",
      title: "Employment Information",
      type: "object",
      description: "Employment details",
      fields: [
        defineField({
          name: "startDate",
          title: "Start Date",
          type: "date",
          description: "When this person started working at KAPCDAM",
        }),
        defineField({
          name: "employmentType",
          title: "Employment Type",
          type: "string",
          options: {
            list: [
              { title: "Full-time", value: "full_time" },
              { title: "Part-time", value: "part_time" },
              { title: "Contract", value: "contract" },
              { title: "Volunteer", value: "volunteer" },
              { title: "Consultant", value: "consultant" },
            ],
            layout: "dropdown",
          },
        }),
      ],
    }),

    defineField({
      name: "isActive",
      title: "Active Status",
      type: "boolean",
      description: "Is this person currently active at KAPCDAM?",
      initialValue: true,
      validation: (rule) => rule.required(),
    }),

    defineField({
      name: "notes",
      title: "Internal Notes",
      type: "text",
      description: "Internal admin notes about this person",
      rows: 3,
    }),
  ],

  preview: {
    select: {
      name: "name",
      role: "role",
      jobTitle: "jobTitle",
      adminRole: "adminRole",
      email: "email",
      isActive: "isActive",
      photo: "photo",
      clerkId: "clerkId",
    },
    prepare({ name, role, jobTitle, adminRole, isActive, photo, clerkId }) {
      const statusInfo = !isActive ? " (Inactive)" : "";
      const clerkInfo = clerkId ? " (Clerk)" : "";
      
      // For admin users, show adminRole instead of jobTitle if available
      const displayRole = role === "admin" && adminRole ? adminRole : jobTitle || role;

      return {
        title: `${name}${statusInfo}${clerkInfo}`,
        subtitle: `${displayRole} - ${role}`,
        media: photo,
      };
    },
  },

  orderings: [
    {
      title: "Name A-Z",
      name: "nameAsc",
      by: [{ field: "name", direction: "asc" }],
    },
    {
      title: "Role",
      name: "role",
      by: [
        { field: "role", direction: "asc" },
        { field: "name", direction: "asc" },
      ],
    },

    {
      title: "Teachers Only",
      name: "teachersOnly",
      by: [{ field: "name", direction: "asc" }],
    },
    {
      title: "Recently Added",
      name: "recentlyAdded",
      by: [{ field: "createdAt", direction: "desc" }],
    },
    {
      title: "Start Date",
      name: "startDate",
      by: [{ field: "employmentInfo.startDate", direction: "desc" }],
    },
  ],
});
