import { z } from "zod";

export const mobileFormSchema = z.object({
  mobileNumber: z
    .string()
    .trim()
    .min(1, "required")
    .regex(/^[6-9][0-9]{9}$/, "invalid_mobile"),
});

export const otpFormSchema = z.object({
  otp: z.string().trim().min(1, "required").regex(/^[0-9]{6}$/, "invalid_otp"),
});

export type MobileFormValues = z.infer<typeof mobileFormSchema>;
export type OtpFormValues = z.infer<typeof otpFormSchema>;
