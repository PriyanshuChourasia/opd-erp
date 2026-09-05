import { z } from "zod";

export const departmentFormSchema = z.object({
  name: z.string().trim().min(1, "Name is required"),
  code: z.string().trim().optional().default(""),
  description: z.string().trim().optional().default(""),
  status: z.enum(["active", "inactive"]).default("active"),
});

export type DepartmentFormValues = z.infer<typeof departmentFormSchema>;