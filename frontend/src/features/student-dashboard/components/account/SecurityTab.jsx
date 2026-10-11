import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { FaPenToSquare } from 'react-icons/fa6';
import { useChangePassword } from '../../api/dashboard.queries.js';
import { passwordSchema } from '@/lib/validation';
import { applyServerErrors } from '@/lib/form-errors';
import { handleForcedLogout } from '@/lib/auth';
import { FORCED_LOGOUT_REASONS } from '@/constants';
import FormError from '@/components/ui/FormError.jsx';
import Modal from '@/components/ui/Modal.jsx';
import Input from '@/components/ui/Input.jsx';
import Button from '@/components/ui/Button.jsx';

const schema = z
  .object({
    currentPassword: z.string().min(1, 'Enter your current password'),
    newPassword: passwordSchema,
    confirmPassword: z.string(),
  })
  .refine((values) => values.newPassword === values.confirmPassword, {
    path: ['confirmPassword'],
    message: 'Both passwords must match',
  });

/** Security tab — currently just the change-password entry point. */
export default function SecurityTab() {
  const [open, setOpen] = useState(false);
  const [formError, setFormError] = useState(null);
  const changePassword = useChangePassword();

  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(schema),
    defaultValues: { currentPassword: '', newPassword: '', confirmPassword: '' },
  });

  const close = () => {
    setOpen(false);
    setFormError(null);
    reset();
  };

  const submit = handleSubmit(async (values) => {
    setFormError(null);
    try {
      await changePassword.mutateAsync({ currentPassword: values.currentPassword, newPassword: values.newPassword });
    } catch (error) {
      // A wrong current password belongs on that field; anything else is shown above the form.
      if (error.code === 'INVALID_PASSWORD') {
        setError('currentPassword', { type: 'server', message: error.message }, { shouldFocus: true });
      } else {
        setFormError(applyServerErrors(error, setError, ['currentPassword', 'newPassword', 'confirmPassword']));
      }
      return;
    }
    // The server ends every session on a password change; sign out here too and say why on the login page.
    close();
    handleForcedLogout(FORCED_LOGOUT_REASONS.PASSWORD_CHANGED);
  });

  return (
    <div className="rounded-xl bg-brand-50/60 p-5 dark:bg-surface-dark">
      <div className="mb-3 flex items-center justify-between gap-4 border-b-2 border-stone-200 pb-1.5 dark:border-stone-200">
        <h2 className="text-base font-bold text-brand-600 sm:text-lg dark:text-brand-300">
          Change Password
        </h2>
        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-label="Change password"
          className="rounded p-1 text-brand-600 transition-colors hover:bg-brand-100 hover:text-brand-800 dark:text-brand-400 dark:hover:bg-surface-dark"
        >
          <FaPenToSquare aria-hidden="true" className="h-4 w-4" />
        </button>
      </div>

      <p className="text-sm text-stone-700 dark:text-brand-200">
        <span className="font-bold text-stone-900 dark:text-white">Password:</span>{' '}
        <span className="tracking-widest">••••••••</span>
      </p>

      <Modal
        open={open}
        onClose={close}
        title="Change password"
        description="After the change you will sign in again with your new password, on this and any other device."
        footer={
          <>
            <Button variant="outline" onClick={close} disabled={changePassword.isPending}>
              Cancel
            </Button>
            <Button onClick={submit} isLoading={changePassword.isPending}>
              Update password
            </Button>
          </>
        }
      >
        <form onSubmit={submit} className="space-y-4" noValidate>
          <FormError>{formError}</FormError>
          <Input
            label="Current password"
            type="password"
            autoComplete="current-password"
            required
            error={errors.currentPassword?.message}
            {...register('currentPassword')}
          />
          <Input
            label="New password"
            type="password"
            autoComplete="new-password"
            required
            hint="At least 10 characters, with a letter and a number."
            error={errors.newPassword?.message}
            {...register('newPassword')}
          />
          <Input
            label="Confirm new password"
            type="password"
            autoComplete="new-password"
            required
            error={errors.confirmPassword?.message}
            {...register('confirmPassword')}
          />
        </form>
      </Modal>
    </div>
  );
}
