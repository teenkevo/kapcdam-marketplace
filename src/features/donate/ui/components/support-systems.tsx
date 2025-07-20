import ProductCategoriesAbout from "@/components/product-categories-about";
import { Button } from "@/components/ui/button";
import { Clock, CheckCircle, LockIcon } from "lucide-react";
import Image from "next/image";

export default function SupportSystems() {
  return (
    <div className="w-full">
      <div>
        {/* Outer white card container */}
        <div className="bg-white rounded-3xl shadow-2xl p-4">
          {/* Inner gray card */}
          <div className="bg-[#eaeaea] rounded-2xl p-4 md:p-6">
            <div className="grid md:grid-cols-2 gap-6">
              {/* Left Panel - No background, just border on gray */}
              <div className="rounded-xl border border-gray-300 p-4 md:p-6">
                <h3 className="text-2xl md:text-3xl font-bold text-gray-900 mb-4 tracking-tight">
                  1. Volunteer with us
                </h3>
                <p className="text-gray-600 mb-8 leading-relaxed">
                  We are always looking for volunteers to help us with our work.
                  You can volunteer in our office, at our events, or in our
                  community.
                </p>

                <Image
                  src="https://res.cloudinary.com/teenkevo-cloud/image/upload/q_70/v1753037047/Financial_literacy_to_one_of_our_saving_groups_h9vhjf.webp"
                  alt="Volunteer with us"
                  width={500}
                  height={500}
                />
              </div>

              {/* Right Panel - Dark with border */}
              <div className="bg-gradient-to-b from-blue-900 to-gray-900 rounded-xl border border-gray-700 p-4 md:p-6 text-white">
                <h3 className="text-2xl md:text-3xl font-bold mb-4">
                  2. Buy from our marketplace
                </h3>
                <p className="text-gray-300 mb-8 leading-relaxed">
                  We have a wide range of products for you to choose from. All
                  products are made in partnership with the parents’ support
                  groups of disabled children. From handrafted products to
                  essential suplies and a skilling center, we have something for
                  everyone.
                </p>

                {/* Time indicator */}
                <div className="flex items-center gap-2 mb-6">
                  <LockIcon className="w-4 h-4 text-gray-400" />
                  <span className="text-sm text-gray-300">
                    Secure and transparent transactions
                  </span>
                </div>

                {/* Progress indicator */}
                <div className="flex items-center gap-2 mb-8">
                  <CheckCircle className="w-4 h-4 text-green-400" />
                  <span className="text-sm text-gray-300">
                    100% of proceeds support children
                  </span>
                </div>

                <Button className="bg-white text-gray-900 hover:bg-gray-100 font-medium px-8 py-3 rounded-full">
                  Visit Marketplace
                </Button>
              </div>
            </div>
            <ProductCategoriesAbout />
          </div>
        </div>
      </div>
    </div>
  );
}
