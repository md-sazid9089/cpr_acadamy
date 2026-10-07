import { useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { FaPenToSquare, FaPlus } from 'react-icons/fa6';
import { createSubscriptionPlan, fetchAdminSubscriptionPlans, updateSubscriptionPlan } from '../api/admin.api.js';
import { adminPlansKey } from './keys.js';
import Card, { CardHeader } from '@/components/ui/Card.jsx';
import Table from '@/components/ui/Table.jsx';
import Badge from '@/components/ui/Badge.jsx';
import Button from '@/components/ui/Button.jsx';
import Modal from '@/components/ui/Modal.jsx';
import Input, { Textarea } from '@/components/ui/Input.jsx';
import { formatBDT } from '@/lib/utils';

const EMPTY_FORM = { name: '', description: '', amount: '', durationDays: '30', features: '' };

/** One bullet per line in the form, an array of strings in the API. */
const parseFeatures = (value) => value.split('\n').map((line) => line.trim()).filter(Boolean);

/**
 * The subscription packages students can buy on top of this course. A student
 * sees only the active ones, and only once their enrolment is active. Packages
 * are retired rather than deleted, because paid subscriptions and invoices
 * keep pointing at them.
 */
export default function CourseSubscriptionsTab() {
  const { course } = useOutletContext();
  const queryClient = useQueryClient();
  const [editing, setEditing] = useState(null); // null | 'new' | plan
  const [form, setForm] = useState(EMPTY_FORM);

  const { data: plans = [], isLoading, isError, error, isFetching, refetch } = useQuery({
    queryKey: adminPlansKey(course.id),
    queryFn: () => fetchAdminSubscriptionPlans(course.id),
  });

  const invalidate = () => queryClient.invalidateQueries({ queryKey: adminPlansKey(course.id) });
  const createMutation = useMutation({ mutationFn: createSubscriptionPlan, onSuccess: () => { invalidate(); setEditing(null); } });
  const updateMutation = useMutation({ mutationFn: updateSubscriptionPlan, onSuccess: () => { invalidate(); setEditing(null); } });
  const toggleMutation = useMutation({ mutationFn: updateSubscriptionPlan, onSuccess: invalidate });

  const openCreate = () => {
    setForm(EMPTY_FORM);
    createMutation.reset();
    setEditing('new');
  };

  const openEdit = (plan) => {
    setForm({
      name: plan.name,
      description: plan.description,
      amount: String(plan.amount),
      durationDays: String(plan.durationDays),
      features: plan.features.join('\n'),
    });
    updateMutation.reset();
    setEditing(plan);
  };

  const set = (field) => (event) => setForm((prev) => ({ ...prev, [field]: event.target.value }));

  const handleSubmit = (event) => {
    event.preventDefault();
    const payload = {
      name: form.name.trim(),
      description: form.description.trim(),
      amount: Number(form.amount),
      durationDays: Number(form.durationDays),
      features: parseFeatures(form.features),
    };
    if (editing === 'new') createMutation.mutate({ courseId: course.id, ...payload });
    else updateMutation.mutate({ id: editing.id, ...payload });
  };

  const saveError = editing === 'new' ? createMutation.error : updateMutation.error;

  const columns = [
    {
      key: 'name',
      header: 'Package',
      render: (plan) => (
        <div className="max-w-xs">
          <p className="font-semibold text-stone-900 dark:text-white">{plan.name}</p>
          {plan.description && <p className="mt-0.5 text-xs text-stone-500 dark:text-brand-200">{plan.description}</p>}
        </div>
      ),
    },
    { key: 'amount', header: 'Price', render: (plan) => <span className="font-semibold">{formatBDT(plan.amount)}</span> },
    { key: 'duration', header: 'Duration', render: (plan) => `${plan.durationDays} days` },
    {
      key: 'status',
      header: 'Status',
      render: (plan) => <Badge tone={plan.isActive ? 'success' : 'neutral'}>{plan.isActive ? 'On offer' : 'Retired'}</Badge>,
    },
    {
      key: 'actions',
      header: '',
      align: 'right',
      render: (plan) => (
        <div className="flex justify-end gap-1">
          <Button size="sm" variant="ghost" onClick={() => openEdit(plan)} aria-label={`Edit ${plan.name}`}>
            <FaPenToSquare aria-hidden="true" className="h-3.5 w-3.5" />
          </Button>
          <Button
            size="sm"
            variant="outline"
            isLoading={toggleMutation.isPending && toggleMutation.variables?.id === plan.id}
            onClick={() => toggleMutation.mutate({ id: plan.id, isActive: !plan.isActive })}
          >
            {plan.isActive ? 'Retire' : 'Put back on offer'}
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-5">
      <Card>
        <CardHeader
          title="Subscription packages"
          description="Extra access students can buy once their enrolment in this course is active."
          action={
            <Button size="sm" onClick={openCreate}>
              <FaPlus aria-hidden="true" className="h-3.5 w-3.5" />
              Add package
            </Button>
          }
        />
        <div className="mt-4">
          {toggleMutation.isError && (
            <p role="alert" className="mx-5 mb-3 rounded-lg bg-red-50 p-3 text-sm text-red-700 dark:bg-red-950/40 dark:text-red-300">
              {toggleMutation.error.message}
            </p>
          )}
          <Table
            columns={columns}
            rows={plans}
            isLoading={isLoading}
            isError={isError}
            error={error}
            isFetching={isFetching}
            onRetry={refetch}
            emptyTitle="No packages yet"
            emptyDescription="Until you add one, students see “No subscription packages are on offer” for this course."
          />
        </div>
      </Card>

      <Modal
        open={editing !== null}
        onClose={() => setEditing(null)}
        title={editing === 'new' ? 'Add package' : 'Edit package'}
        description={course.title}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          {saveError && (
            <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-700 dark:bg-red-950/40 dark:text-red-300">
              {saveError.message}
            </p>
          )}
          <Input label="Name" required value={form.name} onChange={set('name')} placeholder="e.g. Monthly Question Bank" />
          <Textarea label="Description" rows={2} maxLength={2000} value={form.description} onChange={set('description')} />
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Price (BDT)"
              type="number"
              required
              min="0.01"
              step="0.01"
              value={form.amount}
              onChange={set('amount')}
              hint="Up to two decimals."
            />
            <Input
              label="Duration (days)"
              type="number"
              required
              min="1"
              max="3650"
              step="1"
              value={form.durationDays}
              onChange={set('durationDays')}
            />
          </div>
          <Textarea
            label="What’s included"
            rows={4}
            value={form.features}
            onChange={set('features')}
            hint="One item per line, up to 20. Shown as a checklist on the package card."
          />

          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="outline" onClick={() => setEditing(null)}>
              Cancel
            </Button>
            <Button type="submit" isLoading={createMutation.isPending || updateMutation.isPending}>
              {editing === 'new' ? 'Add package' : 'Save changes'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
