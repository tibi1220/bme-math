import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Breadcrumbs } from '@/components/breadcrumbs';
import { LinkCard } from '@/components/link-card';
import { variantLabel } from '@/lib/catalog';
import { PageHeader } from '@/components/page-header';
import {
  examHref,
  exercisesByTopic,
  getExam,
  getSubject,
  practiceHref,
  subjects,
  testHref,
  topicHref,
  years,
} from '@/lib/content';
import { pageMetadata } from '@/lib/metadata';

export const dynamicParams = false;

export function generateStaticParams() {
  return subjects.flatMap(subject =>
    subject.exams
      .filter(exam => exam.tests.length > 0)
      .map(exam => ({ subject: subject.slug, exam: exam.slug })),
  );
}

async function load(params: PageProps<'/[subject]/exams/[exam]'>['params']) {
  const { subject: subjectSlug, exam: examSlug } = await params;
  const subject = getSubject(subjectSlug);
  const exam = subject && getExam(subject, examSlug);
  if (!subject || !exam || exam.tests.length === 0) notFound();
  return { subject, exam };
}

export async function generateMetadata({
  params,
}: PageProps<'/[subject]/exams/[exam]'>): Promise<Metadata> {
  const { subject, exam } = await load(params);
  const span = years(exam);
  return pageMetadata({
    title: `${exam.name} – ${subject.name}`,
    description: `${subject.name}, ${exam.name}: ${exam.tests.length} feladatsor és ${exam.exercises.length} feladat ${Math.min(...span)}–${Math.max(...span)} között, kidolgozott megoldásokkal, évek és témakörök szerint.`,
    path: examHref(subject, exam),
  });
}

export default async function ExamPage({
  params,
}: PageProps<'/[subject]/exams/[exam]'>) {
  const { subject, exam } = await load(params);
  const topics = subject.topics
    .map(topic => ({ topic, count: exercisesByTopic(exam, topic).length }))
    .filter(({ count }) => count > 0);

  return (
    <>
      <Breadcrumbs
        items={[
          { label: 'Főoldal', href: '/' },
          { label: subject.name, href: `/${subject.slug}` },
          { label: exam.name },
        ]}
      />
      <PageHeader
        title={exam.name}
        subtitle={subject.name}
      />

      <section className='mb-10'>
        <LinkCard
          href={practiceHref(subject, exam)}
          title='Gyakorlás véletlen feladatokkal'
          description='Szűrhető témakör, év és típus (zárthelyi, pótzárthelyi, aláíráspótló) szerint.'
        />
      </section>

      <section className='mb-10'>
        <h2 className='mb-1 text-lg font-semibold'>
          Feladatsorok évek szerint
        </h2>
        <p className='mb-4 text-sm text-zinc-500 dark:text-zinc-400'>
          Egy teljes zárthelyi, ahogy a dolgozatban szerepelt.
        </p>
        <ul className='divide-y divide-zinc-200 dark:divide-zinc-800 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900'>
          {years(exam).map(year => (
            <li
              key={year}
              className='flex flex-wrap items-center gap-x-4 gap-y-2 px-4 py-3'
            >
              <span className='w-12 font-medium tabular-nums'>{year}</span>
              <div className='flex flex-wrap gap-2'>
                {exam.tests
                  .filter(test => test.year === year)
                  .map(test => (
                    <Link
                      key={test.variant}
                      href={testHref(subject, exam, test)}
                      className='rounded-md border border-zinc-200 dark:border-zinc-800 px-2.5 py-1 text-sm transition-colors hover:border-zinc-400 dark:hover:border-zinc-600 hover:bg-zinc-50 dark:hover:bg-zinc-800'
                    >
                      {variantLabel(test.info)}
                    </Link>
                  ))}
              </div>
            </li>
          ))}
        </ul>
      </section>

      <section>
        <h2 className='mb-1 text-lg font-semibold'>
          Feladatok témakörök szerint
        </h2>
        <p className='mb-4 text-sm text-zinc-500 dark:text-zinc-400'>
          Az összes év feladatai egy témakörből.
        </p>
        <ul className='grid gap-3 sm:grid-cols-2'>
          {topics.map(({ topic, count }) => (
            <li key={topic.slug}>
              <LinkCard
                href={topicHref(subject, exam, topic)}
                title={topic.name}
                description={`${count} feladat`}
              />
            </li>
          ))}
        </ul>
      </section>
    </>
  );
}
