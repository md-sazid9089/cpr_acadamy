import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import Modal from '@/components/ui/Modal.jsx';
import Input from '@/components/ui/Input.jsx';
import Button from '@/components/ui/Button.jsx';

/**
 * Build the validation schema from the section's field list. Required fields
 * must be non-empty; optional ones may be blank. Email gets a format check.
 */
function buildSchema(fields) {
  return z.object(
    Object.fromEntries(
      fields.map((field) => {
        if (field.key === 'email') {
          return [
            field.key,
            z
              .string()
              .trim()
              .min(1, 'Email is required.')
              .email('Enter a valid email address.'),
          ];
        }
        const base = z.string().trim();
        return [
          field.key,
          field.optional ? base : base.min(1, `${field.label} is required.`),
        ];
      }),
    ),
  );
}

/**
 * Edit dialog for one profile section. The form is generated from the same
 * field metadata that renders the read-only view.
 *
 * @param {Object} props
 * @param {boolean} props.open
 * @param {() => void} props.onClose
 * @param {{ id: string, title: string, fields: object[] }} props.section
 * @param {Record<string, string>} props.values
 * @param {(payload: { section: string, values: object }) => Promise<any>} props.onSave
 * @param {boolean} [props.isSaving]
 */
export default function EditSectionModal({ open, onClose, section, values, onSave, isSaving }) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(buildSchema(section.fields)),
    // Empty strings rather than undefined keep every input controlled.
    defaultValues: Object.fromEntries(
      section.fields.map((field) => [field.key, values?.[field.key] ?? '']),
    ),
  });

  const submit = handleSubmit(async (formValues) => {
    await onSave({ section: section.id, values: formValues });
    onClose();
  });

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={`Edit ${section.title}`}
      description="Changes are saved to your account immediately."
      footer={
        <>
          <Button variant="outline" onClick={onClose} disabled={isSaving}>
            Cancel
          </Button>
          <Button onClick={submit} isLoading={isSaving}>
            Save changes
          </Button>
        </>
      }
    >
      <form onSubmit={submit} className="grid gap-4 sm:grid-cols-2">
        {section.fields.map((field) => {
          const error = errors[field.key]?.message;
          const spanFull = field.type === 'textarea';

          if (field.type === 'select') {
            return (
              <div key={field.key} className="space-y-1.5">
                <label
                  htmlFor={`edit-${field.key}`}
                  className="block text-sm font-medium text-slate-700 dark:text-slate-300"
                >
                  {field.label}
                  {!field.optional && <span className="ml-0.5 text-red-500">*</span>}
                </label>
                <select
                  id={`edit-${field.key}`}
                  {...register(field.key)}
                  aria-invalid={error ? 'true' : undefined}
                  className={`block w-full rounded-lg border bg-white px-3 py-2.5 text-sm text-slate-900 transition-colors focus:border-brand-500 dark:bg-surface-dark-subtle dark:text-slate-100 ${
                    error
                      ? 'border-red-400 dark:border-red-500/70'
                      : 'border-slate-300 dark:border-slate-700'
                  }`}
                >
                  <option value="">Select…</option>
                  {field.options.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
                {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}
              </div>
            );
          }

          if (field.type === 'textarea') {
            return (
              <div key={field.key} className="space-y-1.5 sm:col-span-2">
                <label
                  htmlFor={`edit-${field.key}`}
                  className="block text-sm font-medium text-slate-700 dark:text-slate-300"
                >
                  {field.label}
                  {!field.optional && <span className="ml-0.5 text-red-500">*</span>}
                </label>
                <textarea
                  id={`edit-${field.key}`}
                  rows={3}
                  {...register(field.key)}
                  aria-invalid={error ? 'true' : undefined}
                  className={`block w-full rounded-lg border bg-white px-3 py-2.5 text-sm text-slate-900 transition-colors focus:border-brand-500 dark:bg-surface-dark-subtle dark:text-slate-100 ${
                    error
                      ? 'border-red-400 dark:border-red-500/70'
                      : 'border-slate-300 dark:border-slate-700'
                  }`}
                />
                {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}
              </div>
            );
          }

          return (
            <Input
              key={field.key}
              id={`edit-${field.key}`}
              label={field.label}
              type={field.type === 'date' ? 'date' : 'text'}
              required={!field.optional}
              error={error}
              containerClassName={spanFull ? 'sm:col-span-2' : undefined}
              {...register(field.key)}
            />
          );
        })}
      </form>
    </Modal>
  );
}
