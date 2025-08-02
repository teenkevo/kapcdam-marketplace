"use client";

import { SignUp } from "@clerk/nextjs";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";

function SignUpWithParams() {
  const searchParams = useSearchParams();
  const redirectUrl = searchParams.get("redirectUrl");

  return (
    <div className="flex min-h-screen items-center justify-center">
      <SignUp 
        forceRedirectUrl={redirectUrl || undefined}
        fallbackRedirectUrl="/"
      />
    </div>
  );
}

export default function Page() {
  return (
    <Suspense fallback={
      <div className="flex min-h-screen items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    }>
      <SignUpWithParams />
    </Suspense>
  );
}
