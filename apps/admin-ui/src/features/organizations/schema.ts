import { z } from "zod";

export const organizationFormSchema = z.object({
  name: z.string().trim().min(1, "Organization name is required"),
  legal_name: z.string().trim().optional().default(""),
  registration_number: z.string().trim().optional().default(""),
  email: z
    .string()
    .trim()
    .optional()
    .default("")
    .refine((v) => v === "" || z.string().email().safeParse(v).success, {
      message: "Enter a valid email",
    }),
  phone: z.string().trim().optional().default(""),
  address: z.string().trim().optional().default(""),
  city: z.string().trim().optional().default(""),
  state: z.string().trim().optional().default(""),
  country: z.string().trim().optional().default(""),
  pincode: z.string().trim().optional().default(""),
  timezone: z.string().trim().optional().default(""),
  locale: z.string().trim().optional().default(""),
  currency: z.string().trim().optional().default(""),
  status: z.enum(["active", "inactive"]).default("active"),
});

export type OrganizationFormValues = z.infer<typeof organizationFormSchema>;
