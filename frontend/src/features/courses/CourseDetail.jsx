import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
  FaCalendarDays,
  FaClock,
  FaPhone,
  FaWhatsapp,
  FaCalendarCheck,
  FaCircle,
  FaCircleInfo,
  FaAngleRight,
  FaArrowRightLong,
} from 'react-icons/fa6';
import { useCourse } from './api/courses.queries.js';
import { useEnrollAction } from './hooks/useEnrollAction.js';
import Button from '@/components/ui/Button.jsx';
import { PageSkeleton } from '@/components/ui/Skeleton.jsx';
import EmptyState from '@/components/ui/EmptyState.jsx';
import InstructorReviews from './components/InstructorReviews.jsx';
import { CONTACT, CATEGORY_SLUGS } from '@/constants';
import { formatBDT, formatClassDays, formatDate, formatNumber, formatTimeRange } from '@/lib/utils';

/** Blank lines in the stored description separate paragraphs. */
function paragraphs(text) {
  return (text ?? '')
    .split(/\n\s*\n/)
    .map((part) => part.trim())
    .filter(Boolean);
}

export default function CourseDetail() {
  const { slug } = useParams();
  const { data: course, isLoading, isError } = useCourse(slug);
  const onEnroll = useEnrollAction();
  const [activeSection, setActiveSection] = useState('description');

  if (isLoading) {
    return (
      <PageSkeleton variant="detail" />
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
  const startsOnLabel = course.startsOn ? formatDate(course.startsOn) : 'To be announced';
  const description = paragraphs(course.description);
  const outline = course.highlights ?? [];

  const scrollToSection = (id) => {
    setActiveSection(id);
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <div className="min-h-screen bg-white py-8 dark:bg-surface-dark">
      <div className="container-page">
        {/* ── Breadcrumb ── */}
        <nav className="mb-6 flex items-center gap-2 text-xs font-medium text-stone-500 dark:text-brand-200" aria-label="Breadcrumb">
          <Link to="/" className="hover:text-brand-600 dark:hover:text-brand-400">Home</Link>
          <span>/</span>
          <Link to="/batches" className="hover:text-brand-600 dark:hover:text-brand-400">Batches</Link>
          <span>/</span>
          <span className="text-stone-800 dark:text-brand-200">{course.category}</span>
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
            <div className="overflow-hidden rounded-2xl border border-stone-200 bg-gradient-to-br from-brand-50 via-white to-brand-100 dark:border-stone-200 dark:from-surface-dark dark:via-surface-dark dark:to-surface-dark">
              {/* Blue Header Bar */}
              <div className="bg-gradient-to-r from-brand-700 via-brand-600 to-brand-500 px-6 py-3.5 text-center text-white border border-stone-200 sm:text-left">
                <h1 className="text-lg font-bold sm:text-xl md:text-2xl">
                  {course.title}
                </h1>
              </div>

              {/* Meta Grid Row */}
              <div className="grid gap-4 p-5 sm:grid-cols-3 sm:divide-x sm:divide-stone-200 dark:sm:divide-stone-200">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-100 text-brand-700 dark:bg-brand-950 dark:text-brand-400">
                    <FaCalendarDays className="h-5 w-5" />
                  </div>
                  <div>
                    <span className="text-[11px] font-semibold uppercase tracking-wider text-stone-500 dark:text-brand-200">
                      Starting Date
                    </span>
                    <p className="text-sm font-bold text-stone-800 dark:text-brand-200">
                      {startsOnLabel}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3 sm:pl-4">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-100 text-brand-700 dark:bg-brand-950 dark:text-brand-400">
                    <FaClock className="h-5 w-5" />
                  </div>
                  <div>
                    <span className="text-[11px] font-semibold uppercase tracking-wider text-stone-500 dark:text-brand-200">
                      Time
                    </span>
                    <p className="text-sm font-bold text-stone-800 dark:text-brand-200">
                      {formatTimeRange(course.classTime)}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3 sm:pl-4">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-100 text-brand-700 dark:bg-brand-950 dark:text-brand-400">
                    <FaCalendarDays className="h-5 w-5" />
                  </div>
                  <div>
                    <span className="text-[11px] font-semibold uppercase tracking-wider text-stone-500 dark:text-brand-200">
                      Class Days
                    </span>
                    <p className="text-sm font-bold text-stone-800 dark:text-brand-200">
                      {formatClassDays(course.classDays)}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* ── Quick Navigation Tabs ── */}
            <div className="flex flex-wrap gap-2 rounded-xl bg-white p-2 border border-stone-200 dark:bg-surface-dark-subtle">
              <button
                type="button"
                onClick={() => scrollToSection('description')}
                className={`rounded-lg px-4 py-2 text-xs font-semibold transition-all sm:text-sm ${
                  activeSection === 'description'
                    ? 'bg-brand-600 text-white border border-stone-200'
                    : 'bg-stone-100 text-stone-700 hover:bg-stone-200 dark:bg-surface-dark dark:text-brand-200 dark:hover:bg-surface-dark'
                }`}
              >
                Description
              </button>
              <button
                type="button"
                onClick={() => scrollToSection('outline')}
                className={`rounded-lg px-4 py-2 text-xs font-semibold transition-all sm:text-sm ${
                  activeSection === 'outline'
                    ? 'bg-brand-600 text-white border border-stone-200'
                    : 'bg-stone-100 text-stone-700 hover:bg-stone-200 dark:bg-surface-dark dark:text-brand-200 dark:hover:bg-surface-dark'
                }`}
              >
                Course Outline
              </button>
              <button
                type="button"
                onClick={() => scrollToSection('fee')}
                className={`rounded-lg px-4 py-2 text-xs font-semibold transition-all sm:text-sm ${
                  activeSection === 'fee'
                    ? 'bg-brand-600 text-white border border-stone-200'
                    : 'bg-stone-100 text-stone-700 hover:bg-stone-200 dark:bg-surface-dark dark:text-brand-200 dark:hover:bg-surface-dark'
                }`}
              >
                Fee &amp; Offer
              </button>
              <button
                type="button"
                onClick={() => scrollToSection('registration')}
                className={`rounded-lg px-4 py-2 text-xs font-semibold transition-all sm:text-sm ${
                  activeSection === 'registration'
                    ? 'bg-brand-600 text-white border border-stone-200'
                    : 'bg-stone-100 text-stone-700 hover:bg-stone-200 dark:bg-surface-dark dark:text-brand-200 dark:hover:bg-surface-dark'
                }`}
              >
                Registration
              </button>
              <Link
                to={scheduleUrl}
                className="flex items-center gap-1.5 rounded-lg bg-brand-600 px-4 py-2 text-xs font-bold text-white border border-stone-200 transition hover:bg-brand-700 sm:text-sm"
              >
                <FaCalendarCheck className="h-3.5 w-3.5" />
                View Schedule
                <FaArrowRightLong aria-hidden="true" className="h-3 w-3" />
              </Link>
              <button
                type="button"
                onClick={() => scrollToSection('instructor-reviews')}
                className={`rounded-lg px-4 py-2 text-xs font-semibold transition-all sm:text-sm ${
                  activeSection === 'instructor-reviews'
                    ? 'bg-brand-600 text-white border border-stone-200'
                    : 'bg-stone-100 text-stone-700 hover:bg-stone-200 dark:bg-surface-dark dark:text-brand-200 dark:hover:bg-surface-dark'
                }`}
              >
                Instructor Reviews
              </button>
            </div>

            {/* ── Section 1: Description Card ── */}
            <div id="description" className="scroll-mt-24 overflow-hidden rounded-2xl border border-stone-200 bg-white dark:border-stone-200 dark:bg-surface-dark-subtle">
              <div className="border-b border-stone-200 bg-brand-50/80 px-6 py-3 dark:border-stone-200 dark:bg-surface-dark">
                <h2 className="text-base font-bold text-brand-900 dark:text-brand-300">
                  Description
                </h2>
              </div>

              <div className="space-y-4 p-6 text-sm leading-relaxed text-stone-700 dark:text-brand-200">
                <div className="flex items-start gap-2.5 font-bold text-stone-900 dark:text-white">
                  <FaCircle aria-hidden="true" className="mt-1.5 h-2 w-2 shrink-0 text-brand-500" />
                  <span>{course.title}</span>
                </div>

                <div className="flex items-start gap-2.5 font-bold text-stone-900 dark:text-white">
                  <FaCircle aria-hidden="true" className="mt-1.5 h-2 w-2 shrink-0 text-brand-500" />
                  <span>Orientation &amp; First Class: {startsOnLabel}</span>
                </div>

                {description.length > 0 ? (
                  description.map((paragraph, index) =>
                    index === 0 ? (
                      <div
                        key={index}
                        className="rounded-xl border border-stone-200 bg-brand-50/60 p-4 dark:border-stone-200 dark:bg-brand-950/30"
                      >
                        <p className="flex items-start gap-2 text-stone-700 dark:text-brand-200">
                          <FaCircleInfo aria-hidden="true" className="mt-1 h-4 w-4 shrink-0 text-brand-900 dark:text-brand-300" />
                          <span>{paragraph}</span>
                        </p>
                      </div>
                    ) : (
                      <p key={index} className="text-stone-700 dark:text-brand-200">
                        {paragraph}
                      </p>
                    ),
                  )
                ) : (
                  course.subtitle && <p className="text-stone-700 dark:text-brand-200">{course.subtitle}</p>
                )}
              </div>
            </div>

            {/* ── Section 2: Course Outline Card ── */}
            <div id="outline" className="scroll-mt-24 overflow-hidden rounded-2xl border border-stone-200 bg-white dark:border-stone-200 dark:bg-surface-dark-subtle">
              <div className="border-b border-stone-200 bg-brand-50/80 px-6 py-3 dark:border-stone-200 dark:bg-surface-dark">
                <h2 className="text-base font-bold text-brand-900 dark:text-brand-300">
                  Course Outline
                </h2>
              </div>

              <div className="p-6">
                {outline.length > 0 ? (
                  <ul className="grid gap-3 sm:grid-cols-2">
                    {outline.map((item, index) => (
                      <li
                        key={index}
                        className="flex items-start gap-2.5 rounded-xl border border-stone-200 bg-stone-50/70 p-3.5 text-sm font-medium text-stone-800 dark:border-stone-200 dark:bg-surface-dark dark:text-brand-200"
                      >
                        <FaAngleRight aria-hidden="true" className="mt-0.5 h-4 w-4 shrink-0 text-brand-600 dark:text-brand-400" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-stone-500 dark:text-brand-200">Outline to be announced.</p>
                )}
              </div>
            </div>

            <InstructorReviews key={course.slug} slug={course.slug} />

            {/* ── Section 3: Course Fee & Offer Card ── */}
            <div id="fee" className="scroll-mt-24 overflow-hidden rounded-2xl border border-stone-200 bg-white dark:border-stone-200 dark:bg-surface-dark-subtle">
              <div className="border-b border-stone-200 bg-brand-50/80 px-6 py-3 dark:border-stone-200 dark:bg-surface-dark">
                <h2 className="text-base font-bold text-brand-900 dark:text-brand-300">
                  Course Fee &amp; Offer
                </h2>
              </div>

              <div className="space-y-4 p-6 text-sm">
                <div className="flex items-center justify-between rounded-xl bg-stone-50 p-4 border border-stone-200 dark:bg-surface-dark dark:border-stone-200">
                  <div>
                    <span className="text-xs font-semibold uppercase tracking-wider text-stone-500 dark:text-brand-200">
                      Regular Course Fee
                    </span>
                    <p className={`text-xl font-bold ${hasDiscount ? 'text-stone-500 line-through' : 'text-stone-900 dark:text-white'}`}>
                      {formatBDT(course.price)}
                    </p>
                  </div>

                  {hasDiscount && (
                    <div className="text-right">
                      <span className="inline-block rounded-full bg-brand-100 px-3 py-1 text-xs font-bold text-brand-800 dark:bg-brand-950 dark:text-brand-300">
                        {course.offer?.label || 'Special Discount Offer'}
                      </span>
                      <p className="mt-1 text-2xl font-extrabold text-brand-700 dark:text-brand-400">
                        {formatBDT(course.discountPrice)}
                      </p>
                      {course.offer?.endsAt && (
                        <p className="mt-0.5 text-xs font-medium text-stone-500 dark:text-brand-200">
                          Offer ends {formatDate(course.offer.endsAt)}
                        </p>
                      )}
                    </div>
                  )}
                </div>

                <div className="space-y-2 text-stone-600 dark:text-brand-200" lang="bn">
                  <p className="flex items-center gap-2">
                    <FaCircle aria-hidden="true" className="h-1.5 w-1.5 shrink-0 text-brand-600 dark:text-brand-400" />
                    <span>এককালীন ও কিস্তিতে ফি প্রদানের বিশেষ সুযোগ রয়েছে।</span>
                  </p>
                  <p className="flex items-center gap-2">
                    <FaCircle aria-hidden="true" className="h-1.5 w-1.5 shrink-0 text-brand-600 dark:text-brand-400" />
                    <span>সিট সংখ্যা সীমিত — নির্ধারিত আসন পূর্ণ হওয়ার সাথে সাথে ভর্তি প্রক্রিয়া বন্ধ করা হবে।</span>
                  </p>
                </div>
              </div>
            </div>

            {/* ── Section 4: Registration Process Card ── */}
            <div id="registration" className="scroll-mt-24 overflow-hidden rounded-2xl border border-stone-200 bg-white dark:border-stone-200 dark:bg-surface-dark-subtle">
              <div className="border-b border-stone-200 bg-brand-50/80 px-6 py-3 dark:border-stone-200 dark:bg-surface-dark">
                <h2 className="text-base font-bold text-brand-900 dark:text-brand-300">
                  Registration Process
                </h2>
              </div>

              <div className="space-y-4 p-6 text-sm text-stone-700 dark:text-brand-200">
                <ol className="space-y-3" lang="bn">
                  <li className="flex items-start gap-3">
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-brand-600 text-xs font-bold text-white">
                      ১
                    </span>
                    <span>CPR Academy ওয়েবসাইটে রেজিস্ট্রেশন বা লগইন করুন।</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-brand-600 text-xs font-bold text-white">
                      ২
                    </span>
                    <span>আপনার পছন্দের ব্যাচে <strong className="text-brand-700 dark:text-brand-400">"Enrol Now"</strong> বাটনে ক্লিক করে চেকআউট পেজে যান।</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-brand-600 text-xs font-bold text-white">
                      ৩
                    </span>
                    <span>bKash, Nagad, Rocket অথবা কার্ডের মাধ্যমে কোর্স ফি পরিশোধ করুন।</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-brand-600 text-xs font-bold text-white">
                      ৪
                    </span>
                    <span>পেমেন্ট সফল হলে সাথে সাথেই আপনার ড্যাশবোর্ডে কোর্স এবং ক্লাসের অ্যাক্সেস সক্রিয় হয়ে যাবে।</span>
                  </li>
                </ol>

                <div className="mt-4 rounded-xl border border-stone-200 bg-brand-50/60 p-4 dark:border-stone-200 dark:bg-surface-dark">
                  <p className="flex items-center gap-2 font-bold text-brand-900 dark:text-brand-300" lang="bn">
                    <FaPhone aria-hidden="true" className="h-3.5 w-3.5 shrink-0" />
                    যেকোনো সহযোগিতায় সরাসরি কথা বলুন:
                  </p>
                  <p className="mt-1 flex flex-wrap items-center gap-4 text-xs font-medium sm:text-sm">
                    <a href={`tel:${CONTACT.phone.replace(/\s/g, '')}`} className="flex items-center gap-1.5 font-bold text-brand-700 hover:underline dark:text-brand-400">
                      <FaPhone className="h-3.5 w-3.5" />
                      {CONTACT.phone}
                    </a>
                    <a href={`https://wa.me/${CONTACT.whatsapp}`} target="_blank" rel="noreferrer" className="flex items-center gap-1.5 font-bold text-brand-700 hover:underline dark:text-brand-400">
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
            <div className="overflow-hidden rounded-2xl border border-stone-200 bg-white dark:border-stone-200 dark:bg-surface-dark-subtle">
              <div className="relative aspect-[4/3] w-full overflow-hidden bg-gradient-to-br from-brand-700 via-brand-800 to-brand-900">
                <img
                  src={course.thumbnailUrl || '/assets/carousel/posterd.jpeg'}
                  alt={course.title}
                  className="h-full w-full rounded-image object-cover"
                />
                <div className="absolute top-3 right-3 rounded-full bg-brand-600/90 px-3 py-1 text-xs font-bold text-white border border-stone-200 backdrop-blur-sm">
                  {course.category}
                </div>
              </div>

              {/* Action area below poster */}
              <div className="p-6">
                <div className="flex items-baseline justify-between">
                  <div>
                    <span className="text-xs text-stone-500 dark:text-brand-200">Total Course Fee</span>
                    <p className="text-2xl font-extrabold text-brand-700 dark:text-brand-400">
                      {formatBDT(hasDiscount ? course.discountPrice : course.price)}
                    </p>
                  </div>
                  {hasDiscount && (
                    <span className="text-sm text-stone-400 line-through dark:text-brand-200">
                      {formatBDT(course.price)}
                    </span>
                  )}
                </div>

                <div className="mt-5 space-y-3">
                  <Button
                    fullWidth
                    className="font-bold"
                    onClick={() => onEnroll(course)}
                  >
                    Enrol Now
                  </Button>

                  <Button
                    to={scheduleUrl}
                    variant="outline"
                    fullWidth
                  >
                    <FaCalendarCheck className="h-3.5 w-3.5 text-brand-600" />
                    View Class Schedule
                  </Button>
                </div>

                {/* Quick Spec List */}
                <dl className="mt-6 divide-y divide-stone-200 text-xs dark:divide-stone-200">
                  <div className="flex justify-between py-2.5">
                    <dt className="text-stone-500 dark:text-brand-200">Duration</dt>
                    <dd className="font-semibold text-stone-800 dark:text-brand-200">{course.duration}</dd>
                  </div>
                  <div className="flex justify-between py-2.5">
                    <dt className="text-stone-500 dark:text-brand-200">Total Lectures</dt>
                    <dd className="font-semibold text-stone-800 dark:text-brand-200">{course.lessonCount} sessions</dd>
                  </div>
                  <div className="flex justify-between py-2.5">
                    <dt className="text-stone-500 dark:text-brand-200">Enrolled Students</dt>
                    <dd className="font-semibold text-stone-800 dark:text-brand-200">{formatNumber(course.enrolledCount)}+</dd>
                  </div>
                  <div className="flex justify-between py-2.5">
                    <dt className="text-stone-500 dark:text-brand-200">Access Validity</dt>
                    <dd className="font-semibold text-stone-800 dark:text-brand-200">Until Exam Date</dd>
                  </div>
                  <div className="flex justify-between py-2.5">
                    <dt className="text-stone-500 dark:text-brand-200">Medium</dt>
                    <dd className="font-semibold text-stone-800 dark:text-brand-200">Online Live &amp; Recorded</dd>
                  </div>
                </dl>
              </div>
            </div>

            {/* ── Helpline Card ── */}
            <div className="rounded-2xl border border-stone-200 bg-white p-5 dark:border-stone-200 dark:bg-surface-dark-subtle">
              <h3 className="font-bold text-stone-900 dark:text-white">
                Need Admission Help?
              </h3>
              <p className="mt-1 text-xs text-stone-500 dark:text-brand-200">
                Call our admission counsellors directly:
              </p>
              <div className="mt-3 flex flex-col gap-3">
                <Button
                  href={`tel:${CONTACT.phone.replace(/\s/g, '')}`}
                  variant="secondary"
                >
                  <FaPhone className="h-3.5 w-3.5" />
                  {CONTACT.phone}
                </Button>
                <Button
                  href={`https://wa.me/${CONTACT.whatsapp}`}
                  target="_blank"
                  rel="noreferrer"
                  variant="accent"
                >
                  <FaWhatsapp className="h-4 w-4" />
                  WhatsApp Support
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
