import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { Breadcrumbs } from '@/components/breadcrumbs';
import { PageHeader } from '@/components/page-header';
import { Practice, type PracticeItem } from '@/components/practice';
import { withBasePath } from '@/lib/base-path';
import {
  examHref,
  exerciseAnchor,
  exerciseId,
  exercisesByTopic,
  getExam,
  getSubject,
  subjects,
  testHref,
  testTitle,
  topicBadge,
  years,
} from '@/lib/content';

export const dynamicParams = false;

export function generateStaticParams() {
  return subjects.flatMap(subject =>
    subject.exams
      .filter(exam => exam.tests.length > 0)
      .map(exam => ({ subject: subject.slug, exam: exam.slug })),
  );
}

async function load(
  params: PageProps<'/[subject]/exams/[exam]/practice'>['params'],
) {
  const { subject: subjectSlug, exam: examSlug } = await params;
  const subject = getSubject(subjectSlug);
  const exam = subject && getExam(subject, examSlug);
  if (!subject || !exam || exam.tests.length === 0) notFound();
  return { subject, exam };
}

export async function generateMetadata({
  params,
}: PageProps<'/[subject]/exams/[exam]/practice'>): Promise<Metadata> {
  const { subject, exam } = await load(params);
  return { title: `Gyakorlás – ${exam.name} – ${subject.name}` };
}

export default async function PracticePage({
  params,
}: PageProps<'/[subject]/exams/[exam]/practice'>) {
  const { subject, exam } = await load(params);

  // Only metadata goes to the browser; the exercises are fetched one by one.
  const items: PracticeItem[] = exam.tests.flatMap(test =>
    test.exercises.map(exercise => ({
      id: exerciseId(exercise),
      year: exercise.year,
      kind: test.info.kind,
      topic: exercise.topic,
      source: {
        label: `${test.year} – ${testTitle(exam, test)}, ${exercise.number}. feladat`,
        href: `${testHref(subject, exam, test)}#${exerciseAnchor(exercise)}`,
      },
      badge: topicBadge(subject, exam, exercise),
    })),
  );
  const topics = subject.topics
    .filter(topic => exercisesByTopic(exam, topic).length > 0)
    .map(topic => ({ id: topic.id, name: topic.short }));

  return (
    <>
      <Breadcrumbs
        items={[
          { label: 'Főoldal', href: '/' },
          { label: subject.name, href: `/${subject.slug}` },
          { label: exam.name, href: examHref(subject, exam) },
          { label: 'Gyakorlás' },
        ]}
      />
      <PageHeader
        title='Gyakorlás'
        subtitle={`${exam.name} · véletlenszerű feladatok a korábbi évekből`}
      />
      <Practice
        items={items}
        topics={topics}
        years={years(exam)}
        dataPath={withBasePath(`/exercises/${subject.slug}/${exam.slug}`)}
      />
    </>
  );
}
