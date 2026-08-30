import { createCrudApi } from "@/features/_shared/crud";

import type { Designation, DesignationInput } from "./interface";

export const designationsApi = createCrudApi<Designation, DesignationInput>("designations");