"use client";

import { usePathname, useRouter } from "next/navigation";
import { useConvexQuery, useConvexMutation } from "./use-convex-query";
import * as api from "@/lib/api";

export function useOnboarding() {
  const pathname = usePathname();
  const router = useRouter();

  const { data: currentUser, isLoading } = useConvexQuery(
    api.users.getCurrentUser
  );

  const { mutate: skipOnboarding } = useConvexMutation(
    api.users.skipOnboarding
  );

  const showOnboarding =
    !isLoading &&
    currentUser &&
    !currentUser.hasCompletedOnboarding &&
    pathname === "/";

  const handleOnboardingComplete = () => {
    router.refresh();
  };

  const handleOnboardingSkip = async () => {
    try {
      // Mark as done in DB so it NEVER shows again
      await skipOnboarding({});
    } catch (e) {
      console.error("Failed to skip onboarding:", e);
    }
  };

  return {
    showOnboarding,
    handleOnboardingComplete,
    handleOnboardingSkip,
    needsOnboarding: currentUser && !currentUser.hasCompletedOnboarding,
  };
}
