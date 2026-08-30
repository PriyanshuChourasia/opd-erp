import { createCrudHooks } from "@/features/_shared/crud-hooks";

import { employeesApi } from "./api";

export const {
  useList: useEmployees,
  useCreate: useCreateEmployee,
  useUpdate: useUpdateEmployee,
  useDelete: useDeleteEmployee,
} = createCrudHooks("employees", employeesApi, "Employee");