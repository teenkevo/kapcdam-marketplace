"use client";

import { SignIn } from "@clerk/nextjs";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";

function SignInWithParams() {
  const searchParams = useSearchParams();
  const redirectUrl = searchParams.get("redirectUrl");

  return (
    <div className="flex min-h-screen items-center justify-center">
      <SignIn 
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
      <SignInWithParams />
    </Suspense>
  );
}
