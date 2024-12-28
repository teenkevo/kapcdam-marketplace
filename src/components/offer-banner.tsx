import React from "react";

const OfferBanner: React.FC = () => {
  return (
    <div className="relative w-full h-64 overflow-hidden rounded-lg">
      {/* Background Image */}
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{
          backgroundImage:
            "url('https://res.cloudinary.com/teenkevo-cloud/image/upload/q_67/v1734881184/toni-cuenca-CvFARq2qu8Y-unsplash_pytymo.webp')",
        }}
      ></div>

      {/* Gradient Overlay */}
      <div className="absolute inset-0 bg-gradient-to-r from-black to-transparent"></div>

      {/* Content */}
      <div className="relative z-10 h-full flex flex-col justify-center px-8">
        <h2 className="text-4xl font-bold text-white mb-2">Christmas Sale</h2>
        <p className="text-xl text-gray-400">Up to 50% off on selected items</p>
        <button className="mt-4 px-6 py-2 bg-red-600 text-white font-semibold hover:bg-red-700 transition duration-300 w-max">
          Shop Now
        </button>
      </div>
    </div>
  );
};

export default OfferBanner;
