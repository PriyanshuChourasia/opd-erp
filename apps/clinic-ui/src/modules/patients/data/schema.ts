import { z } from "zod";

export const genderEnum = z.enum(["Male", "Female", "Other"]);
export const bloodGroupEnum = z.enum(["A+", "A-", "B+", "B-", "O+", "O-", "AB+", "AB-"]);

export const createPatientSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  phone: z.string().min(6, "Phone must be at least 6 characters"),
  email: z.string().email("Enter a valid email").optional().or(z.literal("")),
  dateOfBirth: z.string().optional().or(z.literal("")),
  gender: genderEnum.optional().or(z.literal("")),
  bloodGroup: bloodGroupEnum.optional().or(z.literal("")),
  address: z.string().optional().or(z.literal("")),
  emergencyContact: z.string().optional().or(z.literal("")),
  allergies: z.array(z.string()).optional(),
});

export type CreatePatientFormValues = z.infer<typeof createPatientSchema>;
