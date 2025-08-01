import CourseView from "@/features/courses/ui/views/course-view";

interface CoursePageProps {
  params: Promise<{ slug: string }>;
}

export default async function CoursePage({ params }: CoursePageProps) {
  const { slug } = await params;

  return <CourseView slug={slug} />;
}