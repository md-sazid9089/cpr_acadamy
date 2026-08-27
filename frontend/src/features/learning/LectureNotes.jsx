import Card from '@/components/ui/Card.jsx';
import EmptyState from '@/components/ui/EmptyState.jsx';

/**
 * Renders lesson notes.
 *
 * The mock API returns a small subset of Markdown (headings, bullets, ordered
 * lists), so it is rendered with a minimal line-based parser rather than
 * pulling in a Markdown dependency.
 * TODO: swap for sanitized HTML from the API, or react-markdown, once the
 * content team decides on a format.
 */
export default function LectureNotes({ markdown }) {
  if (!markdown) {
    return <EmptyState title="No notes for this lesson" description="Notes are added after the class is published." />;
  }

  const blocks = markdown.split('\n').filter((line) => line.trim() !== '');

  return (
    <Card className="p-6">
      <div className="select-none-secure space-y-3">
        {blocks.map((line, index) => {
          if (line.startsWith('## ')) {
            return (
              <h2 key={index} className="pt-2 text-base font-bold text-slate-900 dark:text-white">
                {line.slice(3)}
              </h2>
            );
          }

          if (line.startsWith('- ')) {
            return (
              <p key={index} className="flex gap-2 text-sm text-slate-700 dark:text-slate-300">
                <span className="text-brand-600 dark:text-brand-400">•</span>
                {line.slice(2)}
              </p>
            );
          }

          const ordered = line.match(/^(\d+)\.\s+(.*)$/);
          if (ordered) {
            return (
              <p key={index} className="flex gap-2 text-sm text-slate-700 dark:text-slate-300">
                <span className="font-semibold text-brand-600 dark:text-brand-400">
                  {ordered[1]}.
                </span>
                {ordered[2]}
              </p>
            );
          }

          return (
            <p key={index} className="text-sm leading-relaxed text-slate-700 dark:text-slate-300">
              {line}
            </p>
          );
        })}
      </div>
    </Card>
  );
}
