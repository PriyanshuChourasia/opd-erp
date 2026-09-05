import { createCrudApi } from "@/features/_shared/crud";

import type { Employee, EmployeeInput } from "./interface";

export const employeesApi = createCrudApi<Employee, EmployeeInput>("employees");