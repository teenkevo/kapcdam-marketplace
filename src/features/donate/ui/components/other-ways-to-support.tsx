"use client";

import SupportSystems from "./support-systems";

export default function OtherWaysToSupport() {
  return (
    <section className=" py-16 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className=" mb-12">
          <h2 className="text-2xl md:text-3xl mb-4 text-black font-extrabold tracking-tight">
            Other ways to support us
          </h2>

          <p className=" text-black max-w-2xl">
            There are many ways to support us. You can donate, volunteer, buy
            from our store or spread the word about our work.
          </p>
        </div>
        <SupportSystems />
      </div>
    </section>
  );
}
