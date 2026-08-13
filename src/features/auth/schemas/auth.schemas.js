import { z } from 'zod';
import {
  bdMobileSchema,
  bmdcSchema,
  fullNameSchema,
  optionalEmailSchema,
  otpSchema,
  passwordSchema,
} from '@/lib/validation';
import { COURSE_CATEGORIES } from '@/constants';

/** Runtime validation schemas for every auth form. */

export const loginSchema = z.object({
  mobile: bdMobileSchema,
  password: z.string().min(1, 'Enter your password'),
  rememberMe: z.boolean().optional(),
});

export const registerSchema = z
  .object({
    fullName: fullNameSchema,
    mobile: bdMobileSchema,
    email: optionalEmailSchema,
    bmdcNumber: bmdcSchema,
    institution: z.string().trim().min(2, 'Enter your institution').max(120),
    interest: z.enum(COURSE_CATEGORIES),
    password: passwordSchema,
    confirmPassword: z.string(),
    acceptTerms: z.literal(true, {
      errorMap: () => ({ message: 'Please accept the terms to continue' }),
    }),
  })
  .refine((values) => values.password === values.confirmPassword, {
    path: ['confirmPassword'],
    message: 'Passwords do not match',
  });

export const otpVerifySchema = z.object({
  otp: otpSchema,
});

export const forgotPasswordSchema = z.object({
  mobile: bdMobileSchema,
});

export const resetPasswordSchema = z
  .object({
    otp: otpSchema,
    password: passwordSchema,
    confirmPassword: z.string(),
  })
  .refine((values) => values.password === values.confirmPassword, {
    path: ['confirmPassword'],
    message: 'Passwords do not match',
  });
