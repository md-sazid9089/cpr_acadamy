import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { FaFacebookF, FaYoutube, FaTelegram, FaPhone, FaEnvelope, FaRegClock, FaLocationDot } from 'react-icons/fa6';
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

// Same helpline number the footer already publishes, alongside the general contact line.
const HELPLINE = '+88 01329 672052';

const SOCIAL_LINKS = [
  { icon: FaFacebookF, href: 'https://facebook.com', label: 'Facebook' },
  { icon: FaYoutube, href: 'https://youtube.com', label: 'YouTube' },
  { icon: FaTelegram, href: 'https://telegram.org', label: 'Telegram' },
];

const CONTACT_CARDS = [
  { icon: FaPhone, label: 'Contact No.', value: CONTACT.phone, href: `tel:${CONTACT.phone.replace(/\s/g, '')}` },
  { icon: FaEnvelope, label: 'Email', value: CONTACT.email, href: `mailto:${CONTACT.email}` },
  { icon: FaRegClock, label: 'Opening Hours', value: CONTACT.hours },
  { icon: FaLocationDot, label: 'Address', value: CONTACT.address },
];

const MAP_SRC = `https://www.google.com/maps?q=${encodeURIComponent(CONTACT.address)}&output=embed`;

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
    <div className="bg-surface-light dark:bg-surface-dark">
      <section className="container-page grid gap-10 py-12 lg:grid-cols-2 lg:items-start">
        <div>
          <h1 className="text-2xl font-extrabold text-stone-900 sm:text-3xl dark:text-white">Contact Us</h1>
          <div className="mt-4 space-y-1.5">
            <a
              href={`tel:${CONTACT.phone.replace(/\s/g, '')}`}
              className="block text-xl font-bold text-brand-700 hover:underline dark:text-brand-400"
            >
              {CONTACT.phone}
            </a>
            <a
              href={`tel:${HELPLINE.replace(/\s/g, '')}`}
              className="block text-xl font-bold text-brand-700 hover:underline dark:text-brand-400"
            >
              {HELPLINE}
            </a>
          </div>
          <p className="mt-4 max-w-sm text-sm leading-relaxed text-stone-600 dark:text-brand-200">
            We would love to speak with you. Feel free to reach out using the below details.
          </p>
          <div className="mt-5 flex items-center gap-2">
            {SOCIAL_LINKS.map(({ icon: Icon, href, label }) => (
              <a
                key={label}
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={label}
                className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-100 text-brand-700 transition-colors hover:bg-brand-600 hover:text-white dark:bg-brand-950 dark:text-brand-300"
              >
                <Icon className="h-3.5 w-3.5" />
              </a>
            ))}
          </div>
        </div>

        <Card className="p-6">
          {submitted ? (
            <div className="py-10 text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-brand-50 text-brand-600 dark:bg-brand-950 dark:text-brand-400">
                <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h2 className="mt-4 text-lg font-semibold text-stone-900 dark:text-white">
                Message sent
              </h2>
              <p className="mt-1 text-sm text-stone-600 dark:text-brand-200">
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

              <Button type="submit" fullWidth isLoading={isSubmitting}>
                Submit
              </Button>
            </form>
          )}
        </Card>
      </section>

      <section className="container-page pb-16 text-center">
        <h2 className="text-xl font-extrabold text-stone-900 sm:text-2xl dark:text-white">Or Get In Touch</h2>
        <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {CONTACT_CARDS.map(({ icon: Icon, label, value, href }) => (
            <Card key={label} className="p-5 text-center">
              <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-full bg-brand-100 text-brand-700 dark:bg-brand-950 dark:text-brand-300">
                <Icon className="h-4 w-4" />
              </div>
              <p className="mt-3 text-xs font-semibold uppercase tracking-wide text-stone-400">{label}</p>
              {href ? (
                <a
                  href={href}
                  className="mt-1 block text-sm font-medium text-stone-800 hover:text-brand-700 hover:underline dark:text-brand-200"
                >
                  {value}
                </a>
              ) : (
                <p className="mt-1 text-sm font-medium text-stone-800 dark:text-brand-200">{value}</p>
              )}
            </Card>
          ))}
        </div>
      </section>

      <section className="container-page pb-16">
        <Card className="h-[280px] overflow-hidden sm:h-[380px]">
          <iframe
            title="CPR Academy location"
            src={MAP_SRC}
            className="h-full w-full border-0"
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
          />
        </Card>
      </section>
    </div>
  );
}
