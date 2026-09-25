import { useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { FaCheck, FaPlus, FaXmark } from 'react-icons/fa6';
import { updateCourse, uploadImage } from '../api/admin.api.js';
import { adminCourseKey } from './keys.js';
import Card, { CardBody, CardHeader } from '@/components/ui/Card.jsx';
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

/** ISO -> 'yyyy-mm-dd' for <input type="date">; '' when unset. */
function toDateInput(iso) {
  return iso ? iso.slice(0, 10) : '';
}

/** 'yyyy-mm-dd' -> ISO midnight UTC; null when blank. */
function fromDateInput(value) {
  return value ? new Date(`${value}T00:00:00.000Z`).toISOString() : null;
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

/**
 * Everything the public course page prints, in four blocks. Saving here
 * changes /courses/:category/:slug immediately — there is no separate
 * "site copy" to keep in sync.
 */
export default function CourseDetailTab() {
  const { course } = useOutletContext();
  const [form, setForm] = useState(() => toForm(course));
  const [uploadError, setUploadError] = useState('');
  const [isUploading, setIsUploading] = useState(false);
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

  const set = (field) => (event) => setForm((prev) => ({ ...prev, [field]: event.target.value }));

  const setHighlight = (index, value) =>
    setForm((prev) => ({
      ...prev,
      highlights: prev.highlights.map((item, i) => (i === index ? value : item)),
    }));

  const removeHighlight = (index) =>
    setForm((prev) => ({ ...prev, highlights: prev.highlights.filter((_, i) => i !== index) }));

  const addHighlight = () => setForm((prev) => ({ ...prev, highlights: [...prev.highlights, ''] }));

  const toggleDay = (dayId) =>
    setForm((prev) => ({
      ...prev,
      classDays: prev.classDays.includes(dayId)
        ? prev.classDays.filter((id) => id !== dayId)
        : [...prev.classDays, dayId],
    }));

  const handleSubmit = (event) => {
    event.preventDefault();
    mutation.mutate({ id: course.id, ...toPayload({ ...form, batchGroup }) });
  };

  const uploadPoster = async (event) => {
    const [file] = event.target.files ?? [];
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
      event.target.value = '';
    }
  };

  const hasDiscount = form.discountPrice !== '' && Number(form.discountPrice) > 0;

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* ── About ── */}
      <Card>
        <CardHeader title="About" description="Title, catalogue placement and the description shown on the public page." />
        <CardBody className="space-y-4">
          <Input label="Course title" required value={form.title} onChange={set('title')} />
          <Input
            label="Subtitle"
            value={form.subtitle}
            onChange={set('subtitle')}
            placeholder="One line under the title on the course card"
          />

          <div className="grid gap-4 sm:grid-cols-2">
            <Input label="Category" value={course.category} disabled hint="Fixed — it drives the public /courses/:category route." />
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
            </Select>
            <Select label="Session" value={form.session} onChange={set('session')}>
              <option value="">—</option>
              {BATCH_SESSIONS.map((session) => (
                <option key={session.id} value={session.id}>
                  {session.label}
                </option>
              ))}
            </Select>
            <Select label="Branch" value={form.branch} onChange={set('branch')}>
              {BATCH_BRANCHES.map((branch) => (
                <option key={branch.id} value={branch.id}>
                  {branch.label}
                </option>
              ))}
            </Select>
          </div>

          <div>
            <label className="block text-sm font-medium text-stone-700 dark:text-brand-200" htmlFor="course-poster-upload">Poster image</label>
            <input id="course-poster-upload" type="file" accept="image/jpeg,image/png,image/webp" onChange={uploadPoster} disabled={isUploading} className="mt-1 block w-full text-sm text-stone-600 file:mr-3 file:rounded-lg file:border-0 file:bg-brand-600 file:px-3 file:py-2 file:text-sm file:font-semibold file:text-white hover:file:bg-brand-700 disabled:opacity-60 dark:text-brand-200" />
            <p className="mt-1 text-xs text-stone-500 dark:text-brand-200">JPEG, PNG, or WebP up to 5 MB. The uploaded image replaces the current poster when you save.</p>
            {isUploading && <p className="mt-1 text-xs text-brand-600 dark:text-brand-400">Uploading image…</p>}
            {uploadError && <p role="alert" className="mt-1 text-xs text-red-600 dark:text-red-400">{uploadError}</p>}
            {form.thumbnailUrl && <img src={form.thumbnailUrl} alt="Current course poster" className="mt-3 h-28 w-20 rounded-lg border border-stone-200 object-cover" />}
          </div>

          <Textarea
            label="Description"
            rows={8}
            value={form.description}
            onChange={set('description')}
            placeholder="Who this batch is for, how it is taught, what a student receives…"
            hint="Leave a blank line between paragraphs. Bangla and English both render."
          />
        </CardBody>
      </Card>

      {/* ── Outline ── */}
      <Card>
        <CardHeader
          title="Outline"
          description="Bullet points under “Course Outline” on the public page, and on the course card."
          action={
            <Button type="button" size="sm" variant="secondary" onClick={addHighlight}>
              <FaPlus aria-hidden="true" className="h-3 w-3" />
              Add item
            </Button>
          }
        />
        <CardBody className="space-y-3">
          {form.highlights.length === 0 && (
            <p className="text-sm text-stone-500 dark:text-brand-200">No outline items yet.</p>
          )}
          {form.highlights.map((item, index) => (
            <div key={index} className="flex items-center gap-2">
              <span className="w-6 shrink-0 text-right text-xs font-semibold text-stone-400 dark:text-brand-200">
                {index + 1}.
              </span>
              <Input
                containerClassName="flex-1"
                value={item}
                onChange={(event) => setHighlight(index, event.target.value)}
                placeholder="e.g. Weekly SBA & MTF exams with detailed explanations"
                aria-label={`Outline item ${index + 1}`}
              />
              <Button
                type="button"
                size="icon"
                variant="ghost"
                onClick={() => removeHighlight(index)}
                aria-label={`Remove outline item ${index + 1}`}
              >
                <FaXmark aria-hidden="true" className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </CardBody>
      </Card>

      {/* ── Fee & offer ── */}
      <Card>
        <CardHeader title="Fee & offer" description="Regular fee, discounted fee and the label shown beside the discount." />
        <CardBody className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <Input label="Regular fee" type="number" required min={0} step={100} prefix="BDT" value={form.price} onChange={set('price')} />
            <Input
              label="Discounted fee"
              type="number"
              min={0}
              step={100}
              prefix="BDT"
              value={form.discountPrice}
              onChange={set('discountPrice')}
              hint="Leave blank for no discount."
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <Input
              label="Offer label"
              value={form.offerLabel}
              onChange={set('offerLabel')}
              disabled={!hasDiscount}
              placeholder="e.g. Early-bird offer"
              hint={hasDiscount ? undefined : 'Set a discounted fee to enable the offer.'}
            />
            <Input label="Offer ends" type="date" value={form.offerEndsAt} onChange={set('offerEndsAt')} disabled={!hasDiscount} />
          </div>
          <p className="text-xs text-stone-500 dark:text-brand-200">
            Public page shows{' '}
            <strong className="text-stone-700 dark:text-brand-200">
              {formatBDT(hasDiscount ? Number(form.discountPrice) : Number(form.price) || 0)}
            </strong>
            {hasDiscount && (
              <>
                {' '}with <span className="line-through">{formatBDT(Number(form.price) || 0)}</span> struck through
              </>
            )}
            .
          </p>
        </CardBody>
      </Card>

      {/* ── Mixed exam policy ── */}
      <Card>
        <CardHeader
          title="Mixed exam policy"
          description="Allowed range for deduction and pass mark when publishing a mixed (MTF + SBA) exam under this course."
        />
        <CardBody className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <Input
              label="Minimum deduction (%)"
              type="number"
              required
              min={0}
              max={1000}
              step={0.001}
              value={form.mixedNegativeMarkingMin}
              onChange={set('mixedNegativeMarkingMin')}
            />
            <Input
              label="Maximum deduction (%)"
              type="number"
              required
              min={0}
              max={1000}
              step={0.001}
              value={form.mixedNegativeMarkingMax}
              onChange={set('mixedNegativeMarkingMax')}
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <Input
              label="Minimum pass mark (%)"
              type="number"
              required
              min={0}
              max={100}
              step={0.001}
              value={form.mixedPassMarkMin}
              onChange={set('mixedPassMarkMin')}
            />
            <Input
              label="Maximum pass mark (%)"
              type="number"
              required
              min={0}
              max={100}
              step={0.001}
              value={form.mixedPassMarkMax}
              onChange={set('mixedPassMarkMax')}
            />
          </div>
          <p className="text-xs text-stone-500 dark:text-brand-200">
            A mixed exam under this course can only be published if its deduction and pass mark fall within these ranges.
          </p>
        </CardBody>
      </Card>

      {/* ── Timing ── */}
      <Card>
        <CardHeader title="Timing" description="Start date, class time and class days — the three items in the course header." />
        <CardBody className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-3">
            <Input label="Starts on" type="date" value={form.startsOn} onChange={set('startsOn')} />
            <Input label="Duration" value={form.duration} onChange={set('duration')} placeholder="e.g. 6 months" />
            <Input label="Total lectures" type="number" min={0} value={form.lessonCount} onChange={set('lessonCount')} />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <Input label="Class starts" type="time" value={form.classStart} onChange={set('classStart')} />
            <Input label="Class ends" type="time" value={form.classEnd} onChange={set('classEnd')} />
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
                      'inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-sm font-medium transition-colors',
                      selected
                        ? 'bg-brand-600 text-white'
                        : 'bg-stone-100 text-stone-600 hover:bg-stone-200 dark:bg-surface-dark dark:text-brand-200 dark:hover:bg-surface-dark',
                    )}
                  >
                    {selected && <FaCheck aria-hidden="true" className="h-3 w-3" />}
                    {day.label}
                  </button>
                );
              })}
            </div>
          </fieldset>

          <p className="text-xs text-stone-500 dark:text-brand-200">
            Header will read{' '}
            <strong className="text-stone-700 dark:text-brand-200">
              {formatTimeRange({ start: form.classStart, end: form.classEnd })}
            </strong>{' '}
            on{' '}
            <strong className="text-stone-700 dark:text-brand-200">{formatClassDays(form.classDays)}</strong>.
          </p>
        </CardBody>
      </Card>

      <div className="sticky bottom-4 z-10 flex items-center justify-end gap-3 rounded-xl border border-stone-200 bg-white/95 p-3 backdrop-blur dark:border-stone-200 dark:bg-surface-dark-subtle/95">
        {mutation.isSuccess && !mutation.isPending && (
          <span className="flex items-center gap-1.5 text-sm font-medium text-brand-700 dark:text-brand-400">
            <FaCheck aria-hidden="true" className="h-3.5 w-3.5" />
            Saved
          </span>
        )}
        {mutation.isError && (
          <span className="text-sm font-medium text-red-600 dark:text-red-400">{mutation.error.message}</span>
        )}
        <Button type="submit" isLoading={mutation.isPending}>
          Save changes
        </Button>
      </div>
    </form>
  );
}
