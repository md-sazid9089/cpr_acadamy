import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import AuthCard, { FormAlert } from './components/AuthCard.jsx';
import { forgotPasswordSchema } from './schemas/auth.schemas.js';
import { forgotPassword } from './api/auth.api.js';
import Input from '@/components/ui/Input.jsx';
import Button from '@/components/ui/Button.jsx';

/** Step 1 of recovery: request an SMS reset code. */
export default function ForgotPassword() {
  const navigate = useNavigate();
  const [submitError, setSubmitError] = useState(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({ resolver: zodResolver(forgotPasswordSchema), defaultValues: { mobile: '' } });

  const onSubmit = async ({ mobile }) => {
    setSubmitError(null);
    try {
      await forgotPassword(mobile);
      navigate('/reset-password', { state: { mobile } });
    } catch (error) {
      setSubmitError(error.message ?? 'Could not send the reset code.');
    }
  };

  return (
    <AuthCard
      title="Forgot your password?"
      description="Enter your registered mobile number and we'll send a reset code."
      footer={
        <Link to="/login" className="font-semibold text-brand-700 hover:underline dark:text-brand-400">
          Back to sign in
        </Link>
      }
    >
      <FormAlert>{submitError}</FormAlert>

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
        <Button type="submit" size="lg" fullWidth isLoading={isSubmitting}>
          Send reset code
        </Button>
      </form>
    </AuthCard>
  );
}
