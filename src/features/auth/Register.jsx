import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import AuthCard, { FormAlert } from './components/AuthCard.jsx';
import { registerSchema } from './schemas/auth.schemas.js';
import { register as registerRequest } from './api/auth.api.js';
import Input, { Select } from '@/components/ui/Input.jsx';
import Button from '@/components/ui/Button.jsx';
import { useAuthStore } from '@/lib/auth';
import { COURSE_CATEGORIES, CATEGORY_LABELS } from '@/constants';

/** Mobile-first signup. Success sends the user to OTP verification. */
export default function Register() {
  const navigate = useNavigate();
  const [submitError, setSubmitError] = useState(null);
  const setPendingMobile = useAuthStore((s) => s.setPendingMobile);

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      fullName: '',
      mobile: '',
      email: '',
      bmdcNumber: '',
      institution: '',
      interest: 'FCPS',
      password: '',
      confirmPassword: '',
      acceptTerms: false,
    },
  });

  const onSubmit = async (values) => {
    setSubmitError(null);
    try {
      await registerRequest(values);
      setPendingMobile(values.mobile);
      navigate('/verify-otp', { state: { mobile: values.mobile } });
    } catch (error) {
      // Map backend field errors onto the form where possible.
      Object.entries(error.fieldErrors ?? {}).forEach(([field, message]) => {
        setError(field, { type: 'server', message });
      });
      setSubmitError(error.message ?? 'Registration failed. Please try again.');
    }
  };

  return (
    <AuthCard
      title="Create your account"
      description="Register with your mobile number. We'll send a verification code by SMS."
      footer={
        <>
          Already registered?{' '}
          <Link to="/login" className="font-semibold text-brand-700 hover:underline dark:text-brand-400">
            Sign in
          </Link>
        </>
      }
    >
      <FormAlert>{submitError}</FormAlert>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
        <Input
          label="Full name"
          required
          autoComplete="name"
          placeholder="Dr. Rahim Uddin"
          error={errors.fullName?.message}
          {...register('fullName')}
        />

        <Input
          label="Mobile number"
          required
          inputMode="numeric"
          autoComplete="tel"
          placeholder="1712345678"
          prefix="+880"
          hint="This becomes your login ID. One account per number."
          error={errors.mobile?.message}
          {...register('mobile')}
        />

        <Input
          label="Email (optional)"
          type="email"
          autoComplete="email"
          placeholder="you@example.com"
          error={errors.email?.message}
          {...register('email')}
        />

        <div className="grid gap-4 sm:grid-cols-2">
          <Input
            label="BMDC reg. no."
            placeholder="A-12345"
            hint="Speeds up approval."
            error={errors.bmdcNumber?.message}
            {...register('bmdcNumber')}
          />
          <Input
            label="Institution"
            required
            placeholder="Dhaka Medical College"
            error={errors.institution?.message}
            {...register('institution')}
          />
        </div>

        <Select label="Preparing for" required error={errors.interest?.message} {...register('interest')}>
          {COURSE_CATEGORIES.map((category) => (
            <option key={category} value={category}>
              {CATEGORY_LABELS[category]}
            </option>
          ))}
        </Select>

        <div className="grid gap-4 sm:grid-cols-2">
          <Input
            label="Password"
            required
            type="password"
            autoComplete="new-password"
            hint="At least 8 characters."
            error={errors.password?.message}
            {...register('password')}
          />
          <Input
            label="Confirm password"
            required
            type="password"
            autoComplete="new-password"
            error={errors.confirmPassword?.message}
            {...register('confirmPassword')}
          />
        </div>

        <label className="flex items-start gap-2.5 text-sm text-slate-600 dark:text-slate-400">
          <input
            type="checkbox"
            className="mt-0.5 h-4 w-4 rounded border-slate-300 text-brand-600 focus:ring-brand-500 dark:border-slate-600 dark:bg-slate-800"
            {...register('acceptTerms')}
          />
          <span>
            I agree to the{' '}
            <Link to="/faq" className="font-medium text-brand-700 hover:underline dark:text-brand-400">
              terms, privacy policy
            </Link>{' '}
            and the single-device access rule.
          </span>
        </label>
        {errors.acceptTerms && (
          <p className="text-xs font-medium text-red-600 dark:text-red-400">
            {errors.acceptTerms.message}
          </p>
        )}

        <Button type="submit" size="lg" fullWidth isLoading={isSubmitting}>
          Send verification code
        </Button>
      </form>

      <p className="mt-5 rounded-lg bg-surface-subtle p-3 text-xs text-slate-500 dark:bg-slate-800/60 dark:text-slate-400">
        After OTP verification an administrator reviews your registration. You'll receive an SMS
        once the account is activated — usually within a few working hours.
      </p>
    </AuthCard>
  );
}
