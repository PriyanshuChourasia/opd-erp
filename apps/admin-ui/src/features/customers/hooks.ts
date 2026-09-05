import { createCrudHooks } from "@/features/_shared/crud-hooks";

import { customersApi } from "./api";

export const {
  useList: useCustomers,
  useShow: useShowCustomer,
  useCreate: useCreateCustomer,
  useUpdate: useUpdateCustomer,
  useDelete: useDeleteCustomer,
} = createCrudHooks("customers", customersApi, "Customer");