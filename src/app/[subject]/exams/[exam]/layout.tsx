import { getSubject } from '@/lib/content';

// Every page of an exam (tests, topics, practice) ends with the credit to the
// lecturers who wrote the tests.
export default async function ExamLayout({
  params,
  children,
}: LayoutProps<'/[subject]/exams/[exam]'>) {
  const subject = getSubject((await params).subject);

  return (
    <>
      {children}
      <aside className='mt-12 rounded-lg border border-zinc-200 dark:border-zinc-800 px-4 py-3 text-sm text-zinc-600 dark:text-zinc-400'>
        A feladatsorokat a tárgy oktatói állították össze.
        {subject && (
          <>
            {' '}
            A tárgyról a{' '}
            <a
              href={subject.website}
              target='_blank'
              rel='noopener noreferrer'
              className='underline hover:text-zinc-900 dark:hover:text-zinc-100'
            >
              tárgyhonlapon
            </a>{' '}
            olvashatsz többet.
          </>
        )}
      </aside>
    </>
  );
}
