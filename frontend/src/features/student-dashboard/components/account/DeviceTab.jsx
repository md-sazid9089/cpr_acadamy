import { useState } from 'react';
import { FaCircleCheck, FaCircleInfo, FaDesktop, FaMobileScreen } from 'react-icons/fa6';
import { useDevices, useRequestDeviceVerification } from '../../api/dashboard.queries.js';
import Modal from '@/components/ui/Modal.jsx';
import Button from '@/components/ui/Button.jsx';
import Spinner from '@/components/ui/Spinner.jsx';

/** One device row — icon, "Device . Platform . Browser", status marker. */
function DeviceRow({ device, verified }) {
  const Icon = device.type === 'desktop' ? FaDesktop : FaMobileScreen;

  return (
    <div className="relative inline-flex w-full max-w-md items-center gap-3 rounded-lg border border-brand-300 bg-white px-4 py-3 dark:border-slate-700 dark:bg-slate-900/60">
      <Icon aria-hidden="true" className="h-5 w-5 shrink-0 text-slate-600 dark:text-slate-300" />

      <p className="min-w-0 flex-1 text-sm text-slate-800 dark:text-slate-200">
        {device.label} . {device.platform} . {device.browser}
      </p>

      {verified ? (
        <FaCircleCheck
          aria-label="Verified device"
          className="h-5 w-5 shrink-0 text-emerald-500"
        />
      ) : (
        <span className="relative shrink-0">
          <FaCircleInfo
            aria-label="This device is not verified"
            className="h-5 w-5 text-slate-400 dark:text-slate-500"
          />
          <span
            aria-hidden="true"
            className="absolute -right-0.5 -top-0.5 h-2 w-2 rounded-full bg-emerald-500 ring-2 ring-white dark:ring-slate-900"
          />
        </span>
      )}
    </div>
  );
}

function GroupHeading({ children }) {
  return (
    <h2 className="mb-3 border-b-2 border-brand-200 pb-1.5 text-base font-bold text-brand-600 sm:text-lg dark:border-slate-700 dark:text-brand-300">
      {children}
    </h2>
  );
}

/**
 * My Device tab — shows the verified device and the browser currently in use,
 * which is the visible half of the single-device-login rule.
 */
export default function DeviceTab() {
  const { data, isLoading } = useDevices();
  const requestVerification = useRequestDeviceVerification();
  const [modalOpen, setModalOpen] = useState(false);
  const [reason, setReason] = useState('');
  const [submitted, setSubmitted] = useState(false);

  if (isLoading || !data) {
    return (
      <div className="flex justify-center py-16">
        <Spinner size="lg" label="Loading your devices…" />
      </div>
    );
  }

  const submit = async () => {
    await requestVerification.mutateAsync({ reason });
    setSubmitted(true);
    setModalOpen(false);
    setReason('');
  };

  return (
    <div className="rounded-xl bg-emerald-50/60 p-5 dark:bg-slate-900/40">
      <section>
        <GroupHeading>Verified Devices (Device and Browser)</GroupHeading>
        {data.verified.length === 0 ? (
          <p className="text-sm text-slate-500 dark:text-slate-400">
            No device has been verified yet.
          </p>
        ) : (
          <div className="space-y-3">
            {data.verified.map((device) => (
              <DeviceRow key={device.id} device={device} verified />
            ))}
          </div>
        )}
      </section>

      <section className="mt-7">
        <GroupHeading>Current Device (Device and Browser)</GroupHeading>
        <DeviceRow device={data.current} verified={data.current.isVerified} />
      </section>

      {!data.current.isVerified && (
        <>
          {/* Bengali guidance, matching the wording the academy already uses. */}
          <div
            lang="bn"
            className="mt-6 space-y-2 text-center text-sm font-semibold leading-relaxed text-accent-600 dark:text-accent-400"
          >
            <p>
              আপনি ইতোমধ্যে <strong>ডিভাইস/ব্রাউজার</strong> ভেরিফাই করেছেন। অনুগ্রহপূর্বক সেটি ব্যবহার
              করুন অথবা নতুন করে &lsquo;Request To Verify&rsquo; বাটন ক্লিক করে যথাযথ কারণ লিখে ভেরিফাই{' '}
              <strong>রিকুয়েস্ট</strong> দিন।
            </p>
            <p>
              বিঃদ্রঃ <strong>ব্যাচ শেষের শেষ মাসে</strong> কোনরূপ Device Change করা যাবে না।
            </p>
          </div>

          <div className="mt-5 text-center">
            {submitted ? (
              <p className="text-sm font-bold text-emerald-700 dark:text-emerald-400">
                Your verification request has been sent for review.
              </p>
            ) : (
              <Button onClick={() => setModalOpen(true)}>Request to Verify</Button>
            )}
          </div>
        </>
      )}

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Request device verification"
        description="Tell us why you need to switch device. An administrator will review it."
        footer={
          <>
            <Button variant="outline" onClick={() => setModalOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={submit}
              isLoading={requestVerification.isPending}
              disabled={reason.trim().length < 10}
            >
              Send request
            </Button>
          </>
        }
      >
        <label
          htmlFor="verify-reason"
          className="block text-sm font-medium text-slate-700 dark:text-slate-300"
        >
          Reason
        </label>
        <textarea
          id="verify-reason"
          rows={4}
          value={reason}
          onChange={(event) => setReason(event.target.value)}
          placeholder="e.g. My previous phone was lost and I now study on my laptop."
          className="mt-1.5 block w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 transition-colors focus:border-brand-500 dark:border-slate-700 dark:bg-surface-dark-subtle dark:text-slate-100"
        />
        <p className="mt-1.5 text-xs text-slate-500 dark:text-slate-400">
          Minimum 10 characters.
        </p>
      </Modal>
    </div>
  );
}
