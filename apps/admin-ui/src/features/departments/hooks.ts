import { createCrudHooks } from "@/features/_shared/crud-hooks";

import { departmentsApi } from "./api";

export const {
  useList: useDepartments,
  useCreate: useCreateDepartment,
  useUpdate: useUpdateDepartment,
  useDelete: useDeleteDepartment,
} = createCrudHooks("departments", departmentsApi, "Department");