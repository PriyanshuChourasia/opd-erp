import { z } from "zod";

export const designationFormSchema = z.object({
  name: z.string().trim().min(1, "Name is required"),
  description: z.string().trim().optional().default(""),
  status: z.enum(["active", "inactive"]).default("active"),
  department_id: z.string().min(1, "Department is required"),
});

export type DesignationFormValues = z.infer<typeof designationFormSchema>;