const TONES = {
  open: 'bg-amber-100 text-amber-800 dark:bg-amber-950/50 dark:text-amber-300',
  answered: 'bg-sky-100 text-sky-800 dark:bg-sky-950/50 dark:text-sky-300',
  solved: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300',
};

const LABELS = { open: 'Open', answered: 'Replied', solved: 'Solved' };

/** @param {{ status: 'open' | 'answered' | 'solved' }} props */
export default function ComplaintStatusBadge({ status }) {
  return (
    <span
      className={`rounded-full px-2.5 py-0.5 text-[11px] font-bold ${TONES[status] ?? TONES.open}`}
    >
      {LABELS[status] ?? status}
    </span>
  );
}
