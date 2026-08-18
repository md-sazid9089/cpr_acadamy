import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  FaArrowLeft,
  FaCheck,
  FaTriangleExclamation,
  FaClockRotateLeft,
  FaTableColumns,
} from 'react-icons/fa6';
import { useMyCourses } from './api/dashboard.queries.js';
import Button from '@/components/ui/Button.jsx';
import Spinner from '@/components/ui/Spinner.jsx';
import EmptyState from '@/components/ui/EmptyState.jsx';
import { CATEGORY_SLUGS } from '@/constants';

const TABS = [
  { id: 'active', label: 'Active Batches', icon: FaCheck, iconColor: 'text-emerald-300' },
  { id: 'unpaid', label: 'Unpaid Batches', icon: FaTriangleExclamation, iconColor: 'text-amber-500' },
  { id: 'previous', label: 'Previous Batches', icon: FaClockRotateLeft, iconColor: 'text-sky-500' },
];

export default function MyCourses() {
  const { data: courses = [], isLoading } = useMyCourses();
  const [activeTab, setActiveTab] = useState('active');
  const navigate = useNavigate();

  if (isLoading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <Spinner size="lg" label="Loading your courses…" />
      </div>
    );
  }

  // Filter courses by tab status
  const filteredCourses = courses.filter((course) => {
    if (activeTab === 'active') return course.status === 'active' || !course.status;
    if (activeTab === 'unpaid') return course.status === 'pending_payment';
    if (activeTab === 'previous') return course.status === 'expired';
    return true;
  });

  return (
    <div className="space-y-6">
      {/* ── Top Bar with Back, Centered Title & Dashboard Dropdown ── */}
      <div className="flex items-center justify-between gap-4">
        <button
          type="button"
          onClick={() => navigate('/dashboard')}
          className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2 text-xs font-bold text-slate-700 shadow-sm transition hover:bg-slate-50 sm:text-sm dark:border-slate-700 dark:bg-surface-dark-subtle dark:text-slate-200 dark:hover:bg-slate-800"
        >
          <FaArrowLeft className="h-3 w-3" />
          Back
        </button>

        <h1 className="text-xl font-bold tracking-tight text-[#1c3d5a] sm:text-2xl lg:text-3xl dark:text-white">
          My Courses
        </h1>

        <Link
          to="/dashboard"
          className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2 text-xs font-bold text-slate-700 shadow-sm transition hover:bg-slate-50 sm:text-sm dark:border-slate-700 dark:bg-surface-dark-subtle dark:text-slate-200 dark:hover:bg-slate-800"
        >
          <FaTableColumns className="h-3.5 w-3.5 text-blue-600" />
          Dashboard
        </Link>
      </div>

      {/* ── 3 Batch Status Tabs (Pill Bar) ── */}
      <div className="overflow-hidden rounded-xl border border-sky-200 bg-gradient-to-r from-sky-100/70 via-blue-50 to-indigo-50/60 p-1.5 shadow-sm dark:border-slate-700 dark:from-slate-900 dark:to-slate-800">
        <div className="grid grid-cols-3 gap-1.5">
          {TABS.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center justify-center gap-2 rounded-lg py-2.5 px-3 text-xs font-bold transition-all sm:text-sm ${
                  isActive
                    ? 'bg-[#1c4d96] text-white shadow-md'
                    : 'bg-white/80 text-slate-700 hover:bg-white dark:bg-slate-800/80 dark:text-slate-200 dark:hover:bg-slate-800'
                }`}
              >
                <Icon className={`h-3.5 w-3.5 shrink-0 ${isActive ? 'text-white' : tab.iconColor}`} />
                <span className="truncate">{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Main Section Container with Blue Header Bar ── */}
      <div className="overflow-hidden rounded-2xl border border-blue-400 bg-[#f4fbf8] shadow-sm dark:border-slate-700 dark:bg-surface-dark-subtle">
        {/* Blue Title Header Strip */}
        <div className="bg-[#1c4d96] px-6 py-3 text-sm font-bold text-white sm:text-base">
          {TABS.find((t) => t.id === activeTab)?.label}
        </div>

        <div className="p-6">
          {filteredCourses.length === 0 ? (
            <EmptyState
              title={`No ${TABS.find((t) => t.id === activeTab)?.label.toLowerCase()} found`}
              description="Browse our active batches and enroll to start learning."
              action={<Button to="/batches">Browse Batches</Button>}
            />
          ) : (
            <div className="grid gap-6 lg:grid-cols-2">
              {filteredCourses.map((course) => {
                const categorySlug = CATEGORY_SLUGS[course.category] || 'fcps';
                const scheduleUrl = `/courses/${categorySlug}/${course.slug}/schedule`;
                const progressValue = course.progress ?? 0;

                return (
                  <div
                    key={course.id}
                    className="flex flex-col justify-between rounded-2xl border-2 border-blue-300 bg-white p-6 shadow-sm transition-all hover:border-blue-500 hover:shadow-md dark:border-slate-700 dark:bg-slate-900/60"
                  >
                    <div>
                      {/* Course / Batch Title */}
                      <h2 className="text-center text-base font-bold text-[#1c4d96] sm:text-lg dark:text-blue-300">
                        {course.title}
                      </h2>

                      {/* Discipline & Reg No Badge Box */}
                      <div className="my-4 flex flex-wrap items-center justify-center gap-x-4 gap-y-1 rounded-xl bg-emerald-50/80 px-4 py-2 text-xs font-semibold text-slate-700 border border-emerald-200/60 dark:bg-emerald-950/30 dark:border-emerald-900/40 dark:text-slate-300">
                        <span>
                          Discipline: <strong className="text-emerald-700 dark:text-emerald-400">{course.category || 'Medicine & Allied'}</strong>
                        </span>
                        <span>•</span>
                        <span>
                          Reg No: <strong className="text-emerald-700 dark:text-emerald-400">2607{course.id.replace(/\D/g, '') || '6732'}</strong>
                        </span>
                      </div>

                      {/* Progress Bar */}
                      <div className="mt-4 space-y-1.5">
                        <div className="flex items-center justify-between text-xs font-bold text-slate-700 dark:text-slate-300">
                          <span>Progress</span>
                          <span>{progressValue}%</span>
                        </div>
                        <div className="h-2 w-full overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700">
                          <div
                            className="h-full rounded-full bg-gradient-to-r from-blue-500 to-indigo-600 transition-all duration-500"
                            style={{ width: `${progressValue}%` }}
                          />
                        </div>
                      </div>

                      {/* Notice / Validity text */}
                      <p className="mt-3 text-center text-[11px] font-semibold leading-relaxed text-rose-600 dark:text-rose-400">
                        Your batch will remain active till "{course.category || 'FCPS P-I'}, December'26 final exam
                        (Expected 3rd December'26. Date will be reviewed &amp; adjusted after exam circular)"
                      </p>
                    </div>

                    {/* 4 Action Buttons in 2x2 Grid */}
                    <div className="mt-6 grid grid-cols-2 gap-3">
                      <Link
                        to={scheduleUrl}
                        className="flex items-center justify-center rounded-xl bg-[#eef3fc] px-3 py-2.5 text-center text-xs font-bold text-[#1c4d96] shadow-sm transition hover:bg-[#dfeaf9] dark:bg-slate-800 dark:text-blue-300 dark:hover:bg-slate-700"
                      >
                        View Schedule
                      </Link>

                      <Link
                        to={`/dashboard/learn/${course.slug}`}
                        className="flex items-center justify-center rounded-xl bg-[#eef3fc] px-3 py-2.5 text-center text-xs font-bold text-[#1c4d96] shadow-sm transition hover:bg-[#dfeaf9] dark:bg-slate-800 dark:text-blue-300 dark:hover:bg-slate-700"
                      >
                        Confusing Questions
                      </Link>

                      <Link
                        to="/dashboard/exams"
                        className="flex items-center justify-center rounded-xl bg-[#eef3fc] px-3 py-2.5 text-center text-xs font-bold text-[#1c4d96] shadow-sm transition hover:bg-[#dfeaf9] dark:bg-slate-800 dark:text-blue-300 dark:hover:bg-slate-700"
                      >
                        My Exam Performance
                      </Link>

                      <Link
                        to={`/dashboard/checkout/${course.slug}`}
                        className="flex items-center justify-center rounded-xl bg-[#eef3fc] px-3 py-2.5 text-center text-xs font-bold text-[#1c4d96] shadow-sm transition hover:bg-[#dfeaf9] dark:bg-slate-800 dark:text-blue-300 dark:hover:bg-slate-700"
                      >
                        Pay Course Fee
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
