import { createCrudApi } from "@/features/_shared/crud";

import type { Organization, OrganizationInput } from "./interface";

export const organizationsApi = createCrudApi<Organization, OrganizationInput>(
  "organizations",
);
