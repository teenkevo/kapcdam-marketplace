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
    beginner: "bg-green-100 text-green-800 hover:bg-green-200",
    intermediate: "bg-yellow-100 text-yellow-800 hover:bg-yellow-200",
    advanced: "bg-red-100 text-red-800 hover:bg-green-200",
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const hasDiscount = course.hasDiscount && course.discountInfo?.isActive;
  const originalPrice = parseInt(course.price);
  const discountedPrice = hasDiscount
    ? originalPrice -
      Math.round((originalPrice * course.discountInfo!.value) / 100)
    : originalPrice;

  return (
    <Card className="overflow-hidden">
      <CardContent className="p-0">
        <div className="relative aspect-square">
          <Link href={`/course/${course.slug.current}`} className="block">
            {course.defaultImage ? (
              <Image
                src={urlFor(course.defaultImage).width(300).height(300).url()}
                alt={course.title}
                width={300}
                height={300}
                className="object-cover w-full h-full p-4 transition-transform duration-200 hover:scale-105"
              />
            ) : (
              <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                <span className="text-gray-500">No image</span>
              </div>
            )}
          </Link>

          {/* Discount indicator */}
          {hasDiscount && (
            <div className="absolute top-2 right-2 z-10 pointer-events-none">
              <Badge className="bg-red-500 text-white text-xs">
                -{course.discountInfo!.value}% OFF
              </Badge>
            </div>
          )}
        </div>

        <div className="p-4 space-y-3">
          <div>
            {/* Course Title */}
            <Link href={`/course/${course.slug.current}`}>
              <h3 className="font-semibold text-sm leading-tight line-clamp-2 hover:text-primary transition-colors cursor-pointer mb-2">
                {course.title.length > 80
                  ? `${course.title.substring(0, 120)}...`
                  : course.title}
              </h3>
            </Link>

            {/* Skill Level Badge */}
            <Badge
              variant="secondary"
              className={`text-xs ${skillLevelColors[course.skillLevel]}`}
            >
              {course.skillLevel.charAt(0).toUpperCase() +
                course.skillLevel.slice(1)}
            </Badge>
          </div>

          {/* Course Duration Info */}
          <div>
            <div className="text-xs text-muted-foreground">
              Duration: 16 weeks • {formatDate(course.startDate)}
            </div>
          </div>

          {/* Course Details - equivalent to ratings section */}
          <div className="flex items-center gap-1">
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <span>In-person training</span>
              <span>•</span>
              <span>Certificate included</span>
            </div>
          </div>

          <hr className="w-full border-t border-gray-200" />

          {/* Price Section */}
          <div className="flex items-center justify-between">
            <div className="text-gray-500 text-sm">Price</div>
            <div className="text-right">
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
                    className="font-semibold text-lg block"
                  />
                  <div className="text-xs text-red-500">
                    Save {course.discountInfo!.value}%
                  </div>
                </>
              ) : (
                <NumericFormat
                  thousandSeparator={true}
                  displayType="text"
                  prefix="UGX "
                  value={originalPrice}
                  className="font-semibold text-lg"
                />
              )}
            </div>
          </div>

          {/* Course Duration Info */}
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>Starts {formatDate(course.startDate)}</span>
            <span>16 weeks duration</span>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2">
            <CourseEnrollmentButton courseId={course._id} />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
