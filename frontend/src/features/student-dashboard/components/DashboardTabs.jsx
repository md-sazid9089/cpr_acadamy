/**
 * Three-up pill tab bar on the tinted card used across the student dashboard.
 *
 * @param {Object} props
 * @param {{ id: string, label: string, icon: Function, iconColor?: string }[]} props.tabs
 * @param {string} props.value
 * @param {(id: string) => void} props.onChange
 */
export default function DashboardTabs({ tabs, value, onChange }) {
  return (
    <div
      role="tablist"
      className="overflow-hidden rounded-xl border border-brand-200 bg-gradient-to-r from-brand-100/70 via-brand-50 to-brand-50/60 p-1.5 shadow-sm dark:border-slate-700 dark:from-slate-900 dark:to-slate-800"
    >
      <div className="grid grid-cols-3 gap-1.5">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = value === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              role="tab"
              aria-selected={isActive}
              onClick={() => onChange(tab.id)}
              className={`flex items-center justify-center gap-2 rounded-lg px-3 py-2.5 text-xs font-bold transition-all sm:text-sm ${
                isActive
                  ? 'bg-brand-600 text-white shadow-md'
                  : 'bg-white/80 text-slate-700 hover:bg-white dark:bg-slate-800/80 dark:text-slate-200 dark:hover:bg-slate-800'
              }`}
            >
              <Icon
                aria-hidden="true"
                className={`h-3.5 w-3.5 shrink-0 ${isActive ? 'text-white' : tab.iconColor}`}
              />
              <span className="truncate">{tab.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
