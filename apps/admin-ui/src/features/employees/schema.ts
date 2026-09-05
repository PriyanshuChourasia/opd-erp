import { z } from "zod";

export const employeeFormSchema = z.object({
  first_name: z.string().trim().min(1, "First name is required"),
  last_name: z.string().trim().optional().default(""),
  email: z.string().trim().min(1, "Email is required").email("Enter a valid email"),
  phone: z.string().trim().optional().default(""),
  gender: z.string().optional().default(""),
  date_of_joining: z.string().optional().default(""),
  status: z.enum(["active", "inactive"]).default("active"),
  department_id: z.string().min(1, "Department is required"),
  designation_id: z.string().min(1, "Designation is required"),
  user_id: z.string().optional().default("__none__"),
});

export type EmployeeFormValues = z.infer<typeof employeeFormSchema>;