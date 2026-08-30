import { createCrudApi } from "@/features/_shared/crud";

import type { Customer, CustomerInput } from "./interface";

export const customersApi = createCrudApi<Customer, CustomerInput>("customers");