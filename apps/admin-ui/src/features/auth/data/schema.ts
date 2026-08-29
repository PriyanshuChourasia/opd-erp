import { z } from "zod";

export const loginSchema = z.object({
  email: z
    .string()
    .min(1, "Enter your email or username")
    .refine(
      (val) => val.includes("@") || /^[a-zA-Z0-9_]{3,}$/.test(val),
      {
        message:
          "Enter a valid email or username (min 3 chars, letters/numbers/underscores only)",
      },
    ),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

export type LoginValues = z.infer<typeof loginSchema>;
