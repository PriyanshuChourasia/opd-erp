import { toast } from "sonner";
import { extractApiError } from "@/lib/axios-client";
import { useMutation } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { useDispatch } from "react-redux";
import { setCredentials } from "@/store/auth-slice";
import { getHomeRoute } from "@/lib/roles";
import { loginApi, registerApi } from "./api";
import type { LoginValues, RegisterValues } from "./schema";

export function useLogin() {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  return useMutation({
    mutationFn: (values: LoginValues) => loginApi(values.email, values.password),
    onSuccess: (data) => {
      dispatch(setCredentials(data));
      navigate({ to: getHomeRoute(data.user.roleName) });
      toast.success("Logged in successfully");
    },
    onError: (err) => { toast.error(extractApiError(err)); },
  });
}

export function useRegister() {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  return useMutation({
    mutationFn: (values: RegisterValues) =>
      registerApi(values.username, values.firstName, values.lastName, values.email, values.password),
    onSuccess: (data) => {
      dispatch(setCredentials(data));
      navigate({ to: getHomeRoute(data.user.roleName) });
      toast.success("Account created successfully");
    },
    onError: (err) => { toast.error(extractApiError(err)); },
  });
}
