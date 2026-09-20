import { z } from 'zod';
import { OTP_LENGTH } from '@/constants';

/**
 * Zod primitives shared by every form. Zod is used purely for runtime
 * validation here — no type inference, since the project is plain JavaScript.
 */

/** Bangladeshi mobile: 11 digits starting 013–019. */
export const bdMobileSchema = z
  .string()
  .trim()
  .regex(/^01[3-9]\d{8}$/, 'Enter a valid Bangladeshi mobile number, e.g. 01712345678');

/**
 * Bangladeshi mobile typed after a visible "+880" prefix, so the leading 0
 * (already implied by the country code) is left off: 1XXXXXXXXX, not
 * 01XXXXXXXXX. Normalizes to the standard 01XXXXXXXXX form the API expects.
 */
export const bdMobileAfterCountryCodeSchema = z
  .string()
  .trim()
  .regex(/^1[3-9]\d{8}$/, 'Enter a valid Bangladeshi mobile number, e.g. 1712345678')
  .transform((value) => `0${value}`);

export const fullNameSchema = z
  .string()
  .trim()
  .min(3, 'Please enter your full name')
  .max(80, 'Name is too long');

export const passwordSchema = z
  .string()
  .min(10, 'Password must be at least 10 characters')
  .regex(/[a-zA-Z]/, 'Include at least one letter')
  .regex(/\d/, 'Include at least one number');

export const otpSchema = z
  .string()
  .trim()
  .length(OTP_LENGTH, `Enter the ${OTP_LENGTH}-digit code`)
  .regex(/^\d+$/, 'The code contains digits only');

export const optionalEmailSchema = z
  .union([z.string().trim().email('Enter a valid email address'), z.literal('')])
  .optional();

/** BMDC registration number — format varies, so only a loose sanity check. */
export const bmdcSchema = z
  .string()
  .trim()
  .min(4, 'Enter your BMDC registration number')
  .max(20, 'That number looks too long')
  .optional()
  .or(z.literal(''));
