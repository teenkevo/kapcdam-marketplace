"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Calendar, Clock, Users, BookOpen, CheckCircle, Play, User, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useTRPC } from "@/trpc/client";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { urlFor } from "@/sanity/lib/image";
import { PortableText } from "@portabletext/react";
import { useUser, SignInButton } from "@clerk/nextjs";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogFooter,
  AlertDialogDescription,
  AlertDialogTitle,
  AlertDialogHeader,
  AlertDialogContent,
  AlertDialogTrigger,
  AlertDialogAction,
} from "@/components/ui/alert-dialog";
import { CourseEnrollmentButton } from "../components/course-enrollment-button";

interface CourseViewProps {
  slug: string;
}

export default function CourseView({ slug }: CourseViewProps) {
  const { isSignedIn, user } = useUser();
  const trpc = useTRPC();

  const {
    data: course,
    isLoading,
    error,
  } = useQuery(trpc.courses.getOne.queryOptions({ slug }));

  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  const handleThumbnailHover = (index: number) => {
    setCurrentImageIndex(index);
  };

  const getCurrentPrice = () => {
    if (!course) return 0;
    return parseFloat(course.price || "0");
  };

  const getDiscountedPrice = () => {
    if (!course?.hasDiscount || !course.discountInfo) return getCurrentPrice();
    const price = getCurrentPrice();
    const discount = course.discountInfo.value;
    return Math.round(price * (1 - discount / 100));
  };

  const formatDuration = (duration: { value: number; unit: string }) => {
    const unit = duration.unit === "hours" ? "hr" : "min";
    return `${duration.value} ${unit}${duration.value > 1 ? "s" : ""}`;
  };

  const getTotalDuration = () => {
    if (!course?.curriculum) return "0 hrs";
    const totalMinutes = course.curriculum.reduce((total, module) => {
      const duration = module.estimatedDuration;
      const minutes = duration.unit === "hours" ? duration.value * 60 : duration.value;
      return total + minutes;
    }, 0);
    
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    
    if (hours === 0) return `${minutes} mins`;
    if (minutes === 0) return `${hours} hrs`;
    return `${hours}h ${minutes}m`;
  };

  const currentImages = course?.images || [];
  const currentImage = currentImages[currentImageIndex];

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto py-20">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 mb-8 w-1/3"></div>
          <div className="grid lg:grid-cols-2 gap-8">
            <div className="space-y-4">
              <div className="aspect-video bg-gray-200"></div>
              <div className="flex gap-2">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="w-16 h-16 bg-gray-200"></div>
                ))}
              </div>
            </div>
            <div className="space-y-6">
              <div className="h-8 bg-gray-200 w-2/3"></div>
              <div className="h-6 bg-gray-200 w-1/2"></div>
              <div className="h-12 bg-gray-200 w-1/3"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !course) {
    return (
      <div className="max-w-7xl mx-auto py-20 text-center">
        <h1 className="text-3xl font-bold mb-4">Course Not Found</h1>
        <p className="text-gray-600 mb-8">
          The course you're looking for doesn't exist or may have been removed.
        </p>
        <div className="flex gap-4 justify-center">
          <Link href="/">
            <Button>Return Home</Button>
          </Link>
          <Link href="/courses">
            <Button variant="outline">Browse Courses</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto py-20 px-4">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm mb-8">
        <Link href="/" className="text-muted-foreground hover:text-primary">
          Home
        </Link>
        <span className="text-muted-foreground">/</span>
        <Link href="/courses" className="text-muted-foreground hover:text-primary">
          Courses
        </Link>
      </div>

      <div className="grid lg:grid-cols-3 gap-8 mb-12">
        {/* Left Column - Course Media and Details */}
        <div className="lg:col-span-2 space-y-6">
          {/* Course Hero */}
          <div className="space-y-4">
            <div className="aspect-video relative rounded-lg overflow-hidden">
              {currentImage ? (
                <Image
                  src={urlFor(currentImage).url()}
                  alt={course.title}
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 100vw, 66vw"
                />
              ) : (
                <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                  <BookOpen className="w-16 h-16 text-gray-400" />
                </div>
              )}
              
              {/* Play Button Overlay if preview video exists */}
              {course.previewVideo && (
                <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                  <Button
                    size="lg"
                    className="rounded-full bg-white/20 backdrop-blur-sm hover:bg-white/30"
                    onClick={() => window.open(course.previewVideo!, '_blank')}
                  >
                    <Play className="w-8 h-8 text-white fill-white" />
                  </Button>
                </div>
              )}
            </div>

            {/* Image Thumbnails */}
            {currentImages.length > 1 && (
              <div className="flex gap-2 overflow-x-auto pb-2">
                {currentImages.slice(0, 6).map((image, i) => (
                  <div
                    key={i}
                    className={`flex-shrink-0 w-16 h-16 relative border-2 transition-colors cursor-pointer rounded-md overflow-hidden ${
                      i === currentImageIndex
                        ? "border-primary"
                        : "border-transparent hover:border-primary"
                    }`}
                    onMouseEnter={() => handleThumbnailHover(i)}
                  >
                    <Image
                      src={urlFor(image).url()}
                      alt={`Course view ${i + 1}`}
                      fill
                      className="object-cover"
                      sizes="64px"
                    />
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Course Description */}
          <div className="space-y-4">
            <h2 className="text-2xl font-bold">About This Course</h2>
            <div className="prose prose-sm max-w-none">
              <PortableText value={course.description} />
            </div>
          </div>

          {/* Learning Outcomes */}
          <div className="space-y-4">
            <h3 className="text-xl font-bold">What You'll Learn</h3>
            <div className="grid gap-3">
              {course.learningOutcomes.map((outcome, index) => (
                <div key={index} className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                  <span className="text-gray-700">{outcome}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Course Curriculum */}
          <div className="space-y-4">
            <h3 className="text-xl font-bold">Course Curriculum</h3>
            <div className="space-y-3">
              {course.curriculum.map((module, index) => (
                <Card key={index} className="border-l-4 border-l-primary">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg">
                        Module {index + 1}: {module.moduleTitle}
                      </CardTitle>
                      <Badge variant="secondary" className="text-xs">
                        {formatDuration(module.estimatedDuration)}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <p className="text-gray-600 mb-3">{module.moduleDescription}</p>
                    {module.topics && module.topics.length > 0 && (
                      <div className="space-y-2">
                        <h5 className="font-medium text-sm">Topics Covered:</h5>
                        <ul className="text-sm text-gray-600 space-y-1">
                          {module.topics.map((topic, topicIndex) => (
                            <li key={topicIndex} className="flex items-center gap-2">
                              <div className="w-1.5 h-1.5 bg-primary rounded-full flex-shrink-0" />
                              {topic}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* Requirements */}
          {course.requirements && course.requirements.length > 0 && (
            <div className="space-y-4">
              <h3 className="text-xl font-bold">Requirements</h3>
              <ul className="space-y-2">
                {course.requirements.map((requirement, index) => (
                  <li key={index} className="flex items-start gap-3">
                    <div className="w-2 h-2 bg-gray-400 rounded-full mt-2 flex-shrink-0" />
                    <span className="text-gray-700">{requirement}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* Right Column - Sticky Course Info */}
        <div className="lg:sticky lg:top-8 lg:h-fit">
          <Card className="p-6 space-y-6">
            {/* Course Title and Instructor */}
            <div className="space-y-4">
              <h1 className="text-2xl font-bold leading-tight">{course.title}</h1>
              
              {course.createdBy && (
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                    {course.createdBy.image ? (
                      <Image
                        src={course.createdBy.image}
                        alt={course.createdBy.name}
                        width={40}
                        height={40}
                        className="rounded-full object-cover"
                      />
                    ) : (
                      <User className="w-5 h-5 text-gray-500" />
                    )}
                  </div>
                  <div>
                    <p className="font-medium text-sm">Instructor</p>
                    <p className="text-sm text-gray-600">{course.createdBy.name}</p>
                  </div>
                </div>
              )}
            </div>

            {/* Price */}
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                {course.hasDiscount && course.discountInfo ? (
                  <>
                    <span className="text-3xl font-bold">
                      UGX {getDiscountedPrice().toLocaleString()}
                    </span>
                    <span className="text-lg text-gray-500 line-through">
                      UGX {getCurrentPrice().toLocaleString()}
                    </span>
                    <Badge variant="destructive" className="text-xs">
                      {course.discountInfo.value}% OFF
                    </Badge>
                  </>
                ) : (
                  <span className="text-3xl font-bold">
                    UGX {getCurrentPrice().toLocaleString()}
                  </span>
                )}
              </div>
            </div>

            {/* Course Info */}
            <div className="space-y-3 pt-4 border-t">
              <div className="flex items-center gap-3 text-sm">
                <Calendar className="w-4 h-4 text-gray-500" />
                <span>Starts: {new Date(course.startDate).toLocaleDateString()}</span>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <Calendar className="w-4 h-4 text-gray-500" />
                <span>Ends: {new Date(course.endDate).toLocaleDateString()}</span>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <Clock className="w-4 h-4 text-gray-500" />
                <span>Duration: {getTotalDuration()}</span>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <BookOpen className="w-4 h-4 text-gray-500" />
                <span>{course.curriculum.length} modules</span>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <Star className="w-4 h-4 text-gray-500" />
                <span className="capitalize">{course.skillLevel} level</span>
              </div>
            </div>

            {/* Enrollment Button */}
            <div className="pt-4 border-t">
              {isSignedIn ? (
                <CourseEnrollmentButton courseId={course._id} />
              ) : (
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button className="w-full bg-[#C5F82A] text-black hover:bg-[#B4E729]">
                      Enroll Now
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Sign in to enroll</AlertDialogTitle>
                      <AlertDialogDescription>
                        You need to be signed in to enroll in this course.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction asChild>
                        <SignInButton>Sign In</SignInButton>
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              )}
            </div>

            {/* Course Tags */}
            {course.tags && course.tags.length > 0 && (
              <div className="pt-4 border-t">
                <p className="text-sm font-medium mb-2">Tags:</p>
                <div className="flex flex-wrap gap-2">
                  {course.tags.map((tag, index) => (
                    <Badge key={index} variant="outline" className="text-xs">
                      {tag}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}