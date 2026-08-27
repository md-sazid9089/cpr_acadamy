import { Link, useNavigate } from 'react-router-dom';
import { FaArrowLeft, FaTableColumns } from 'react-icons/fa6';

const BUTTON =
  'inline-flex min-h-[40px] shrink-0 items-center gap-2 rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-bold text-slate-700 shadow-sm transition hover:bg-slate-50 sm:px-4 sm:text-sm dark:border-slate-700 dark:bg-surface-dark-subtle dark:text-slate-200 dark:hover:bg-slate-800';

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
        <Link to="/dashboard" aria-label="Dashboard" className={BUTTON}>
          <FaTableColumns aria-hidden="true" className="h-3.5 w-3.5 text-brand-600" />
          <span className="hidden sm:inline">Dashboard</span>
        </Link>
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
