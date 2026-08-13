import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import Card from '@/components/ui/Card.jsx';
import Input, { Textarea, Select } from '@/components/ui/Input.jsx';
import Button from '@/components/ui/Button.jsx';
import { CONTACT, COURSE_CATEGORIES } from '@/constants';
import { bdMobileSchema, fullNameSchema, optionalEmailSchema } from '@/lib/validation';
import { sleep } from '@/lib/utils';

const contactSchema = z.object({
  fullName: fullNameSchema,
  mobile: bdMobileSchema,
  email: optionalEmailSchema,
  interest: z.enum(['FCPS', 'BCS', 'MBBS', 'OTHER']),
  message: z.string().trim().min(10, 'Please write at least a sentence or two').max(1000),
});

const CONTACT_CARDS = [
  { label: 'Call us', value: CONTACT.phone, href: `tel:${CONTACT.phone.replace(/\s/g, '')}` },
  { label: 'Email', value: CONTACT.email, href: `mailto:${CONTACT.email}` },
  { label: 'WhatsApp', value: CONTACT.phone, href: `https://wa.me/${CONTACT.whatsapp}` },
  { label: 'Office hours', value: CONTACT.hours },
];

export default function Contact() {
  const [submitted, setSubmitted] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(contactSchema),
    defaultValues: { fullName: '', mobile: '', email: '', interest: 'FCPS', message: '' },
  });

  const onSubmit = async (values) => {
    // TODO: POST /contact-messages via apiClient.
    await sleep(600);
    console.info('[contact] submitted', values);
    setSubmitted(true);
    reset();
  };

  return (
    <div className="bg-white dark:bg-surface-dark">
      <section className="border-b border-slate-200 bg-surface-subtle py-12 text-center dark:border-slate-800 dark:bg-surface-dark-subtle">
        <div className="container-page">
          <h1 className="section-heading">Contact Us</h1>
          <p className="section-subheading mx-auto text-center">
            Questions about a batch, payment or your account? Send a message and we'll get back to
            you the same working day.
          </p>
        </div>
      </section>

      <section className="container-page grid gap-8 py-12 lg:grid-cols-3">
        <Card className="p-6 lg:col-span-2">
          {submitted ? (
            <div className="py-10 text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-brand-50 text-brand-600 dark:bg-brand-950 dark:text-brand-400">
                <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h2 className="mt-4 text-lg font-semibold text-slate-900 dark:text-white">
                Message sent
              </h2>
              <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
                Thank you. Our admission team will call or message you shortly.
              </p>
              <Button variant="outline" className="mt-5" onClick={() => setSubmitted(false)}>
                Send another message
              </Button>
            </div>
          ) : (
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
              <div className="grid gap-4 sm:grid-cols-2">
                <Input
                  label="Full name"
                  required
                  placeholder="Dr. Rahim Uddin"
                  error={errors.fullName?.message}
                  {...register('fullName')}
                />
                <Input
                  label="Mobile number"
                  required
                  inputMode="numeric"
                  placeholder="01712345678"
                  error={errors.mobile?.message}
                  {...register('mobile')}
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <Input
                  label="Email (optional)"
                  type="email"
                  placeholder="you@example.com"
                  error={errors.email?.message}
                  {...register('email')}
                />
                <Select label="I'm interested in" error={errors.interest?.message} {...register('interest')}>
                  {COURSE_CATEGORIES.map((category) => (
                    <option key={category} value={category}>
                      {category}
                    </option>
                  ))}
                  <option value="OTHER">Something else</option>
                </Select>
              </div>

              <Textarea
                label="Message"
                required
                rows={5}
                placeholder="Tell us which batch or exam you're preparing for…"
                error={errors.message?.message}
                {...register('message')}
              />

              <Button type="submit" size="lg" isLoading={isSubmitting}>
                Send message
              </Button>
            </form>
          )}
        </Card>

        <aside className="space-y-4">
          {CONTACT_CARDS.map((item) => (
            <Card key={item.label} className="p-5">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                {item.label}
              </p>
              {item.href ? (
                <a
                  href={item.href}
                  target={item.href.startsWith('http') ? '_blank' : undefined}
                  rel="noopener noreferrer"
                  className="mt-1 block text-sm font-medium text-brand-700 hover:underline dark:text-brand-400"
                >
                  {item.value}
                </a>
              ) : (
                <p className="mt-1 text-sm font-medium text-slate-800 dark:text-slate-200">
                  {item.value}
                </p>
              )}
            </Card>
          ))}

          <Card className="p-5">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Address</p>
            <p className="mt-1 text-sm text-slate-700 dark:text-slate-300">{CONTACT.address}</p>
            {/* TODO: embed a map once the office location is confirmed. */}
            <div className="mt-3 flex h-32 items-center justify-center rounded-lg bg-surface-subtle text-xs text-slate-400 dark:bg-slate-800">
              Map placeholder
            </div>
          </Card>
        </aside>
      </section>
    </div>
  );
}
