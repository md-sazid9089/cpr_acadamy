import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import { FaCheck, FaCircleCheck, FaCopy, FaPrint, FaRegCircleXmark, FaCamera, FaPen, FaWhatsapp, FaPlay } from 'react-icons/fa6';
import { submitPaymentProof, uploadPaymentScreenshot } from './api/payments.api.js';
import {
  WALLETS, walletById, paymentReference, cleanMobile, isValidMobile, cleanTransactionId, isValidTransactionId,
} from './wallets.js';
import Button from '@/components/ui/Button.jsx';
import FormError from '@/components/ui/FormError.jsx';
import { CONTACT } from '@/constants';
import { cn, formatBDT, formatDate } from '@/lib/utils';
import './payments.css';

/** Which wallet the student picked. The API stores every manual payment the same way, so it is kept per invoice in this browser. */
const walletKey = (invoiceId) => `cpr:pay-wallet:${invoiceId}`;
const readWallet = (invoiceId) => {
  try { return localStorage.getItem(walletKey(invoiceId)); } catch { return null; }
};
const rememberWallet = (invoiceId, wallet) => {
  try { localStorage.setItem(walletKey(invoiceId), wallet); } catch { /* private window: the choice simply is not remembered */ }
};

function CopyButton({ value, label }) {
  const [copied, setCopied] = useState(false);
  useEffect(() => {
    if (!copied) return undefined;
    const id = setTimeout(() => setCopied(false), 1600);
    return () => clearTimeout(id);
  }, [copied]);
  return (
    <button
      type="button"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(value);
          setCopied(true);
        } catch { /* older browsers refuse: the value stays on screen to copy by hand */ }
      }}
      aria-label={`${label} কপি করুন`}
      className={cn(
        'shrink-0 rounded-lg border px-2.5 py-1 text-xs font-semibold transition-colors',
        copied
          ? 'border-brand-500 bg-brand-50 text-brand-700 dark:bg-brand-950 dark:text-brand-300'
          : 'border-stone-200 bg-white text-brand-600 hover:bg-brand-50 dark:bg-surface-dark dark:text-brand-200',
      )}
    >
      {copied ? 'কপি হয়েছে ✓' : 'কপি'}
    </button>
  );
}

/** One numbered block of the payment form. */
function Step({ number, title, locked, done, children }) {
  return (
    <section
      aria-disabled={locked || undefined}
      className={cn(
        'rounded-card border border-stone-200 bg-white p-5 transition-opacity sm:p-6 dark:border-stone-200 dark:bg-surface-dark-subtle',
        locked && 'opacity-55',
      )}
    >
      <div className="mb-4 flex items-center gap-3">
        <span
          aria-hidden="true"
          className={cn(
            'flex h-9 w-9 shrink-0 items-center justify-center rounded-full font-heading text-base font-bold text-white',
            locked ? 'bg-stone-400' : done ? 'bg-brand-500' : 'bg-brand-800',
          )}
        >
          {done && !locked ? <FaCheck aria-hidden="true" className="h-4 w-4" /> : number}
        </span>
        <h2 lang="bn" className="font-heading text-lg font-bold text-brand-800 dark:text-white">{title}</h2>
      </div>
      {children}
    </section>
  );
}

/** জমা হয়েছে → যাচাই চলছে → কোর্স চালু */
function Tracker({ stage }) {
  const steps = ['জমা হয়েছে', 'যাচাই চলছে', 'কোর্স চালু'];
  return (
    <ol className="mx-auto mt-6 grid max-w-lg grid-cols-3" aria-label="অগ্রগতি">
      {steps.map((label, index) => {
        const done = index < stage;
        const now = index === stage;
        return (
          <li key={label} lang="bn" className="relative pt-10 text-center text-xs sm:text-sm">
            {index > 0 && (
              <span aria-hidden="true" className={cn('absolute left-[-50%] top-[11px] h-[3px] w-full', done || now ? 'bg-brand-500' : 'bg-stone-200')} />
            )}
            <span
              aria-hidden="true"
              className={cn(
                'absolute left-1/2 top-0 z-10 h-[22px] w-[22px] -translate-x-1/2 rounded-full border-[3px]',
                done ? 'border-brand-500 bg-brand-500' : now ? 'border-accent-500 bg-white motion-safe:animate-pulse' : 'border-stone-200 bg-white',
              )}
            />
            <span className={cn(done ? 'font-semibold text-brand-700 dark:text-brand-300' : now ? 'font-semibold text-accent-600 dark:text-accent-300' : 'text-stone-500 dark:text-brand-200')}>
              {label}
            </span>
          </li>
        );
      })}
    </ol>
  );
}

