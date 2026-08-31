import { createCrudApi } from "@/features/_shared/crud";

import type { Country, CountryInput } from "./interface";

export const countriesApi = createCrudApi<Country, CountryInput>("countries");