import { defineType, defineField, defineArrayMember } from "sanity";

export const courseBooking = defineType({
  name: "courseBooking",
  title: "Course Booking",
  type: "document",
  description:
    "Individual course bookings for students - tracks scheduling, progress, and completion",
  fields: [
    defineField({
      name: "order",
      title: "Order",
      type: "reference",
      description:
        "Reference to the order that created this booking (financial link)",
      to: [{ type: "order" }],
      validation: (rule) =>
        rule.required().error("Order reference is required"),
    }),

    defineField({
      name: "course",
      title: "Course",
      type: "reference",
      description: "Reference to the course being booked",
      to: [{ type: "course" }],
      validation: (rule) =>
        rule.required().error("Course reference is required"),
    }),

    defineField({
      name: "student",
      title: "Student",
      type: "reference",
      description: "Reference to the customer (Clerk user) taking the course",
      to: [{ type: "user" }],
      validation: (rule) =>
        rule.required().error("Student reference is required"),
    }),

    defineField({
      name: "bookingDate",
      title: "Booking Date",
      type: "datetime",
      description: "When this booking was made",
      validation: (rule) => rule.required().error("Booking date is required"),
      initialValue: () => new Date().toISOString(),
    }),
    defineField({
      name: "preferredStartDate",
      title: "Preferred Start Date",
      type: "datetime",
      description: "Customer's preferred start date for the course",
      validation: (rule) =>
        rule.required().error("Preferred start date is required"),
    }),

    defineField({
      name: "actualStartDate",
      title: "Actual Start Date",
      type: "datetime",
      description: "KAPCDAM confirmed start date",
    }),

    defineField({
      name: "endDate",
      title: "End Date",
      type: "datetime",
      description: "Calculated end date (start + duration)",
    }),

    defineField({
      name: "assignedTeacher",
      title: "Assigned Teacher",
      type: "reference",
      description: "Teacher assigned to this course booking",
      to: [{ type: "team" }],
    }),
    defineField({
      name: "status",
      title: "Booking Status",
      type: "string",
      description: "Current status of this course booking",
      options: {
        list: [
          { title: "Pending", value: "pending" },
          { title: "Scheduled", value: "scheduled" },
          { title: "In Progress", value: "in_progress" },
          { title: "Completed", value: "completed" },
          { title: "Cancelled", value: "cancelled" },
          { title: "Postponed", value: "postponed" },
        ],
        layout: "dropdown",
      },
      validation: (rule) => rule.required().error("Booking status is required"),
      initialValue: "pending",
    }),

    defineField({
      name: "attendanceRecords",
      title: "Attendance Records",
      type: "array",
      description: "Track lesson dates and student attendance",
      of: [
        defineArrayMember({
          type: "object",
          title: "Attendance Record",
          fields: [
            defineField({
              name: "lessonDate",
              title: "Lesson Date",
              type: "datetime",
              description: "Date and time of the lesson",
              validation: (rule) =>
                rule.required().error("Lesson date is required"),
            }),
            defineField({
              name: "attended",
              title: "Student Attended",
              type: "boolean",
              description: "Did the student attend this lesson?",
              initialValue: false,
            }),
            defineField({
              name: "lessonTopic",
              title: "Lesson Topic",
              type: "string",
              description: "What was covered in this lesson",
            }),
            defineField({
              name: "duration",
              title: "Lesson Duration",
              type: "string",
              description: "How long the lesson lasted (e.g., '2 hours')",
            }),
            defineField({
              name: "notes",
              title: "Lesson Notes",
              type: "text",
              description: "Additional notes about this lesson",
              rows: 2,
            }),
          ],
          preview: {
            select: {
              date: "lessonDate",
              attended: "attended",
              topic: "lessonTopic",
              duration: "duration",
            },
            prepare({ date, attended, topic, duration }) {
              const formattedDate = date
                ? new Date(date).toLocaleDateString()
                : "No date";
              const topicInfo = topic ? ` • ${topic}` : "";
              const durationInfo = duration ? ` • ${duration}` : "";

              return {
                title: `${formattedDate}${topicInfo}`,
                subtitle: `${attended ? "Attended" : "Absent"}${durationInfo}`,
              };
            },
          },
        }),
      ],
    }),

    defineField({
      name: "progressNotes",
      title: "Progress Notes",
      type: "array",
      description: "Teacher notes on student progress throughout the course",
      of: [
        defineArrayMember({
          type: "object",
          title: "Progress Note",
          fields: [
            defineField({
              name: "date",
              title: "Date",
              type: "datetime",
              description: "When this note was made",
              validation: (rule) => rule.required().error("Date is required"),
              initialValue: () => new Date().toISOString(),
            }),
            defineField({
              name: "note",
              title: "Progress Note",
              type: "text",
              description: "Teacher's note about student progress",
              rows: 3,
              validation: (rule) =>
                rule.required().error("Progress note is required"),
            }),
            defineField({
              name: "skillLevel",
              title: "Current Skill Level",
              type: "string",
              description: "Student's current skill level assessment",
              options: {
                list: [
                  { title: "Struggling", value: "struggling" },
                  { title: "Progressing", value: "progressing" },
                  { title: "Good", value: "good" },
                  { title: "Excellent", value: "excellent" },
                ],
                layout: "dropdown",
              },
            }),
            defineField({
              name: "addedBy",
              title: "Added By",
              type: "reference",
              description: "Teacher who added this note",
              to: [{ type: "team" }],
            }),
          ],
          preview: {
            select: {
              date: "date",
              note: "note",
              skillLevel: "skillLevel",
              teacherName: "addedBy.name",
            },
            prepare({ date, note, skillLevel, teacherName }) {
              const formattedDate = date
                ? new Date(date).toLocaleDateString()
                : "No date";

              return {
                title: `${formattedDate} ${skillLevel || "No assessment"}`,
                subtitle: `${teacherName || "Unknown teacher"} • ${note?.substring(0, 50) || "No note"}${note?.length > 50 ? "..." : ""}`,
              };
            },
          },
        }),
      ],
    }),

    defineField({
      name: "completionCertificate",
      title: "Completion Certificate",
      type: "file",
      description: "Certificate file for completed courses",
      hidden: ({ document }) => document?.status !== "completed",
    }),

    defineField({
      name: "notes",
      title: "Internal Notes",
      type: "text",
      description: "Internal admin notes about this booking",
      rows: 3,
    }),

    defineField({
      name: "cancelReason",
      title: "Cancellation Reason",
      type: "text",
      description: "Why this booking was cancelled",
      rows: 2,
      hidden: ({ document }) => document?.status !== "cancelled",
    }),

    defineField({
      name: "postponedFrom",
      title: "Postponed From",
      type: "datetime",
      description: "Original start date if course was postponed",
      hidden: ({ document }) => document?.status !== "postponed",
    }),

    defineField({
      name: "postponeReason",
      title: "Postpone Reason",
      type: "text",
      description: "Why this booking was postponed",
      rows: 2,
      hidden: ({ document }) => document?.status !== "postponed",
    }),

    defineField({
      name: "courseSnapshot",
      title: "Course Snapshot",
      type: "object",
      description: "Snapshot of course data at time of booking",
      fields: [
        defineField({
          name: "title",
          title: "Course Title",
          type: "string",
          description: "Course name at time of booking",
        }),
        defineField({
          name: "price",
          title: "Course Price",
          type: "number",
          description: "Course price at time of booking",
        }),
        defineField({
          name: "duration",
          title: "Course Duration",
          type: "string",
          description: "Course duration at time of booking",
        }),
        defineField({
          name: "totalHours",
          title: "Total Hours",
          type: "string",
          description: "Total hours at time of booking",
        }),
        defineField({
          name: "skillLevel",
          title: "Skill Level",
          type: "string",
          description: "Course skill level at time of booking",
        }),
        defineField({
          name: "maxStudents",
          title: "Max Students",
          type: "number",
          description: "Maximum students at time of booking",
        }),
      ],
    }),

    defineField({
      name: "createdAt",
      title: "Created At",
      type: "datetime",
      description: "When this booking was created",
      validation: (rule) =>
        rule.required().error("Created at timestamp is required"),
      initialValue: () => new Date().toISOString(),
    }),

    defineField({
      name: "updatedAt",
      title: "Updated At",
      type: "datetime",
      description: "Last modification timestamp",
      validation: (rule) =>
        rule.required().error("Updated at timestamp is required"),
      initialValue: () => new Date().toISOString(),
    }),

    defineField({
      name: "isActive",
      title: "Booking Active",
      type: "boolean",
      description: "Is this booking active/visible?",
      initialValue: true,
    }),
  ],

  preview: {
    select: {
      courseTitle: "course.title",
      studentName: "student.firstName",
      studentEmail: "student.email",
      teacherName: "assignedTeacher.name",
      status: "status",
      actualStartDate: "actualStartDate",
      preferredStartDate: "preferredStartDate",
      orderNumber: "order.orderNumber",
      attendanceRecords: "attendanceRecords",
    },
    prepare({
      courseTitle,
      studentName,
      studentEmail,
      teacherName,
      status,
      actualStartDate,
      preferredStartDate,
      orderNumber,
      attendanceRecords,
    }) {
      const studentDisplay = studentName || studentEmail || "Unknown Student";
      const courseDisplay = courseTitle || "Unknown Course";

      const startDate = actualStartDate || preferredStartDate;
      const dateInfo = startDate
        ? new Date(startDate).toLocaleDateString()
        : "No date";

      const attendanceInfo = attendanceRecords?.length
        ? ` • ${attendanceRecords.length} lessons`
        : "";

      const teacherInfo = teacherName ? ` • ${teacherName}` : "";
      const orderInfo = orderNumber ? ` • ${orderNumber}` : "";

      return {
        title: `${courseDisplay} - ${studentDisplay} (${status})`,
        subtitle: `${dateInfo}${teacherInfo}${attendanceInfo}${orderInfo}`,
      };
    },
  },

  orderings: [
    {
      title: "Recent Bookings",
      name: "recentBookings",
      by: [{ field: "createdAt", direction: "desc" }],
    },
    {
      title: "Start Date",
      name: "startDate",
      by: [{ field: "actualStartDate", direction: "desc" }],
    },
    {
      title: "Booking Status",
      name: "status",
      by: [{ field: "status", direction: "asc" }],
    },
    {
      title: "Student Name",
      name: "studentName",
      by: [{ field: "student.firstName", direction: "asc" }],
    },
    {
      title: "Course Name",
      name: "courseName",
      by: [{ field: "course.title", direction: "asc" }],
    },
    {
      title: "Teacher",
      name: "teacher",
      by: [{ field: "assignedTeacher.name", direction: "asc" }],
    },
  ],
});
