import { useAppSelector } from "@/store/hooks";
import type { AuthUser } from "@/store/auth-slice";

/**
 * Returns the currently authenticated user.
 *
 * DIP: Pages depend on this hook's return type, not on the Redux store
 * structure. If the store shape changes, only this hook needs updating.
 */
export function useCurrentUser(): AuthUser | null {
  return useAppSelector((state) => state.auth.user);
}
