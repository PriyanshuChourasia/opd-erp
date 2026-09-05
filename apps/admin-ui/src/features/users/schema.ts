import { z } from "zod";

const profileFields = {
  phone: z.string().trim().optional().default(""),
  gender: z.string().optional().default(""),
  date_of_birth: z.string().optional().default(""),
  address: z.string().trim().optional().default(""),
  city: z.string().trim().optional().default(""),
  state: z.string().trim().optional().default(""),
  country: z.string().trim().optional().default(""),
  pincode: z.string().trim().optional().default(""),
  avatar_url: z.string().trim().optional().default(""),
  status: z.enum(["active", "inactive"]).default("active"),
} satisfies Record<string, z.ZodTypeAny>;

export const createUserFormSchema = z.object({
  name: z.string().trim().min(1, "Name is required"),
  email: z.string().trim().min(1, "Email is required").email("Enter a valid email"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  ...profileFields,
});

export const editUserFormSchema = z.object({
  name: z.string().trim().min(1, "Name is required"),
  email: z.string().trim().min(1, "Email is required").email("Enter a valid email"),
  password: z.string().optional().default(""),
  ...profileFields,
});

export type UserFormValues = z.infer<typeof editUserFormSchema>;