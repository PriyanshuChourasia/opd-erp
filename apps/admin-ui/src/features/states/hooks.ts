import { createCrudHooks } from "@/features/_shared/crud-hooks";

import { statesApi } from "./api";

export const {
  useList: useStates,
  useShow: useShowState,
  useCreate: useCreateState,
  useUpdate: useUpdateState,
  useDelete: useDeleteState,
} = createCrudHooks("states", statesApi, "State");