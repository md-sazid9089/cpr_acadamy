import { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import AuthCard, { FormAlert } from './components/AuthCard.jsx';
import { loginSchema } from './schemas/auth.schemas.js';
import { login as loginRequest } from './api/auth.api.js';
import Input from '@/components/ui/Input.jsx';
import Button from '@/components/ui/Button.jsx';
import { useAuthStore } from '@/lib/auth';
import { ACCOUNT_STATUS, FORCED_LOGOUT_REASONS, ROLES } from '@/constants';

const FORCED_LOGOUT_MESSAGES = {
  [FORCED_LOGOUT_REASONS.ANOTHER_DEVICE]:
    'You were signed out because this account was used on another device. Only one device can be signed in at a time.',
  [FORCED_LOGOUT_REASONS.TOKEN_EXPIRED]: 'Your session expired. Please sign in again.',
  [FORCED_LOGOUT_REASONS.ACCOUNT_SUSPENDED]:
    'This account has been suspended. Please contact the academy office.',
};

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const [submitError, setSubmitError] = useState(null);

  const setSession = useAuthStore((s) => s.setSession);
  const setPendingMobile = useAuthStore((s) => s.setPendingMobile);
  const forcedLogoutReason = useAuthStore((s) => s.forcedLogoutReason);
  const clearForcedLogout = useAuthStore((s) => s.clearForcedLogout);

  // Surface the "signed out elsewhere" notice once, then drop it.
  useEffect(() => () => clearForcedLogout(), [clearForcedLogout]);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(loginSchema),
    defaultValues: { mobile: '', password: '', rememberMe: true },
  });

  const onSubmit = async (values) => {
    setSubmitError(null);
    try {
      const session = await loginRequest(values);

      // An approved account goes straight in; anything else lands on the
      // pending screen rather than a protected route.
      setSession(session);

      if (session.user.status !== ACCOUNT_STATUS.ACTIVE) {
        setPendingMobile(session.user.mobile);
        navigate('/pending-approval', { replace: true });
        return;
      }

      const fallback = session.user.role === ROLES.ADMIN ? '/admin' : '/dashboard';
      navigate(location.state?.from ?? fallback, { replace: true });
    } catch (error) {
      setSubmitError(error.message ?? 'Sign in failed. Please try again.');
    }
  };

  return (
    <AuthCard
      title="Sign in"
      description="Use the mobile number you registered with."
      footer={
        <>
          New to CPR Medical Academy?{' '}
          <Link to="/register" className="font-semibold text-brand-700 hover:underline dark:text-brand-400">
            Create an account
          </Link>
        </>
      }
    >
      <FormAlert>{submitError ?? FORCED_LOGOUT_MESSAGES[forcedLogoutReason]}</FormAlert>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
        <Input
          label="Mobile number"
          required
          inputMode="numeric"
          autoComplete="tel"
          placeholder="01712345678"
          error={errors.mobile?.message}
          {...register('mobile')}
        />

        <Input
          label="Password"
          required
          type="password"
          autoComplete="current-password"
          placeholder="••••••••"
          error={errors.password?.message}
          {...register('password')}
        />

        <div className="flex items-center justify-between">
          <label className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
            <input
              type="checkbox"
              className="h-4 w-4 rounded border-slate-300 text-brand-600 focus:ring-brand-500 dark:border-slate-600 dark:bg-slate-800"
              {...register('rememberMe')}
            />
            Keep me signed in
          </label>

          <Link
            to="/forgot-password"
            className="text-sm font-medium text-brand-700 hover:underline dark:text-brand-400"
          >
            Forgot password?
          </Link>
        </div>

        <Button type="submit" size="lg" fullWidth isLoading={isSubmitting}>
          Sign in
        </Button>
      </form>

      <p className="mt-5 rounded-lg bg-surface-subtle p-3 text-xs text-slate-500 dark:bg-slate-800/60 dark:text-slate-400">
        One device at a time: signing in here ends any session already open on another phone or
        computer.
      </p>

      {/* Demo credentials while the backend is mocked — remove before launch. */}
      <p className="mt-3 text-center text-xs text-slate-400">
        Demo: 01711111111 (student) · 01799999999 (admin) · any password
      </p>
    </AuthCard>
  );
}
