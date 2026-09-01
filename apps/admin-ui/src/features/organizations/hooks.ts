import { createCrudHooks } from "@/features/_shared/crud-hooks";

import { organizationsApi } from "./api";

export const {
  useList: useOrganizations,
  useShow: useShowOrganization,
  useCreate: useCreateOrganization,
  useUpdate: useUpdateOrganization,
  useDelete: useDeleteOrganization,
} = createCrudHooks("organizations", organizationsApi, "Organization");
