import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import AuthCard, { FormAlert } from './components/AuthCard.jsx';
import { loginSchema } from './schemas/auth.schemas.js';
import { login as loginRequest, openAdminGate } from './api/auth.api.js';
import Input from '@/components/ui/Input.jsx';
import Button from '@/components/ui/Button.jsx';
import { useAuthStore } from '@/lib/auth';
import { ROLES, STORAGE_KEYS } from '@/constants';

const keySchema = z.object({ key: z.string().min(1, 'Enter the access key') });

// The pass is signed by the server and bound to this device, so keeping it in
// localStorage only spares the admin re-entering the key until it expires.
function readPass() {
  try {
    const stored = JSON.parse(localStorage.getItem(STORAGE_KEYS.ADMIN_GATE) ?? 'null');
    return stored && stored.expiresAt > Date.now() ? stored.gatePass : null;
  } catch {
    return null;
  }
}

function storePass(pass) {
  try {
    if (pass) localStorage.setItem(STORAGE_KEYS.ADMIN_GATE, JSON.stringify(pass));
    else localStorage.removeItem(STORAGE_KEYS.ADMIN_GATE);
  } catch {
    // Private mode: the pass still works for this visit.
  }
}

/**
 * Staff access page. Step 1 trades the access key for a server-signed pass;
 * step 2 is the admin's mobile + password, sent with that pass. The backend
 * refuses an admin sign-in without it, so skipping this page gains nothing.
 */
export default function AdminGate() {
  const [gatePass, setGatePass] = useState(readPass);
  return gatePass ? (
    <AdminSignIn
      gatePass={gatePass}
      onPassRejected={() => {
        storePass(null);
        setGatePass(null);
      }}
    />
  ) : (
    <AccessKey
      onOpened={(pass) => {
        storePass(pass);
        setGatePass(pass.gatePass);
      }}
    />
  );
}

function AccessKey({ onOpened }) {
  const [submitError, setSubmitError] = useState(null);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({ resolver: zodResolver(keySchema), defaultValues: { key: '' } });

  const onSubmit = async ({ key }) => {
    setSubmitError(null);
    try {
      onOpened(await openAdminGate(key));
    } catch (error) {
      setSubmitError(error.message ?? 'Could not check the key. Please try again.');
    }
  };

  return (
    <AuthCard title="Staff access" description="Enter the access key to continue.">
      <FormAlert>{submitError}</FormAlert>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
        <Input
          label="Access key"
          required
          type="password"
          autoComplete="off"
          error={errors.key?.message}
          {...register('key')}
        />
        <Button type="submit" fullWidth isLoading={isSubmitting}>
          Continue
        </Button>
      </form>
    </AuthCard>
  );
}

function AdminSignIn({ gatePass, onPassRejected }) {
  const navigate = useNavigate();
  const setSession = useAuthStore((s) => s.setSession);
  const [submitError, setSubmitError] = useState(null);
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
      const session = await loginRequest({ ...values, gatePass });
      setSession(session);
      navigate(session.user.role === ROLES.ADMIN ? '/admin' : '/dashboard', { replace: true });
    } catch (error) {
      // An expired pass, or one from before this device's ID changed: ask for the key again.
      if (error.code === 'ADMIN_GATE_REQUIRED') onPassRejected();
      else setSubmitError(error.message ?? 'Sign in failed. Please try again.');
    }
  };

  return (
    <AuthCard title="Staff sign in" description="Use your administrator mobile number and password.">
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
        <Input
          label="Password"
          required
          type="password"
          autoComplete="current-password"
          placeholder="••••••••"
          error={errors.password?.message}
          {...register('password')}
        />
        <Button type="submit" fullWidth isLoading={isSubmitting}>
          Sign in
        </Button>
      </form>
    </AuthCard>
  );
}
