import Button from '@/components/ui/Button.jsx';
import { CONTACT } from '@/constants';

/** Closing conversion strip above the footer. */
export default function CtaBanner() {
  return (
    <section className="bg-brand-700 py-14 text-white dark:bg-brand-900">
      <div className="container-page flex flex-col items-center gap-6 text-center lg:flex-row lg:justify-between lg:text-left">
        <div>
          <h2 className="text-2xl font-bold sm:text-3xl">Ready to start your preparation?</h2>
          <p className="mt-2 max-w-xl text-brand-100">
            Create an account with your mobile number. Our team verifies every new registration
            before activation, usually within a few hours.
          </p>
        </div>

        <div className="flex flex-wrap justify-center gap-3">
          <Button to="/register" size="lg" variant="inverse">
            Register now
          </Button>
          <Button
            href={`tel:${CONTACT.phone.replace(/\s/g, '')}`}
            size="lg"
            variant="inverse-outline"
          >
            Call {CONTACT.phone}
          </Button>
        </div>
      </div>
    </section>
  );
}
