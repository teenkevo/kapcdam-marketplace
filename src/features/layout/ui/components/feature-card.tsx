import Image from "next/image";
import { cn } from "@/lib/utils";

interface FeatureCardProps {
  id: string;
  heading: string;
  description?: string;
  features?: { heading: string; description: string }[];
  imageSrc?: string;
  backgroundColorClass: string;
  textColorClass: string;
  borderColorClass: string;
  hasShadow: boolean;
  stickyTopClass: string; // This will now contain md:top-[...]
  className?: string;
}

export default function FeatureCard({
  id,
  heading,
  description,
  features,
  imageSrc,
  backgroundColorClass,
  textColorClass,
  stickyTopClass,
  borderColorClass,
  hasShadow,
  className,
}: FeatureCardProps) {
  const hasDetailedContent =
    description || (features && features.length > 0) || imageSrc;

  return (
    <div
      id={id}
      className={cn(
        "w-full p-8 md:p-12 lg:py-8 rounded-xl transition-all duration-300 ease-in-out",
        `${hasShadow ? "shadow-even" : ""}`,
        backgroundColorClass,
        borderColorClass,
        textColorClass,
        "md:sticky", // Apply sticky only from medium screens and up
        stickyTopClass, // This will already have the md: prefix from page.tsx
        className,
        " flex items-center justify-center"
      )}
    >
      <div
        className={cn(
          "grid gap-8 md:gap-12",
          hasDetailedContent ? "md:grid-cols-3 items-start" : "grid-cols-1"
        )}
      >
        {/* Left column for text content - takes 2/3 on desktop, full on mobile */}
        <div
          className={cn(
            "grid gap-6",
            hasDetailedContent ? "md:col-span-2" : "col-span-full text-center"
          )}
        >
          <h2 className="text-2xl md:text-3xl font-extrabold tracking-tight">
            {heading}
          </h2>
          {description && (
            <p className="text-base text-foreground/80 md:text-lg">
              {description}
            </p>
          )}
          {features && features.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mt-4">
              {features.map((feature, index) => (
                <div key={index} className="flex items-start gap-4">
                  {" "}
                  {/* Gradient Border */}
                  <div className="w-[0.5px] h-full bg-gradient-to-b from-black to-transparent min-h-[48px]" />{" "}
                  <div className="grid gap-2 flex-1">
                    {" "}
                    {/* Added flex-1 to make content take remaining space */}
                    <h3 className="text-xl font-semibold">{feature.heading}</h3>
                    <p className="text-sm text-muted-foreground/80">
                      {feature.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right column for image - takes 1/3 on desktop, full on mobile */}
        {imageSrc && (
          <div className="relative h-64 md:h-full min-h-[200px] md:min-h-[400px] rounded-lg overflow-hidden md:col-span-1">
            <Image
              src={imageSrc || "/placeholder.svg"}
              alt={heading} // Alt text for accessibility [^1][^2]
              layout="fill"
              objectFit="cover"
              className="rounded-lg"
            />
          </div>
        )}
      </div>
    </div>
  );
}
