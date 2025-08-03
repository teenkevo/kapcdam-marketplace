import FeatureCard from "@/features/layout/ui/components/feature-card";

export default function AboutUsSummary() {
  // Using standard Tailwind top classes for better compatibility
  // top-24 = 96px
  // top-44 = 176px
  // top-64 = 256px

  const cardsData = [
    {
      id: "card-1",
      heading: "Why Our Work Matters",
      description:
        "In Uganda, nearly 13% of children live with a disability, yet most face social exclusion, limited access to education, and inadequate healthcare. KAPCDAM exists to change this reality—one child at a time.",
      features: [
        {
          heading: "Underrepresented Voices",
          description:
            "Children with disabilities often face stigma and neglect. We work to create visibility, acceptance, and opportunity.",
        },
        {
          heading: "Barriers to Education",
          description:
            "Less than 10% of disabled children in Uganda complete primary school. We help remove the barriers keeping them from learning.",
        },
        {
          heading: "Healthcare Inequality",
          description:
            "Many children lack access to basic therapy or rehabilitation services. We provide the tools and care they need to thrive.",
        },
        {
          heading: "Community Impact",
          description:
            "By supporting one child, we uplift entire families and reshape perceptions across communities.",
        },
      ],
      imageSrc:
        "https://res.cloudinary.com/teenkevo-cloud/image/upload/q_72/v1752875536/regarn-hope-5Tn_dWPV5k0-unsplash_rj92nu.webp",
      backgroundColorClass: "bg-[#eef2e4]",
      borderColorClass: "border border-gray-200",
      textColorClass: "text-gray-900",
      stickyTopClass: "md:top-10", // Sticks with padding (96px)
    },
    {
      id: "card-2",
      heading: "Our Mission: Empower Every Child",
      description:
        "KAPCDAM is dedicated to building a world where disabled children are valued, supported, and empowered to reach their full potential. Our programs are designed to nurture growth, independence, and dignity.",
      features: [
        {
          heading: "Inclusive Education",
          description:
            "From early learning to vocational skills, we ensure children have equal access to education tailored to their needs.",
        },
        {
          heading: "Health & Well-being",
          description:
            "We offer physical therapy, mental health support, nutrition, and medical interventions that improve quality of life.",
        },
        {
          heading: "Family & Community Support",
          description:
            "We engage caregivers and communities through training, support groups, and advocacy campaigns.",
        },
        {
          heading: "Child Rights & Advocacy",
          description:
            "We champion disability rights and push for systemic change through legal awareness and policy engagement.",
        },
      ],
      imageSrc:
        "https://res.cloudinary.com/teenkevo-cloud/image/upload/v1752874574/web-20220321-Kapcdam-161_cilnod.jpg",
      backgroundColorClass: "bg-[#d8efc8]",
      borderColorClass: "border border-gray-300",
      hasShadow: true,
      textColorClass: "text-gray-900",
      stickyTopClass: "md:top-32", // Sticks with padding + offset (176px)
    },
    {
      id: "card-3",
      heading: "Sustaining Impact: Economic Empowerment",
      description:
        "Our social enterprise model fuels long-term change. Whether you shop or donate, you’re helping us provide vital services to disabled children.",
      features: [
        {
          heading: "Community Marketplace",
          description:
            "Handmade goods and vocational services crafted by KAPCDAM families support both livelihoods and our mission.",
        },
        {
          heading: "Direct Donations",
          description:
            "Every contribution goes to essentials—therapy, education materials, assistive devices, and more.",
        },
        {
          heading: "Skills Development",
          description:
            "Vocational programs equip parents and youth with skills to generate income and reduce dependency.",
        },
        {
          heading: "Sponsorship Options",
          description:
            "Support a child’s journey through monthly giving, enabling consistent, reliable care and education.",
        },
      ],
      imageSrc:
        "https://res.cloudinary.com/teenkevo-cloud/image/upload/q_73/v1752876167/web-20220321-Kapcdam-118_bnmt9y.webp", // Placeholder image [^1][^2]
      backgroundColorClass: "bg-gray-100",
      borderColorClass: "border border-gray-300",
      textColorClass: "text-gray-900",
      hasShadow: true,
      stickyTopClass: "md:top-52", // Sticks with padding + offset (256px)
    },
    {
      id: "card-4",
      heading: "100% Transparency: Accountability You Can Trust",
      description:
        "We believe trust is earned. Every shilling donated is accounted for, and our financial practices are open to public scrutiny.",
      features: [
        {
          heading: "Open Financial Records",
          description:
            "Track how funds are used with weekly public ledger updates and full transaction breakdowns.",
        },
        {
          heading: "Zero Overhead Model",
          description:
            "No admin fees. All costs are covered through external grants so your donation goes entirely to impact.",
        },
        {
          heading: "Quarterly Impact Reports",
          description:
            "Stay informed with in-depth reports showing how your support improves lives on the ground.",
        },
        {
          heading: "Annual Independent Audits",
          description:
            "Every year, external auditors review our operations to maintain high standards of financial integrity.",
        },
      ],
      imageSrc:
        "https://res.cloudinary.com/teenkevo-cloud/image/upload/q_74/v1752884098/Candle_making_by_parents_of_Children_with_Disabilities_Association_sjb4nw.webp", // Placeholder image [^1][^2]
      backgroundColorClass: "bg-[#e7f2f0]",
      borderColorClass: "border border-gray-300",
      textColorClass: "text-gray-900",
      hasShadow: true,
      stickyTopClass: "md:top-[290px]", // Sticks with padding + offset (256px)
    },
  ];

  return (
    <div className="min-h-[200vh] bg-white">
      <div className="max-w-7xl mx-auto py-10 md:py-16 px-4 sm:px-6 lg:px-8">
        {/* Sticky stack wrapper */}
        <div
          className="relative flex flex-col gap-8 md:gap-12"
          // style={{ height: "calc(4 * 600px)" }}
        >
          {cardsData.map((card, index) => (
            <FeatureCard
              key={card.id}
              id={card.id}
              heading={card.heading}
              description={card.description}
              features={card.features}
              imageSrc={card.imageSrc}
              backgroundColorClass={card.backgroundColorClass}
              borderColorClass={card.borderColorClass}
              hasShadow={card.hasShadow || false}
              textColorClass={card.textColorClass}
              stickyTopClass={card.stickyTopClass}
              className={
                index === 0
                  ? "md:z-10"
                  : index === 1
                    ? "md:z-20"
                    : index === 2
                      ? "md:z-30"
                      : "md:z-40"
              }
            />
          ))}
        </div>
      </div>
    </div>
  );
}
