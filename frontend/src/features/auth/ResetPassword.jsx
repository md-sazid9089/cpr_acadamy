import { useState } from 'react';
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import AuthCard, { FormAlert } from './components/AuthCard.jsx';
import { resetPasswordSchema } from './schemas/auth.schemas.js';
import { resetPassword } from './api/auth.api.js';
import Input from '@/components/ui/Input.jsx';
import Button from '@/components/ui/Button.jsx';
import { OTP_LENGTH } from '@/constants';
import { maskMobile } from '@/lib/utils';

/** Step 2 of recovery: SMS code plus a new password. */
export default function ResetPassword() {
  const navigate = useNavigate();
  const location = useLocation();
  const [submitError, setSubmitError] = useState(null);
  const mobile = location.state?.mobile;

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: { otp: '', password: '', confirmPassword: '' },
  });

  if (!mobile) return <Navigate to="/forgot-password" replace />;

  const onSubmit = async (values) => {
    setSubmitError(null);
    try {
      await resetPassword({ mobile, ...values });
      navigate('/login', { replace: true });
    } catch (error) {
      setSubmitError(error.message ?? 'Could not reset the password.');
    }
  };

  return (
    <AuthCard
      title="Set a new password"
      description={`Enter the ${OTP_LENGTH}-digit code sent to ${maskMobile(mobile)}.`}
      footer={
        <Link to="/login" className="font-semibold text-brand-700 hover:underline dark:text-brand-400">
          Back to sign in
        </Link>
      }
    >
      <FormAlert>{submitError}</FormAlert>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
        <Input
          label="Reset code"
          required
          inputMode="numeric"
          autoComplete="one-time-code"
          maxLength={OTP_LENGTH}
          className="text-center text-lg tracking-[0.5em]"
          error={errors.otp?.message}
          {...register('otp')}
        />
        <Input
          label="New password"
          required
          type="password"
          autoComplete="new-password"
          error={errors.password?.message}
          {...register('password')}
        />
        <Input
          label="Confirm new password"
          required
          type="password"
          autoComplete="new-password"
          error={errors.confirmPassword?.message}
          {...register('confirmPassword')}
        />
        <Button type="submit" size="lg" fullWidth isLoading={isSubmitting}>
          Reset password
        </Button>
      </form>
    </AuthCard>
  );
}
