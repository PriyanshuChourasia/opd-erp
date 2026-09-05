import { z } from "zod";

export const licenseFormSchema = z
  .object({
    customer_id: z.string().min(1, "Customer is required"),
    organization_id: z.string().optional().default("__none__"),
    status: z
      .enum([
        "created",
        "active",
        "suspended",
        "expired",
        "revoked",
      ])
      .default("created"),
    issue_date: z.string().optional().default(""),
    start_date: z.string().optional().default(""),
    expiry_date: z.string().optional().default(""),
    plan: z.string().trim().optional().default(""),
    max_users: z.string().optional().default(""),
    max_devices: z.string().optional().default(""),
    features: z.string().optional().default(""),
  })
  .refine(
    (v) =>
      v.expiry_date === "" ||
      v.start_date === "" ||
      v.expiry_date >= v.start_date,
    {
      message: "Expiry date must be on or after the start date",
      path: ["expiry_date"],
    },
  );

export type LicenseFormValues = z.infer<typeof licenseFormSchema>;
