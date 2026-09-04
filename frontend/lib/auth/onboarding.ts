import { BashiriUser } from "@/stores/auth.store";

export type AuthResolutionState = {
  hasHydrated: boolean;
  isUserLoading: boolean;
  isAuthenticated: boolean;
};

export function shouldShowOnboarding(
  user: BashiriUser | null,
  authState: AuthResolutionState,
): boolean {
  return (
    authState.hasHydrated &&
    !authState.isUserLoading &&
    authState.isAuthenticated &&
    user?.onboarding_status === "not_started"
  );
}

export function getPostAuthPath(user: BashiriUser): "/onboarding" | "/home" {
  return user.onboarding_status === "not_started" ? "/onboarding" : "/home";
}