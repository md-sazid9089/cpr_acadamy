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
    iconColor: 'text-[#1c4d96]',
  },
  {
    id: 'subscriptions',
    title: 'Subscriptions',
    to: '/dashboard/payments',
    icon: FaCreditCard,
    iconColor: 'text-[#1c4d96]',
  },
  {
    id: 'available-batch',
    title: 'Available Batch',
    to: '/batches',
    icon: FaUsers,
    iconColor: 'text-[#1c4d96]',
  },
  {
    id: 'pay-now',
    title: 'Pay Now',
    to: '/dashboard/payments',
    icon: FaMoneyBillWave,
    iconColor: 'text-[#1c4d96]',
  },
  {
    id: 'notice',
    title: 'Notice',
    to: '/class',
    icon: FaBell,
    iconColor: 'text-[#1c4d96]',
  },
  {
    id: 'complain-box',
    title: 'Complain Box',
    to: '/contact',
    icon: FaComments,
    iconColor: 'text-[#1c4d96]',
  },
  {
    id: 'publication',
    title: 'Publication',
    to: '/gallery',
    icon: FaBookBookmark,
    iconColor: 'text-[#1c4d96]',
  },
  {
    id: 'my-account',
    title: 'My Account',
    to: '/dashboard/progress',
    icon: FaIdCard,
    iconColor: 'text-[#1c4d96]',
  },
];

export default function Overview() {
  const user = useAuthStore((s) => s.user);

  return (
    <div className="relative min-h-[75vh] overflow-hidden rounded-3xl bg-gradient-to-b from-sky-50/40 via-white to-blue-50/30 p-4 sm:p-8 md:p-10 dark:from-slate-900/60 dark:via-surface-dark dark:to-slate-900/40">
      {/* Decorative background curves */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.03] dark:opacity-[0.05]"
        style={{
          backgroundImage: `radial-gradient(#1d4ed8 1px, transparent 1px)`,
          backgroundSize: '24px 24px',
        }}
        aria-hidden="true"
      />

      <div className="relative z-10 mx-auto max-w-4xl">
        {/* ── Title ── */}
        <div className="mb-6 text-center sm:mb-10">
          <h1 className="text-2xl font-bold tracking-tight text-[#1c3d5a] sm:text-3xl lg:text-4xl dark:text-white">
            My Dashboard
          </h1>
          {user?.fullName && (
            <p className="mt-1 text-xs font-medium text-slate-500 sm:text-sm dark:text-slate-400">
              Welcome, <span className="font-semibold text-brand-700 dark:text-brand-400">{user.fullName}</span>
            </p>
          )}
        </div>

        {/* ── 2 Columns on Mobile, 3 on Tablet, 4 on Desktop (4x2 on mobile) ── */}
        <div className="grid grid-cols-2 gap-3.5 sm:gap-5 md:grid-cols-3 lg:grid-cols-4">
          {DASHBOARD_MENU.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.id}
                to={item.to}
                className="group flex min-h-[135px] flex-col items-center justify-center rounded-2xl border-2 border-blue-400 bg-white p-4 text-center shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-blue-600 hover:shadow-md hover:shadow-blue-500/10 sm:min-h-[160px] sm:p-6 dark:border-slate-700 dark:bg-surface-dark-subtle dark:hover:border-blue-500"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-slate-50 shadow-inner ring-1 ring-slate-100 transition-transform duration-300 group-hover:scale-110 sm:h-14 sm:w-14 dark:bg-slate-800 dark:ring-slate-700">
                  <Icon className={`h-6 w-6 ${item.iconColor} sm:h-7 sm:w-7`} />
                </div>

                <span className="mt-3 text-xs font-bold text-[#1c3d5a] transition-colors group-hover:text-blue-600 sm:mt-4 sm:text-base dark:text-slate-100 dark:group-hover:text-blue-400">
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
