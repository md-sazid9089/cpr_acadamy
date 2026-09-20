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
import { COURSE_CATEGORIES, CATEGORY_LABELS, GOVERNMENT_MEDICAL_COLLEGES_BD, PRIVATE_MEDICAL_COLLEGES_BD } from '@/constants';

/**
 * Mobile-first signup. Normally sends the user to OTP verification; while the
 * backend has phone verification disabled, it logs them straight into the
 * approval-pending screen instead (see `result.accessToken` check below).
 */
export default function Register() {
  const navigate = useNavigate();
  const [submitError, setSubmitError] = useState(null);
  const setPendingMobile = useAuthStore((s) => s.setPendingMobile);
  const setSession = useAuthStore((s) => s.setSession);

  const {
    register,
    handleSubmit,
    setError,
    watch,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      fullName: '',
      mobile: '',
      email: '',
      bmdcNumber: '',
      institution: '',
      institutionOther: '',
      interest: 'FCPS',
      password: '',
      confirmPassword: '',
      acceptTerms: false,
    },
  });

  const selectedInstitution = watch('institution');

  const onSubmit = async (values) => {
    setSubmitError(null);
    // A custom "Other" institution is typed in a follow-up field; the sentinel
    // itself is never sent — the backend just stores free-text institution.
    const institution = values.institution === 'OTHER' ? values.institutionOther.trim() : values.institution;
    try {
      const result = await registerRequest({ ...values, institution });
      if (result.accessToken) {
        // Phone verification is currently disabled: the backend already logged
        // the account in, still pending admin approval.
        setSession(result);
        navigate('/pending-approval', { replace: true });
      } else {
        setPendingMobile(values.mobile);
        navigate('/verify-otp', { state: { mobile: values.mobile } });
      }
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
      description="Register with your mobile number."
      illustrations={[
        { src: '/assets/bg/undraw_doctors_djoj.svg', width: 693, height: 597 },
        { src: '/assets/bg/undraw_medicine_hqqg.svg', width: 1105, height: 783 },
      ]}
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
          <Select label="Institution" required error={errors.institution?.message} {...register('institution')}>
            <option value="" disabled>
              Select your medical college
            </option>
            <optgroup label="Government medical colleges">
              {GOVERNMENT_MEDICAL_COLLEGES_BD.map((college) => (
                <option key={college} value={college}>
                  {college}
                </option>
              ))}
            </optgroup>
            <optgroup label="Private medical colleges">
              {PRIVATE_MEDICAL_COLLEGES_BD.map((college) => (
                <option key={college} value={college}>
                  {college}
                </option>
              ))}
            </optgroup>
            <option value="OTHER">Other (not listed)</option>
          </Select>
        </div>

        {selectedInstitution === 'OTHER' && (
          <Input
            label="Your institution"
            required
            placeholder="Enter your medical college / institution name"
            error={errors.institutionOther?.message}
            {...register('institutionOther')}
          />
        )}

        <Select label="Preparing for" required error={errors.interest?.message} {...register('interest')}>
          {COURSE_CATEGORIES.map((category) => (
            <option key={category} value={category}>
              {CATEGORY_LABELS[category]}
            </option>
          ))}
          <option value="OTHER">Other</option>
        </Select>

        <div className="grid gap-4 sm:grid-cols-2">
          <Input
            label="Password"
            required
            type="password"
            autoComplete="new-password"
            hint="At least 10 characters, with a letter and a number."
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

        <label className="flex items-start gap-2.5 text-sm text-stone-600 dark:text-brand-200">
          <input
            type="checkbox"
            className="mt-0.5 h-4 w-4 rounded border-stone-200 text-brand-600 focus:ring-brand-500 dark:border-stone-200 dark:bg-surface-dark"
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

        <Button type="submit" fullWidth isLoading={isSubmitting}>
          Create account
        </Button>
      </form>

      <p className="mt-5 rounded-lg bg-surface-subtle p-3 text-xs text-stone-500 dark:bg-surface-dark dark:text-brand-200">
        An administrator reviews your registration. You'll receive an SMS once the account is
        activated — usually within a few working hours.
      </p>
    </AuthCard>
  );
}
