import { Link } from 'react-router-dom';

export default function About() {
  return (
    <div className="relative min-h-screen overflow-hidden bg-surface-light py-12 sm:py-16 dark:bg-surface-dark">

      <div className="container-page relative z-10 max-w-5xl space-y-10">
        {/* ── Page Header ── */}
        <div className="text-center">
          <h1 className="text-3xl font-extrabold tracking-tight text-brand-900 sm:text-4xl lg:text-5xl dark:text-white">
            About Us
          </h1>
        </div>

        {/* ── CARD 1: Achieve your Goals with CPR Academy ── */}
        <div className="border-b border-stone-200 py-6 sm:py-10 lg:py-12 dark:border-stone-200">
          <div className="grid items-center gap-8 lg:grid-cols-12 lg:gap-12">
            <div className="relative flex items-center justify-center lg:col-span-5">

              <div className="relative z-10 overflow-hidden rounded-2xl">
                <img
                  src="/assets/spotlight/profilea.png"
                  alt="CPR Academy Medical Faculty"
                  className="max-h-80 w-auto object-contain sm:max-h-96"
                />
              </div>
            </div>

            {/* Right: Content */}
            <div className="space-y-4 lg:col-span-7">
              <h2 className="text-2xl font-extrabold tracking-tight text-brand-900 sm:text-3xl lg:text-4xl dark:text-white">
                Achieve your Goals <br />
                <span className="text-brand-600 dark:text-brand-400">with CPR Academy</span>
              </h2>

              <p className="text-xs leading-relaxed text-stone-700 sm:text-sm dark:text-brand-200">
                Physician is human's friend and CPR Academy is physician's friend.
                CPR Academy is your best friend in realizing your dream of developing
                yourself as a specialist medical doctor.
              </p>

              <p className="text-xs leading-relaxed text-stone-600 sm:text-sm dark:text-brand-200">
                Not burdening the brain with unnecessary information or just
                scratching, CPR Academy works with two things in mind: "Exam Based
                Preparation" and "Conception Clearance". FCPS / MD / MS / MRCP /
                MRCS / Diploma / Basic subjects or whatever, CPR Academy Curriculum,
                Air-conditioned classroom, impeccable lectures, multimedia
                presentations, irresistible sheets, daily exams, mock exams will
                build you up little by little every day, Confident it will.
              </p>

              <div className="pt-2">
                <Link
                  to="/batches"
                  className="inline-flex items-center justify-center rounded-lg border border-stone-200 bg-transparent px-6 py-2 text-xs font-bold text-brand-600 transition hover:bg-brand-600 hover:text-white sm:text-sm dark:border-stone-200 dark:text-brand-400 dark:hover:bg-brand-600 dark:hover:text-white"
                >
                  Join Us
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* ── CARD 2: Tools For Doctors (Why Choose CPR Academy) ── */}
        <div className="py-6 sm:py-10 lg:py-12">
          <div className="grid items-center gap-8 lg:grid-cols-12 lg:gap-12">
            {/* Left: Content */}
            <div className="order-2 space-y-4 lg:order-1 lg:col-span-7">
              <div>
                <span className="text-xs font-bold text-brand-600 sm:text-sm dark:text-brand-400">
                  Why Choose CPR Academy
                </span>
                <h2 className="mt-1 text-2xl font-extrabold tracking-tight text-brand-900 sm:text-3xl lg:text-4xl dark:text-white">
                  Tools For Doctors
                </h2>
              </div>

              <p className="text-xs leading-relaxed text-stone-700 sm:text-sm dark:text-brand-200">
                CPR Academy is now experienced which is a recognised truth, one in
                three surpasses success.
              </p>

              <p className="text-xs leading-relaxed text-stone-600 sm:text-sm dark:text-brand-200">
                And this is also true; Contrary to many years of tradition, the
                era of LASER, laparoscopy, minimal surgery is now coming; Just
                that-day. Our team is made up of people who have an in-depth
                knowledge of the subject, experts in sharing, who have been
                working on exam-question-answer-possibilities for many years.
              </p>

              <p className="text-xs leading-relaxed text-stone-600 sm:text-sm dark:text-brand-200">
                A message will surely stick in your mind as you walk with us;
                That is, complete preparation is required in each paper rather
                than being a scientist for success in exams. Don't forget to talk
                to a former student of CPR Academy before making any decision.
              </p>

              <div className="pt-2">
                <Link
                  to="/batches"
                  className="inline-flex items-center justify-center rounded-lg bg-brand-600 px-6 py-2.5 text-xs font-bold text-white border border-stone-200 transition hover:bg-brand-700 sm:text-sm"
                >
                  See our Batches
                </Link>
              </div>
            </div>

            <div className="relative order-1 flex items-center justify-center lg:order-2 lg:col-span-5">

              <div className="relative z-10 overflow-hidden rounded-2xl">
                <img
                  src="/assets/spotlight/profileb.png"
                  alt="CPR Academy Medical Student Studying"
                  className="max-h-80 w-auto object-contain sm:max-h-96"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
