import Card from '@/components/ui/Card.jsx';
import { DotMatrix } from '@/components/ui/backgrounds';

const STATS = [
  { value: '12,000+', label: 'Doctors trained' },
  { value: '94%', label: 'Part-1 pass rate' },
  { value: '24,800+', label: 'Question bank items' },
  { value: '60+', label: 'Faculty members' },
];

const REASONS = [
  {
    title: 'Faculty who sat the same exams',
    description:
      'Every lecture is delivered by an FCPS/MD-qualified clinician actively teaching in a medical college — not a generalist coach.',
    icon: 'M12 3l8 4v6c0 5-3.4 7.7-8 9-4.6-1.3-8-4-8-9V7z',
  },
  {
    title: 'Exam-pattern assessment',
    description:
      'SBA and MTF papers follow the BCPS marking scheme, including negative marking, with item analysis after every exam.',
    icon: 'M9 11l3 3L22 4M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11',
  },
  {
    title: 'Study anywhere, on any device',
    description:
      'Recorded lectures, secure PDF notes and mock exams work on mobile data — with one active session per account to protect your material.',
    icon: 'M8 21h8M12 17v4M4 4h16v12H4z',
  },
  {
    title: 'Progress you can actually see',
    description:
      'Chapter-wise completion, exam ranking and weak-topic reports so you know exactly what to revise next.',
    icon: 'M4 20V10M10 20V4M16 20v-7M22 20H2',
  },
  {
    title: 'Local payment methods',
    description:
      'Pay with bKash, Nagad, Rocket or card. Instant invoice, and full payment history inside your dashboard.',
    icon: 'M3 7h15a2 2 0 012 2v8a2 2 0 01-2 2H4a1 1 0 01-1-1zM17 13h2',
  },
  {
    title: 'Support that answers',
    description:
      'WhatsApp helpline from 10 AM to 8 PM, plus doubt-clearing sessions with faculty every week.',
    icon: 'M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z',
  },
];

/** Trust + stats block, the section directly below the course grid. */
export default function WhyChooseUs() {
  return (
    <section className="relative isolate overflow-hidden bg-white py-12 dark:bg-surface-dark">
      <div className="pointer-events-none absolute inset-0 -z-10 text-brand-700 opacity-[0.04] dark:text-brand-300 dark:opacity-[0.10]">
        <DotMatrix className="h-full w-full" />
      </div>

      <div className="container-page">
        <div className="text-center">
          <h2 className="section-heading">Why doctors choose CPR Medical Academy</h2>
          <p className="section-subheading mx-auto text-center">
            Built around how these examinations are actually marked — structure, repetition and
            honest feedback.
          </p>
        </div>

        <dl className="mt-10 grid grid-cols-2 gap-4 lg:grid-cols-4">
          {STATS.map((stat) => (
            <Card key={stat.label} className="p-6 text-center">
              <dt className="order-2 mt-1 text-sm text-slate-500 dark:text-slate-400">{stat.label}</dt>
              <dd className="text-3xl font-extrabold text-brand-700 dark:text-brand-400">{stat.value}</dd>
            </Card>
          ))}
        </dl>

        <div className="mt-10 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {REASONS.map((reason) => (
            <Card key={reason.title} className="p-6">
              <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand-50 text-brand-700 dark:bg-brand-950 dark:text-brand-300">
                <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                  <path strokeLinecap="round" strokeLinejoin="round" d={reason.icon} />
                </svg>
              </span>
              <h3 className="mt-4 text-base font-semibold text-slate-900 dark:text-white">
                {reason.title}
              </h3>
              <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">{reason.description}</p>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
