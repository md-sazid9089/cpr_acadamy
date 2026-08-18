import { Link } from 'react-router-dom';

export default function About() {
  return (
    <div className="relative min-h-screen overflow-hidden bg-gradient-to-b from-[#b8e4f0] via-[#cceef6] to-[#b3e1ed] py-12 sm:py-16 dark:from-slate-950 dark:via-surface-dark dark:to-slate-900">
      {/* Decorative bokeh background circles */}
      <div
        className="pointer-events-none absolute -left-20 top-20 h-96 w-96 rounded-full bg-white/30 blur-2xl"
        aria-hidden="true"
      />
      <div
        className="pointer-events-none absolute -right-20 top-1/3 h-96 w-96 rounded-full bg-cyan-200/40 blur-2xl"
        aria-hidden="true"
      />
      <div
        className="pointer-events-none absolute left-1/3 bottom-20 h-96 w-96 rounded-full bg-white/20 blur-3xl"
        aria-hidden="true"
      />

      <div className="container-page relative z-10 max-w-5xl space-y-10">
        {/* ── Page Header ── */}
        <div className="text-center">
          <h1 className="text-3xl font-extrabold tracking-tight text-[#1c3d5a] sm:text-4xl lg:text-5xl dark:text-white">
            About Us
          </h1>
        </div>

        {/* ── CARD 1: Achieve your Goals with CPR Academy ── */}
        <div className="overflow-hidden rounded-3xl border border-white/70 bg-white/75 p-6 shadow-xl backdrop-blur-md sm:p-10 lg:p-12 dark:border-slate-700/60 dark:bg-surface-dark-subtle/80">
          <div className="grid items-center gap-8 lg:grid-cols-12 lg:gap-12">
            {/* Left: Doctor Portrait with Soft Pink Watercolor Background */}
            <div className="relative flex items-center justify-center lg:col-span-5">
              {/* Pink watercolor blob backdrop */}
              <div
                className="absolute inset-0 m-auto h-64 w-64 rounded-full bg-gradient-to-tr from-pink-400/40 to-rose-300/40 blur-xl sm:h-72 sm:w-72"
                aria-hidden="true"
              />

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
              <h2 className="text-2xl font-extrabold tracking-tight text-[#1c3d5a] sm:text-3xl lg:text-4xl dark:text-white">
                Achieve your Goals <br />
                <span className="text-[#1d63d3] dark:text-blue-400">with CPR Academy</span>
              </h2>

              <p className="text-xs leading-relaxed text-slate-700 sm:text-sm dark:text-slate-300">
                Physician is human's friend and CPR Academy is physician's friend.
                CPR Academy is your best friend in realizing your dream of developing
                yourself as a specialist medical doctor.
              </p>

              <p className="text-xs leading-relaxed text-slate-600 sm:text-sm dark:text-slate-300">
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
                  className="inline-flex items-center justify-center rounded-lg border-2 border-[#1c4d96] bg-transparent px-6 py-2 text-xs font-bold text-[#1c4d96] shadow-sm transition hover:bg-[#1c4d96] hover:text-white sm:text-sm dark:border-blue-400 dark:text-blue-400 dark:hover:bg-blue-600 dark:hover:text-white"
                >
                  Join Us
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* ── CARD 2: Tools For Doctors (Why Choose CPR Academy) ── */}
        <div className="overflow-hidden rounded-3xl border border-white/70 bg-white/75 p-6 shadow-xl backdrop-blur-md sm:p-10 lg:p-12 dark:border-slate-700/60 dark:bg-surface-dark-subtle/80">
          <div className="grid items-center gap-8 lg:grid-cols-12 lg:gap-12">
            {/* Left: Content */}
            <div className="order-2 space-y-4 lg:order-1 lg:col-span-7">
              <div>
                <span className="text-xs font-bold text-[#1d63d3] sm:text-sm dark:text-blue-400">
                  Why Choose CPR Academy
                </span>
                <h2 className="mt-1 text-2xl font-extrabold tracking-tight text-[#1c3d5a] sm:text-3xl lg:text-4xl dark:text-white">
                  Tools For Doctors
                </h2>
              </div>

              <p className="text-xs leading-relaxed text-slate-700 sm:text-sm dark:text-slate-300">
                CPR Academy is now experienced which is a recognised truth, one in
                three surpasses success.
              </p>

              <p className="text-xs leading-relaxed text-slate-600 sm:text-sm dark:text-slate-300">
                And this is also true; Contrary to many years of tradition, the
                era of LASER, laparoscopy, minimal surgery is now coming; Just
                that-day. Our team is made up of people who have an in-depth
                knowledge of the subject, experts in sharing, who have been
                working on exam-question-answer-possibilities for many years.
              </p>

              <p className="text-xs leading-relaxed text-slate-600 sm:text-sm dark:text-slate-300">
                A message will surely stick in your mind as you walk with us;
                That is, complete preparation is required in each paper rather
                than being a scientist for success in exams. Don't forget to talk
                to a former student of CPR Academy before making any decision.
              </p>

              <div className="pt-2">
                <Link
                  to="/batches"
                  className="inline-flex items-center justify-center rounded-lg bg-[#1d63d3] px-6 py-2.5 text-xs font-bold text-white shadow-md transition hover:bg-blue-700 sm:text-sm"
                >
                  See our Batches
                </Link>
              </div>
            </div>

            {/* Right: Student with Book on Organic Green Backdrop */}
            <div className="relative order-1 flex items-center justify-center lg:order-2 lg:col-span-5">
              {/* Organic green/teal shape backdrop */}
              <div
                className="absolute inset-0 m-auto h-64 w-64 rounded-full bg-gradient-to-tr from-emerald-400/50 to-teal-300/50 blur-xl sm:h-72 sm:w-72"
                aria-hidden="true"
              />

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
