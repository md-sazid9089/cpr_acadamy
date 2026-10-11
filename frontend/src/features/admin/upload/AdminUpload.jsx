import { useState } from 'react';
import { useIsMutating } from '@tanstack/react-query';
import HeroTab from './HeroTab.jsx';
import CollageTab from './CollageTab.jsx';
import GalleryTab from './GalleryTab.jsx';
import { cn } from '@/lib/utils';

const TABS = [
  { id: 'hero', label: 'Home hero', Panel: HeroTab },
  { id: 'collage', label: 'Success collage', Panel: CollageTab },
  { id: 'gallery', label: 'Gallery page', Panel: GalleryTab },
];

/** Admin Upload page: every image the public site shows outside courses. Each change saves on its own. */
export default function AdminUpload() {
  const [active, setActive] = useState('hero');
  const saving = useIsMutating({ mutationKey: ['upload'] }) > 0;
  const { Panel } = TABS.find((tab) => tab.id === active);

  const onKeyDown = (event) => {
    const index = TABS.findIndex((tab) => tab.id === active);
    const next = event.key === 'ArrowRight' ? index + 1 : event.key === 'ArrowLeft' ? index - 1 : null;
    if (next === null) return;
    const tab = TABS[(next + TABS.length) % TABS.length];
    setActive(tab.id);
    document.getElementById(`upload-tab-${tab.id}`)?.focus();
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-stone-900 dark:text-white">Upload</h1>
          <p className="mt-0.5 text-sm text-stone-500 dark:text-brand-200">Images on the home page and the Gallery page.</p>
        </div>
        <span aria-live="polite" className="inline-flex items-center gap-1.5 text-xs text-stone-500 dark:text-brand-200">
          <span aria-hidden="true" className={cn('h-2 w-2 rounded-full', saving ? 'bg-stone-400' : 'bg-brand-500')} />
          {saving ? 'Saving…' : 'All changes saved'}
        </span>
      </div>

      <div role="tablist" aria-label="Upload areas" onKeyDown={onKeyDown} className="flex gap-1 overflow-x-auto rounded-xl border border-stone-200 bg-white p-1.5 dark:bg-surface-dark-subtle">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            id={`upload-tab-${tab.id}`}
            type="button"
            role="tab"
            aria-selected={active === tab.id}
            aria-controls="upload-panel"
            tabIndex={active === tab.id ? 0 : -1}
            onClick={() => setActive(tab.id)}
            className={cn(
              'shrink-0 rounded-lg px-4 py-2 text-sm font-semibold transition-colors',
              active === tab.id ? 'bg-brand-600 text-white' : 'text-stone-600 hover:bg-stone-100 dark:text-brand-200 dark:hover:bg-surface-dark',
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div id="upload-panel" role="tabpanel" aria-labelledby={`upload-tab-${active}`}>
        <Panel />
      </div>
    </div>
  );
}
