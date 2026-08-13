import Button from '@/components/ui/Button.jsx';

/** Catch-all 404 rendered inside the public layout. */
export default function NotFound() {
  return (
    <div className="container-page flex min-h-[60vh] flex-col items-center justify-center text-center">
      <p className="text-6xl font-extrabold text-brand-600 dark:text-brand-400">404</p>
      <h1 className="mt-4 text-2xl font-bold text-slate-900 dark:text-white">Page not found</h1>
      <p className="mt-2 max-w-md text-sm text-slate-600 dark:text-slate-400">
        The page you're looking for doesn't exist or has been moved.
      </p>
      <div className="mt-6 flex gap-3">
        <Button to="/">Back to home</Button>
        <Button to="/courses" variant="outline">
          Browse courses
        </Button>
      </div>
    </div>
  );
}
