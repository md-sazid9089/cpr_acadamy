import { useState } from 'react';
import Card from '@/components/ui/Card.jsx';
import Button from '@/components/ui/Button.jsx';
import { cn } from '@/lib/utils';

// TODO: move to GET /faqs so the admin panel can edit these.
const FAQ_GROUPS = [
  {
    group: 'Admission & account',
    items: [
      {
        q: 'How do I create an account?',
        a: 'Register with your mobile number. You will receive a 6-digit OTP by SMS. After verification our team reviews the registration — accounts are activated once an administrator approves them, usually within a few working hours.',
      },
      {
        q: 'Why is my account showing "pending approval"?',
        a: 'Every new registration is manually checked against the details you submitted (name, BMDC number, institution). This prevents shared and fraudulent accounts. You will get an SMS as soon as the account is activated.',
      },
      {
        q: 'Can I log in from more than one device?',
        a: 'No. Each account allows one active session at a time. Signing in on a new device automatically signs you out everywhere else — this protects our lecture material from being shared.',
      },
    ],
  },
  {
    group: 'Courses & classes',
    items: [
      {
        q: 'Are the classes live or recorded?',
        a: 'Both. Core lectures are recorded so you can study around your duty roster, and each course runs live problem-solving and doubt-clearing sessions every week. Live sessions are recorded and added to your library.',
      },
      {
        q: 'How long do I keep access to a course?',
        a: 'Access runs until the examination date of the batch you enrolled in. Extensions are available at a reduced fee if you defer to the next cycle.',
      },
      {
        q: 'Can I download the lecture notes?',
        a: 'Notes are readable inside the app through a secure viewer and watermarked with your account details. Printed note bundles are included with selected courses.',
      },
    ],
  },
  {
    group: 'Exams & results',
    items: [
      {
        q: 'What question formats do the exams use?',
        a: 'Single Best Answer (SBA) and Multiple True/False (MTF), matching the BCPS pattern including negative marking where applicable.',
      },
      {
        q: 'What happens if my internet drops during an exam?',
        a: 'Your answers are saved as you go and the timer keeps running server-side. Reconnect and you resume from the same question with the remaining time intact.',
      },
    ],
  },
  {
    group: 'Payment & refunds',
    items: [
      {
        q: 'Which payment methods are supported?',
        a: 'bKash, Nagad, Rocket and card or bank transfer. An invoice appears in your dashboard immediately after a successful payment.',
      },
      {
        q: 'Do you offer refunds?',
        a: 'A full refund is available within 7 days of enrolment provided you have not accessed more than three lectures. After that, fees can be transferred to a later batch once.',
      },
    ],
  },
];

function FaqItem({ item }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="border-b border-slate-200 last:border-0 dark:border-slate-800">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
        className="flex w-full items-center justify-between gap-4 py-4 text-left"
      >
        <span className="text-sm font-semibold text-slate-900 dark:text-white">{item.q}</span>
        <svg
          className={cn(
            'h-5 w-5 shrink-0 text-brand-600 transition-transform dark:text-brand-400',
            open && 'rotate-180',
          )}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M6 9l6 6 6-6" />
        </svg>
      </button>
      {open && <p className="pb-4 text-sm leading-relaxed text-slate-600 dark:text-slate-400">{item.a}</p>}
    </div>
  );
}

export default function FAQ() {
  return (
    <div className="bg-white dark:bg-surface-dark">
      <section className="border-b border-slate-200 bg-surface-subtle py-12 text-center dark:border-slate-800 dark:bg-surface-dark-subtle">
        <div className="container-page">
          <h1 className="section-heading">Frequently Asked Questions</h1>
          <p className="section-subheading mx-auto text-center">
            Admission, classes, exams and payment — the things students ask us most.
          </p>
        </div>
      </section>

      <section className="container-page grid gap-8 py-12 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          {FAQ_GROUPS.map((group) => (
            <Card key={group.group} className="p-6">
              <h2 className="text-base font-bold text-brand-700 dark:text-brand-400">{group.group}</h2>
              <div className="mt-2">
                {group.items.map((item) => (
                  <FaqItem key={item.q} item={item} />
                ))}
              </div>
            </Card>
          ))}
        </div>

        <aside>
          <Card className="sticky top-24 p-6">
            <h2 className="text-base font-semibold text-slate-900 dark:text-white">
              Still have a question?
            </h2>
            <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
              Our admission team answers on WhatsApp between 10 AM and 8 PM, Saturday to Thursday.
            </p>
            <Button to="/contact" fullWidth className="mt-5">
              Contact us
            </Button>
          </Card>
        </aside>
      </section>
    </div>
  );
}
