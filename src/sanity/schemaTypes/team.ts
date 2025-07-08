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
      validation: (rule) =>
        rule.required().error("Valid email address is required"),
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

    defineField({
      name: "jobTitle",
      title: "Job Title",
      type: "string",
      description:
        "Specific job title (e.g., 'Senior Dressmaking Instructor', 'Operations Manager')",
      validation: (rule) =>
        rule.required().min(2).max(100).error("Job title is required"),
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

    defineField({
      name: "createdAt",
      title: "Record Created",
      type: "datetime",
      description: "When this record was created",
      validation: (rule) =>
        rule.required().error("Created at timestamp is required"),
      initialValue: () => new Date().toISOString(),
      readOnly: true,
    }),

    defineField({
      name: "updatedAt",
      title: "Last Updated",
      type: "datetime",
      description: "Last modification timestamp",
      validation: (rule) =>
        rule.required().error("Updated at timestamp is required"),
      initialValue: () => new Date().toISOString(),
      readOnly: true,
    }),
  ],

  preview: {
    select: {
      name: "name",
      role: "role",
      jobTitle: "jobTitle",
      department: "department",
      email: "email",
      isActive: "isActive",
      photo: "photo",
    },
    prepare({ name, role, jobTitle, isActive, photo }) {
      const statusInfo = !isActive ? " (Inactive)" : "";

      return {
        title: `${name}${statusInfo}`,
        subtitle: `${jobTitle} - ${role}`,
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
