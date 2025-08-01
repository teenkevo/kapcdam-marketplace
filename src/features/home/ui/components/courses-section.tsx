"use client";

import { useTRPC } from "@/trpc/client";
import { useQuery } from "@tanstack/react-query";
import { CourseCard } from "./course-card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Skeleton } from "@/components/ui/skeleton";

export function CoursesSection() {
  const trpc = useTRPC();
  
  // Fetch featured courses first
  const { data: featuredCourses, isLoading: featuredLoading } = useQuery({
    ...trpc.courses.getFeatured.queryOptions(),
  });

  // Fetch any available courses as fallback
  const { data: allCourses, isLoading: allLoading } = useQuery({
    ...trpc.courses.getMany.queryOptions({
      page: 1,
      pageSize: 3,
      sortBy: "newest"
    }),
    enabled: !featuredLoading && (!featuredCourses || featuredCourses.length === 0)
  });

  const courses = featuredCourses && featuredCourses.length > 0 
    ? featuredCourses 
    : allCourses?.items || [];
  const isLoading = featuredLoading || allLoading;


  return (
    <section className="py-16 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            Featured Courses
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Develop practical skills through our hands-on courses. Learn directly from experienced professionals in a supportive learning environment.
          </p>
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="space-y-4">
                <Skeleton className="aspect-video w-full rounded-lg" />
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
                <Skeleton className="h-10 w-full" />
              </div>
            ))}
          </div>
        )}

        {/* Courses Grid */}
        {courses && courses.length > 0 && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
              {courses.slice(0, 3).map((course) => (
                <CourseCard key={course._id} course={course} />
              ))}
            </div>

            {/* View All Courses Button */}
            {/* <div className="text-center">
              <Link href="/courses">
                <Button 
                  size="lg" 
                  className="bg-[#C5F82A] text-black hover:bg-[#B4E729]"
                >
                  View All Courses
                </Button>
              </Link>
            </div> */}
          </>
        )}

        {/* No Courses State */}
        {courses && courses.length === 0 && (
          <div className="text-center py-12">
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              Coming Soon
            </h3>
            <p className="text-gray-600">
              We're preparing exciting new courses for you. Check back soon!
            </p>
          </div>
        )}
      </div>
    </section>
  );
}