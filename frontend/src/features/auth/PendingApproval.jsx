import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { FaCheck } from 'react-icons/fa6';
import AuthCard from './components/AuthCard.jsx';
import { fetchApprovalStatus } from './api/auth.api.js';
import Button from '@/components/ui/Button.jsx';
import Badge from '@/components/ui/Badge.jsx';
import { useAuthStore } from '@/lib/auth';
import { ACCOUNT_STATUS, CONTACT } from '@/constants';
import { maskMobile } from '@/lib/utils';

const STEPS = [
  { key: 'registered', label: 'Registration submitted' },
  { key: 'verified', label: 'Mobile number verified' },
  { key: 'approval', label: 'Administrator approval' },
  { key: 'active', label: 'Account activated' },
];

/**
 * Terminal state between OTP verification and activation. The account exists
 * and is verified, but an administrator has not approved it yet, so no
 * protected route is reachable.
 */
export default function PendingApproval() {
  const user = useAuthStore((s) => s.user);
  const pendingMobile = useAuthStore((s) => s.pendingMobile);
  const logout = useAuthStore((s) => s.logout);
  const setUser = useAuthStore((s) => s.setUser);

  const mobile = user?.mobile ?? pendingMobile;
  const status = user?.status ?? ACCOUNT_STATUS.AWAITING_APPROVAL;
  const isRejected = status === ACCOUNT_STATUS.REJECTED;

  // Poll so the screen flips over on its own the moment an admin approves.
  const { refetch, isFetching } = useQuery({
    queryKey: ['auth', 'approval-status', mobile],
    queryFn: async () => {
      const result = await fetchApprovalStatus(mobile);
      if (user && result.status !== user.status) setUser({ ...user, status: result.status });
      return result;
    },
    enabled: Boolean(mobile) && !isRejected,
    refetchInterval: 30_000,
  });

  // How far along the four-step strip we are.
  const reachedIndex = isRejected ? 1 : status === ACCOUNT_STATUS.ACTIVE ? 3 : 2;

  return (
    <AuthCard
      title={isRejected ? 'Registration not approved' : 'Your account is awaiting approval'}
      description={
        isRejected
          ? 'Our team could not verify the details you submitted.'
          : `Thanks for verifying ${mobile ? maskMobile(mobile) : 'your number'}. An administrator reviews every new registration before it is activated.`
      }
      footer={
        <>
          Approved already?{' '}
          <Link to="/login" className="font-semibold text-brand-700 hover:underline dark:text-brand-400">
            Sign in
          </Link>
        </>
      }
    >
      <div className="mb-6 flex items-center gap-2">
        <span className="text-sm text-slate-600 dark:text-slate-400">Status</span>
        <Badge tone={isRejected ? 'danger' : 'warning'}>
          {isRejected ? 'Rejected' : 'Awaiting approval'}
        </Badge>
      </div>

      <ol className="space-y-3">
        {STEPS.map((step, index) => {
          const done = index <= reachedIndex - 1;
          const current = index === reachedIndex;
          return (
            <li key={step.key} className="flex items-center gap-3">
              <span
                className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                  done
                    ? 'bg-brand-600 text-white'
                    : current
                      ? 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300'
                      : 'bg-slate-100 text-slate-400 dark:bg-slate-800 dark:text-slate-500'
                }`}
              >
                {done ? <FaCheck aria-hidden="true" className="h-3 w-3" /> : index + 1}
              </span>
              <span
                className={`text-sm ${
                  done || current
                    ? 'font-medium text-slate-800 dark:text-slate-200'
                    : 'text-slate-400 dark:text-slate-500'
                }`}
              >
                {step.label}
              </span>
            </li>
          );
        })}
      </ol>

      {!isRejected && (
        <div className="mt-6 rounded-lg bg-surface-subtle p-4 text-sm text-slate-600 dark:bg-slate-800/60 dark:text-slate-400">
          Approvals are usually completed within a few working hours (Saturday – Thursday,
          {` ${CONTACT.hours.split(', ')[1]}`}). You'll get an SMS as soon as your account is live.
        </div>
      )}

      <div className="mt-6 grid gap-3 sm:grid-cols-2">
        {!isRejected && (
          <Button variant="outline" fullWidth isLoading={isFetching} onClick={() => refetch()}>
            Check status
          </Button>
        )}
        <Button href={`https://wa.me/${CONTACT.whatsapp}`} variant="secondary" fullWidth>
          Contact support
        </Button>
      </div>

      <button
        type="button"
        onClick={logout}
        className="mt-5 w-full text-center text-sm text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
      >
        Sign out
      </button>
    </AuthCard>
  );
}
