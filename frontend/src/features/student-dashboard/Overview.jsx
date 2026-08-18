import { Link } from 'react-router-dom';
import {
  FaBookOpen,
  FaCreditCard,
  FaUsers,
  FaMoneyBillWave,
  FaBell,
  FaComments,
  FaBookBookmark,
  FaIdCard,
} from 'react-icons/fa6';
import { useAuthStore } from '@/lib/auth';

const DASHBOARD_MENU = [
  {
    id: 'my-course',
    title: 'My Course',
    to: '/dashboard/courses',
    icon: FaBookOpen,
    iconColor: 'text-blue-600',
    bgColor: 'bg-blue-50 dark:bg-blue-950/50',
  },
  {
    id: 'subscriptions',
    title: 'Subscriptions',
    to: '/dashboard/payments',
    icon: FaCreditCard,
    iconColor: 'text-indigo-600',
    bgColor: 'bg-indigo-50 dark:bg-indigo-950/50',
  },
  {
    id: 'available-batch',
    title: 'Available Batch',
    to: '/batches',
    icon: FaUsers,
    iconColor: 'text-sky-600',
    bgColor: 'bg-sky-50 dark:bg-sky-950/50',
  },
  {
    id: 'pay-now',
    title: 'Pay Now',
    to: '/dashboard/payments',
    icon: FaMoneyBillWave,
    iconColor: 'text-emerald-600',
    bgColor: 'bg-emerald-50 dark:bg-emerald-950/50',
  },
  {
    id: 'notice',
    title: 'Notice',
    to: '/class',
    icon: FaBell,
    iconColor: 'text-blue-500',
    bgColor: 'bg-blue-50 dark:bg-blue-950/50',
  },
  {
    id: 'complain-box',
    title: 'Complain Box',
    to: '/contact',
    icon: FaComments,
    iconColor: 'text-teal-600',
    bgColor: 'bg-teal-50 dark:bg-teal-950/50',
  },
  {
    id: 'publication',
    title: 'Publication',
    to: '/gallery',
    icon: FaBookBookmark,
    iconColor: 'text-blue-700',
    bgColor: 'bg-blue-50 dark:bg-blue-950/50',
  },
  {
    id: 'my-account',
    title: 'My Account',
    to: '/dashboard/progress',
    icon: FaIdCard,
    iconColor: 'text-indigo-700',
    bgColor: 'bg-indigo-50 dark:bg-indigo-950/50',
  },
];

export default function Overview() {
  const user = useAuthStore((s) => s.user);

  const topSix = DASHBOARD_MENU.slice(0, 6);
  const bottomTwo = DASHBOARD_MENU.slice(6, 8);

  return (
    <div className="relative min-h-[75vh] overflow-hidden rounded-3xl bg-gradient-to-b from-sky-50/40 via-white to-blue-50/30 p-6 sm:p-10 dark:from-slate-900/60 dark:via-surface-dark dark:to-slate-900/40">
      {/* Decorative background curves */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.03] dark:opacity-[0.05]"
        style={{
          backgroundImage: `radial-gradient(#1d4ed8 1px, transparent 1px)`,
          backgroundSize: '24px 24px',
        }}
        aria-hidden="true"
      />

      <div className="relative z-10 mx-auto max-w-5xl">
        {/* ── Title ── */}
        <div className="mb-10 text-center">
          <h1 className="text-2xl font-extrabold tracking-tight text-[#1c3d5a] sm:text-3xl lg:text-4xl dark:text-white">
            My Dashboard
          </h1>
          {user?.fullName && (
            <p className="mt-1.5 text-sm font-medium text-slate-500 dark:text-slate-400">
              Welcome, <span className="font-semibold text-brand-700 dark:text-brand-400">{user.fullName}</span>
            </p>
          )}
        </div>

        {/* ── Top 6 Cards Grid (3x2) ── */}
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {topSix.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.id}
                to={item.to}
                className="group flex min-h-[140px] flex-col items-center justify-center rounded-2xl border-2 border-sky-300/80 bg-gradient-to-b from-white to-sky-50/40 p-6 text-center shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-blue-500 hover:shadow-lg hover:shadow-blue-500/10 dark:border-slate-700 dark:bg-surface-dark-subtle dark:hover:border-blue-500"
              >
                <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-white shadow-sm ring-1 ring-slate-100 transition-transform duration-300 group-hover:scale-110 dark:bg-slate-800 dark:ring-slate-700">
                  <Icon className={`h-7 w-7 ${item.iconColor}`} />
                </div>

                <span className="mt-3.5 text-base font-bold text-[#1c3d5a] transition-colors group-hover:text-blue-600 sm:text-lg dark:text-slate-100 dark:group-hover:text-blue-400">
                  {item.title}
                </span>
              </Link>
            );
          })}
        </div>

        {/* ── Bottom 2 Centered Cards ── */}
        <div className="mt-5 flex flex-col justify-center gap-5 sm:flex-row">
          {bottomTwo.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.id}
                to={item.to}
                className="group flex min-h-[140px] w-full flex-col items-center justify-center rounded-2xl border-2 border-sky-300/80 bg-gradient-to-b from-white to-sky-50/40 p-6 text-center shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-blue-500 hover:shadow-lg hover:shadow-blue-500/10 sm:max-w-[320px] dark:border-slate-700 dark:bg-surface-dark-subtle dark:hover:border-blue-500"
              >
                <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-white shadow-sm ring-1 ring-slate-100 transition-transform duration-300 group-hover:scale-110 dark:bg-slate-800 dark:ring-slate-700">
                  <Icon className={`h-7 w-7 ${item.iconColor}`} />
                </div>

                <span className="mt-3.5 text-base font-bold text-[#1c3d5a] transition-colors group-hover:text-blue-600 sm:text-lg dark:text-slate-100 dark:group-hover:text-blue-400">
                  {item.title}
                </span>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
