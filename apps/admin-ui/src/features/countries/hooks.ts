import { createCrudHooks } from "@/features/_shared/crud-hooks";

import { countriesApi } from "./api";

export const {
  useList: useCountries,
  useShow: useShowCountry,
  useCreate: useCreateCountry,
  useUpdate: useUpdateCountry,
  useDelete: useDeleteCountry,
} = createCrudHooks("countries", countriesApi, "Country");