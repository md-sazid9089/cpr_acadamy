import Button from '@/components/ui/Button.jsx';

const TRUST_POINTS = ['12,000+ doctors trained', '94% pass rate', 'Faculty from BSMMU & DMC'];

export default function Hero() {
  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-brand-700 via-brand-800 to-emerald-950 text-white">
      {/* Soft radial highlight behind the copy. */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-24 -top-24 h-80 w-80 rounded-full bg-brand-400/20 blur-3xl"
      />

      <div className="container-page grid gap-10 py-16 lg:grid-cols-2 lg:py-24">
        <div className="max-w-xl">
          <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-brand-100 ring-1 ring-white/20">
            Admission open · January 2026 batch
          </span>

          <h1 className="mt-5 text-3xl font-extrabold leading-tight tracking-tight sm:text-4xl lg:text-5xl">
            Preparation that matches the{' '}
            <span className="text-brand-300">real examination</span>, not just the syllabus.
          </h1>

          <p className="mt-5 text-base text-brand-100 sm:text-lg">
            CPR Medical Academy prepares Bangladeshi doctors and students for FCPS, BCS (Health) and
            MBBS professional examinations — structured lectures, a curated question bank, and
            regular assessment with item analysis.
          </p>

          <div className="mt-8 flex flex-wrap gap-3">
            <Button to="/courses" size="lg" variant="inverse">
              Explore Courses
            </Button>
            <Button to="/register" size="lg" variant="inverse-outline">
              Create Free Account
            </Button>
          </div>

          <ul className="mt-8 flex flex-wrap gap-x-6 gap-y-2 text-sm text-brand-100">
            {TRUST_POINTS.map((point) => (
              <li key={point} className="flex items-center gap-2">
                <svg className="h-4 w-4 text-brand-300" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
                {point}
              </li>
            ))}
          </ul>
        </div>

        <div className="relative hidden items-center justify-center lg:flex">
          <div className="w-full max-w-sm rounded-2xl bg-white/10 p-6 ring-1 ring-white/20 backdrop-blur">
            <p className="text-sm font-semibold text-brand-100">Next live class</p>
            <p className="mt-1 text-lg font-bold">Cardiology — Arrhythmia Approach</p>
            <p className="mt-1 text-sm text-brand-200">Friday, 8:00 PM · Dr. Nusrat Jahan</p>

            <div className="mt-6 space-y-3">
              {[
                ['Ongoing batches', '14'],
                ['Question bank items', '24,800+'],
                ['Mock exams this month', '32'],
              ].map(([label, value]) => (
                <div
                  key={label}
                  className="flex items-center justify-between rounded-lg bg-white/10 px-4 py-3 text-sm"
                >
                  <span className="text-brand-100">{label}</span>
                  <span className="font-bold">{value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
