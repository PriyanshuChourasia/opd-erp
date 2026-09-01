import { createCrudHooks } from "@/features/_shared/crud-hooks";

import { licensesApi } from "./api";

export const {
  useList: useLicenses,
  useShow: useShowLicense,
  useCreate: useCreateLicense,
  useUpdate: useUpdateLicense,
  useDelete: useDeleteLicense,
} = createCrudHooks("licenses", licensesApi, "License");
