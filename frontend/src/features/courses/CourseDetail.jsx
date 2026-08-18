import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
  FaCalendarDays,
  FaClock,
  FaPhone,
  FaWhatsapp,
  FaCheck,
  FaCalendarCheck,
} from 'react-icons/fa6';
import { useCourse } from './api/courses.queries.js';
import { useEnrollAction } from './hooks/useEnrollAction.js';
import Button from '@/components/ui/Button.jsx';
import Spinner from '@/components/ui/Spinner.jsx';
import EmptyState from '@/components/ui/EmptyState.jsx';
import { CONTACT, CATEGORY_SLUGS } from '@/constants';
import { formatBDT, formatDate } from '@/lib/utils';

export default function CourseDetail() {
  const { slug } = useParams();
  const { data: course, isLoading, isError } = useCourse(slug);
  const onEnroll = useEnrollAction();
  const [activeSection, setActiveSection] = useState('description');

  if (isLoading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center bg-white dark:bg-surface-dark">
        <Spinner size="lg" label="Loading course details…" />
      </div>
    );
  }

  if (isError || !course) {
    return (
      <EmptyState
        className="min-h-[60vh] bg-white dark:bg-surface-dark"
        title="Course not found"
        description="The course or batch you are looking for may have been renamed or archived."
        action={<Button to="/batches">Browse all batches</Button>}
      />
    );
  }

  const categorySlug = CATEGORY_SLUGS[course.category] || 'fcps';
  const scheduleUrl = `/courses/${categorySlug}/${course.slug}/schedule`;
  const hasDiscount = Boolean(course.discountPrice);

  const scrollToSection = (id) => {
    setActiveSection(id);
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <div className="min-h-screen bg-slate-50/70 py-8 dark:bg-surface-dark/95">
      <div className="container-page">
        {/* ── Breadcrumb ── */}
        <nav className="mb-6 flex items-center gap-2 text-xs font-medium text-slate-500 dark:text-slate-400" aria-label="Breadcrumb">
          <Link to="/" className="hover:text-brand-600 dark:hover:text-brand-400">Home</Link>
          <span>/</span>
          <Link to="/batches" className="hover:text-brand-600 dark:hover:text-brand-400">Batches</Link>
          <span>/</span>
          <span className="text-slate-800 dark:text-slate-200">{course.category}</span>
          <span>/</span>
          <span className="truncate font-semibold text-brand-700 dark:text-brand-400">{course.title}</span>
        </nav>

        {/* ── Main 2-Column Layout ── */}
        <div className="grid gap-8 lg:grid-cols-[1fr_22rem] xl:grid-cols-[1fr_24rem]">
          {/* ═══════════════════════════════════════════════════════════════
              LEFT COLUMN: Header Card, Tab Nav, and Detail Cards
              ═══════════════════════════════════════════════════════════════ */}
          <div className="space-y-6">
            {/* ── Top Header Banner Card ── */}
            <div className="overflow-hidden rounded-2xl border border-sky-200 bg-gradient-to-br from-sky-50 via-blue-50/60 to-indigo-50 shadow-sm dark:border-slate-800 dark:from-slate-900 dark:via-slate-900 dark:to-slate-850">
              {/* Blue Header Bar */}
              <div className="bg-gradient-to-r from-sky-600 via-blue-600 to-indigo-600 px-6 py-3.5 text-center text-white shadow-sm sm:text-left">
                <h1 className="text-lg font-bold sm:text-xl md:text-2xl">
                  {course.title}
                </h1>
              </div>

              {/* Meta Grid Row */}
              <div className="grid gap-4 p-5 sm:grid-cols-3 sm:divide-x sm:divide-sky-200/60 dark:sm:divide-slate-800">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-sky-100 text-sky-700 dark:bg-sky-950 dark:text-sky-400">
                    <FaCalendarDays className="h-5 w-5" />
                  </div>
                  <div>
                    <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                      Starting Date
                    </span>
                    <p className="text-sm font-bold text-slate-800 dark:text-slate-200">
                      {course.startsOn ? formatDate(course.startsOn) : '20-Jan-2026'}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3 sm:pl-4">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-400">
                    <FaClock className="h-5 w-5" />
                  </div>
                  <div>
                    <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                      Time
                    </span>
                    <p className="text-sm font-bold text-slate-800 dark:text-slate-200">
                      08:00 PM - 10:00 PM
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3 sm:pl-4">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-400">
                    <FaCalendarDays className="h-5 w-5" />
                  </div>
                  <div>
                    <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                      Class Days
                    </span>
                    <p className="text-sm font-bold text-slate-800 dark:text-slate-200">
                      SAT, TUE &amp; THU
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* ── Quick Navigation Tabs ── */}
            <div className="flex flex-wrap gap-2 rounded-xl bg-white p-2 shadow-sm dark:bg-surface-dark-subtle">
              <button
                type="button"
                onClick={() => scrollToSection('description')}
                className={`rounded-lg px-4 py-2 text-xs font-semibold transition-all sm:text-sm ${
                  activeSection === 'description'
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700'
                }`}
              >
                Description
              </button>
              <button
                type="button"
                onClick={() => scrollToSection('outline')}
                className={`rounded-lg px-4 py-2 text-xs font-semibold transition-all sm:text-sm ${
                  activeSection === 'outline'
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700'
                }`}
              >
                Course Outline
              </button>
              <button
                type="button"
                onClick={() => scrollToSection('fee')}
                className={`rounded-lg px-4 py-2 text-xs font-semibold transition-all sm:text-sm ${
                  activeSection === 'fee'
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700'
                }`}
              >
                Fee &amp; Offer
              </button>
              <button
                type="button"
                onClick={() => scrollToSection('registration')}
                className={`rounded-lg px-4 py-2 text-xs font-semibold transition-all sm:text-sm ${
                  activeSection === 'registration'
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700'
                }`}
              >
                Registration
              </button>
              <Link
                to={scheduleUrl}
                className="flex items-center gap-1.5 rounded-lg bg-emerald-600 px-4 py-2 text-xs font-bold text-white shadow-sm transition hover:bg-emerald-700 sm:text-sm"
              >
                <FaCalendarCheck className="h-3.5 w-3.5" />
                View Schedule →
              </Link>
            </div>

            {/* ── Section 1: Description Card ── */}
            <div id="description" className="scroll-mt-24 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-surface-dark-subtle">
              <div className="border-b border-sky-100 bg-sky-50/80 px-6 py-3 dark:border-slate-800 dark:bg-slate-900/60">
                <h2 className="text-base font-bold text-sky-900 dark:text-sky-300">
                  Description
                </h2>
              </div>

              <div className="space-y-4 p-6 text-sm leading-relaxed text-slate-700 dark:text-slate-300">
                <div className="flex items-start gap-2.5 font-bold text-slate-900 dark:text-white">
                  <span className="text-rose-500">🔴</span>
                  <span>{course.title}</span>
                </div>

                <div className="flex items-start gap-2.5 font-bold text-slate-900 dark:text-white">
                  <span className="text-rose-500">🔴</span>
                  <span>Orientation &amp; First Class: {course.startsOn ? formatDate(course.startsOn) : '20-Jan-2026'}</span>
                </div>

                <div className="rounded-xl bg-amber-50/60 p-4 border border-amber-200/60 dark:bg-amber-950/30 dark:border-amber-900/40">
                  <p className="font-semibold text-amber-900 dark:text-amber-300" lang="bn">
                    👉 কাদের জন্য এই ব্যাচ:
                  </p>
                  <p className="mt-1 text-slate-700 dark:text-slate-300" lang="bn">
                    যারা আগামী {course.category} পরীক্ষায় প্রথমবার অংশগ্রহণ করতে যাচ্ছেন অথবা পূর্ববর্তী পরীক্ষায় কাঙ্ক্ষিত ফলাফল অর্জন করতে পারেননি, তাদের জন্য সাজানো হয়েছে এই পূর্ণাঙ্গ কম্বাইন্ড প্রস্তুতি ব্যাচ।
                  </p>
                </div>

                <p className="text-slate-700 dark:text-slate-300" lang="bn">
                  CPR Medical Academy-র বিশেষজ্ঞ মেন্টর প্যানেল দ্বারা পরিচালিত এই ব্যাচে রয়েছে প্রতিটি বিষয়ের ওপর ইন্টারেক্টিভ লাইভ ক্লাস, বিগত বছরের প্রশ্নের পুঙ্খানুপুঙ্খ ব্যাখ্যা, অধ্যায়ভিত্তিক পরীক্ষা এবং ফাইনাল মডেল টেস্ট।
                </p>

                <div className="space-y-2 pt-2">
                  <h3 className="font-bold text-slate-900 dark:text-white" lang="bn">
                    📌 ব্যাচের প্রধান বৈশিষ্ট্যসমূহ:
                  </h3>
                  <ul className="space-y-2 pl-2">
                    <li className="flex items-start gap-2">
                      <FaCheck className="mt-1 h-3.5 w-3.5 shrink-0 text-brand-600 dark:text-brand-400" />
                      <span>{course.lessonCount} টি লাইভ ইন্টারেক্টিভ ক্লাস ও রেকর্ড ব্যাকআপ অ্যাক্সেস।</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <FaCheck className="mt-1 h-3.5 w-3.5 shrink-0 text-brand-600 dark:text-brand-400" />
                      <span>অধ্যায়ভিত্তিক SBA এবং MTF প্রশ্ন সমাধান ও র্যাঙ্ক লিস্ট।</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <FaCheck className="mt-1 h-3.5 w-3.5 shrink-0 text-brand-600 dark:text-brand-400" />
                      <span>বিশেষজ্ঞ চিকিৎসকদের তত্ত্বাবধানে নিয়মিত ডাউট সলভিং সেশন।</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <FaCheck className="mt-1 h-3.5 w-3.5 shrink-0 text-brand-600 dark:text-brand-400" />
                      <span>মুদ্রিত এবং ডিজিটাল পিডিএফ লেকচার নোট বান্ডেল।</span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>

            {/* ── Section 2: Course Outline Card ── */}
            <div id="outline" className="scroll-mt-24 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-surface-dark-subtle">
              <div className="border-b border-sky-100 bg-sky-50/80 px-6 py-3 dark:border-slate-800 dark:bg-slate-900/60">
                <h2 className="text-base font-bold text-sky-900 dark:text-sky-300">
                  Course Outline
                </h2>
              </div>

              <div className="p-6">
                <ul className="grid gap-3 sm:grid-cols-2">
                  {course.highlights.map((highlight, index) => (
                    <li
                      key={index}
                      className="flex items-start gap-2.5 rounded-xl border border-slate-100 bg-slate-50/70 p-3.5 text-sm font-medium text-slate-800 dark:border-slate-800 dark:bg-slate-900/40 dark:text-slate-200"
                    >
                      <span className="text-base">👉</span>
                      <span>{highlight}</span>
                    </li>
                  ))}
                  <li className="flex items-start gap-2.5 rounded-xl border border-slate-100 bg-slate-50/70 p-3.5 text-sm font-medium text-slate-800 dark:border-slate-800 dark:bg-slate-900/40 dark:text-slate-200">
                    <span className="text-base">👉</span>
                    <span>National Merit Ranking with every central assessment exam</span>
                  </li>
                  <li className="flex items-start gap-2.5 rounded-xl border border-slate-100 bg-slate-50/70 p-3.5 text-sm font-medium text-slate-800 dark:border-slate-800 dark:bg-slate-900/40 dark:text-slate-200">
                    <span className="text-base">👉</span>
                    <span>Special OSPE / Clinical Case discussion webinars</span>
                  </li>
                </ul>
              </div>
            </div>

            {/* ── Section 3: Course Fee & Offer Card ── */}
            <div id="fee" className="scroll-mt-24 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-surface-dark-subtle">
              <div className="border-b border-sky-100 bg-sky-50/80 px-6 py-3 dark:border-slate-800 dark:bg-slate-900/60">
                <h2 className="text-base font-bold text-sky-900 dark:text-sky-300">
                  Course Fee &amp; Offer
                </h2>
              </div>

              <div className="space-y-4 p-6 text-sm">
                <div className="flex items-center justify-between rounded-xl bg-slate-50 p-4 border border-slate-200/60 dark:bg-slate-900/50 dark:border-slate-800">
                  <div>
                    <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                      Regular Course Fee
                    </span>
                    <p className={`text-xl font-bold ${hasDiscount ? 'text-slate-500 line-through' : 'text-slate-900 dark:text-white'}`}>
                      {formatBDT(course.price)}
                    </p>
                  </div>

                  {hasDiscount && (
                    <div className="text-right">
                      <span className="inline-block rounded-full bg-emerald-100 px-3 py-1 text-xs font-bold text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                        Special Discount Offer
                      </span>
                      <p className="mt-1 text-2xl font-extrabold text-brand-700 dark:text-brand-400">
                        {formatBDT(course.discountPrice)}
                      </p>
                    </div>
                  )}
                </div>

                <div className="space-y-2 text-slate-600 dark:text-slate-400" lang="bn">
                  <p className="flex items-center gap-2">
                    <span className="text-brand-600 dark:text-brand-400">🔹</span>
                    <span>এককালীন ও কিস্তিতে ফি প্রদানের বিশেষ সুযোগ রয়েছে।</span>
                  </p>
                  <p className="flex items-center gap-2">
                    <span className="text-brand-600 dark:text-brand-400">🔹</span>
                    <span>সিট সংখ্যা সীমিত — নির্ধারিত আসন পূর্ণ হওয়ার সাথে সাথে ভর্তি প্রক্রিয়া বন্ধ করা হবে।</span>
                  </p>
                </div>
              </div>
            </div>

            {/* ── Section 4: Registration Process Card ── */}
            <div id="registration" className="scroll-mt-24 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-surface-dark-subtle">
              <div className="border-b border-sky-100 bg-sky-50/80 px-6 py-3 dark:border-slate-800 dark:bg-slate-900/60">
                <h2 className="text-base font-bold text-sky-900 dark:text-sky-300">
                  Registration Process
                </h2>
              </div>

              <div className="space-y-4 p-6 text-sm text-slate-700 dark:text-slate-300">
                <ol className="space-y-3" lang="bn">
                  <li className="flex items-start gap-3">
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-blue-600 text-xs font-bold text-white">
                      ১
                    </span>
                    <span>CPR Academy ওয়েবসাইটে রেজিস্ট্রেশন বা লগইন করুন।</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-blue-600 text-xs font-bold text-white">
                      ২
                    </span>
                    <span>আপনার পছন্দের ব্যাচে <strong className="text-brand-700 dark:text-brand-400">"Enrol Now"</strong> বাটনে ক্লিক করে চেকআউট পেজে যান।</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-blue-600 text-xs font-bold text-white">
                      ৩
                    </span>
                    <span>bKash, Nagad, Rocket অথবা কার্ডের মাধ্যমে কোর্স ফি পরিশোধ করুন।</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-blue-600 text-xs font-bold text-white">
                      ৪
                    </span>
                    <span>পেমেন্ট সফল হলে সাথে সাথেই আপনার ড্যাশবোর্ডে কোর্স এবং ক্লাসের অ্যাক্সেস সক্রিয় হয়ে যাবে।</span>
                  </li>
                </ol>

                <div className="mt-4 rounded-xl border border-sky-200 bg-sky-50/60 p-4 dark:border-slate-800 dark:bg-slate-900/60">
                  <p className="font-bold text-sky-900 dark:text-sky-300" lang="bn">
                    📞 যেকোনো সহযোগিতায় সরাসরি কথা বলুন:
                  </p>
                  <p className="mt-1 flex flex-wrap items-center gap-4 text-xs font-medium sm:text-sm">
                    <a href={`tel:${CONTACT.phone.replace(/\s/g, '')}`} className="flex items-center gap-1.5 font-bold text-brand-700 hover:underline dark:text-brand-400">
                      <FaPhone className="h-3.5 w-3.5" />
                      {CONTACT.phone}
                    </a>
                    <a href={`https://wa.me/${CONTACT.whatsapp}`} target="_blank" rel="noreferrer" className="flex items-center gap-1.5 font-bold text-emerald-700 hover:underline dark:text-emerald-400">
                      <FaWhatsapp className="h-4 w-4" />
                      WhatsApp: {CONTACT.whatsapp}
                    </a>
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* ═══════════════════════════════════════════════════════════════
              RIGHT COLUMN: Poster & Enrollment Action Box
              ═══════════════════════════════════════════════════════════════ */}
          <div className="space-y-6">
            {/* ── Poster Card ── */}
            <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-surface-dark-subtle">
              <div className="relative aspect-[4/3] w-full overflow-hidden bg-gradient-to-br from-brand-700 via-brand-800 to-sky-900">
                <img
                  src={course.thumbnailUrl || '/assets/carousel/posterd.jpeg'}
                  alt={course.title}
                  className="h-full w-full object-cover"
                />
                <div className="absolute top-3 right-3 rounded-full bg-brand-600/90 px-3 py-1 text-xs font-bold text-white shadow backdrop-blur-sm">
                  {course.category}
                </div>
              </div>

              {/* Action area below poster */}
              <div className="p-6">
                <div className="flex items-baseline justify-between">
                  <div>
                    <span className="text-xs text-slate-500 dark:text-slate-400">Total Course Fee</span>
                    <p className="text-2xl font-extrabold text-brand-700 dark:text-brand-400">
                      {formatBDT(hasDiscount ? course.discountPrice : course.price)}
                    </p>
                  </div>
                  {hasDiscount && (
                    <span className="text-sm text-slate-400 line-through dark:text-slate-500">
                      {formatBDT(course.price)}
                    </span>
                  )}
                </div>

                <div className="mt-5 space-y-3">
                  <Button
                    fullWidth
                    size="lg"
                    className="bg-blue-600 font-bold hover:bg-blue-700"
                    onClick={() => onEnroll(course)}
                  >
                    Enrol Now
                  </Button>

                  <Link
                    to={scheduleUrl}
                    className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-slate-200 px-4 py-2.5 text-xs font-semibold text-slate-700 transition-colors hover:bg-slate-100 dark:border-slate-800 dark:text-slate-300 dark:hover:bg-slate-800"
                  >
                    <FaCalendarCheck className="h-3.5 w-3.5 text-emerald-600" />
                    View Class Schedule
                  </Link>
                </div>

                {/* Quick Spec List */}
                <dl className="mt-6 divide-y divide-slate-100 text-xs dark:divide-slate-800">
                  <div className="flex justify-between py-2.5">
                    <dt className="text-slate-500 dark:text-slate-400">Duration</dt>
                    <dd className="font-semibold text-slate-800 dark:text-slate-200">{course.duration}</dd>
                  </div>
                  <div className="flex justify-between py-2.5">
                    <dt className="text-slate-500 dark:text-slate-400">Total Lectures</dt>
                    <dd className="font-semibold text-slate-800 dark:text-slate-200">{course.lessonCount} sessions</dd>
                  </div>
                  <div className="flex justify-between py-2.5">
                    <dt className="text-slate-500 dark:text-slate-400">Enrolled Students</dt>
                    <dd className="font-semibold text-slate-800 dark:text-slate-200">{course.enrolledCount.toLocaleString('en-BD')}+</dd>
                  </div>
                  <div className="flex justify-between py-2.5">
                    <dt className="text-slate-500 dark:text-slate-400">Access Validity</dt>
                    <dd className="font-semibold text-slate-800 dark:text-slate-200">Until Exam Date</dd>
                  </div>
                  <div className="flex justify-between py-2.5">
                    <dt className="text-slate-500 dark:text-slate-400">Medium</dt>
                    <dd className="font-semibold text-slate-800 dark:text-slate-200">Online Live &amp; Recorded</dd>
                  </div>
                </dl>
              </div>
            </div>

            {/* ── Helpline Card ── */}
            <div className="rounded-2xl border border-brand-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-surface-dark-subtle">
              <h3 className="font-bold text-slate-900 dark:text-white">
                Need Admission Help?
              </h3>
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                Call our admission counsellors directly:
              </p>
              <div className="mt-3 flex flex-col gap-2">
                <a
                  href={`tel:${CONTACT.phone.replace(/\s/g, '')}`}
                  className="flex items-center justify-center gap-2 rounded-lg bg-emerald-50 px-4 py-2.5 text-xs font-bold text-emerald-800 transition-colors hover:bg-emerald-100 dark:bg-emerald-950 dark:text-emerald-300"
                >
                  <FaPhone className="h-3.5 w-3.5" />
                  {CONTACT.phone}
                </a>
                <a
                  href={`https://wa.me/${CONTACT.whatsapp}`}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center justify-center gap-2 rounded-lg bg-emerald-600 px-4 py-2.5 text-xs font-bold text-white transition-colors hover:bg-emerald-700"
                >
                  <FaWhatsapp className="h-4 w-4" />
                  WhatsApp Support
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
