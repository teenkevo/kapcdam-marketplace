import ProductCategoriesAbout from "@/components/product-categories-about";
import { Button } from "@/components/ui/button";
import { Clock, CheckCircle, LockIcon } from "lucide-react";

export default function MarketPlaceTeaser() {
  return (
    <div className="w-full bg-gray-100 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto py-16 px-4 sm:px-6 lg:px-8">
        {/* Outer white card container */}
        <div className="bg-white rounded-3xl shadow-2xl p-4">
          {/* Inner gray card */}
          <div className="bg-[#eaeaea] rounded-2xl p-4 md:p-6">
            <div className="grid md:grid-cols-2 gap-6">
              {/* Left Panel - No background, just border on gray */}
              <div className="rounded-xl border border-gray-300 p-4 md:p-6">
                <h3 className="text-2xl md:text-3xl font-bold text-gray-900 mb-4 tracking-tight">
                  How we spend your money
                </h3>
                <p className="text-gray-600 mb-8 leading-relaxed">
                  Every donation and marketplace purchase directly supports
                  disabled children in Uganda. We hope to go beyond Uganda and
                  support children in other countries, but for now, we are still
                  here. Your contribution helps provide education, healthcare,
                  and opportunities for a brighter future.
                </p>

                {/* Tags */}
                <div className="flex flex-wrap gap-3 mb-8">
                  <span className="px-4 py-2 bg-white rounded-full text-sm font-medium text-gray-700 border border-gray-300">
                    50% Education
                  </span>
                  <span className="px-4 py-2 bg-white rounded-full text-sm font-medium text-gray-700 border border-gray-300">
                    30% Healthcare
                  </span>
                  <span className="px-4 py-2 bg-white rounded-full text-sm font-medium text-gray-700 border border-gray-300">
                    10% Empowerment
                  </span>
                  <span className="px-4 py-2 bg-white rounded-full text-sm font-medium text-gray-700 border border-gray-300">
                    10% Community
                  </span>
                </div>

                <button className="text-blue-600 font-medium hover:text-blue-700 transition-colors">
                  Learn more about our impact
                </button>
              </div>

              {/* Right Panel - Dark with border */}
              <div className="bg-gradient-to-b from-blue-900 to-gray-900 rounded-xl border border-gray-700 p-4 md:p-6 text-white">
                <h3 className="text-2xl md:text-3xl font-bold mb-4">
                  Buy from our marketplace
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
