import { useEffect, useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { FaCheck, FaPlus, FaUpload, FaXmark } from 'react-icons/fa6';
import { updateCourse, uploadImage } from '../api/admin.api.js';
import { adminCourseKey } from './keys.js';
import DeleteCourse from './DeleteCourse.jsx';
import Card from '@/components/ui/Card.jsx';
import Button from '@/components/ui/Button.jsx';
import Input, { Select, Textarea } from '@/components/ui/Input.jsx';
import { OTHER, resolveChoice, useCatalogOptions } from './catalogOptions.js';
import {
  BATCH_BRANCHES,
  BATCH_SESSIONS,
  BATCH_TYPES,
  CLASS_DAYS,
} from '@/constants';
import { cn, formatBDT, formatClassDays, formatTimeRange } from '@/lib/utils';

/** Subtitles longer than this wrap on the course card; the API itself accepts more. */
const SUBTITLE_FITS = 90;

/** ISO -> 'yyyy-mm-dd' for <input type="date">; '' when unset. */
function toDateInput(iso) {
  return iso ? iso.slice(0, 10) : '';
}

/** 'yyyy-mm-dd' -> ISO midnight UTC; null when blank. */
function fromDateInput(value) {
  return value ? new Date(`${value}T00:00:00.000Z`).toISOString() : null;
}

/** 'yyyy-mm-dd' -> '30 Nov 2026'. */
function formatDateInput(value) {
  if (!value) return '';
  return new Date(`${value}T00:00:00.000Z`).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' });
}

function toForm(course) {
  return {
    title: course.title ?? '',
    subtitle: course.subtitle ?? '',
    batchGroup: course.batchGroup ?? '',
    newBatchGroup: '',
    batchType: course.batchType ?? '',
    session: course.session ?? '',
    branch: course.branch ?? 'online',
    thumbnailUrl: course.thumbnailUrl ?? '',
    description: course.description ?? '',
    highlights: course.highlights?.length ? [...course.highlights] : [''],
    price: course.price ?? '',
    discountPrice: course.discountPrice ?? '',
    offerLabel: course.offer?.label ?? '',
    offerEndsAt: toDateInput(course.offer?.endsAt),
    startsOn: toDateInput(course.startsOn),
    duration: course.duration ?? '',
    lessonCount: course.lessonCount ?? '',
    classStart: course.classTime?.start ?? '',
    classEnd: course.classTime?.end ?? '',
    classDays: course.classDays ? [...course.classDays] : [],
    mixedNegativeMarkingMin: course.mixedNegativeMarkingMin ?? 0,
    mixedNegativeMarkingMax: course.mixedNegativeMarkingMax ?? 1000,
    mixedPassMarkMin: course.mixedPassMarkMin ?? 0,
    mixedPassMarkMax: course.mixedPassMarkMax ?? 100,
  };
}

function toPayload(form) {
  const discount = form.discountPrice === '' ? null : Number(form.discountPrice);
  return {
    title: form.title.trim(),
    subtitle: form.subtitle.trim(),
    batchGroup: form.batchGroup || null,
    batchType: form.batchType || null,
    session: form.session || null,
    branch: form.branch,
    thumbnailUrl: form.thumbnailUrl.trim() || null,
    description: form.description.trim(),
    highlights: form.highlights.map((item) => item.trim()).filter(Boolean),
    price: Number(form.price) || 0,
    discountPrice: discount,
    // An offer only means something when there is a discounted price to attach it to.
    offer: discount && form.offerLabel.trim()
      ? { label: form.offerLabel.trim(), endsAt: fromDateInput(form.offerEndsAt) }
      : null,
    startsOn: fromDateInput(form.startsOn),
    duration: form.duration.trim(),
    lessonCount: Number(form.lessonCount) || 0,
    classTime: { start: form.classStart, end: form.classEnd },
    classDays: form.classDays,
    mixedNegativeMarkingMin: Number(form.mixedNegativeMarkingMin) || 0,
    mixedNegativeMarkingMax: Number(form.mixedNegativeMarkingMax) || 0,
    mixedPassMarkMin: Number(form.mixedPassMarkMin) || 0,
    mixedPassMarkMax: Number(form.mixedPassMarkMax) || 0,
  };
}

/** One block of the form: a tinted heading bar with an optional action, then the fields. */
function Section({ title, description, action, children, className }) {
  return (
    <Card className="overflow-hidden">
      <div className="flex flex-wrap items-start justify-between gap-3 border-b border-stone-200 bg-stone-50 px-5 py-4 sm:px-6 dark:border-stone-200 dark:bg-surface-dark">
        <div className="min-w-0">
          <h3 className="text-base font-semibold text-stone-900 dark:text-white">{title}</h3>
          {description && <p className="mt-0.5 text-sm text-stone-500 dark:text-brand-200">{description}</p>}
        </div>
        {action}
      </div>
      <div className={cn('space-y-4 p-5 sm:p-6', className)}>{children}</div>
    </Card>
  );
}

const optional = (text) => (
  <>
    {text} <span className="font-normal text-stone-400 dark:text-brand-200">(optional)</span>
  </>
);

/**
 * Everything the public course page prints, in four blocks. Saving here
 * changes /courses/:category/:slug immediately — there is no separate
 * "site copy" to keep in sync.
 */
export default function CourseDetailTab() {
  const { course } = useOutletContext();
  const [form, setForm] = useState(() => toForm(course));
  // What the server last accepted, to tell saved from unsaved edits.
  const [savedForm, setSavedForm] = useState(() => JSON.stringify(toForm(course)));
  const [uploadError, setUploadError] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [dragging, setDragging] = useState(false);
  const queryClient = useQueryClient();
  const { groupsFor } = useCatalogOptions();

  const groups = groupsFor(course.category);
  // Keep the saved group selectable even before the course list has loaded.
  if (form.batchGroup && form.batchGroup !== OTHER && !groups.some((group) => group.value === form.batchGroup)) {
    groups.push({ value: form.batchGroup, label: form.batchGroup });
  }
  const batchGroup = resolveChoice(form.batchGroup, form.newBatchGroup, groups);

  const mutation = useMutation({
    mutationFn: updateCourse,
    onSuccess: (saved) => {
      queryClient.setQueryData(adminCourseKey(course.id), saved);
      queryClient.invalidateQueries({ queryKey: ['admin', 'courses'] });
      queryClient.invalidateQueries({ queryKey: ['courses'] });
    },
  });

  // Saves only the price fields, so other unsaved edits on this page are left alone.
  const removeOffer = useMutation({
    mutationFn: () => updateCourse({ id: course.id, discountPrice: null, offer: null }),
    onSuccess: (saved) => {
      const cleared = { discountPrice: '', offerLabel: '', offerEndsAt: '' };
      setForm((prev) => ({ ...prev, ...cleared }));
      setSavedForm((prev) => JSON.stringify({ ...JSON.parse(prev), ...cleared }));
      queryClient.setQueryData(adminCourseKey(course.id), saved);
      queryClient.invalidateQueries({ queryKey: ['admin', 'courses'] });
      queryClient.invalidateQueries({ queryKey: ['courses'] });
    },
  });

  const dirty = JSON.stringify(form) !== savedForm;

  // Warn before closing or reloading the tab with edits that were never saved.
  useEffect(() => {
    if (!dirty) return undefined;
    const warn = (event) => {
      event.preventDefault();
      event.returnValue = '';
    };
    window.addEventListener('beforeunload', warn);
    return () => window.removeEventListener('beforeunload', warn);
  }, [dirty]);

  const set = (field) => (event) => setForm((prev) => ({ ...prev, [field]: event.target.value }));

  const setHighlight = (index, value) =>
    setForm((prev) => ({
      ...prev,
      highlights: prev.highlights.map((item, i) => (i === index ? value : item)),
    }));

  const removeHighlight = (index) =>
    setForm((prev) => ({ ...prev, highlights: prev.highlights.filter((_, i) => i !== index) }));

  const addHighlight = () => {
    setForm((prev) => ({ ...prev, highlights: [...prev.highlights, ''] }));
    // Put the cursor in the new, empty item.
    requestAnimationFrame(() => {
      const inputs = document.querySelectorAll('[data-outline-item]');
      inputs[inputs.length - 1]?.focus();
    });
  };

  const toggleDay = (dayId) =>
    setForm((prev) => ({
      ...prev,
      classDays: prev.classDays.includes(dayId)
        ? prev.classDays.filter((id) => id !== dayId)
        : [...prev.classDays, dayId],
    }));

  const handleSubmit = (event) => {
    event.preventDefault();
    const submitted = JSON.stringify(form);
    mutation.mutate({ id: course.id, ...toPayload({ ...form, batchGroup }) }, { onSuccess: () => setSavedForm(submitted) });
  };

  const uploadPoster = async (file) => {
    if (!file) return;
    setUploadError('');
    setIsUploading(true);
    try {
      const thumbnailUrl = await uploadImage(file);
      setForm((previous) => ({ ...previous, thumbnailUrl }));
    } catch (error) {
      setUploadError(error.message || 'The image could not be uploaded.');
    } finally {
      setIsUploading(false);
    }
  };

  const onPosterChosen = (event) => {
    uploadPoster(event.target.files?.[0]);
    event.target.value = '';
  };

  const onPosterDropped = (event) => {
    event.preventDefault();
    setDragging(false);
    if (!isUploading) uploadPoster(event.dataTransfer.files?.[0]);
  };

  const price = Number(form.price) || 0;
  const hasDiscount = form.discountPrice !== '' && Number(form.discountPrice) > 0;
  const discount = Number(form.discountPrice) || 0;
  const discountTooHigh = hasDiscount && discount >= price;
  const classTimeBackwards = Boolean(form.classStart && form.classEnd && form.classEnd <= form.classStart);
  const offerBadge = form.offerLabel.trim()
    ? `${form.offerLabel.trim()}${form.offerEndsAt ? `, until ${formatDateInput(form.offerEndsAt)}` : ''}`
    : null;

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* ── About ── */}
      <Section title="About" description="Title, catalogue placement and the description shown on the public page.">
        <Input label="Course title" required value={form.title} onChange={set('title')} />
        <Input
          label={(
            <span className="flex items-baseline justify-between gap-3">
              <span>{optional('Subtitle')}</span>
              <span className={cn('text-xs font-normal tabular-nums', form.subtitle.length > SUBTITLE_FITS ? 'font-semibold text-brand-700 dark:text-brand-300' : 'text-stone-400 dark:text-brand-200')}>
                {form.subtitle.length} / {SUBTITLE_FITS}
              </span>
            </span>
          )}
          value={form.subtitle}
          onChange={set('subtitle')}
          placeholder="One line under the title on the course card"
          hint={form.subtitle.length > SUBTITLE_FITS ? 'Longer than one line on the course card; it will wrap.' : 'One line under the title on the course card.'}
        />

        <div className="grid gap-4 sm:grid-cols-2">
          <Input label="Category" value={course.category} readOnly disabled hint="Fixed. It drives the public /courses/:category page." />
          <Select label="Batch group" value={form.batchGroup} onChange={set('batchGroup')}>
            <option value="">No batch group</option>
            {groups.map((group) => (
              <option key={group.value} value={group.value}>
                {group.label}
              </option>
            ))}
            <option value={OTHER}>Other (create a new batch group)</option>
          </Select>
        </div>
        {form.batchGroup === OTHER && (
          <Input
            label="New batch group name"
            required
            autoFocus
            maxLength={80}
            value={form.newBatchGroup}
            onChange={set('newBatchGroup')}
            placeholder="e.g. BDS Part-1"
          />
        )}

        <div className="grid gap-4 sm:grid-cols-3">
          <Select label="Batch type" value={form.batchType} onChange={set('batchType')}>
            <option value="">—</option>
            {BATCH_TYPES.map((type) => (
              <option key={type.id} value={type.id}>
                {type.label}
              </option>
            ))}
            {/* A value saved outside this list (older data, the API) is shown as-is rather than as a blank. */}
            {form.batchType && !BATCH_TYPES.some((type) => type.id === form.batchType) && (
              <option value={form.batchType}>{form.batchType}</option>
            )}
          </Select>
          <Select label="Session" value={form.session} onChange={set('session')}>
            <option value="">—</option>
            {BATCH_SESSIONS.map((session) => (
              <option key={session.id} value={session.id}>
                {session.label}
              </option>
            ))}
            {form.session && !BATCH_SESSIONS.some((session) => session.id === form.session) && (
              <option value={form.session}>{form.session}</option>
            )}
          </Select>
          <Select label="Branch" value={form.branch} onChange={set('branch')}>
            {BATCH_BRANCHES.map((branch) => (
              <option key={branch.id} value={branch.id}>
                {branch.label}
              </option>
            ))}
          </Select>
        </div>

        <div className="space-y-1.5">
          <span className="block text-sm font-medium text-stone-700 dark:text-brand-200">Poster image</span>
          <label
            htmlFor="course-poster-upload"
            onDragOver={(event) => { event.preventDefault(); setDragging(true); }}
            onDragEnter={(event) => { event.preventDefault(); setDragging(true); }}
            onDragLeave={() => setDragging(false)}
            onDrop={onPosterDropped}
            className={cn(
              'flex cursor-pointer flex-col gap-4 rounded-xl border border-dashed p-3 transition-colors sm:flex-row sm:items-center',
              dragging
                ? 'border-brand-500 bg-brand-50 dark:bg-brand-950/40'
                : 'border-stone-300 hover:border-brand-400 dark:border-stone-200',
            )}
          >
            <div className="grid aspect-[4/3] w-full shrink-0 place-items-center overflow-hidden rounded-lg bg-gradient-to-br from-brand-600 to-brand-900 text-sm font-semibold text-white sm:w-40">
              {form.thumbnailUrl
                ? <img src={form.thumbnailUrl} alt="Current course poster" className="h-full w-full object-cover" />
                : 'No poster yet'}
            </div>
            <div className="min-w-0 space-y-1.5">
              <span className="inline-flex items-center gap-2 rounded-lg border border-stone-200 bg-white px-3.5 py-2 text-sm font-semibold text-stone-900 dark:border-stone-200 dark:bg-surface-dark-subtle dark:text-white">
                <FaUpload aria-hidden="true" className="h-3.5 w-3.5" />
                {isUploading ? 'Uploading…' : form.thumbnailUrl ? 'Replace image' : 'Choose image'}
              </span>
              <p className="text-xs text-stone-500 dark:text-brand-200">
                or drag it here. JPEG, PNG or WebP, up to 5 MB. Shown square on course cards and 4:3 on the course page; the
                new image replaces the current poster when you save.
              </p>
              {uploadError && <p role="alert" className="text-xs font-medium text-red-600 dark:text-red-400">{uploadError}</p>}
            </div>
            <input id="course-poster-upload" type="file" accept="image/jpeg,image/png,image/webp" onChange={onPosterChosen} disabled={isUploading} className="sr-only" />
          </label>
        </div>

        <Textarea
          label="Description"
          rows={8}
          value={form.description}
          onChange={set('description')}
          placeholder="Who this batch is for, how it is taught, what a student receives…"
          hint="Leave a blank line between paragraphs. Bangla and English both work."
        />
      </Section>

      {/* ── Outline ── */}
      <Section
        title="Outline"
        description="Bullet points under “Course outline” on the public page and the course card."
        className="space-y-2"
        action={
          <Button type="button" size="sm" onClick={addHighlight}>
            <FaPlus aria-hidden="true" className="h-3 w-3" />
            Add item
          </Button>
        }
      >
        {form.highlights.length === 0 && (
          <p className="rounded-lg border border-dashed border-stone-300 p-4 text-center text-sm text-stone-500 dark:border-stone-200 dark:text-brand-200">
            No outline items yet. Add the first one.
          </p>
        )}
        {form.highlights.map((item, index) => (
          <div key={index} className="flex items-center gap-2">
            <span className="w-6 shrink-0 text-right text-sm tabular-nums text-stone-400 dark:text-brand-200">{index + 1}.</span>
            <Input
              containerClassName="flex-1"
              data-outline-item=""
              value={item}
              onChange={(event) => setHighlight(index, event.target.value)}
              onKeyDown={(event) => {
                // Enter starts the next point instead of submitting the whole form.
                if (event.key === 'Enter') {
                  event.preventDefault();
                  addHighlight();
                }
              }}
              placeholder="e.g. Weekly SBA & MTF exams with detailed explanations"
              aria-label={`Outline item ${index + 1}`}
            />
            <button
              type="button"
              onClick={() => removeHighlight(index)}
              aria-label={`Remove outline item ${index + 1}`}
              className="grid h-10 w-10 shrink-0 place-items-center rounded-lg border border-stone-200 text-stone-500 transition-colors hover:border-red-200 hover:bg-red-50 hover:text-red-600 dark:border-stone-200 dark:text-brand-200 dark:hover:bg-red-950/40"
            >
              <FaXmark aria-hidden="true" className="h-4 w-4" />
            </button>
          </div>
        ))}
      </Section>

      {/* ── Fee & offer ── */}
      <Section
        title="Fee & offer"
        description="Regular fee, discounted fee and the label shown beside the discount."
        action={
          (hasDiscount || course.discountPrice != null || course.offer) && (
            <Button type="button" variant="outline" size="sm" className="text-red-600 dark:text-red-400" onClick={() => removeOffer.mutate()} isLoading={removeOffer.isPending}>
              <FaXmark aria-hidden="true" className="h-3.5 w-3.5" />
              Remove offer
            </Button>
          )
        }
      >
        {removeOffer.isError && (
          <p role="alert" className="text-sm font-medium text-red-600 dark:text-red-400">{removeOffer.error.message}</p>
        )}
        <div className="grid gap-4 sm:grid-cols-2">
          <Input label="Regular fee" type="number" required min={0} step={100} prefix="BDT" value={form.price} onChange={set('price')} />
          <Input
            label={optional('Discounted fee')}
            type="number"
            min={0}
            step={100}
            prefix="BDT"
            value={form.discountPrice}
            onChange={set('discountPrice')}
            error={discountTooHigh ? 'Should be lower than the regular fee.' : undefined}
            hint={hasDiscount && price > 0
              ? `Saves ${formatBDT(price - discount)} (${Math.round(((price - discount) / price) * 100)}% off).`
              : 'Leave blank for no discount.'}
          />
          <Input
            label="Offer label"
            value={form.offerLabel}
            onChange={set('offerLabel')}
            disabled={!hasDiscount}
            placeholder="e.g. Early bird"
            hint={hasDiscount ? 'Shown beside the discounted fee.' : 'Set a discounted fee to enable the offer.'}
          />
          <Input
            label="Offer ends"
            type="date"
            value={form.offerEndsAt}
            onChange={set('offerEndsAt')}
            disabled={!hasDiscount}
            hint={hasDiscount ? 'After this date the regular fee shows again.' : undefined}
          />
        </div>
        <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1 rounded-lg bg-brand-50 px-4 py-2.5 text-sm text-stone-700 dark:bg-brand-950/40 dark:text-brand-200">
          <span className="text-stone-500 dark:text-brand-200">Public page shows:</span>
          <strong className="text-lg tabular-nums text-stone-900 dark:text-white">{formatBDT(hasDiscount ? discount : price)}</strong>
          {hasDiscount && <s className="tabular-nums text-stone-500 dark:text-brand-200">{formatBDT(price)}</s>}
          {hasDiscount && offerBadge && (
            <span className="rounded-full bg-accent-50 px-2.5 py-0.5 text-xs font-semibold text-accent-700 dark:bg-accent-950/40 dark:text-accent-300">
              {offerBadge}
            </span>
          )}
        </div>
      </Section>

      {/* The Mixed exam policy card is hidden. Its ranges still load into the form and are
          saved back unchanged, so existing Mixed exams keep the policy they had. */}

      {/* ── Timing ── */}
      <Section title="Timing" description="Start date, class time and class days. These appear in the course header.">
        <div className="grid gap-4 sm:grid-cols-3">
          <Input label="Starts on" type="date" value={form.startsOn} onChange={set('startsOn')} />
          <Input label="Duration" value={form.duration} onChange={set('duration')} placeholder="e.g. 6 months" />
          <Input label="Total lectures" type="number" min={0} value={form.lessonCount} onChange={set('lessonCount')} />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <Input label="Class starts" type="time" value={form.classStart} onChange={set('classStart')} />
          <Input
            label="Class ends"
            type="time"
            value={form.classEnd}
            onChange={set('classEnd')}
            error={classTimeBackwards ? 'Should be after the start time.' : undefined}
          />
        </div>

        <fieldset>
          <legend className="text-sm font-medium text-stone-700 dark:text-brand-200">Class days</legend>
          <div className="mt-2 flex flex-wrap gap-2">
            {CLASS_DAYS.map((day) => {
              const selected = form.classDays.includes(day.id);
              return (
                <button
                  key={day.id}
                  type="button"
                  onClick={() => toggleDay(day.id)}
                  aria-pressed={selected}
                  className={cn(
                    'inline-flex items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-sm font-medium transition-colors',
                    selected
                      ? 'border-brand-600 bg-brand-600 text-white'
                      : 'border-stone-300 bg-white text-stone-700 hover:border-brand-500 dark:border-stone-200 dark:bg-surface-dark dark:text-brand-200',
                  )}
                >
                  {selected && <FaCheck aria-hidden="true" className="h-3 w-3" />}
                  {day.label}
                </button>
              );
            })}
          </div>
          <p className="mt-2 text-xs text-stone-500 dark:text-brand-200">
            {form.classDays.length ? (
              <>
                Header will read:{' '}
                <strong className="text-stone-800 dark:text-white">
                  {formatClassDays(form.classDays)}, {formatTimeRange({ start: form.classStart, end: form.classEnd })}
                </strong>
              </>
            ) : 'Pick at least one class day.'}
          </p>
        </fieldset>
      </Section>

      <DeleteCourse course={course} />

      <div className="sticky bottom-4 z-10 flex flex-wrap items-center justify-end gap-3 rounded-card border border-stone-200 bg-white/95 px-5 py-3 backdrop-blur sm:px-6 dark:border-stone-200 dark:bg-surface-dark-subtle/95">
        <span className="mr-auto text-sm" aria-live="polite">
          {mutation.isError ? (
            <span className="font-medium text-red-600 dark:text-red-400">{mutation.error.message}</span>
          ) : dirty ? (
            <span className="font-semibold text-brand-700 dark:text-brand-300">Unsaved changes</span>
          ) : (
            <span className="flex items-center gap-1.5 text-stone-500 dark:text-brand-200">
              <FaCheck aria-hidden="true" className="h-3.5 w-3.5" />
              All changes saved
            </span>
          )}
        </span>
        <Button type="submit" isLoading={mutation.isPending} disabled={!dirty || isUploading} className="max-sm:flex-1">
          Save changes
        </Button>
      </div>
    </form>
  );
}
