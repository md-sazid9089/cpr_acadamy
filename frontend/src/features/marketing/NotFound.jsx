import { FiBookOpen, FiHome } from 'react-icons/fi';
import ChatBubble from '@/components/layout/ChatBubble.jsx';
import Button from '@/components/ui/Button.jsx';

export default function NotFound() {
  return (
    <>
      <main className="flex min-h-dvh items-center justify-center bg-gradient-to-br from-brand-50 to-brand-100 px-6 py-24 text-center" aria-labelledby="not-found-heading">
        <div className="flex w-full max-w-2xl flex-col items-center">
          <div className="relative flex h-28 w-56 items-center justify-center" aria-hidden="true">
            <span className="text-[104px] font-extrabold leading-none text-brand-200">404</span>
            <FiBookOpen className="absolute h-[72px] w-[72px] text-brand-600" strokeWidth={2.25} />
          </div>
          <h1 id="not-found-heading" className="mt-7 font-body text-2xl font-bold leading-tight text-stone-900">
            <span className="sr-only">Page not found. </span>
            Oops! This lesson isn't in our curriculum
          </h1>
          <p className="mt-2 max-w-[340px] text-base leading-[1.5] text-stone-600">
            The page you're looking for seems to have graduated and moved on. Let's get you back to learning!
          </p>
          <Button to="/" size="sm" className="mt-5 rounded-lg border-transparent bg-brand-600 hover:bg-brand-700">
            <FiHome className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
            Back to Home
          </Button>
        </div>
      </main>
      <ChatBubble />
    </>
  );
}
