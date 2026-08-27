import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { FaPenToSquare } from 'react-icons/fa6';
import { useChangePassword } from '../../api/dashboard.queries.js';
import { passwordSchema } from '@/lib/validation';
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
  const [saved, setSaved] = useState(false);
  const changePassword = useChangePassword();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(schema),
    defaultValues: { currentPassword: '', newPassword: '', confirmPassword: '' },
  });

  const close = () => {
    setOpen(false);
    reset();
  };

  const submit = handleSubmit(async (values) => {
    await changePassword.mutateAsync(values);
    setSaved(true);
    close();
  });

  return (
    <div className="rounded-xl bg-emerald-50/60 p-5 dark:bg-slate-900/40">
      <div className="mb-3 flex items-center justify-between gap-4 border-b-2 border-brand-200 pb-1.5 dark:border-slate-700">
        <h2 className="text-base font-bold text-brand-600 sm:text-lg dark:text-brand-300">
          Change Password
        </h2>
        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-label="Change password"
          className="rounded p-1 text-brand-600 transition-colors hover:bg-brand-100 hover:text-brand-800 dark:text-brand-400 dark:hover:bg-slate-800"
        >
          <FaPenToSquare aria-hidden="true" className="h-4 w-4" />
        </button>
      </div>

      <p className="text-sm text-slate-700 dark:text-slate-300">
        <span className="font-bold text-slate-900 dark:text-white">Password:</span>{' '}
        <span className="tracking-widest">••••••••</span>
      </p>

      {saved && (
        <p className="mt-3 text-sm font-bold text-emerald-700 dark:text-emerald-400">
          Your password has been updated.
        </p>
      )}

      <Modal
        open={open}
        onClose={close}
        title="Change password"
        description="You will stay signed in on this device."
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
        <form onSubmit={submit} className="space-y-4">
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
            hint="At least 8 characters, with a letter and a number."
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
