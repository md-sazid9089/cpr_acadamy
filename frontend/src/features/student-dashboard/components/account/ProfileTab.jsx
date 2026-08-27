import { useState } from 'react';
import { FaPenToSquare, FaUser } from 'react-icons/fa6';
import { ACCOUNT_SECTIONS, getProfileCompletion } from './accountSections.js';
import EditSectionModal from './EditSectionModal.jsx';
import { useAccountProfile, useUpdateAccountProfile } from '../../api/dashboard.queries.js';
import Spinner from '@/components/ui/Spinner.jsx';
import { formatDate } from '@/lib/utils';

/** Read-only "Label: value" row. Empty values render the label alone, as in the reference. */
function Field({ label, value, type }) {
  const display = type === 'date' && value ? formatDate(value) : value;

  return (
    <p className="text-sm leading-relaxed text-slate-700 dark:text-slate-300">
      <span className="font-bold text-slate-900 dark:text-white">{label}:</span>{' '}
      {display || <span className="text-slate-400 dark:text-slate-500">—</span>}
    </p>
  );
}

/** Section heading with the underline rule and the edit pencil. */
function SectionHeader({ title, onEdit }) {
  return (
    <div className="mb-3 flex items-center justify-between gap-4 border-b-2 border-brand-200 pb-1.5 dark:border-slate-700">
      <h2 className="text-base font-bold text-brand-600 sm:text-lg dark:text-brand-300">{title}</h2>
      <button
        type="button"
        onClick={onEdit}
        aria-label={`Edit ${title}`}
        className="rounded p-1 text-brand-600 transition-colors hover:bg-brand-100 hover:text-brand-800 dark:text-brand-400 dark:hover:bg-slate-800"
      >
        <FaPenToSquare aria-hidden="true" className="h-4 w-4" />
      </button>
    </div>
  );
}

export default function ProfileTab() {
  const { data: profile, isLoading } = useAccountProfile();
  const updateProfile = useUpdateAccountProfile();
  const [editingSectionId, setEditingSectionId] = useState(null);

  if (isLoading || !profile) {
    return (
      <div className="flex justify-center py-16">
        <Spinner size="lg" label="Loading your profile…" />
      </div>
    );
  }

  const { percent, missing } = getProfileCompletion(profile);
  const editingSection = ACCOUNT_SECTIONS.find((section) => section.id === editingSectionId);

  return (
    <>
      {/* ── Profile completion ── */}
      <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-900/60">
        <div className="flex items-center gap-4">
          <div className="min-w-0 flex-1">
            <div className="flex items-baseline justify-between gap-3">
              <h2 className="text-sm font-bold text-slate-900 sm:text-base dark:text-white">
                Profile Completion
              </h2>
              <span className="text-sm font-bold text-slate-900 dark:text-white">{percent}%</span>
            </div>

            <div
              role="progressbar"
              aria-valuenow={percent}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-label="Profile completion"
              className="mt-2 h-2.5 w-full overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700"
            >
              <div
                className="h-full rounded-full bg-emerald-500 transition-all duration-500"
                style={{ width: `${percent}%` }}
              />
            </div>

            {missing.length > 0 && (
              <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
                Missing: {missing.join(', ')}
              </p>
            )}
          </div>

          {profile.isVerified && (
            <span className="shrink-0 rounded-full bg-emerald-100 px-4 py-1.5 text-xs font-bold text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300">
              Verified
            </span>
          )}
        </div>
      </div>

      {/* ── Information sections ── */}
      <div className="mt-5 rounded-xl bg-emerald-50/60 p-5 dark:bg-slate-900/40">
        {ACCOUNT_SECTIONS.map((section, index) => (
          <section key={section.id} className={index > 0 ? 'mt-7' : undefined}>
            <SectionHeader title={section.title} onEdit={() => setEditingSectionId(section.id)} />

            {section.id === 'basic' ? (
              <div className="flex flex-col gap-5 sm:flex-row">
                <div className="shrink-0">
                  <div className="flex h-28 w-28 items-center justify-center overflow-hidden rounded-lg border border-slate-300 bg-white dark:border-slate-700 dark:bg-slate-800">
                    {profile.photoUrl ? (
                      <img
                        src={profile.photoUrl}
                        alt="Profile"
                        width="112"
                        height="112"
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <FaUser aria-hidden="true" className="h-10 w-10 text-slate-300 dark:text-slate-600" />
                    )}
                  </div>
                  <button
                    type="button"
                    className="mt-2 w-28 rounded-lg border border-brand-400 bg-white px-3 py-1.5 text-xs font-bold text-brand-600 transition hover:bg-brand-50 dark:border-slate-600 dark:bg-slate-800 dark:text-brand-300 dark:hover:bg-slate-700"
                  >
                    Change
                  </button>
                </div>

                <div className="min-w-0 flex-1 space-y-1">
                  {section.fields.map((field) => (
                    <Field
                      key={field.key}
                      label={field.label}
                      value={profile[section.id]?.[field.key]}
                      type={field.type}
                    />
                  ))}
                </div>
              </div>
            ) : (
              <div className="space-y-1">
                {section.fields.map((field) => (
                  <Field
                    key={field.key}
                    label={field.label}
                    value={profile[section.id]?.[field.key]}
                    type={field.type}
                  />
                ))}
              </div>
            )}
          </section>
        ))}
      </div>

      {editingSection && (
        <EditSectionModal
          open
          onClose={() => setEditingSectionId(null)}
          section={editingSection}
          values={profile[editingSection.id]}
          onSave={updateProfile.mutateAsync}
          isSaving={updateProfile.isPending}
        />
      )}
    </>
  );
}
