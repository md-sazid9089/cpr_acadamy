import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { FaArrowRight } from 'react-icons/fa6';
import { fetchInvoice, initiatePayment } from './api/payments.api.js';
import PaymentFlow, { paymentPageTitle } from './PaymentFlow.jsx';
import { fetchCourseBySlug } from '@/features/courses/api/courses.api.js';
import { useSubscriptionPlans, useMyCourses } from '@/features/student-dashboard/api/dashboard.queries.js';
import Button from '@/components/ui/Button.jsx';
import ContentSkeleton from '@/components/ui/Skeleton.jsx';
import EmptyState from '@/components/ui/EmptyState.jsx';

const newKey = () => crypto.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(16).slice(2)}`;

/**
 * The student's payment page at /dashboard/checkout/:slug, or with `?batchId=&planId=` for a
 * subscription package on an enrolment they already hold.
 *
 * The invoice is opened in the background as soon as the page loads, so there is no separate
 * "create invoice" step: `/payments/initiate` is idempotent and hands back the open invoice when
 * one already exists, and the same key is reused on every retry so a double-click cannot create two.
 */
export default function Checkout() {
  const { slug } = useParams();
  const [searchParams] = useSearchParams();
  const planId = searchParams.get('planId') ?? undefined;
  const batchId = searchParams.get('batchId') ?? undefined;
  const queryClient = useQueryClient();

  const [paymentId, setPaymentId] = useState(null);
  const [idempotencyKey, setIdempotencyKey] = useState(newKey);
  const requested = useRef(false);

  const { data: course, isLoading, isError } = useQuery({
    queryKey: ['courses', 'detail', slug],
    queryFn: () => fetchCourseBySlug(slug),
    enabled: Boolean(slug),
  });
  const plansQuery = useSubscriptionPlans(planId ? batchId : undefined);
  const plan = planId ? plansQuery.data?.find((item) => item.id === planId) : null;
  const enrollmentsQuery = useMyCourses();
  const activeEnrollment = !planId && enrollmentsQuery.data?.find((item) => item.slug === slug && item.status === 'active');

  const openInvoice = useMutation({
    mutationFn: initiatePayment,
    onSuccess: (payment) => {
      setPaymentId(payment.id);
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });

  const blocked = isLoading || isError || !course || activeEnrollment || (planId && (plansQuery.isLoading || !plan));
  useEffect(() => {
    if (blocked || requested.current) return;
    requested.current = true;
    openInvoice.mutate({ courseSlug: slug, method: 'manual', planId, idempotencyKey });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [blocked]);

  const invoiceQuery = useQuery({
    queryKey: ['payments', 'invoice', paymentId],
    queryFn: () => fetchInvoice(paymentId),
    enabled: Boolean(paymentId),
    // Picks up the administrator's decision without the student refreshing.
    refetchInterval: (query) => (query.state.data?.status === 'pending' ? 15000 : false),
  });
  const invoice = invoiceQuery.data;

  /** A refused payment cannot be edited, so correcting it means opening a fresh invoice. */
  const restart = () => {
    const key = newKey();
    setIdempotencyKey(key);
    setPaymentId(null);
    openInvoice.mutate({ courseSlug: slug, method: 'manual', planId, idempotencyKey: key });
  };

  if (activeEnrollment) {
    return (
      <EmptyState
        title="You're already enrolled"
        description={`Your access to ${course?.title ?? 'this batch'} is active. Open the batch to continue, or add a subscription package from My Courses.`}
        action={<Button to={`/dashboard/course/${slug}`}>Open batch</Button>}
      />
    );
  }

  if (isError || (!isLoading && !course) || (planId && !plansQuery.isLoading && !plan)) {
    return (
      <EmptyState
        title="Nothing to pay for"
        description="This course or package is no longer available."
        action={<Button to="/dashboard/courses">My courses</Button>}
      />
    );
  }

  if (openInvoice.isError) {
    return (
      <EmptyState
        variant="error"
        title="Couldn't open the invoice"
        description={openInvoice.error?.message}
        action={<Button onClick={restart} isLoading={openInvoice.isPending}>Try again</Button>}
      />
    );
  }

  if (!invoice) return <ContentSkeleton variant="form" label="Loading checkout" />;

  const meta = plan
    ? [plan.name, plan.durationLabel].filter(Boolean).join(' · ')
    : [course?.duration, course?.lessonCount ? `${course.lessonCount} lectures` : null].filter(Boolean).join(' · ');

  return (
    <div className="space-y-4">
      <Link to={`/dashboard/course/${slug}`} lang="bn" className="inline-flex items-center gap-1.5 text-sm font-semibold text-brand-600 dark:text-brand-300">
        <FaArrowRight aria-hidden="true" className="h-3 w-3 rotate-180" />
        কোর্সে ফিরে যান
      </Link>
      <h1 lang="bn" className="font-heading text-2xl font-bold text-brand-800 dark:text-white">
        {paymentPageTitle(invoice.status, Boolean(invoice.proofSubmittedAt))}
      </h1>

      <PaymentFlow
        invoice={invoice}
        courseSlug={slug}
        courseMeta={{ category: course?.category, meta, listPrice: plan ? plan.amount : course?.price }}
        onUpdated={(updated) => {
          queryClient.setQueryData(['payments', 'invoice', paymentId], (current) => ({ ...current, ...updated }));
          queryClient.invalidateQueries({ queryKey: ['dashboard'] });
        }}
        onRestart={restart}
        isRestarting={openInvoice.isPending}
      />
    </div>
  );
}
