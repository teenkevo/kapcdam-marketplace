"use client";

import { useTRPC } from "@/trpc/client";
import { useQuery } from "@tanstack/react-query";
import { CourseCard } from "./course-card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Skeleton } from "@/components/ui/skeleton";
import { GraduationCap } from "lucide-react";

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
      sortBy: "newest",
    }),
    enabled:
      !featuredLoading && (!featuredCourses || featuredCourses.length === 0),
  });

  const courses =
    featuredCourses && featuredCourses.length > 0
      ? featuredCourses
      : allCourses?.items || [];
  const isLoading = featuredLoading || allLoading;

  return (
    <section className="py-16 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="mb-12">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl md:text-4xl font-bold text-gray-900">
              Featured Courses
            </h2>
            <Link href="/marketplace?type=courses">
              <Button size="sm" variant="outline">
                <GraduationCap className="w-4 h-4 mr-2" />
                View All
              </Button>
            </Link>
          </div>
          <p className="text-lg text-gray-600 max-w-2xl">
            Develop practical skills through our hands-on courses. Learn
            directly from experienced professionals in a supportive learning
            environment.
          </p>
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="flex gap-6 overflow-x-auto pb-4 scrollbar-hide items-stretch">
            {[...Array(3)].map((_, i) => (
              <div
                key={i}
                className="flex-shrink-0 w-80 space-y-4 animate-pulse"
              >
                <div className="aspect-video bg-gray-200 rounded-lg"></div>
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                <div className="h-10 bg-gray-200 rounded w-full"></div>
              </div>
            ))}
          </div>
        )}

        {/* Courses Carousel */}
        {courses && courses.length > 0 && (
          <div className="flex gap-6 overflow-x-auto pb-4 scrollbar-hide items-stretch">
            {courses.slice(0, 3).map((course) => (
              <div key={course._id} className="flex-shrink-0 w-80">
                <CourseCard course={course} />
              </div>
            ))}
          </div>
        )}

        {/* No Courses State */}
        {courses && courses.length === 0 && !isLoading && (
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
