"use client";

import { useRef, useState, type MouseEvent } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { GraduationCap } from "lucide-react";

import { useTRPC } from "@/trpc/client";
import { Button } from "@/components/ui/button";
import { CourseCard } from "./course-card";

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
  const isLoading = featuredLoading || (allCourses === undefined && allLoading);

  // --- Start of new drag-to-scroll logic ---
  const sliderRef = useRef<HTMLDivElement>(null);
  const [isDown, setIsDown] = useState(false);
  const [startX, setStartX] = useState(0);
  const [scrollLeft, setScrollLeft] = useState(0);

  const handleMouseDown = (e: MouseEvent<HTMLDivElement>) => {
    if (!sliderRef.current) return;
    setIsDown(true);
    sliderRef.current.classList.add("cursor-grabbing");
    setStartX(e.pageX - sliderRef.current.offsetLeft);
    setScrollLeft(sliderRef.current.scrollLeft);
  };

  const handleMouseLeave = () => {
    if (!sliderRef.current) return;
    setIsDown(false);
    sliderRef.current.classList.remove("cursor-grabbing");
  };

  const handleMouseUp = () => {
    if (!sliderRef.current) return;
    setIsDown(false);
    sliderRef.current.classList.remove("cursor-grabbing");
  };

  const handleMouseMove = (e: MouseEvent<HTMLDivElement>) => {
    if (!isDown || !sliderRef.current) return;
    e.preventDefault();
    const x = e.pageX - sliderRef.current.offsetLeft;
    const walk = (x - startX) * 2; // Scroll speed multiplier
    sliderRef.current.scrollLeft = scrollLeft - walk;
  };
  // --- End of new drag-to-scroll logic ---

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
        {courses && courses.length > 0 && !isLoading && (
          <div
            ref={sliderRef}
            onMouseDown={handleMouseDown}
            onMouseLeave={handleMouseLeave}
            onMouseUp={handleMouseUp}
            onMouseMove={handleMouseMove}
            className="flex gap-6 overflow-x-auto pb-4 scrollbar-hide items-stretch cursor-grab active:cursor-grabbing select-none"
          >
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
