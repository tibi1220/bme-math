import Link from 'next/link';
import { CopyButton } from '@/components/copy-button';
import { exerciseAnchor, type Exercise } from '@/lib/exercise';
import { lwarpClasses } from '@/lib/lwarp-classes';

function pointsLabel(points: number[]) {
  const total = points.reduce((a, b) => a + b, 0);
  return points.length > 1
    ? `${points.join(' + ')} = ${total} pont`
    : `${total} pont`;
}

export function ExerciseCard({
  exercise,
  source,
  topic,
}: {
  exercise: Exercise;
  // Shown instead of the exercise number, e.g. on topic pages.
  source?: { label: string; href: string };
  // Topic badge; left out where every exercise has the same topic.
  topic?: { label: string; href: string };
}) {
  return (
    <article
      id={source ? undefined : exerciseAnchor(exercise)}
      className='scroll-mt-6 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-5'
    >
      <header className='mb-3 flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1'>
        <h2 className='font-semibold text-zinc-900 dark:text-zinc-100'>
          {source ? (
            <Link
              href={source.href}
              className='hover:underline'
            >
              {source.label}
            </Link>
          ) : (
            `${exercise.number}. feladat`
          )}
        </h2>
        <div className='flex items-center gap-2 text-sm text-zinc-500 dark:text-zinc-400'>
          {topic && (
            <Link
              href={topic.href}
              className='rounded bg-sky-50 dark:bg-sky-900/40 px-1.5 py-0.5 text-xs font-medium text-sky-800 dark:text-sky-300 hover:bg-sky-100 dark:hover:bg-sky-900/70'
            >
              {topic.label}
            </Link>
          )}
          {exercise.imsc && (
            <span className='rounded bg-amber-100 dark:bg-amber-900/40 px-1.5 py-0.5 text-xs font-medium text-amber-800 dark:text-amber-300'>
              IMSC
            </span>
          )}
          <span>{pointsLabel(exercise.points)}</span>
          {exercise.tex && (
            <CopyButton
              text={exercise.tex}
              label='TeX másolása'
            />
          )}
        </div>
      </header>
      <div
        className={lwarpClasses}
        dangerouslySetInnerHTML={{ __html: exercise.html }}
      />
      {exercise.solution && (
        <details className='group mt-4 border-t border-zinc-200 dark:border-zinc-800 pt-3'>
          <summary className='cursor-pointer list-none text-sm font-medium text-zinc-600 dark:text-zinc-400 select-none hover:text-zinc-900 dark:hover:text-zinc-100 [&::-webkit-details-marker]:hidden'>
            <span
              aria-hidden
              className='mr-1.5 inline-block transition-transform group-open:rotate-90'
            >
              ▸
            </span>
            <span className='group-open:hidden'>Megoldás megjelenítése</span>
            <span className='hidden group-open:inline'>Megoldás elrejtése</span>
          </summary>
          <div className='mt-3 rounded-md bg-zinc-50 dark:bg-zinc-950 p-4'>
            {exercise.solutionTex && (
              <div className='mb-2 flex justify-end'>
                <CopyButton
                  text={exercise.solutionTex}
                  label='Megoldás TeX másolása'
                />
              </div>
            )}
            <div
              className={lwarpClasses}
              dangerouslySetInnerHTML={{ __html: exercise.solution }}
            />
          </div>
        </details>
      )}
    </article>
  );
}
