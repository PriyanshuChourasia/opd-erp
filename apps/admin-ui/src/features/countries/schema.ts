import { z } from "zod";

export const countryFormSchema = z.object({
  name: z.string().trim().min(1, "Name is required"),
  code: z
    .string()
    .trim()
    .min(1, "Code is required")
    .max(10, "Max 10 characters"),
  phone_code: z.string().trim().optional().default(""),
  status: z.enum(["active", "inactive"]).default("active"),
});

export type CountryFormValues = z.infer<typeof countryFormSchema>;