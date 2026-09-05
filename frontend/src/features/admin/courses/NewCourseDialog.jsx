import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { FaCheck } from 'react-icons/fa6';
import { createCourse } from '../api/admin.api.js';
import Button from '@/components/ui/Button.jsx';
import Modal from '@/components/ui/Modal.jsx';
import Input, { Select } from '@/components/ui/Input.jsx';
import { BATCH_GROUPS, CATEGORY_LABELS, COURSE_CATEGORIES } from '@/constants';
import { cn } from '@/lib/utils';

const EMPTY = { category: '', batchGroup: '', title: '', price: '' };

/**
 * Two-step picker: the fixed category first (it drives /courses/:category on
 * the public site), then a batch group filtered to that category. Everything
 * else about the course is filled in on the Detail tab once it exists.
 */
export default function NewCourseDialog({ open, onClose }) {
  const [form, setForm] = useState(EMPTY);
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const groups = BATCH_GROUPS.filter((group) => group.category === form.category);

  const mutation = useMutation({
    mutationFn: createCourse,
    onSuccess: (course) => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'courses'] });
      queryClient.invalidateQueries({ queryKey: ['courses'] });
      setForm(EMPTY);
      onClose();
      navigate(`/admin/courses/${course.id}/detail`);
    },
  });

  const close = () => {
    setForm(EMPTY);
    onClose();
  };

  const pickCategory = (category) => {
    // Changing category invalidates the group chosen under the previous one.
    setForm((prev) => ({ ...prev, category, batchGroup: '' }));
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    mutation.mutate({
      title: form.title.trim(),
      category: form.category,
      batchGroup: form.batchGroup || null,
      price: Number(form.price),
    });
  };

  return (
    <Modal
      open={open}
      onClose={close}
      title="New course"
      description="Pick where it sits in the catalogue, give it a name, and fill in the rest from the course tabs."
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        <fieldset>
          <legend className="text-sm font-medium text-slate-700 dark:text-slate-300">
            Category <span className="text-red-500">*</span>
          </legend>
          <div className="mt-2 grid gap-2 sm:grid-cols-3">
            {COURSE_CATEGORIES.map((category) => {
              const selected = form.category === category;
              return (
                <button
                  key={category}
                  type="button"
                  onClick={() => pickCategory(category)}
                  aria-pressed={selected}
                  className={cn(
                    'flex items-start justify-between gap-2 rounded-xl border p-3 text-left transition-colors',
                    selected
                      ? 'border-brand-500 bg-brand-50 dark:border-brand-500 dark:bg-brand-950/40'
                      : 'border-slate-200 hover:border-brand-300 dark:border-slate-700 dark:hover:border-brand-700',
                  )}
                >
                  <span>
                    <span className="block text-sm font-semibold text-slate-900 dark:text-white">{category}</span>
                    <span className="mt-0.5 block text-xs text-slate-500 dark:text-slate-400">
                      {CATEGORY_LABELS[category]}
                    </span>
                  </span>
                  {selected && <FaCheck aria-hidden="true" className="mt-0.5 h-3.5 w-3.5 shrink-0 text-brand-600 dark:text-brand-400" />}
                </button>
              );
            })}
          </div>
        </fieldset>

        <Select
          label="Batch group"
          value={form.batchGroup}
          disabled={!form.category}
          onChange={(event) => setForm({ ...form, batchGroup: event.target.value })}
        >
          <option value="">
            {form.category
              ? groups.length
                ? 'No batch group'
                : 'No batch groups under this category'
              : 'Pick a category first'}
          </option>
          {groups.map((group) => (
            <option key={group.id} value={group.id}>
              {group.label}
              {group.note ? ` ${group.note}` : ''}
            </option>
          ))}
        </Select>

        <Input
          label="Course title"
          required
          value={form.title}
          onChange={(event) => setForm({ ...form, title: event.target.value })}
          placeholder="e.g. FCPS Part-1 Medicine — July Batch"
        />

        <Input
          label="Regular fee"
          type="number"
          required
          min={0}
          step={100}
          prefix="BDT"
          value={form.price}
          onChange={(event) => setForm({ ...form, price: event.target.value })}
          hint="Discounts and offers are set on the Detail tab."
        />

        <div className="flex justify-end gap-3 pt-2">
          <Button type="button" variant="outline" onClick={close}>
            Cancel
          </Button>
          <Button type="submit" disabled={!form.category || !form.title.trim()} isLoading={mutation.isPending}>
            Create draft
          </Button>
        </div>
      </form>
    </Modal>
  );
}
