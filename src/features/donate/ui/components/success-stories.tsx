"use client";
import { useState, useRef } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function SuccessStories() {
  const [currentStory, setCurrentStory] = useState(0);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const stories = [
    {
      name: "Sarah's Educational Journey",
      title: "Hearing Aids for Sarah",
      description:
        "Sarah, a 6-year-old with hearing challenges, now excels in her studies thanks to specialized hearing aids and inclusive classroom support. Her determination and the right resources have transformed her educational experience.",
      image:
        "https://res.cloudinary.com/teenkevo-cloud/image/upload/q_72/v1753036243/dion-martins-gI1sa1MalH4-unsplash_rri7tf.webp",
      badges: ["Education", "Healthcare"],
    },
    {
      name: "Product Building",
      title: "Handcrafted goods for sale",
      description:
        "We are training parents to start their own businesses to provide for their children's education and healthcare.",
      image:
        "https://res.cloudinary.com/teenkevo-cloud/image/upload/v1752953564/_MG_2302_iuq42j.jpg",
      badges: ["Economic Empowerment"],
    },
    {
      name: "Financial Literacy",
      title: "Financial Literacy to Empower Parents",
      description:
        "We train parents on financial literacy to help them manage their family's finances effectively, ensuring their children receive the best care and education possible.",
      image:
        "https://res.cloudinary.com/teenkevo-cloud/image/upload/q_71/v1753037047/Financial_literacy_to_one_of_our_saving_groups_h9vhjf.webp",
      badges: ["Training", "Economic Empowerment"],
    },
    {
      name: "Filtered Water",
      title: "Ceramic water filters",
      description:
        "Ceramic water filters given to families with children with disabilities to help them access clean water.",
      image:
        "https://res.cloudinary.com/teenkevo-cloud/image/upload/q_70/v1752874574/web-20220321-Kapcdam-161_cilnod.webp",
      badges: ["Healthcare"],
    },
  ];

  const nextStory = () => {
    if (window.innerWidth >= 768) {
      // Desktop: scroll horizontally
      if (scrollContainerRef.current) {
        const cardWidth = 600 + 24; // card width + gap
        scrollContainerRef.current.scrollBy({
          left: cardWidth,
          behavior: "smooth",
        });
      }
    } else {
      // Mobile: scroll horizontally through the carousel
      const mobileContainer = document.querySelector(
        ".md\\:hidden .overflow-x-auto"
      );
      if (mobileContainer) {
        const cardWidth = mobileContainer.clientWidth + 16; // card width + gap
        mobileContainer.scrollBy({
          left: cardWidth,
          behavior: "smooth",
        });
      }
    }
  };

  const prevStory = () => {
    if (window.innerWidth >= 768) {
      // Desktop: scroll horizontally
      if (scrollContainerRef.current) {
        const cardWidth = 600 + 24; // card width + gap
        scrollContainerRef.current.scrollBy({
          left: -cardWidth,
          behavior: "smooth",
        });
      }
    } else {
      // Mobile: scroll horizontally through the carousel
      const mobileContainer = document.querySelector(
        ".md\\:hidden .overflow-x-auto"
      );
      if (mobileContainer) {
        const cardWidth = mobileContainer.clientWidth + 16; // card width + gap
        mobileContainer.scrollBy({
          left: -cardWidth,
          behavior: "smooth",
        });
      }
    }
  };

  const getBadgeColor = (badge: string) => {
    const colors = {
      Training: "border border-purple-400",
      Education: "border border-yellow-400",
      Healthcare: "border border-blue-400",
      "Economic Empowerment": "border border-green-400",
      "Community Support": "border border-pink-400",
      Advocacy: "border border-red-400",
      "Community Integration": "border border-indigo-400",
      Technology: "border border-gray-400",
    };
    return colors[badge as keyof typeof colors] || "bg-gray-100 text-gray-800";
  };

  return (
    <section className="relative py-16 bg-gray-50">
      {/* Background Image */}
      <div className="absolute inset-0">
        <img
          src="https://res.cloudinary.com/teenkevo-cloud/image/upload/q_75/v1753035403/gerard-griffay--wo6QjS9JPU-unsplash_lovpvh.webp"
          alt="KAPCDAM Hero"
          className="w-full h-full object-cover object-top "
          onError={(e) => {
            e.currentTarget.src =
              "/placeholder.svg?height=600&width=1200&text=Supporting+Disabled+Children";
          }}
        />
      </div>
      {/* Gradient Overlay */}
      <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/60 to-transparent"></div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className=" mb-12">
          <h2 className="text-2xl md:text-3xl mb-4 text-white font-extrabold tracking-tight">
            Know that your donation is making a difference
          </h2>

          <p className=" text-white max-w-2xl">
            See how your donations are transforming lives and creating
            opportunities for disabled children in Makindye
          </p>
        </div>

        {/* Carousel Container */}
        <div className="relative">
          {/* Desktop Horizontal Scroll */}
          <div className="bg-gray-600/40 rounded-2xl hidden p-4 md:block">
            <div
              ref={scrollContainerRef}
              className="flex space-x-6 overflow-x-auto scrollbar-hide scroll-smooth"
            >
              {stories.map((story, index) => (
                <div
                  key={index}
                  className="flex-shrink-0 w-[600px] border border-gray-200 bg-white rounded-2xl shadow-lg overflow-hidden"
                >
                  <div className="grid grid-cols-2 h-80">
                    {/* Left Side - Image */}
                    <div className="relative overflow-hidden">
                      <img
                        src={story.image || "/placeholder.svg"}
                        alt={story.title}
                        className="w-full h-full object-cover object-top"
                      />
                    </div>

                    {/* Right Side - Content */}
                    <div className="p-6 flex flex-col justify-center">
                      <div className="flex flex-wrap gap-2 mb-4">
                        {story.badges.map((badge, badgeIndex) => (
                          <span
                            key={badgeIndex}
                            className={`px-3 py-1 rounded-full text-xs font-medium ${getBadgeColor(badge)}`}
                          >
                            {badge}
                          </span>
                        ))}
                      </div>
                      <h3 className="text-xl font-bold text-gray-900 mb-3 leading-tight">
                        {story.title}
                      </h3>
                      <p className="text-gray-600 text-sm leading-relaxed">
                        {story.description}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Mobile Carousel */}
          <div className="md:hidden">
            <div className="overflow-x-auto scrollbar-hide">
              <div
                className="flex space-x-4 pb-4"
                style={{ width: `${stories.length * 100}%` }}
              >
                {stories.map((story, index) => (
                  <div
                    key={index}
                    className="flex-shrink-0 w-full max-w-sm bg-white rounded-2xl shadow-lg overflow-hidden"
                  >
                    <div className="grid grid-cols-1">
                      {/* Image */}
                      <div className="aspect-[16/12] overflow-hidden">
                        <img
                          src={story.image || "/placeholder.svg"}
                          alt={story.title}
                          className="w-full h-full object-cover object-top"
                        />
                      </div>
                      {/* Content */}
                      <div className="p-6">
                        <div className="flex flex-wrap gap-2 mb-4">
                          {story.badges.map((badge, badgeIndex) => (
                            <span
                              key={badgeIndex}
                              className={`px-3 py-1 rounded-full text-xs font-medium ${getBadgeColor(badge)}`}
                            >
                              {badge}
                            </span>
                          ))}
                        </div>
                        <h3 className="text-xl font-bold text-gray-900 mb-3">
                          {story.title}
                        </h3>
                        <p className="text-gray-600 text-sm leading-relaxed">
                          {story.description}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Navigation Arrows */}
          <div className="flex justify-center mt-8 space-x-4">
            <Button
              variant="outline"
              size="icon"
              onClick={prevStory}
              className="flex items-center gap-2 px-4 py-2 bg-white hover:bg-gray-50 rounded-full"
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={nextStory}
              className="flex items-center gap-2 px-4 py-2 bg-white hover:bg-gray-50 rounded-full"
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>

      <style jsx>{`
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
      `}</style>
    </section>
  );
}
