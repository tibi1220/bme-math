import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { Breadcrumbs } from '@/components/breadcrumbs';
import { ExerciseCard } from '@/components/exercise-card';
import { PageHeader } from '@/components/page-header';
import { variantLabel } from '@/lib/catalog';
import {
  examHref,
  getExam,
  getSubject,
  getTest,
  subjects,
  testDownloadHref,
  testTitle,
  topicBadge,
  totalPoints,
} from '@/lib/content';

type Params = PageProps<'/[subject]/exams/[exam]/[year]/[variant]'>['params'];

export const dynamicParams = false;

export function generateStaticParams() {
  return subjects.flatMap(subject =>
    subject.exams.flatMap(exam =>
      exam.tests.map(test => ({
        subject: subject.slug,
        exam: exam.slug,
        year: String(test.year),
        variant: test.info.slug,
      })),
    ),
  );
}

async function load(params: Params) {
  const { subject: subjectSlug, exam: examSlug, year, variant } = await params;
  const subject = getSubject(subjectSlug);
  const exam = subject && getExam(subject, examSlug);
  const test = exam && getTest(exam, year, variant);
  if (!subject || !exam || !test) notFound();
  return { subject, exam, test };
}

export async function generateMetadata({
  params,
}: {
  params: Params;
}): Promise<Metadata> {
  const { subject, exam, test } = await load(params);
  return { title: `${test.year} ${testTitle(exam, test)} – ${subject.name}` };
}

export default async function TestPage({ params }: { params: Params }) {
  const { subject, exam, test } = await load(params);
  const points = totalPoints(test.exercises);

  return (
    <>
      <Breadcrumbs
        items={[
          { label: 'Főoldal', href: '/' },
          { label: subject.name, href: `/${subject.slug}` },
          { label: exam.name, href: examHref(subject, exam) },
          {
            label: `${test.year} ${variantLabel(test.info)}`,
          },
        ]}
      />
      <PageHeader
        title={`${test.year} – ${testTitle(exam, test)}`}
        subtitle={`${subject.name} · ${points.regular} pont${points.imsc > 0 ? ` + ${points.imsc} IMSC pont` : ''}`}
      />
      <div className='-mt-4 mb-8 flex flex-wrap gap-2'>
        <a
          href={testDownloadHref(subject, exam, test, false)}
          download
          className='rounded-md border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 px-3 py-1.5 text-sm hover:border-zinc-400 dark:hover:border-zinc-600'
        >
          Letöltés (PDF)
        </a>
        <a
          href={testDownloadHref(subject, exam, test, true)}
          download
          className='rounded-md border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 px-3 py-1.5 text-sm hover:border-zinc-400 dark:hover:border-zinc-600'
        >
          Letöltés megoldásokkal (PDF)
        </a>
      </div>
      <div className='space-y-4'>
        {test.exercises.map(exercise => (
          <ExerciseCard
            key={exercise.number}
            exercise={exercise}
            topic={topicBadge(subject, exam, exercise)}
          />
        ))}
      </div>
    </>
  );
}
