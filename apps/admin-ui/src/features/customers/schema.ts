import { z } from "zod";

export const customerFormSchema = z.object({
  first_name: z.string().trim().min(1, "First name is required"),
  last_name: z.string().trim().optional().default(""),
  company_name: z.string().trim().optional().default(""),
  tax_number: z.string().trim().optional().default(""),
  email: z.string().trim().min(1, "Email is required").email("Enter a valid email"),
  phone: z.string().trim().optional().default(""),
  gender: z.string().optional().default(""),
  date_of_birth: z.string().optional().default(""),
  address: z.string().trim().optional().default(""),
  city: z.string().trim().optional().default(""),
  state: z.string().trim().optional().default(""),
  country: z.string().trim().optional().default(""),
  pincode: z.string().trim().optional().default(""),
  billing_address: z.string().trim().optional().default(""),
  billing_city: z.string().trim().optional().default(""),
  billing_state: z.string().trim().optional().default(""),
  billing_country: z.string().trim().optional().default(""),
  billing_pincode: z.string().trim().optional().default(""),
  status: z.enum(["active", "inactive"]).default("active"),
  user_id: z.string().optional().default("__none__"),
});

export type CustomerFormValues = z.infer<typeof customerFormSchema>;