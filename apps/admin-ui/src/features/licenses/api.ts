import { createCrudApi } from "@/features/_shared/crud";

import type { License, LicenseInput } from "./interface";

export const licensesApi = createCrudApi<License, LicenseInput>("licenses");
