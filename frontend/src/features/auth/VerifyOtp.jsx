import { useState } from 'react';
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import AuthCard, { FormAlert } from './components/AuthCard.jsx';
import { otpVerifySchema } from './schemas/auth.schemas.js';
import { resendOtp, verifyOtp } from './api/auth.api.js';
import Input from '@/components/ui/Input.jsx';
import Button from '@/components/ui/Button.jsx';
import { useAuthStore } from '@/lib/auth';
import { useCountdown } from '@/hooks/useCountdown';
import { OTP_LENGTH, OTP_RESEND_SECONDS } from '@/constants';
import { maskMobile } from '@/lib/utils';

/** Step 2 of signup: SMS code entry. Success leads to the approval wait. */
export default function VerifyOtp() {
  const navigate = useNavigate();
  const location = useLocation();
  const [submitError, setSubmitError] = useState(null);

  const pendingMobile = useAuthStore((s) => s.pendingMobile);
  const setUser = useAuthStore((s) => s.setUser);
  const mobile = location.state?.mobile ?? pendingMobile;

  const resendTimer = useCountdown(OTP_RESEND_SECONDS);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({ resolver: zodResolver(otpVerifySchema), defaultValues: { otp: '' } });

  // Nothing to verify without a number — send the visitor back to registration.
  if (!mobile) return <Navigate to="/register" replace />;

  const onSubmit = async ({ otp }) => {
    setSubmitError(null);
    try {
      const { user } = await verifyOtp({ mobile, otp });
      // Verified, but not active: the account still needs admin approval, so we
      // store the user without a token and route to the waiting screen.
      setUser(user);
      navigate('/pending-approval', { replace: true });
    } catch (error) {
      setSubmitError(error.message ?? 'Verification failed. Please try again.');
    }
  };

  const handleResend = async () => {
    setSubmitError(null);
    try {
      await resendOtp(mobile);
      resendTimer.reset(OTP_RESEND_SECONDS);
    } catch (error) {
      setSubmitError(error.message ?? 'Could not resend the code.');
    }
  };

  return (
    <AuthCard
      title="Verify your mobile number"
      description={`We sent a ${OTP_LENGTH}-digit code to ${maskMobile(mobile)}.`}
      footer={
        <>
          Wrong number?{' '}
          <Link to="/register" className="font-semibold text-brand-700 hover:underline dark:text-brand-400">
            Start over
          </Link>
        </>
      }
    >
      <FormAlert>{submitError}</FormAlert>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
        <Input
          label="Verification code"
          required
          inputMode="numeric"
          autoComplete="one-time-code"
          maxLength={OTP_LENGTH}
          placeholder="••••••"
          className="text-center text-lg tracking-[0.5em]"
          error={errors.otp?.message}
          {...register('otp')}
        />

        <Button type="submit" size="lg" fullWidth isLoading={isSubmitting}>
          Verify
        </Button>
      </form>

      <div className="mt-5 text-center text-sm text-slate-600 dark:text-slate-400">
        {resendTimer.isExpired ? (
          <button
            type="button"
            onClick={handleResend}
            className="font-semibold text-brand-700 hover:underline dark:text-brand-400"
          >
            Resend code
          </button>
        ) : (
          <span>Resend available in {resendTimer.remaining}s</span>
        )}
      </div>
    </AuthCard>
  );
}
