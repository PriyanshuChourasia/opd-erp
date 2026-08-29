import { useMutation, useQuery } from "@tanstack/react-query";
import { toast } from "sonner";

import { extractApiError } from "@/lib/api-client";
import { clearAuth, hasToken, persistAuth } from "./auth-store";
import { fetchMe, loginApi, logoutApi } from "./api";
import type { LoginValues } from "./schema";

export function useLogin() {
  return useMutation({
    mutationFn: (values: LoginValues) => loginApi(values.email, values.password),
    onSuccess: (data) => {
      persistAuth(data);
      toast.success(`Welcome back, ${data.user.firstName}`);
      window.location.assign("/dashboard");
    },
    onError: (error) => {
      toast.error(extractApiError(error));
    },
  });
}

export function useMe(enabled: boolean) {
  return useQuery({
    queryKey: ["me"],
    queryFn: fetchMe,
    enabled,
  });
}

export function useLogout() {
  const onSettled = () => {
    clearAuth();
    window.location.assign("/");
  };

  return useMutation({
    mutationFn: logoutApi,
    onSuccess: onSettled,
    onError: onSettled,
  });
}

export function useIsAuthenticated() {
  return hasToken();
}