import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import AuthCard, { FormAlert } from './components/AuthCard.jsx';
import { forgotPasswordSchema } from './schemas/auth.schemas.js';
import { forgotPassword } from './api/auth.api.js';
import Input from '@/components/ui/Input.jsx';
import Button from '@/components/ui/Button.jsx';
import { cn } from '@/lib/utils';

const CHANNELS = [
  { value: 'mobile', label: 'Mobile number' },
  { value: 'email', label: 'Email' },
];

/** Step 1 of recovery: request a reset code by SMS or email. */
export default function ForgotPassword() {
  const navigate = useNavigate();
  const [submitError, setSubmitError] = useState(null);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    clearErrors,
    formState: { errors, isSubmitting },
  } = useForm({ resolver: zodResolver(forgotPasswordSchema), defaultValues: { channel: 'mobile', mobile: '', email: '' } });
  const channel = watch('channel');

  const selectChannel = (value) => {
    setValue('channel', value);
    clearErrors();
    setSubmitError(null);
  };

  const onSubmit = async (values) => {
    setSubmitError(null);
    const identity = values.channel === 'email' ? { email: values.email } : { mobile: values.mobile };
    try {
      await forgotPassword(identity);
      navigate('/reset-password', { state: identity });
    } catch (error) {
      setSubmitError(error.message ?? 'Could not send the reset code.');
    }
  };

  return (
    <AuthCard
      title="Forgot your password?"
      description={
        channel === 'email'
          ? "Enter the email address on your account and we'll email you a reset code."
          : "Enter your registered mobile number and we'll send a reset code."
      }
      footer={
        <Link to="/login" className="font-semibold text-brand-700 hover:underline dark:text-brand-400">
          Back to sign in
        </Link>
      }
    >
      <FormAlert>{submitError}</FormAlert>

      <div className="mb-4 grid grid-cols-2 gap-1 rounded-control border border-stone-200 p-1" role="group" aria-label="Send the reset code to">
        {CHANNELS.map((option) => (
          <button
            key={option.value}
            type="button"
            aria-pressed={channel === option.value}
            onClick={() => selectChannel(option.value)}
            className={cn(
              'rounded-control px-3 py-2 text-sm font-semibold transition-colors',
              channel === option.value
                ? 'bg-brand-700 text-white'
                : 'text-stone-600 hover:bg-stone-100 hover:text-stone-900',
            )}
          >
            {option.label}
          </button>
        ))}
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
        {channel === 'email' ? (
          <Input
            key="email"
            label="Email address"
            required
            type="email"
            inputMode="email"
            autoComplete="email"
            placeholder="you@example.com"
            maxLength={254}
            error={errors.email?.message}
            {...register('email')}
          />
        ) : (
          <Input
            key="mobile"
            label="Mobile number"
            required
            inputMode="numeric"
            autoComplete="tel"
            placeholder="01712345678"
            error={errors.mobile?.message}
            {...register('mobile')}
          />
        )}
        <Button type="submit" fullWidth isLoading={isSubmitting}>
          Send reset code
        </Button>
      </form>
    </AuthCard>
  );
}
