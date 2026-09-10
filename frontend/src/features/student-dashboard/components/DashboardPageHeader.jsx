import { useEffect, useRef, useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  FaArrowLeft,
  FaChevronDown,
  FaTableCellsLarge,
  FaBook,
  FaUser,
  FaLayerGroup,
  FaComments,
  FaClipboard,
} from 'react-icons/fa6';

const BUTTON =
  'inline-flex min-h-[40px] shrink-0 items-center gap-2 rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-bold text-slate-700 shadow-sm transition hover:bg-slate-50 sm:px-4 sm:text-sm dark:border-slate-700 dark:bg-surface-dark-subtle dark:text-slate-200 dark:hover:bg-slate-800';

/** Quick-links shown in the header Dashboard dropdown. */
const DASHBOARD_MENU = [
  { to: '/dashboard', label: 'Dashboard', icon: FaTableCellsLarge, end: true },
  { to: '/dashboard/courses', label: 'My Course', icon: FaBook },
  { to: '/dashboard/account', label: 'My account', icon: FaUser },
  { to: '/dashboard/subscriptions', label: 'Subscriptions', icon: FaLayerGroup },
  { to: '/dashboard/complaints', label: 'Complain Box', icon: FaComments },
  { to: '/dashboard/notice', label: 'Notice', icon: FaClipboard },
];

/** Back / centred title / Dashboard dropdown bar used at the top of every student page. */
function DashboardMenu() {
  const [open, setOpen] = useState(false);
  const containerRef = useRef(null);

  useEffect(() => {
    if (!open) return undefined;
    const handleClick = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setOpen(false);
      }
    };
    const handleKey = (event) => {
      if (event.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', handleClick);
    document.addEventListener('keydown', handleKey);
    return () => {
      document.removeEventListener('mousedown', handleClick);
      document.removeEventListener('keydown', handleKey);
    };
  }, [open]);

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-haspopup="menu"
        aria-expanded={open}
        className={BUTTON}
      >
        <FaTableCellsLarge aria-hidden="true" className="h-3.5 w-3.5 text-brand-600" />
        <span className="hidden sm:inline">Dashboard</span>
        <FaChevronDown
          aria-hidden="true"
          className={`h-3 w-3 text-slate-500 transition-transform ${open ? 'rotate-180' : ''}`}
        />
      </button>

      {open && (
        <div
          role="menu"
          className="absolute right-0 z-30 mt-2 w-56 overflow-hidden rounded-xl border border-slate-200 bg-white py-1 shadow-lg dark:border-slate-700 dark:bg-surface-dark"
        >
          {DASHBOARD_MENU.map(({ to, label, icon: ItemIcon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              role="menuitem"
              onClick={() => setOpen(false)}
              className={({ isActive }) =>
                [
                  'flex items-center gap-3 px-4 py-2.5 text-sm font-semibold transition-colors',
                  isActive
                    ? 'bg-brand-50 text-brand-700 dark:bg-slate-800 dark:text-brand-300'
                    : 'text-brand-900 hover:bg-brand-50 hover:text-brand-700 dark:text-slate-200 dark:hover:bg-slate-800',
                ].join(' ')
              }
            >
              <ItemIcon aria-hidden="true" className="h-4 w-4 shrink-0 text-brand-600 dark:text-brand-400" />
              {label}
            </NavLink>
          ))}
        </div>
      )}
    </div>
  );
}

/**
 * Back / centred title / Dashboard bar used at the top of every student page.
 *
 * @param {Object} props
 * @param {string} props.title
 * @param {string} [props.backTo]  Where Back goes. Defaults to history back so
 *   a nested page returns to the list the student actually came from.
 * @param {boolean} [props.showDashboardLink=true]  Set false to drop the
 *   Dashboard shortcut on pages that do not want it.
 */
export default function DashboardPageHeader({ title, backTo, showDashboardLink = true }) {
  const navigate = useNavigate();

  return (
    // gap-2 and a shrinkable title keep all three on one row down to 320px;
    // below sm the Dashboard button drops its label to an icon so a long page
    // title has somewhere to go instead of pushing the row past the viewport.
    <div className="flex items-center justify-between gap-2 sm:gap-4">
      <button
        type="button"
        onClick={() => (backTo ? navigate(backTo) : navigate(-1))}
        className={BUTTON}
      >
        <FaArrowLeft aria-hidden="true" className="h-3 w-3" />
        Back
      </button>

      <h1 className="min-w-0 flex-1 truncate text-center text-lg font-bold tracking-tight text-brand-900 sm:text-2xl lg:text-3xl dark:text-white">
        {title}
      </h1>

      {showDashboardLink ? (
        <DashboardMenu />
      ) : (
        // A hidden copy of the Back button, not a fixed-width box: it is the
        // only thing guaranteed to match Back's width at every breakpoint, so
        // the title stays optically centred on the page.
        <span aria-hidden="true" className={`${BUTTON} invisible`}>
          <FaArrowLeft className="h-3 w-3" />
          Back
        </span>
      )}
    </div>
  );
}
