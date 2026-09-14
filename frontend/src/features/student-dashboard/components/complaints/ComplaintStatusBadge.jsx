const TONES = {
  open: 'bg-brand-100 text-brand-800 dark:bg-brand-950/50 dark:text-brand-300',
  answered: 'bg-brand-100 text-brand-800 dark:bg-brand-950/50 dark:text-brand-300',
  solved: 'bg-brand-100 text-brand-800 dark:bg-brand-950/50 dark:text-brand-300',
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
