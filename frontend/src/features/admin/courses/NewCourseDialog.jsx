import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createCourse } from '../api/admin.api.js';
import Button from '@/components/ui/Button.jsx';
import Modal from '@/components/ui/Modal.jsx';
import Input, { Select } from '@/components/ui/Input.jsx';
import { OTHER, resolveChoice, useCatalogOptions } from './catalogOptions.js';

const EMPTY = { category: '', newCategory: '', batchGroup: '', newBatchGroup: '', title: '', price: '' };

/**
 * Category first, then a batch group filtered to it. Either can be "Other" to
 * type a new name. Everything else is filled in on the Detail tab.
 */
export default function NewCourseDialog({ open, onClose }) {
  const [form, setForm] = useState(EMPTY);
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { categories, groupsFor } = useCatalogOptions();

  const category = resolveChoice(form.category, form.newCategory, categories);
  const groups = category ? groupsFor(category) : [];
  const batchGroup = resolveChoice(form.batchGroup, form.newBatchGroup, groups);

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
    mutation.reset();
    onClose();
  };

  const set = (key) => (event) => setForm((prev) => ({ ...prev, [key]: event.target.value }));
  // Changing category invalidates the group chosen under the previous one.
  const setCategory = (key) => (event) => setForm((prev) => ({ ...prev, [key]: event.target.value, batchGroup: '', newBatchGroup: '' }));

  const handleSubmit = (event) => {
    event.preventDefault();
    mutation.mutate({ title: form.title.trim(), category, batchGroup: batchGroup || null, price: Number(form.price) });
  };

  return (
    <Modal
      open={open}
      onClose={close}
      title="New course"
      description="Pick where it sits in the catalogue, give it a name, and fill in the rest from the course tabs."
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        {mutation.isError && (
          <p role="alert" className="rounded-control border border-stone-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {mutation.error?.message ?? 'The course could not be created.'}
          </p>
        )}

        <Select label="Category" required value={form.category} onChange={setCategory('category')}>
          <option value="" disabled>
            Select a category
          </option>
          {categories.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
          <option value={OTHER}>Other (create a new category)</option>
        </Select>
        {form.category === OTHER && (
          <Input
            label="New category name"
            required
            autoFocus
            maxLength={60}
            value={form.newCategory}
            onChange={setCategory('newCategory')}
            placeholder="e.g. Dental, Nursing, MRCP"
            hint="It will appear in this list for future courses."
          />
        )}

        <Select label="Batch group" value={form.batchGroup} disabled={!category} onChange={set('batchGroup')}>
          <option value="">{category ? 'No batch group' : 'Pick a category first'}</option>
          {groups.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
          {category && <option value={OTHER}>Other (create a new batch group)</option>}
        </Select>
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

        <Input
          label="Course title"
          required
          maxLength={200}
          value={form.title}
          onChange={set('title')}
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
          onChange={set('price')}
          hint="Discounts and offers are set on the Detail tab."
        />

        <div className="flex justify-end gap-3 pt-2">
          <Button type="button" variant="outline" onClick={close}>
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={!category || (form.batchGroup === OTHER && !batchGroup) || !form.title.trim()}
            isLoading={mutation.isPending}
          >
            Create draft
          </Button>
        </div>
      </form>
    </Modal>
  );
}
