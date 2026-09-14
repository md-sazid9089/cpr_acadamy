import { Link } from 'react-router-dom';
import {
  FaBookOpen,
  FaCreditCard,
  FaUsers,
  FaMoneyBillWave,
  FaBell,
  FaComments,
  FaClipboardList,
  FaIdCard,
  FaTrophy,
} from 'react-icons/fa6';
import { useAuthStore } from '@/lib/auth';

const DASHBOARD_MENU = [
  {
    id: 'my-course',
    title: 'My Course',
    to: '/dashboard/courses',
    icon: FaBookOpen,
    iconColor: 'text-brand-600',
  },
  {
    id: 'subscriptions',
    title: 'Subscriptions',
    to: '/dashboard/subscriptions',
    icon: FaCreditCard,
    iconColor: 'text-brand-600',
  },
  {
    id: 'available-batch',
    title: 'Available Batch',
    to: '/batches',
    icon: FaUsers,
    iconColor: 'text-brand-600',
  },
  {
    id: 'payments',
    title: 'Payments',
    to: '/dashboard/payments',
    icon: FaMoneyBillWave,
    iconColor: 'text-brand-600',
  },
  {
    id: 'notice',
    title: 'Notice',
    to: '/dashboard/notice',
    icon: FaBell,
    iconColor: 'text-brand-600',
  },
  {
    id: 'complain-box',
    title: 'Complain Box',
    to: '/dashboard/complaints',
    icon: FaComments,
    iconColor: 'text-brand-600',
  },
  {
    id: 'exams',
    title: 'My Exams',
    to: '/dashboard/exams',
    icon: FaClipboardList,
    iconColor: 'text-brand-600',
  },
  {
    id: 'exam-positions',
    title: 'Exam Positions',
    to: '/dashboard/exam-positions',
    icon: FaTrophy,
    iconColor: 'text-brand-600',
  },
  {
    id: 'my-account',
    title: 'My Account',
    to: '/dashboard/account',
    icon: FaIdCard,
    iconColor: 'text-brand-600',
  },
];

export default function Overview() {
  const user = useAuthStore((s) => s.user);

  return (
    <div className="relative min-h-[75vh] min-w-0 px-4 pb-4 sm:px-8 sm:pb-8 md:px-10 md:pb-10">
      <div className="relative z-10 mx-auto max-w-4xl">
        {/* ── Title ── */}
        <div className="mb-6 text-center sm:mb-10">
          <h1 className="text-2xl font-bold tracking-tight text-brand-900 sm:text-3xl lg:text-4xl dark:text-white">
            My Dashboard
          </h1>
          {user?.fullName && (
            <p className="mt-1 text-xs font-medium text-stone-500 sm:text-sm dark:text-brand-200">
              Welcome, <span className="font-semibold text-brand-700 dark:text-brand-400">{user.fullName}</span>
            </p>
          )}
        </div>

        <div className="grid grid-cols-2 gap-3.5 sm:gap-5 md:grid-cols-3">
          {DASHBOARD_MENU.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.id}
                to={item.to}
                className="ui-card group dashboard-menu-card flex min-h-[135px] min-w-0 flex-col items-center justify-center rounded-2xl border bg-white p-4 text-center transition-all duration-300 hover:-translate-y-1 sm:min-h-[160px] sm:p-6 dark:bg-surface-dark-subtle"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-stone-50 border border-stone-200 transition-transform duration-300 group-hover:scale-110 sm:h-14 sm:w-14 dark:bg-surface-dark ">
                  <Icon className={`h-6 w-6 ${item.iconColor} sm:h-7 sm:w-7`} />
                </div>

                <span className="mt-3 w-full break-words text-xs font-bold text-brand-900 transition-colors group-hover:text-brand-600 sm:mt-4 sm:text-base dark:text-brand-200 dark:group-hover:text-brand-400">
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
