import { useMemo, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { FaCircleCheck, FaMobileScreen } from 'react-icons/fa6';
import { initiatePayment } from './api/payments.api.js';
import { fetchCourseBySlug } from '@/features/courses/api/courses.api.js';
import { useSubscriptionPlans, useMyCourses } from '@/features/student-dashboard/api/dashboard.queries.js';
import Card, { CardBody, CardHeader } from '@/components/ui/Card.jsx';
import Button from '@/components/ui/Button.jsx';
import ContentSkeleton from '@/components/ui/Skeleton.jsx';
import EmptyState from '@/components/ui/EmptyState.jsx';
import { CONTACT, PAYMENT_METHODS } from '@/constants';
import { cn, formatBDT } from '@/lib/utils';

/** Online gateways are not connected yet; everything settles as a manual payment. */
const ONLINE_METHODS = new Set(['bkash', 'nagad', 'rocket', 'card']);

/**
 * Enrolment checkout at /dashboard/checkout/:slug. With `?batchId=&planId=`
 * it buys a subscription package for an existing enrolment instead.
 *
 * Creating the invoice is idempotent per visit: the same key is sent on every
 * retry so a double-click can never create two invoices.
 */
export default function Checkout() {
  const { slug } = useParams();
  const [searchParams] = useSearchParams();
  const planId = searchParams.get('planId') ?? undefined;
  const batchId = searchParams.get('batchId') ?? undefined;
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [method, setMethod] = useState('manual');
  const idempotencyKey = useMemo(() => crypto.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(16).slice(2)}`, []);

  const { data: course, isLoading, isError } = useQuery({
    queryKey: ['courses', 'detail', slug],
    queryFn: () => fetchCourseBySlug(slug),
    enabled: Boolean(slug),
  });
  const plansQuery = useSubscriptionPlans(planId ? batchId : undefined);
  const plan = planId ? plansQuery.data?.find((item) => item.id === planId) : null;
  const enrollmentsQuery = useMyCourses();
  const activeEnrollment = !planId && enrollmentsQuery.data?.find((item) => item.slug === slug && item.status === 'active');

  const payMutation = useMutation({
    mutationFn: initiatePayment,
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      if (result.redirectUrl) window.location.assign(result.redirectUrl);
      else navigate(`/dashboard/invoices/${result.id}`, { replace: true });
    },
  });

  if (isLoading || (planId && plansQuery.isLoading) || (!planId && enrollmentsQuery.isLoading)) {
    return (
      <ContentSkeleton variant="form" label="Loading checkout" />
    );
  }

  if (activeEnrollment) {
    return (
      <EmptyState
        title="You're already enrolled"
        description={`Your access to ${course?.title ?? 'this batch'} is active. Open the batch to continue, or add a subscription package from My Courses.`}
        action={<Button to={`/dashboard/course/${slug}`}>Open batch</Button>}
      />
    );
  }

  if (isError || !course || (planId && !plan)) {
    return (
      <EmptyState
        title="Nothing to pay for"
        description="This course or package is no longer available."
        action={<Button to="/dashboard/courses">My courses</Button>}
      />
    );
  }

  const amount = plan ? plan.amount : course.discountPrice ?? course.price;
  const savings = !plan && course.discountPrice ? course.price - course.discountPrice : 0;

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      <div className="space-y-6 lg:col-span-2">
        <Card>
          <CardHeader title="Payment method" description="Choose how you'd like to pay." />
          <CardBody className="grid gap-3 sm:grid-cols-2">
            {[{ id: 'manual', label: 'Send money & confirm with the academy' }, ...PAYMENT_METHODS.filter((option) => ONLINE_METHODS.has(option.id))].map((option) => {
              const disabled = ONLINE_METHODS.has(option.id);
              return (
                <button
                  key={option.id}
                  type="button"
                  disabled={disabled}
                  onClick={() => setMethod(option.id)}
                  className={cn(
                    'flex items-center justify-between rounded-xl border p-4 text-left transition-colors',
                    disabled && 'cursor-not-allowed opacity-60',
                    method === option.id
                      ? 'border-stone-200 bg-brand-50 dark:border-stone-200 dark:bg-brand-950/40'
                      : 'border-stone-200 hover:border-stone-200 dark:border-stone-200',
                  )}
                >
                  <span>
                    <span className="block text-sm font-semibold text-stone-800 dark:text-brand-200">{option.label}</span>
                    {disabled && <span className="block text-xs text-stone-500 dark:text-brand-200">Online payment coming soon</span>}
                  </span>
                  <span
                    className={cn(
                      'h-4 w-4 shrink-0 rounded-full border',
                      method === option.id ? 'border-stone-200 bg-brand-600' : 'border-stone-200 dark:border-stone-200',
                    )}
                  />
                </button>
              );
            })}
          </CardBody>
        </Card>

        <Card>
          <CardHeader title="How it works" description="Three steps — your access opens as soon as the academy confirms the transfer." />
          <CardBody>
            <ol className="space-y-3 text-sm text-stone-700 dark:text-brand-200">
              <li className="flex gap-3">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-brand-600 text-xs font-bold text-white">1</span>
                <span>
                  Click <strong>Create invoice</strong> below. You get an invoice number and the exact amount.
                </span>
              </li>
              <li className="flex gap-3">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-brand-600 text-xs font-bold text-white">2</span>
                <span>
                  Send <strong>{formatBDT(amount)}</strong> by bKash / Nagad / Rocket send-money or bank transfer to the academy
                  ({CONTACT.phone}) with the invoice number as the reference.
                </span>
              </li>
              <li className="flex gap-3">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-brand-600 text-xs font-bold text-white">3</span>
                <span>
                  Share the transaction ID on WhatsApp ({CONTACT.whatsapp}). An administrator matches it to your invoice and
                  your enrolment activates immediately.
                </span>
              </li>
            </ol>
            <p className="mt-4 flex items-start gap-2 rounded-lg bg-surface-subtle p-3 text-xs text-stone-500 dark:bg-surface-dark dark:text-brand-200">
              <FaMobileScreen aria-hidden="true" className="mt-0.5 h-3.5 w-3.5 shrink-0" />
              Invoices stay open until the academy confirms or rejects them; you can find them any time under Payment History.
            </p>
          </CardBody>
        </Card>
      </div>

      <aside>
        <Card className="sticky top-24 p-6">
          <h2 className="text-sm font-semibold text-stone-900 dark:text-white">Order summary</h2>

          <p className="mt-3 text-sm text-stone-600 dark:text-brand-200">{course.title}</p>
          {plan ? (
            <p className="text-xs text-stone-500 dark:text-brand-200">
              {plan.name} · {plan.durationLabel}
            </p>
          ) : (
            <p className="text-xs text-stone-500 dark:text-brand-200">
              {[course.duration, course.lessonCount ? `${course.lessonCount} lectures` : null].filter(Boolean).join(' · ')}
            </p>
          )}

          <dl className="mt-5 space-y-2 border-t border-stone-200 pt-4 text-sm dark:border-stone-200">
            <div className="flex justify-between">
              <dt className="text-stone-500 dark:text-brand-200">{plan ? 'Package fee' : 'Course fee'}</dt>
              <dd className="text-stone-800 dark:text-brand-200">{formatBDT(plan ? plan.amount : course.price)}</dd>
            </div>
            {savings > 0 && (
              <div className="flex justify-between">
                <dt className="text-stone-500 dark:text-brand-200">Discount</dt>
                <dd className="text-brand-600 dark:text-brand-400">−{formatBDT(savings)}</dd>
              </div>
            )}
            <div className="flex justify-between border-t border-stone-200 pt-2 text-base font-bold dark:border-stone-200">
              <dt className="text-stone-900 dark:text-white">Total</dt>
              <dd className="text-brand-700 dark:text-brand-400">{formatBDT(amount)}</dd>
            </div>
          </dl>

          {payMutation.isError && (
            <p role="alert" className="mt-4 rounded-lg bg-red-50 p-3 text-xs text-red-700 dark:bg-red-950/40 dark:text-red-300">
              {payMutation.error.message}
            </p>
          )}

          <Button
            fullWidth
            className="mt-5"
            isLoading={payMutation.isPending}
            onClick={() => payMutation.mutate({ courseSlug: course.slug, method, planId, idempotencyKey })}
          >
            <FaCircleCheck aria-hidden="true" className="h-4 w-4" />
            Create invoice for {formatBDT(amount)}
          </Button>

          <p className="mt-3 text-center text-xs text-stone-500 dark:text-brand-200">
            The amount is fixed by the academy — the invoice always shows the current fee.
          </p>
        </Card>
      </aside>
    </div>
  );
}
