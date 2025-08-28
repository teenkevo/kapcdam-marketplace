"use client";

import { useUser } from "@clerk/nextjs";
import { useQuery } from "@tanstack/react-query";
import { useTRPC } from "@/trpc/client";

export function useIsAdmin(): { isAdmin: boolean; loading: boolean } {
  const { isSignedIn } = useUser();
  const trpc = useTRPC();

  const { data: adminProfile, isLoading } = useQuery({
    ...trpc.team.getAdminProfile.queryOptions(),
    enabled: isSignedIn,
    retry: false,
  });

  return { isAdmin: !!adminProfile && !isLoading, loading: isLoading };
}
