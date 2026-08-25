import { toast } from "sonner";
import { useMutation } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { loginApi, extractApiError } from "@/lib/api";
import type { LoginValues } from "./schema";

export function useLogin() {
  const navigate = useNavigate();

  return useMutation({
    mutationFn: (values: LoginValues) =>
      loginApi(values.email, values.password),
    onSuccess: (data) => {
      localStorage.setItem("admin_access_token", data.accessToken);
      localStorage.setItem("admin_user", JSON.stringify(data.user));
      navigate({ to: "/dashboard" });
      toast.success("Logged in successfully");
    },
    onError: (err) => {
      toast.error(extractApiError(err));
    },
  });
}
