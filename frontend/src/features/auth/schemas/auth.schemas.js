import { z } from 'zod';
import {
  bdMobileAfterCountryCodeSchema,
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
    mobile: bdMobileAfterCountryCodeSchema,
    email: optionalEmailSchema,
    bmdcNumber: bmdcSchema,
    institution: z.string().min(1, 'Select your institution').max(120),
    institutionOther: z.string().trim().max(120).optional(),
    interest: z.enum([...COURSE_CATEGORIES, 'OTHER']),
    password: passwordSchema,
    confirmPassword: z.string(),
    acceptTerms: z.literal(true, {
      errorMap: () => ({ message: 'Please accept the terms to continue' }),
    }),
  })
  .refine((values) => values.password === values.confirmPassword, {
    path: ['confirmPassword'],
    message: 'Passwords do not match',
  })
  .refine((values) => values.institution !== 'OTHER' || Boolean(values.institutionOther?.trim()), {
    path: ['institutionOther'],
    message: 'Enter your institution',
  });

export const otpVerifySchema = z.object({
  otp: otpSchema,
});

export const forgotPasswordSchema = z.discriminatedUnion('channel', [
  z.object({ channel: z.literal('mobile'), mobile: bdMobileSchema }),
  z.object({
    channel: z.literal('email'),
    email: z.string().trim().min(1, 'Enter your email address').email('Enter a valid email address').max(254),
  }),
]);

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
