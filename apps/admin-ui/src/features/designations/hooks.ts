import { createCrudHooks } from "@/features/_shared/crud-hooks";

import { designationsApi } from "./api";

export const {
  useList: useDesignations,
  useCreate: useCreateDesignation,
  useUpdate: useUpdateDesignation,
  useDelete: useDeleteDesignation,
} = createCrudHooks("designations", designationsApi, "Designation");