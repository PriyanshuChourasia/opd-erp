import { createCrudApi } from "@/features/_shared/crud";

import type { Department, DepartmentInput } from "./interface";

export const departmentsApi = createCrudApi<Department, DepartmentInput>("departments");