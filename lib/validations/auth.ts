import { z } from 'zod';

export const strictPhoneSchema = z.string()
    // Basic E.164-ish check: + followed by 10-15 digits, OR just 10-15 digits (allowing local format if needed, but strict is improved)
    // Regex: Optional +, then 10 to 15 digits. No spaces/dashes allowed in raw input.
    .regex(/^\+?\d{10,15}$/, "Phone number must be 10-15 digits, optional + prefix, no spaces")
    .transform(val => val.trim());

export const otpRequestSchema = z.object({
    action: z.literal('request'),
    phone: strictPhoneSchema,
}).strict(); // Reject unknown fields

export const otpVerifySchema = z.object({
    action: z.literal('verify'),
    phone: strictPhoneSchema,
    otp: z.string().length(6, "OTP must be 6 digits").regex(/^\d+$/),
}).strict();

export const authSchema = z.discriminatedUnion("action", [
    otpRequestSchema,
    otpVerifySchema
]);
