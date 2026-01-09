import { z } from 'zod';

export const strictPhoneSchema = z.string().trim().regex(/^\+[1-9]\d{10,14}$/, { message: "Invalid phone number format. Must be E.164 (e.g. +919999999999)" });

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
