import Button from '@/components/ui/Button.jsx';
import { EcgLine } from '@/components/ui/backgrounds';
import { CONTACT } from '@/constants';

/** Closing conversion strip above the footer. */
export default function CtaBanner() {
  return (
    <section className="relative isolate overflow-hidden bg-white py-12 dark:bg-surface-dark">
      <div className="pointer-events-none absolute inset-y-0 left-0 right-0 -z-10 my-auto h-24 text-brand-600 opacity-[0.10] dark:text-brand-400 dark:opacity-[0.16]">
        <EcgLine className="h-full w-full" />
      </div>

      <div className="container-page flex flex-col items-center gap-6 text-center lg:flex-row lg:justify-between lg:text-left">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 sm:text-3xl dark:text-white">
            Ready to start your preparation?
          </h2>
          <p className="mt-2 max-w-xl text-slate-600 dark:text-slate-400">
            Create an account with your mobile number. Our team verifies every new registration
            before activation, usually within a few hours.
          </p>
        </div>

        <div className="flex flex-wrap justify-center gap-3">
          <Button to="/register" size="lg">
            Register now
          </Button>
          <Button
            href={`tel:${CONTACT.phone.replace(/\s/g, '')}`}
            size="lg"
            variant="outline"
          >
            Call {CONTACT.phone}
          </Button>
        </div>
      </div>
    </section>
  );
}
