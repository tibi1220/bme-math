import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { ExerciseCard } from '@/components/exercise-card';
import { subjects } from '@/lib/content';
import { pageMetadata } from '@/lib/metadata';
import { loadPractice, practiceItems } from '@/lib/practice';

type Params =
  PageProps<'/[subject]/exams/[exam]/practice/[exercise]'>['params'];

export const dynamicParams = false;

// Every exercise is prerendered, so a reload or a shared link shows it
// straight away.
export function generateStaticParams() {
  return subjects.flatMap(subject =>
    subject.exams.flatMap(exam =>
      practiceItems(subject, exam).map(({ item }) => ({
        subject: subject.slug,
        exam: exam.slug,
        exercise: item.id,
      })),
    ),
  );
}

async function load(params: Params) {
  const { subject, exam } = await loadPractice(params);
  const { exercise: id } = await params;
  const found = practiceItems(subject, exam).find(({ item }) => item.id === id);
  if (!found) notFound();
  return { subject, exam, ...found };
}

export async function generateMetadata({
  params,
}: {
  params: Params;
}): Promise<Metadata> {
  const { subject, exam, item } = await load(params);
  return pageMetadata({
    title: `${item.source.label} – Gyakorlás – ${subject.name}`,
    description: `Gyakorló feladat – ${subject.name}, ${exam.name}: ${item.source.label}, kidolgozott megoldással.`,
    // The same exercise is on its test page, which search engines should
    // index instead.
    path: item.source.href.split('#')[0],
  });
}

export default async function PracticeExercisePage({
  params,
}: {
  params: Params;
}) {
  const { exercise, item } = await load(params);
  return (
    <ExerciseCard
      exercise={exercise}
      source={item.source}
      topic={item.badge}
    />
  );
}
