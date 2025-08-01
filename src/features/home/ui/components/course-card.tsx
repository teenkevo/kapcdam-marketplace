"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { urlFor } from "@/sanity/lib/image";
import Image from "next/image";
import { NumericFormat } from "react-number-format";
import { CourseEnrollmentButton } from "@/features/courses/ui/components/course-enrollment-button";
import Link from "next/link";

interface CourseCardProps {
  course: {
    _id: string;
    title: string;
    slug: { current: string };
    price: string;
    skillLevel: "beginner" | "intermediate" | "advanced";
    defaultImage?: any;
    startDate: string;
    endDate: string;
    description?: any;
    hasDiscount?: boolean | null;
    discountInfo?: {
      value: number;
      isActive: boolean;
      title?: string;
      startDate?: string;
      endDate?: string;
    } | null;
  };
}

export function CourseCard({ course }: CourseCardProps) {
  const skillLevelColors = {
    beginner: "bg-green-100 text-green-800",
    intermediate: "bg-yellow-100 text-yellow-800", 
    advanced: "bg-red-100 text-red-800"
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const hasDiscount = course.hasDiscount && course.discountInfo?.isActive;
  const originalPrice = parseInt(course.price);
  const discountedPrice = hasDiscount 
    ? originalPrice - Math.round((originalPrice * course.discountInfo!.value) / 100)
    : originalPrice;

  return (
    <Card className="group hover:shadow-lg transition-all duration-300 overflow-hidden">
      <div className="relative overflow-hidden">
        {/* Course Image */}
        <Link href={`/course/${course.slug.current}`}>
          <div className="aspect-video relative overflow-hidden">
            {course.defaultImage ? (
              <Image
                src={urlFor(course.defaultImage).width(400).height(225).url()}
                alt={course.title}
                fill
                className="object-cover group-hover:scale-105 transition-transform duration-300"
              />
            ) : (
              <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                <span className="text-gray-500">No image</span>
              </div>
            )}
            {hasDiscount && (
              <div className="absolute top-3 left-3">
                <Badge className="bg-red-500 text-white">
                  -{course.discountInfo!.value}% OFF
                </Badge>
              </div>
            )}
          </div>
        </Link>
      </div>

      <CardContent className="p-6">
        {/* Skill Level Badge */}
        <div className="flex items-center justify-between mb-3">
          <Badge className={`text-xs ${skillLevelColors[course.skillLevel]}`}>
            {course.skillLevel.charAt(0).toUpperCase() + course.skillLevel.slice(1)}
          </Badge>
          <div className="flex items-center gap-1 text-sm text-gray-500">
            <span>{formatDate(course.startDate)}</span>
          </div>
        </div>

        {/* Course Title */}
        <Link href={`/course/${course.slug.current}`}>
          <h3 className="font-semibold text-lg text-gray-900 mb-3 line-clamp-2">
            {course.title}
          </h3>
        </Link>

        {/* Course Duration */}
        <div className="flex items-center gap-4 text-sm text-gray-600 mb-4">
          <div className="flex items-center gap-1">
            <span>16 weeks</span>
          </div>
          <div className="flex items-center gap-1">
            <span>In-person</span>
          </div>
        </div>

        {/* Price Section */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            {hasDiscount ? (
              <>
                <NumericFormat
                  thousandSeparator={true}
                  displayType="text"
                  prefix="UGX "
                  value={originalPrice}
                  className="text-sm text-gray-400 line-through"
                />
                <NumericFormat
                  thousandSeparator={true}
                  displayType="text"
                  prefix="UGX "
                  value={discountedPrice}
                  className="text-lg font-bold text-green-600"
                />
              </>
            ) : (
              <NumericFormat
                thousandSeparator={true}
                displayType="text"
                prefix="UGX "
                value={originalPrice}
                className="text-lg font-bold text-gray-900"
              />
            )}
          </div>
        </div>

        {/* Enroll Button */}
        <CourseEnrollmentButton courseId={course._id} />
      </CardContent>
    </Card>
  );
}