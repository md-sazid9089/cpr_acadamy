import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useMutation, useQuery } from '@tanstack/react-query';
import { initiatePayment } from './api/payments.api.js';
import { fetchCourseBySlug } from '@/features/courses/api/courses.api.js';
import Card, { CardBody, CardHeader } from '@/components/ui/Card.jsx';
import Button from '@/components/ui/Button.jsx';
import Input from '@/components/ui/Input.jsx';
import Spinner from '@/components/ui/Spinner.jsx';
import { PAYMENT_METHODS } from '@/constants';
import { cn, formatBDT } from '@/lib/utils';

/** Enrolment checkout at /dashboard/checkout/:slug. */
export default function Checkout() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const [method, setMethod] = useState('bkash');
  const [coupon, setCoupon] = useState('');

  const { data: course, isLoading } = useQuery({
    queryKey: ['courses', 'detail', slug],
    queryFn: () => fetchCourseBySlug(slug),
    enabled: Boolean(slug),
  });

  const payMutation = useMutation({
    mutationFn: initiatePayment,
    onSuccess: (result) => {
      // TODO: when the gateway returns a redirectUrl, send the browser there
      // instead — the success state must come from the verified callback.
      if (result.redirectUrl) window.location.assign(result.redirectUrl);
      else navigate('/dashboard/payments');
    },
  });

  if (isLoading || !course) {
    return (
      <div className="flex justify-center py-20">
        <Spinner size="lg" label="Loading checkout…" />
      </div>
    );
  }

  const amount = course.discountPrice ?? course.price;
  const savings = course.discountPrice ? course.price - course.discountPrice : 0;

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      <div className="space-y-6 lg:col-span-2">
        <Card>
          <CardHeader title="Payment method" description="Choose how you'd like to pay." />
          <CardBody className="grid gap-3 sm:grid-cols-2">
            {PAYMENT_METHODS.map((option) => (
              <button
                key={option.id}
                type="button"
                onClick={() => setMethod(option.id)}
                className={cn(
                  'flex items-center justify-between rounded-xl border p-4 text-left transition-colors',
                  method === option.id
                    ? 'border-brand-500 bg-brand-50 dark:border-brand-500 dark:bg-brand-950/40'
                    : 'border-slate-200 hover:border-brand-300 dark:border-slate-800',
                )}
              >
                <span className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                  {option.label}
                </span>
                <span
                  className={cn(
                    'h-4 w-4 rounded-full border-2',
                    method === option.id
                      ? 'border-brand-600 bg-brand-600'
                      : 'border-slate-300 dark:border-slate-600',
                  )}
                />
              </button>
            ))}
          </CardBody>
        </Card>

        <Card>
          <CardHeader title="Coupon" description="Have a referral or campaign code?" />
          <CardBody className="flex gap-3">
            <Input
              placeholder="Enter code"
              containerClassName="flex-1"
              value={coupon}
              onChange={(event) => setCoupon(event.target.value.toUpperCase())}
            />
            {/* TODO: POST /coupons/validate */}
            <Button variant="outline" disabled={!coupon}>
              Apply
            </Button>
          </CardBody>
        </Card>
      </div>

      <aside>
        <Card className="sticky top-24 p-6">
          <h2 className="text-sm font-semibold text-slate-900 dark:text-white">Order summary</h2>

          <p className="mt-3 text-sm text-slate-600 dark:text-slate-300">{course.title}</p>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            {course.duration} · {course.lessonCount} lessons
          </p>

          <dl className="mt-5 space-y-2 border-t border-slate-200 pt-4 text-sm dark:border-slate-800">
            <div className="flex justify-between">
              <dt className="text-slate-500 dark:text-slate-400">Course fee</dt>
              <dd className="text-slate-800 dark:text-slate-200">{formatBDT(course.price)}</dd>
            </div>
            {savings > 0 && (
              <div className="flex justify-between">
                <dt className="text-slate-500 dark:text-slate-400">Discount</dt>
                <dd className="text-emerald-600 dark:text-emerald-400">−{formatBDT(savings)}</dd>
              </div>
            )}
            <div className="flex justify-between border-t border-slate-200 pt-2 text-base font-bold dark:border-slate-800">
              <dt className="text-slate-900 dark:text-white">Total</dt>
              <dd className="text-brand-700 dark:text-brand-400">{formatBDT(amount)}</dd>
            </div>
          </dl>

          <Button
            fullWidth
            size="lg"
            className="mt-5"
            isLoading={payMutation.isPending}
            onClick={() => payMutation.mutate({ courseSlug: slug, method, amount })}
          >
            Pay {formatBDT(amount)}
          </Button>

          <p className="mt-3 text-center text-xs text-slate-500 dark:text-slate-400">
            Your enrolment activates as soon as the payment is confirmed.
          </p>
        </Card>
      </aside>
    </div>
  );
}
