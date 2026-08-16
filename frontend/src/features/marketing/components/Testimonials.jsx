import Card from '@/components/ui/Card.jsx';

// TODO: replace with GET /testimonials once the backend exists.
const TESTIMONIALS = [
  {
    id: 't-1',
    name: 'Dr. Farhana Akter',
    result: 'FCPS Part-1 (Medicine), passed 2025',
    quote:
      'The weekly item analysis showed me exactly which topics I was guessing on. That single habit changed how I revised in the last two months.',
  },
  {
    id: 't-2',
    name: 'Dr. Mahmudul Hasan',
    result: '41st BCS (Health), recommended',
    quote:
      'The written-answer evaluation was brutally honest and that is precisely what I needed. Model answers were far better than any guide book.',
  },
  {
    id: 't-3',
    name: 'Dr. Sadia Rahman',
    result: 'MBBS 3rd Professional, DMC',
    quote:
      'Card exams every alternate day kept me consistent. The notes were concise enough to revise the night before the exam.',
  },
];

export default function Testimonials() {
  return (
    <section className="bg-white py-12 dark:bg-surface-dark">
      <div className="container-page">
        <div className="text-center">
          <h2 className="section-heading">What our students say</h2>
          <p className="section-subheading mx-auto text-center">
            Results from doctors who prepared with us in the last two examination cycles.
          </p>
        </div>

        <div className="mt-10 grid gap-6 md:grid-cols-3">
          {TESTIMONIALS.map((item) => (
            <Card key={item.id} className="flex flex-col p-6">
              <div className="flex gap-1 text-amber-400" aria-label="5 out of 5 stars">
                {Array.from({ length: 5 }).map((_, index) => (
                  <svg key={index} className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 2l3 6.5 7 .9-5 4.8 1.2 7L12 17.8 5.8 21.2 7 14.2l-5-4.8 7-.9z" />
                  </svg>
                ))}
              </div>
              <blockquote className="mt-4 flex-1 text-sm leading-relaxed text-slate-600 dark:text-slate-300">
                “{item.quote}”
              </blockquote>
              <footer className="mt-5 border-t border-slate-100 pt-4 dark:border-slate-800">
                <p className="text-sm font-semibold text-slate-900 dark:text-white">{item.name}</p>
                <p className="text-xs text-slate-500 dark:text-slate-400">{item.result}</p>
              </footer>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
