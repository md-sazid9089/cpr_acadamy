import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { FaPrint, FaArrowLeftLong } from 'react-icons/fa6';
import { useCourse } from './api/courses.queries.js';
import { useEnrollAction } from './hooks/useEnrollAction.js';
import Button from '@/components/ui/Button.jsx';
import Spinner from '@/components/ui/Spinner.jsx';
import { CONTACT, CATEGORY_SLUGS } from '@/constants';

const ROUTINE_DATA = [
  {
    id: 1,
    dateTime: '20 Jun 2026, Saturday\n02:30 PM',
    exam: 'NO EXAM',
    solveClass: 'NO CLASS',
    lecture: 'Orientation Program',
  },
  {
    id: 2,
    dateTime: '20 Jun 2026, Saturday\n02:30 PM',
    exam: 'NO EXAM',
    solveClass: 'NO CLASS',
    lecture: "Renal System Live class Dec'26",
  },
  {
    id: 3,
    dateTime: '27 Jun 2026, Saturday\n02:30 PM',
    exam: 'Renal System (Regular Exam)',
    solveClass: 'Renal System (Regular Solve Class)',
    lecture: "Body fluid, Electrolytes, Acid Base Balance Live class Dec'26",
  },
  {
    id: 4,
    dateTime: '02 Jul 2026, Thursday\n04:00 PM',
    exam: 'NO EXAM',
    solveClass: 'NO CLASS',
    lecture: "Principle of Surgery-I: [Chapter 1-5] (Bailey & Love's Regular Online Live Lecture)",
  },
  {
    id: 5,
    dateTime: '04 Jul 2026, Saturday\n02:30 PM',
    exam: 'Body Fluid, Electrolytes, Acid Base Balance (Regular Exam)',
    solveClass: 'Body Fluid, Electrolytes, Acid Base Balance (Regular Solve Class)',
    lecture: "Respiratory & General Physiology Live class Dec'26",
  },
  {
    id: 6,
    dateTime: '07 Jul 2026, Tuesday\n02:30 PM',
    exam: 'NO EXAM',
    solveClass: 'NO CLASS',
    lecture: "Cell Injury & Adaptation Live class Dec'26 (2)",
  },
  {
    id: 7,
    dateTime: '11 Jul 2026, Saturday\n02:30 PM',
    exam: 'Respiratory & General Physiology (Regular Exam)',
    solveClass: 'Respiratory & General Physiology (Regular Solve Class)',
    lecture: "Cardiovascular System & Shock Live class Dec'26",
  },
  {
    id: 8,
    dateTime: '18 Jul 2026, Saturday\n02:30 PM',
    exam: 'Cardiovascular System (Regular Exam)',
    solveClass: 'Cardiovascular System (Regular Solve Class)',
    lecture: "Gastrointestinal System & Nutrition Live class Dec'26",
  },
  {
    id: 9,
    dateTime: '31 Oct 2026, Saturday\n02:30 PM',
    exam: "Review Exam: Biostatistics & Pharmacology Dec'26",
    solveClass: "Review Exam: Biostatistics & Pharmacology Solve Class Dec'26",
    lecture: 'NO CLASS',
  },
  {
    id: 10,
    dateTime: '14 Nov 2026, Saturday\n11:00 AM',
    exam: "Pre Mock-1 (Anatomy) Surgery & Allied December'26",
    solveClass: "Pre Mock-1 Solve Class Dec'26",
    lecture: 'NO CLASS',
  },
  {
    id: 11,
    dateTime: '16 Nov 2026, Monday\n11:00 AM',
    exam: "Pre Mock-2 (Physiology, Biochemistry, Biostatistics, Pharmacology) Surgery & Allied December'26",
    solveClass: "Pre Mock-2 Solve Class Dec'26",
    lecture: 'NO CLASS',
  },
  {
    id: 12,
    dateTime: '18 Nov 2026, Wednesday\n11:00 AM',
    exam: "Pre Mock-3 (Pathology, Microbiology) Surgery & Allied December'26",
    solveClass: "Pre Mock-3 Solve Class Dec'26",
    lecture: 'NO CLASS',
  },
  {
    id: 13,
    dateTime: '21 Nov 2026, Saturday\n09:00 AM',
    exam: "Final Mock-1 (Surgery & Allied) December'26",
    solveClass: 'Mock-1 Paper-01 (Surgery & Allied) Solve Class Question MCQ (01-25) SBA (76-100)',
    lecture: 'NO CLASS',
  },
  {
    id: 14,
    dateTime: '25 Nov 2026, Wednesday\n09:00 AM',
    exam: "Final Mock-2 (Surgery & Allied) December'26",
    solveClass: 'Mock-2 Paper-01 (Surgery & Allied) Solve Class Question MCQ (01-25) SBA (76-100)',
    lecture: 'NO CLASS',
  },
];

