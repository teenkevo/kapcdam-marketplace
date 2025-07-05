import { defineType, defineField } from "sanity";

export const team = defineType({
  name: "team",
  title: "KAPCDAM People",
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
      fields: [
        {
          name: "alt",
          type: "string",
          title: "Alternative Text",
          description: "Describe this photo for accessibility",
        },
      ],
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
      name: "department",
      title: "Department",
      type: "string",
      description: "Department or area of work",
      options: {
        list: [
          { title: "Training & Education", value: "training" },
          { title: "Administration", value: "administration" },
          { title: "Operations", value: "operations" },
          { title: "Finance", value: "finance" },
          { title: "Marketing", value: "marketing" },
          { title: "Sales", value: "sales" },
          { title: "Customer Service", value: "customer_service" },
          { title: "General", value: "general" },
        ],
        layout: "dropdown",
      },
      validation: (rule) => rule.required().error("Department is required"),
    }),

    defineField({
      name: "teachingInfo",
      title: "Teaching Information",
      type: "object",
      description: "Information specific to teaching roles",
      hidden: ({ document }) => document?.role !== "teacher",
      fields: [
        defineField({
          name: "specializations",
          title: "Teaching Specializations",
          type: "array",
          description: "Areas of expertise for teaching",
          of: [
            {
              type: "string",
              options: {
                list: [
                  { title: "Dressmaking", value: "dressmaking" },
                  { title: "Tailoring", value: "tailoring" },
                  { title: "Soap Making", value: "soap_making" },
                  { title: "Candle Making", value: "candle_making" },
                  { title: "Embroidery", value: "embroidery" },
                  { title: "Pattern Making", value: "pattern_making" },
                  { title: "Fashion Design", value: "fashion_design" },
                  { title: "Business Skills", value: "business_skills" },
                  { title: "General Crafts", value: "general_crafts" },
                ],
              },
            },
          ],
          validation: (rule) =>
            rule
              .min(1)
              .error("At least one specialization is required for teachers"),
        }),

        defineField({
          name: "experience",
          title: "Teaching Experience",
          type: "string",
          description:
            "Years of teaching experience (e.g., '5 years', '10+ years')",
        }),

        defineField({
          name: "qualifications",
          title: "Qualifications",
          type: "array",
          description: "Teaching qualifications and certifications",
          of: [{ type: "string" }],
        }),

        defineField({
          name: "bio",
          title: "Teacher Biography",
          type: "text",
          description: "Brief biography for public display",
          rows: 4,
        }),

        defineField({
          name: "availability",
          title: "Teaching Availability",
          type: "object",
          description: "When this teacher is available for courses",
          fields: [
            defineField({
              name: "isAvailable",
              title: "Currently Available",
              type: "boolean",
              description:
                "Is this teacher currently available for new courses?",
              initialValue: true,
            }),
         
            defineField({
              name: "workingDays",
              title: "Working Days",
              type: "array",
              description: "Days of the week this teacher is available",
              of: [
                {
                  type: "string",
                  options: {
                    list: [
                      { title: "Monday", value: "monday" },
                      { title: "Tuesday", value: "tuesday" },
                      { title: "Wednesday", value: "wednesday" },
                      { title: "Thursday", value: "thursday" },
                      { title: "Friday", value: "friday" },
                      { title: "Saturday", value: "saturday" },
                      { title: "Sunday", value: "sunday" },
                    ],
                  },
                },
              ],
            }),
            defineField({
              name: "notes",
              title: "Availability Notes",
              type: "text",
              description: "Additional notes about availability",
              rows: 2,
            }),
          ],
        }),
      ],
    }),

    defineField({
      name: "emergencyContact",
      title: "Emergency Contact",
      type: "object",
      description: "Emergency contact information",
      fields: [
        defineField({
          name: "name",
          title: "Emergency Contact Name",
          type: "string",
        }),
        defineField({
          name: "relationship",
          title: "Relationship",
          type: "string",
          description: "Relationship to team member",
        }),
        defineField({
          name: "phone",
          title: "Emergency Contact Phone",
          type: "string",
        }),
      ],
    }),

    defineField({
      name: "address",
      title: "Address",
      type: "object",
      description: "Home address",
      fields: [
        defineField({
          name: "street",
          title: "Street Address",
          type: "string",
        }),
        defineField({
          name: "city",
          title: "City",
          type: "string",
          initialValue: "Kampala",
        }),
        defineField({
          name: "district",
          title: "District",
          type: "string",
          description: "District/area (e.g., Makindye, Nakawa)",
        }),
        defineField({
          name: "country",
          title: "Country",
          type: "string",
          initialValue: "Uganda",
          readOnly: true,
        }),
      ],
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
    }),

    defineField({
      name: "updatedAt",
      title: "Last Updated",
      type: "datetime",
      description: "Last modification timestamp",
      validation: (rule) =>
        rule.required().error("Updated at timestamp is required"),
      initialValue: () => new Date().toISOString(),
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
    prepare({
      name,
      role,
      jobTitle,
      department,
      isActive,
      photo,
    }) {
      const statusInfo = !isActive ? " (Inactive)" : "";

  


      const departmentInfo = department ? ` • ${department}` : "";

      return {
        title: `${name}${statusInfo}`,
        subtitle: `${jobTitle} (${role})${departmentInfo}`,
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
      title: "Department",
      name: "department",
      by: [
        { field: "department", direction: "asc" },
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