function DetailRows({ rows }) {
  return (
    <dl className="mx-auto mt-6 max-w-md rounded-image border border-stone-200 px-4 dark:border-stone-200">
      {rows.filter(([, value]) => value).map(([term, value], index) => (
        <div key={term} className={cn('flex justify-between gap-4 py-2.5 text-sm', index > 0 && 'border-t border-dashed border-stone-200 dark:border-stone-200')}>
          <dt lang="bn" className="text-stone-500 dark:text-brand-200">{term}</dt>
          <dd className="text-right font-semibold text-brand-800 dark:text-white">{value}</dd>
        </div>
      ))}
    </dl>
  );
}

/**
 * One page for a manual course payment: the summary, how to pay, the proof form, the review
 * status, and the receipt once an administrator confirms it. Which part shows depends only on
 * the invoice's own status, so the student can leave and come back at any point.
 */
export default function PaymentFlow({ invoice, courseSlug, courseMeta, onUpdated, onRestart, isRestarting }) {
  const reference = paymentReference(invoice.invoiceNo);
  const hasProof = Boolean(invoice.proofSubmittedAt);
  const [editing, setEditing] = useState(!hasProof);
  const [wallet, setWallet] = useState(() => readWallet(invoice.id));
  const [payerMobile, setPayerMobile] = useState(invoice.payerMobile ?? '');
  const [transactionId, setTransactionId] = useState(invoice.transactionId ?? '');
  const [screenshotUrl, setScreenshotUrl] = useState(invoice.screenshotUrl ?? '');
  const [touched, setTouched] = useState({});
  const [uploadError, setUploadError] = useState('');
  const [isUploading, setIsUploading] = useState(false);

  const submitMutation = useMutation({
    mutationFn: submitPaymentProof,
    onSuccess: (updated) => {
      setEditing(false);
      onUpdated(updated);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    },
  });

  const chosen = walletById(wallet);
  const mobile = cleanMobile(payerMobile);
  const trx = cleanTransactionId(transactionId);
  const mobileOk = isValidMobile(mobile);
  const trxOk = isValidTransactionId(trx);
  const ready = Boolean(chosen) && mobileOk && trxOk;

  const PROOF_FIELDS = ['transactionId', 'payerMobile', 'screenshotUrl'];
  const refusal = submitMutation.error;
  const fieldErrors = Object.fromEntries(Object.entries(refusal?.fieldErrors ?? {}).filter(([field]) => PROOF_FIELDS.includes(field)));
  const formMessage = refusal && (refusal.code !== 'VALIDATION_ERROR' || Object.keys(fieldErrors).length === 0) ? refusal.message : null;

  const pickWallet = (id) => {
    setWallet(id);
    rememberWallet(invoice.id, id);
  };

  const attachScreenshot = async (event) => {
    const [file] = event.target.files ?? [];
    if (!file) return;
    setUploadError('');
    setIsUploading(true);
    try {
      setScreenshotUrl(await uploadPaymentScreenshot(file));
    } catch (error) {
      setUploadError(error.message ?? 'স্ক্রিনশটটি আপলোড করা যায়নি।');
    } finally {
      setIsUploading(false);
      event.target.value = '';
    }
  };

  const paid = invoice.status === 'paid';
  const failed = invoice.status === 'failed';
  const summaryFee = invoice.lines.reduce((sum, line) => sum + line.unitPrice * line.quantity, 0);
  // The invoice is raised at the discounted price, so the saving comes from the course's own list price.
  const saving = invoice.discount > 0 ? invoice.discount : Math.max(0, (courseMeta?.listPrice ?? 0) - invoice.total);
  const courseTitle = invoice.lines[0]?.description ?? 'কোর্স';

  const field = 'block min-h-[48px] w-full rounded-control border bg-white px-3.5 py-2.5 text-[15px] text-brand-800 placeholder:text-stone-400 dark:bg-surface-dark dark:text-brand-200';

  return (
    <div className="mx-auto max-w-[680px] space-y-6">
      {/* ── Order summary ── */}
      <section className="payment-no-print overflow-hidden rounded-card border border-stone-200 bg-white dark:border-stone-200 dark:bg-surface-dark-subtle">
        <div className="flex min-h-[84px] flex-col justify-end bg-gradient-to-br from-brand-500 to-brand-800 px-5 py-4 text-white">
          {courseMeta?.category && <span className="text-xs opacity-85">{courseMeta.category}</span>}
          <h2 className="font-heading text-lg font-bold leading-snug">{courseTitle}</h2>
        </div>
        <div className="px-5 pb-5 pt-4">
          {courseMeta?.meta && <p className="mb-2.5 text-sm text-stone-500 dark:text-brand-200">{courseMeta.meta}</p>}
          <dl className="space-y-1 text-sm">
            {saving > 0 && (
              <>
                <div className="flex justify-between py-0.5">
                  <dt lang="bn" className="text-stone-600 dark:text-brand-200">কোর্স ফি</dt>
                  <dd className="tabular-nums text-stone-800 dark:text-brand-200">{formatBDT(invoice.total + saving)}</dd>
                </div>
                <div className="flex justify-between py-0.5">
                  <dt lang="bn" className="text-stone-600 dark:text-brand-200">বিশেষ ছাড়</dt>
                  <dd className="font-semibold tabular-nums text-accent-600 dark:text-accent-300">−{formatBDT(saving)}</dd>
                </div>
              </>
            )}
            <div className={cn('flex items-baseline justify-between', saving > 0 && 'mt-2 border-t border-stone-200 pt-2.5 dark:border-stone-200')}>
              <dt lang="bn" className="font-semibold text-brand-800 dark:text-white">মোট পরিশোধ</dt>
              <dd className="font-heading text-2xl font-bold tabular-nums text-brand-800 dark:text-white">{formatBDT(invoice.total)}</dd>
            </div>
          </dl>
          {reference && (
            <div className="mt-3 flex items-center justify-between gap-3 rounded-image bg-brand-50 px-3 py-2 text-sm dark:bg-brand-950/60">
              <span lang="bn" className="text-brand-800 dark:text-brand-200">আপনার রেফারেন্স</span>
              <span className="font-bold tabular-nums text-brand-800 dark:text-white">{reference}</span>
            </div>
          )}
        </div>
      </section>

      {/* ── Pending, nothing submitted yet (or the student is correcting it) ── */}
      {invoice.status === 'pending' && editing && (
        <form
          className="payment-no-print space-y-6"
          onSubmit={(event) => {
            event.preventDefault();
            if (!ready || isUploading) return;
            submitMutation.mutate({ id: invoice.id, transactionId: trx, payerMobile: mobile, screenshotUrl });
          }}
        >
          <Step number="১" title="যেভাবে পেমেন্ট করবেন">
            <ol className="space-y-2.5 text-sm text-stone-700 dark:text-brand-200" lang="bn">
              {[
                <>নিচে <strong>বিকাশ বা নগদ</strong> বেছে নিন। পাঠানোর নম্বর ও টাকার পরিমাণ দেখাবে।</>,
                <>আপনার অ্যাপ থেকে <strong className="tabular-nums">{formatBDT(invoice.total)}</strong> <strong>Send Money</strong> করুন। রেফারেন্সে লিখুন <strong className="tabular-nums">{reference}</strong>।</>,
                <>যে নম্বর থেকে পাঠিয়েছেন সেটি ও <strong>ট্রানজেকশন আইডি (TrxID)</strong> লিখে জমা দিন। যাচাইয়ের পর কোর্স চালু হবে।</>,
              ].map((line, index) => (
                <li key={index} className="flex items-start gap-2.5">
                  <span aria-hidden="true" className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-brand-50 text-xs font-bold text-brand-700 dark:bg-brand-950 dark:text-brand-300">
                    {['১', '২', '৩'][index]}
                  </span>
                  <span>{line}</span>
                </li>
              ))}
            </ol>
            <p lang="bn" className="mt-3.5 rounded-image bg-brand-50 px-3.5 py-2.5 text-sm leading-relaxed text-brand-900 dark:bg-brand-950/60 dark:text-brand-200">
              টাকা পাঠানোর পর অ্যাপে যে মেসেজ আসে, সেখানেই TrxID থাকে। স্ক্রিনশট রেখে দিন।
            </p>
          </Step>

          <Step number="২" title="পেমেন্ট মাধ্যম বেছে নিন" done={Boolean(chosen)}>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3" role="radiogroup" aria-label="পেমেন্ট মাধ্যম">
              {WALLETS.map((option) => (
                <label
                  key={option.id}
                  className={cn(
                    'relative flex cursor-pointer flex-col gap-0.5 rounded-image border-2 bg-white px-4 py-3.5 transition-colors dark:bg-surface-dark',
                    wallet === option.id ? option.selectedClass : 'border-stone-200 hover:border-brand-200',
                  )}
                >
                  <input
                    type="radio"
                    name="wallet"
                    value={option.id}
                    checked={wallet === option.id}
                    onChange={() => pickWallet(option.id)}
                    className="peer sr-only"
                  />
                  <span lang="bn" className={cn('font-heading text-xl font-bold leading-tight', option.nameClass)}>{option.name}</span>
                  <span className="text-xs text-stone-500 dark:text-brand-200">{option.sub}</span>
                  <span
                    aria-hidden="true"
                    className={cn(
                      'absolute right-2.5 top-2.5 flex h-5 w-5 items-center justify-center rounded-full border-2 text-white peer-focus-visible:ring-2 peer-focus-visible:ring-brand-500',
                      wallet === option.id ? `${option.dotClass} border-transparent` : 'border-stone-200',
                    )}
                  >
                    {wallet === option.id && <FaCheck aria-hidden="true" className="h-2.5 w-2.5" />}
                  </span>
                </label>
              ))}
              <div aria-disabled="true" className="flex cursor-not-allowed flex-col gap-0.5 rounded-image border-2 border-stone-200 bg-stone-50 px-4 py-3.5 dark:bg-surface-dark">
                <span lang="bn" className="font-heading text-xl font-bold leading-tight text-stone-400">কার্ড</span>
                <span lang="bn" className="text-xs text-stone-400">শীঘ্রই আসছে</span>
              </div>
            </div>

            {chosen && (
              <div className="mt-4 overflow-hidden rounded-image border border-stone-200 dark:border-stone-200">
                <p lang="bn" className={cn('px-4 py-2.5 text-sm font-semibold text-white', chosen.headClass)}>
                  {chosen.name}-এ পাঠানোর তথ্য
                </p>
                <div className="px-4">
                  {[
                    [`যে নম্বরে পাঠাবেন (${chosen.accountType})`, chosen.number, 'নম্বর'],
                    ['টাকার পরিমাণ', formatBDT(invoice.total), 'পরিমাণ'],
                    ['রেফারেন্স', reference, 'রেফারেন্স'],
                  ].map(([label, value, copyLabel], index) => (
                    <div key={label} className={cn('flex items-center justify-between gap-3 py-2.5', index > 0 && 'border-t border-dashed border-stone-200 dark:border-stone-200')}>
                      <span lang="bn" className="text-sm text-stone-500 dark:text-brand-200">{label}</span>
                      <span className="flex items-center gap-2.5">
                        <span className="font-heading text-lg font-bold tabular-nums text-brand-800 dark:text-white">{value}</span>
                        <CopyButton value={copyLabel === 'পরিমাণ' ? String(invoice.total) : String(value).replace(/[^\w-]/g, '')} label={copyLabel} />
                      </span>
                    </div>
                  ))}
                </div>
                <ol lang="bn" className="list-decimal space-y-0.5 border-t border-stone-200 bg-stone-50 py-3 pl-9 pr-4 text-sm text-stone-700 dark:border-stone-200 dark:bg-surface-dark dark:text-brand-200">
                  <li>{chosen.app} অ্যাপে <strong>Send Money</strong> চাপুন</li>
                  <li>উপরের নম্বরটি দিন</li>
                  <li>পরিমাণ <strong className="tabular-nums">{formatBDT(invoice.total)}</strong> লিখুন</li>
                  <li>রেফারেন্সে <strong className="tabular-nums">{reference}</strong> লিখুন</li>
                  <li>পিন দিয়ে কনফার্ম করুন, তারপর মেসেজ থেকে TrxID কপি করুন</li>
                </ol>
              </div>
            )}
          </Step>

          <Step number="৩" title="পেমেন্টের তথ্য দিন" locked={!chosen} done={ready}>
            <fieldset disabled={!chosen} className="grid gap-4 sm:grid-cols-2">
              <div>
                <label lang="bn" htmlFor="payer-mobile" className="mb-1.5 block text-sm font-semibold text-brand-800 dark:text-brand-200">
                  যে নম্বর থেকে পাঠিয়েছেন
                </label>
                <input
                  id="payer-mobile"
                  inputMode="numeric"
                  autoComplete="tel"
                  maxLength={16}
                  placeholder="01XXXXXXXXX"
                  value={payerMobile}
                  onChange={(event) => setPayerMobile(event.target.value)}
                  onBlur={() => setTouched((previous) => ({ ...previous, mobile: true }))}
                  aria-invalid={touched.mobile && mobile && !mobileOk ? 'true' : undefined}
                  className={cn(field, mobileOk ? 'border-brand-500' : touched.mobile && mobile ? 'border-red-500' : 'border-stone-200')}
                />
                <p lang="bn" className={cn('mt-1.5 text-xs', touched.mobile && mobile && !mobileOk ? 'text-red-600 dark:text-red-400' : 'text-stone-500 dark:text-brand-200')}>
                  {fieldErrors.payerMobile
                    || (mobileOk ? '✓ ঠিক আছে'
                      : touched.mobile && mobile ? 'সঠিক ১১ সংখ্যার নম্বর দিন (যেমন 01712345678)'
                        : '১১ সংখ্যার মোবাইল নম্বর')}
                </p>
              </div>
              <div>
                <label lang="bn" htmlFor="payer-trx" className="mb-1.5 block text-sm font-semibold text-brand-800 dark:text-brand-200">
                  ট্রানজেকশন আইডি (TrxID)
                </label>
                <input
                  id="payer-trx"
                  autoCapitalize="characters"
                  autoComplete="off"
                  spellCheck="false"
                  maxLength={20}
                  placeholder="যেমন 9KD7A2XQ1M"
                  value={transactionId}
                  onChange={(event) => setTransactionId(cleanTransactionId(event.target.value))}
                  onBlur={() => setTouched((previous) => ({ ...previous, trx: true }))}
                  aria-invalid={touched.trx && trx && !trxOk ? 'true' : undefined}
                  className={cn(field, 'tracking-wide', trxOk ? 'border-brand-500' : touched.trx && trx ? 'border-red-500' : 'border-stone-200')}
                />
                <p lang="bn" className={cn('mt-1.5 text-xs', touched.trx && trx && !trxOk ? 'text-red-600 dark:text-red-400' : 'text-stone-500 dark:text-brand-200')}>
                  {fieldErrors.transactionId
                    || (trxOk ? '✓ ঠিক আছে'
                      : touched.trx && trx ? 'TrxID সাধারণত ১০ অক্ষর ও সংখ্যার হয়'
                        : 'অ্যাপের মেসেজে পাবেন')}
                </p>
              </div>
            </fieldset>

            <div className="mt-4 flex flex-wrap items-center gap-3">
              <label
                className={cn(
                  'inline-flex cursor-pointer items-center gap-2 rounded-image border border-dashed border-stone-200 px-3 py-2 text-sm font-medium text-brand-800 hover:border-brand-500 hover:bg-brand-50 dark:text-brand-200 dark:hover:bg-brand-950/40',
                  (!chosen || isUploading) && 'pointer-events-none opacity-50',
                )}
              >
                <FaCamera aria-hidden="true" className="h-4 w-4" />
                <span lang="bn">{isUploading ? 'আপলোড হচ্ছে…' : screenshotUrl ? 'স্ক্রিনশট বদলান' : 'স্ক্রিনশট যোগ করুন'}</span>
                <input type="file" accept="image/jpeg,image/png,image/webp" className="sr-only" disabled={!chosen || isUploading} onChange={attachScreenshot} />
              </label>
              <span lang="bn" className="text-sm text-stone-500 dark:text-brand-200">
                {screenshotUrl ? '✓ যোগ হয়েছে' : 'ঐচ্ছিক, যাচাই দ্রুত হয়'}
              </span>
            </div>
            {(uploadError || fieldErrors.screenshotUrl) && (
              <p role="alert" className="mt-2 text-xs font-medium text-red-600 dark:text-red-400">{uploadError || fieldErrors.screenshotUrl}</p>
            )}
            {screenshotUrl && <img src={screenshotUrl} alt="পেমেন্ট স্ক্রিনশট" className="mt-3 max-h-44 rounded-image border border-stone-200" />}
          </Step>

          {formMessage && <FormError>{formMessage}</FormError>}

          <div className="text-center">
            <Button
              type="submit"
              size="lg"
              shape="pill"
              variant="accent"
              className="w-full sm:w-auto sm:min-w-[380px]"
              disabled={!ready || isUploading}
              isLoading={submitMutation.isPending}
            >
              <FaCircleCheck aria-hidden="true" className="h-5 w-5" />
              <span lang="bn">যাচাইয়ের জন্য জমা দিন</span>
            </Button>
            <p lang="bn" className="mt-2.5 text-sm text-stone-500 dark:text-brand-200">
              {!chosen ? 'পেমেন্ট মাধ্যম বেছে নিন ও তথ্য পূরণ করুন'
                : ready ? 'জমা দেওয়ার পর অ্যাডমিন আপনার পেমেন্ট যাচাই করবেন'
                  : 'নম্বর ও TrxID দিন'}
            </p>
            {hasProof && (
              <button type="button" lang="bn" onClick={() => setEditing(false)} className="mt-3 text-sm font-semibold text-brand-600 underline underline-offset-4 dark:text-brand-300">
                বাতিল করুন
              </button>
            )}
          </div>
        </form>
      )}

      {/* ── Submitted, waiting for an administrator ── */}
      {invoice.status === 'pending' && !editing && (
        <section className="payment-no-print rounded-card border border-stone-200 bg-white p-6 text-center dark:border-stone-200 dark:bg-surface-dark-subtle" aria-live="polite">
          <span aria-hidden="true" className="mx-auto mb-3 flex h-16 w-16 items-center justify-center rounded-full bg-brand-50 text-brand-700 dark:bg-brand-950 dark:text-brand-300">
            <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></svg>
          </span>
          <h2 lang="bn" className="font-heading text-xl font-bold text-brand-800 dark:text-white">পেমেন্ট যাচাই চলছে</h2>
          <p lang="bn" className="mx-auto mt-1.5 max-w-[46ch] text-sm text-stone-500 dark:text-brand-200">
            অ্যাডমিন আপনার পেমেন্ট মিলিয়ে দেখছেন। নিশ্চিত হলে কোর্স নিজে থেকেই চালু হয়ে যাবে। এই পেজ বন্ধ করলেও সমস্যা নেই।
          </p>

          <Tracker stage={1} />

          <DetailRows
            rows={[
              ['কোর্স', courseTitle],
              ['পরিমাণ', formatBDT(invoice.total)],
              ['মাধ্যম', chosen?.name ?? 'ম্যানুয়াল'],
              ['TrxID', invoice.transactionId],
              ['প্রেরক নম্বর', invoice.payerMobile],
              ['রেফারেন্স', reference],
            ]}
          />

          <div className="mt-5 flex flex-wrap justify-center gap-2.5">
            <a
              href={`https://wa.me/${CONTACT.whatsapp}`}
              target="_blank"
              rel="noopener noreferrer"
              lang="bn"
              className="inline-flex min-h-[44px] items-center gap-2 rounded-control border border-stone-200 bg-white px-4 text-sm font-semibold text-brand-800 hover:bg-brand-50 dark:bg-surface-dark dark:text-brand-200"
            >
              <FaWhatsapp aria-hidden="true" className="h-4 w-4" />
              WhatsApp-এ যোগাযোগ
            </a>
            <button
              type="button"
              lang="bn"
              onClick={() => setEditing(true)}
              className="inline-flex min-h-[44px] items-center gap-2 rounded-control border border-stone-200 bg-white px-4 text-sm font-semibold text-brand-800 hover:bg-brand-50 dark:bg-surface-dark dark:text-brand-200"
            >
              <FaPen aria-hidden="true" className="h-3.5 w-3.5" />
              তথ্য ঠিক করুন
            </button>
          </div>
        </section>
      )}

      {/* ── Rejected: the student starts a fresh invoice, since a refused one cannot be edited ── */}
      {failed && (
        <section className="payment-no-print rounded-card border border-red-200 bg-white p-6 text-center dark:border-red-900 dark:bg-surface-dark-subtle">
          <span aria-hidden="true" className="mx-auto mb-3 flex h-16 w-16 items-center justify-center rounded-full bg-red-50 text-red-700 dark:bg-red-950/40 dark:text-red-300">
            <FaRegCircleXmark aria-hidden="true" className="h-8 w-8" />
          </span>
          <h2 lang="bn" className="font-heading text-xl font-bold text-brand-800 dark:text-white">পেমেন্টটি গ্রহণ করা হয়নি</h2>
          <p lang="bn" className="mx-auto mt-1.5 max-w-[46ch] text-sm text-stone-500 dark:text-brand-200">
            অ্যাডমিন এই পেমেন্টের সঙ্গে কোনো লেনদেন মেলাতে পারেননি। কারণ জানতে বা আবার চেষ্টা করতে নিচের বোতামটি ব্যবহার করুন।
          </p>
          <DetailRows rows={[['TrxID', invoice.transactionId], ['প্রেরক নম্বর', invoice.payerMobile], ['রেফারেন্স', reference]]} />
          <div className="mt-5 flex flex-wrap justify-center gap-2.5">
            {onRestart && (
              <Button onClick={onRestart} isLoading={isRestarting}>
                <span lang="bn">আবার চেষ্টা করুন</span>
              </Button>
            )}
            <a
              href={`https://wa.me/${CONTACT.whatsapp}`}
              target="_blank"
              rel="noopener noreferrer"
              lang="bn"
              className="inline-flex min-h-[44px] items-center gap-2 rounded-control border border-stone-200 bg-white px-4 text-sm font-semibold text-brand-800 hover:bg-brand-50 dark:bg-surface-dark dark:text-brand-200"
            >
              <FaWhatsapp aria-hidden="true" className="h-4 w-4" />
              WhatsApp-এ যোগাযোগ
            </a>
          </div>
        </section>
      )}

      {/* ── Confirmed ── */}
      {paid && (
        <>
          <section className="payment-no-print rounded-card border border-stone-200 bg-white p-6 text-center dark:border-stone-200 dark:bg-surface-dark-subtle" aria-live="polite">
            <span aria-hidden="true" className="mx-auto mb-3 flex h-16 w-16 items-center justify-center rounded-full bg-brand-50 text-brand-600 dark:bg-brand-950 dark:text-brand-300">
              <FaCheck aria-hidden="true" className="h-8 w-8" />
            </span>
            <h2 lang="bn" className="font-heading text-xl font-bold text-brand-800 dark:text-white">অভিনন্দন! ভর্তি সম্পন্ন হয়েছে</h2>
            <p lang="bn" className="mx-auto mt-1.5 max-w-[46ch] text-sm text-stone-500 dark:text-brand-200">
              আপনার পেমেন্ট নিশ্চিত হয়েছে। এখনই কোর্স শুরু করতে পারেন, রসিদও নামিয়ে রাখুন।
            </p>
            <Tracker stage={3} />
            <div className="mt-5 flex flex-wrap justify-center gap-2.5">
              <Button to={courseSlug ? `/dashboard/course/${courseSlug}` : '/dashboard/courses'}>
                <FaPlay aria-hidden="true" className="h-3.5 w-3.5" />
                <span lang="bn">কোর্স শুরু করুন</span>
              </Button>
              <Button variant="outline" onClick={() => window.print()}>
                <FaPrint aria-hidden="true" className="h-4 w-4" />
                <span lang="bn">রসিদ ডাউনলোড</span>
              </Button>
            </div>
          </section>

          {/* The printed page: everything with payment-no-print is hidden, leaving only this. */}
          <section className="invoice-document rounded-card border border-stone-200 bg-white p-6 sm:p-8 dark:border-stone-200 dark:bg-surface-dark-subtle">
            <div className="mb-4 flex flex-wrap justify-between gap-4 border-b-2 border-brand-800 pb-3">
              <div className="flex min-w-0 items-start gap-3">
                <img src="/assets/spotlight/cpr-logo.png" alt="CPR Medical Academy logo" width="48" height="48" className="h-12 w-12 shrink-0 object-contain" />
                <div className="min-w-0">
                  <p className="font-heading text-lg font-bold text-brand-800 dark:text-white">CPR Medical Academy</p>
                  <p className="mt-0.5 max-w-xs text-xs text-stone-500 dark:text-brand-200">{CONTACT.address}</p>
                  <p className="break-all text-xs text-stone-500 dark:text-brand-200">{CONTACT.email}</p>
                </div>
              </div>
              <div className="text-right text-xs text-stone-500 dark:text-brand-200">
                <span
                  aria-hidden="true"
                  className="mb-1 inline-block rotate-[-8deg] rounded-lg border-[3px] border-brand-600 px-3 py-0.5 font-heading text-xl font-extrabold text-brand-600 opacity-80"
                >
                  PAID
                </span>
                <p lang="bn">রসিদ নং <strong className="text-brand-800 dark:text-white">{reference}</strong></p>
                <p className="mt-0.5 break-all">{invoice.invoiceNo}</p>
                <p className="mt-0.5">{formatDate(invoice.paidAt ?? invoice.issuedAt)}</p>
              </div>
            </div>

            <p className="mb-2 text-sm">
              <span lang="bn" className="text-stone-500 dark:text-brand-200">শিক্ষার্থী: </span>
              <strong className="text-brand-800 dark:text-white">{invoice.billedTo?.name}</strong>
              {invoice.billedTo?.mobile && <span className="text-stone-500 dark:text-brand-200"> · {invoice.billedTo.mobile}</span>}
              {invoice.billedTo?.institution && (
                <span className="block text-xs text-stone-500 dark:text-brand-200">Institution: {invoice.billedTo.institution}</span>
              )}
            </p>

            <table className="w-full text-sm">
              <tbody>
                {invoice.lines.map((line) => (
                  <tr key={line.id} className="border-b border-stone-200 dark:border-stone-200">
                    <td className="py-2 text-stone-700 dark:text-brand-200">{line.description}</td>
                    <td className="py-2 text-right tabular-nums text-stone-700 dark:text-brand-200">{formatBDT(line.unitPrice * line.quantity)}</td>
                  </tr>
                ))}
                {invoice.discount > 0 && (
                  <tr className="border-b border-stone-200 dark:border-stone-200">
                    <td lang="bn" className="py-2 text-stone-700 dark:text-brand-200">বিশেষ ছাড়</td>
                    <td className="py-2 text-right tabular-nums text-stone-700 dark:text-brand-200">−{formatBDT(invoice.discount)}</td>
                  </tr>
                )}
                <tr>
                  <td lang="bn" className="py-2 font-bold text-brand-800 dark:text-white">মোট পরিশোধিত</td>
                  <td className="py-2 text-right text-base font-bold tabular-nums text-brand-800 dark:text-white">{formatBDT(invoice.total)}</td>
                </tr>
              </tbody>
            </table>

            <div className="mt-3 grid grid-cols-2 gap-3 rounded-image bg-stone-50 px-3 py-2.5 text-sm sm:grid-cols-3 dark:bg-surface-dark">
              {[['মাধ্যম', chosen?.name ?? 'ম্যানুয়াল'], ['TrxID', invoice.transactionId], ['প্রেরক নম্বর', invoice.payerMobile]]
                .filter(([, value]) => value)
                .map(([label, value]) => (
                  <div key={label}>
                    <span lang="bn" className="block text-[11px] text-stone-500 dark:text-brand-200">{label}</span>
                    <strong className="break-all text-brand-800 dark:text-white">{value}</strong>
                  </div>
                ))}
            </div>

            <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
              <p lang="bn" className="text-xs text-stone-400">কম্পিউটারে তৈরি রসিদ, স্বাক্ষরের প্রয়োজন নেই।</p>
              <Button variant="outline" size="sm" className="payment-no-print" onClick={() => window.print()}>
                <FaPrint aria-hidden="true" className="h-3.5 w-3.5" />
                <span lang="bn">PDF ডাউনলোড</span>
              </Button>
            </div>
          </section>

          <p className="payment-no-print text-center text-sm">
            <Link to="/dashboard/payments" lang="bn" className="font-semibold text-brand-600 underline underline-offset-4 dark:text-brand-300">
              সব পেমেন্ট দেখুন
            </Link>
          </p>
        </>
      )}

      {invoice.status === 'refunded' && (
        <section className="payment-no-print rounded-card border border-stone-200 bg-white p-6 text-center dark:border-stone-200 dark:bg-surface-dark-subtle">
          <h2 lang="bn" className="font-heading text-lg font-bold text-brand-800 dark:text-white">এই পেমেন্ট ফেরত দেওয়া হয়েছে</h2>
          <DetailRows rows={[['পরিমাণ', formatBDT(invoice.total)], ['রেফারেন্স', reference]]} />
        </section>
      )}
    </div>
  );
}

/** Heading for the page, so both routes show the same wording for a state. */
export function paymentPageTitle(status, hasProof) {
  if (status === 'paid') return 'ভর্তি সম্পন্ন';
  if (status === 'failed') return 'পেমেন্ট গ্রহণ করা হয়নি';
  if (status === 'refunded') return 'পেমেন্ট ফেরত';
  return hasProof ? 'পেমেন্ট জমা হয়েছে' : 'কোর্সে ভর্তি হোন';
}