export default function CourseSchedule() {
  const { slug, category } = useParams();
  const targetSlug = slug || 'fcps-part-1-medicine-january-batch';
  const { data: course, isLoading } = useCourse(targetSlug);
  const onEnroll = useEnrollAction();

  if (isLoading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center bg-white dark:bg-surface-dark">
        <Spinner size="lg" label="Loading schedule…" />
      </div>
    );
  }

  const courseData = course || {
    id: 'c-default',
    title: "Online P-1 Surgery Live Batch-3 Dec'2026",
    category: category ? category.toUpperCase() : 'FCPS Part-1',
    session: "Dec'26 P-1 Candidate",
    slug: targetSlug,
  };

  const categorySlug = CATEGORY_SLUGS[courseData.category] || 'fcps';
  const detailUrl = `/courses/${categorySlug}/${courseData.slug}`;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="min-h-screen bg-[#edf6f9] py-8 dark:bg-surface-dark/95 print:bg-white print:py-0">
      <div className="container-page max-w-6xl">
        {/* ── Breadcrumb ── */}
        <div className="mb-4 flex items-center justify-between text-xs font-medium text-slate-500 print:hidden dark:text-slate-400">
          <div className="flex items-center gap-2">
            <Link to="/" className="hover:text-blue-600 dark:hover:text-blue-400">Home</Link>
            <span>/</span>
            <Link to="/batches" className="hover:text-blue-600 dark:hover:text-blue-400">Batches</Link>
            <span>/</span>
            <Link to={detailUrl} className="hover:text-blue-600 dark:hover:text-blue-400">{courseData.title}</Link>
            <span>/</span>
            <span className="font-semibold text-blue-700 dark:text-blue-400">Schedule</span>
          </div>

          <Link
            to={detailUrl}
            className="inline-flex items-center gap-1.5 font-semibold text-blue-600 hover:underline dark:text-blue-400"
          >
            <FaArrowLeftLong className="h-3 w-3" />
            Back to Course Details
          </Link>
        </div>

        {/* ── Top Action Header Row ── */}
        <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
          <h1 className="text-2xl font-bold tracking-tight text-[#1c3d5a] sm:text-3xl dark:text-white">
            Batch Schedule
          </h1>

          <div className="flex items-center gap-3 print:hidden">
            <button
              type="button"
              onClick={handlePrint}
              className="inline-flex items-center gap-2 rounded-lg border border-blue-400 bg-white px-4 py-2 text-sm font-semibold text-blue-700 shadow-sm transition-colors hover:bg-blue-50 dark:border-slate-700 dark:bg-surface-dark-subtle dark:text-blue-300 dark:hover:bg-slate-800"
            >
              <FaPrint className="h-4 w-4" />
              Print
            </button>

            <Button
              size="md"
              className="bg-[#1d63d3] px-6 font-bold hover:bg-blue-700"
              onClick={() => onEnroll(courseData)}
            >
              Enroll
            </Button>
          </div>
        </div>

        {/* ── Batch Info Box ── */}
        <div className="mb-6 overflow-hidden rounded-xl border border-blue-400 bg-white shadow-sm dark:border-slate-700 dark:bg-surface-dark-subtle">
          {/* Blue title bar */}
          <div className="bg-[#1c4d96] px-5 py-3 text-sm font-bold text-white sm:text-base">
            {courseData.title}
          </div>

          {/* Details */}
          <div className="space-y-1.5 bg-[#f6fbf9] p-5 text-sm text-slate-800 dark:bg-slate-900/60 dark:text-slate-200">
            <p>
              <strong className="font-bold text-slate-900 dark:text-white">Year:</strong> 2026
            </p>
            <p>
              <strong className="font-bold text-slate-900 dark:text-white">Course:</strong> {courseData.category === 'FCPS' ? 'FCPS Part-1' : courseData.category}
            </p>
            <p>
              <strong className="font-bold text-slate-900 dark:text-white">Session:</strong> {courseData.session || "Dec'26 P-1 Candidate"}
            </p>
          </div>
        </div>

        {/* ── Routine Table ── */}
        <div className="overflow-hidden rounded-xl border-2 border-blue-500 bg-white shadow-sm dark:border-blue-600 dark:bg-surface-dark-subtle">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead className="bg-[#1c4d96] text-white">
                <tr className="divide-x divide-blue-400/50">
                  <th className="w-1/4 py-3 px-4 text-center font-bold">Date &amp; Time</th>
                  <th className="w-1/4 py-3 px-4 text-center font-bold">Exam</th>
                  <th className="w-1/4 py-3 px-4 text-center font-bold">Solve Class</th>
                  <th className="w-1/4 py-3 px-4 text-center font-bold">Lecture</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-blue-200 text-slate-800 dark:divide-slate-800 dark:text-slate-200">
                {ROUTINE_DATA.map((row) => (
                  <tr
                    key={row.id}
                    className="divide-x divide-blue-200 transition-colors hover:bg-sky-50/50 dark:divide-slate-800 dark:hover:bg-slate-900/40"
                  >
                    {/* Date & Time */}
                    <td className="whitespace-pre-line py-3 px-4 text-xs font-semibold sm:text-sm text-slate-800 dark:text-slate-200">
                      {row.dateTime}
                    </td>

                    {/* Exam */}
                    <td className="py-3 px-4 text-center text-xs sm:text-sm font-medium">
                      {row.exam === 'NO EXAM' ? (
                        <span className="font-semibold text-slate-700 dark:text-slate-300">
                          NO EXAM
                        </span>
                      ) : (
                        <span className="text-blue-900 font-semibold dark:text-blue-300">
                          {row.exam}
                        </span>
                      )}
                    </td>

                    {/* Solve Class */}
                    <td className="py-3 px-4 text-center text-xs sm:text-sm font-medium">
                      {row.solveClass === 'NO CLASS' ? (
                        <span className="font-semibold text-slate-700 dark:text-slate-300">
                          NO CLASS
                        </span>
                      ) : (
                        <span className="text-emerald-900 font-semibold dark:text-emerald-300">
                          {row.solveClass}
                        </span>
                      )}
                    </td>

                    {/* Lecture */}
                    <td className="py-3 px-4 text-xs sm:text-sm font-medium">
                      {row.lecture === 'NO CLASS' ? (
                        <span className="block text-center font-semibold text-slate-700 dark:text-slate-300">
                          NO CLASS
                        </span>
                      ) : (
                        <span className="text-slate-900 font-semibold dark:text-white">
                          {row.lecture}
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Bottom Banner */}
          <div className="border-t border-blue-400 bg-white py-3 text-center text-sm font-bold text-slate-900 dark:border-slate-800 dark:bg-surface-dark-subtle dark:text-white">
            To Be Continued...
          </div>
        </div>

        {/* ── N.B. Note ── */}
        <p className="mt-3 text-xs font-semibold text-slate-700 dark:text-slate-300">
          N.B: Schedule can be changed in any emergency/unavoidable reason.
        </p>

        {/* ── Footer Contact Box ── */}
        <div className="mt-6 rounded-xl border border-blue-400 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-surface-dark-subtle">
          <p className="text-sm font-bold text-slate-900 dark:text-white">
            Address: <span className="font-normal text-slate-700 dark:text-slate-300">{CONTACT.address}</span>
          </p>
          <p className="mt-2 text-sm font-bold text-slate-900 dark:text-white">
            Contact: <span className="font-normal text-slate-700 dark:text-slate-300">{CONTACT.phone}</span>
          </p>
          <p className="mt-2 text-sm font-bold text-slate-900 dark:text-white">
            For Result Please Visit:{' '}
            <a href="https://cprmedicalacademy.com" target="_blank" rel="noreferrer" className="text-blue-700 hover:underline dark:text-blue-400">
              www.cprmedicalacademy.com
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
