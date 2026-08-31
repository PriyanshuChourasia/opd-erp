import { z } from "zod";

export const stateFormSchema = z.object({
  name: z.string().trim().min(1, "Name is required"),
  code: z.string().trim().optional().default(""),
  country_id: z.string().min(1, "Country is required"),
  status: z.enum(["active", "inactive"]).default("active"),
});

export type StateFormValues = z.infer<typeof stateFormSchema>;