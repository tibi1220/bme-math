import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { Breadcrumbs } from '@/components/breadcrumbs';
import { ExerciseCard } from '@/components/exercise-card';
import { PageHeader } from '@/components/page-header';
import {
  examHref,
  exerciseAnchor,
  exercisesByTopic,
  getExam,
  getSubject,
  getTopic,
  subjects,
  testHref,
  testTitle,
  topicHref,
  years,
  type Exercise,
} from '@/lib/content';
import { pageMetadata } from '@/lib/metadata';

type Params = PageProps<'/[subject]/exams/[exam]/topics/[topic]'>['params'];

export const dynamicParams = false;

export function generateStaticParams() {
  return subjects.flatMap(subject =>
    subject.exams.flatMap(exam =>
      subject.topics
        .filter(topic => exercisesByTopic(exam, topic).length > 0)
        .map(topic => ({
          subject: subject.slug,
          exam: exam.slug,
          topic: topic.slug,
        })),
    ),
  );
}

async function load(params: Params) {
  const {
    subject: subjectSlug,
    exam: examSlug,
    topic: topicSlug,
  } = await params;
  const subject = getSubject(subjectSlug);
  const exam = subject && getExam(subject, examSlug);
  const topic = subject && getTopic(subject, topicSlug);
  const exercises = exam && topic ? exercisesByTopic(exam, topic) : [];
  if (!subject || !exam || !topic || exercises.length === 0) notFound();
  return { subject, exam, topic, exercises };
}

export async function generateMetadata({
  params,
}: {
  params: Params;
}): Promise<Metadata> {
  const { subject, exam, topic, exercises } = await load(params);
  return pageMetadata({
    title: `${topic.name} – ${exam.name} – ${subject.name}`,
    description: `${topic.name} – ${subject.name}, ${exam.name}: ${exercises.length} feladat a korábbi évekből, kidolgozott megoldásokkal.`,
    path: topicHref(subject, exam, topic),
  });
}

export default async function TopicPage({ params }: { params: Params }) {
  const { subject, exam, topic, exercises } = await load(params);

  const source = (exercise: Exercise) => {
    const test = exam.tests.find(
      t => t.year === exercise.year && t.variant === exercise.variant,
    )!;
    return {
      label: `${testTitle(exam, test)}, ${exercise.number}. feladat`,
      href: `${testHref(subject, exam, test)}#${exerciseAnchor(exercise)}`,
    };
  };

  return (
    <>
      <Breadcrumbs
        items={[
          { label: 'Főoldal', href: '/' },
          { label: subject.name, href: `/${subject.slug}` },
          { label: exam.name, href: examHref(subject, exam) },
          { label: topic.name },
        ]}
      />
      <PageHeader
        title={topic.name}
        subtitle={`${exam.name} · ${exercises.length} feladat`}
      />
      <div className='space-y-10'>
        {years(exam)
          .filter(year => exercises.some(exercise => exercise.year === year))
          .map(year => (
            <section key={year}>
              <h2 className='mb-3 text-lg font-semibold tabular-nums'>
                {year}
              </h2>
              <div className='space-y-4'>
                {exercises
                  .filter(exercise => exercise.year === year)
                  .map(exercise => (
                    <ExerciseCard
                      key={`${exercise.variant}-${exercise.number}`}
                      exercise={exercise}
                      source={source(exercise)}
                    />
                  ))}
              </div>
            </section>
          ))}
      </div>
    </>
  );
}
