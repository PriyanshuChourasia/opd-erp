import { createCrudApi } from "@/features/_shared/crud";

import type { State, StateInput } from "./interface";

export const statesApi = createCrudApi<State, StateInput>("states");