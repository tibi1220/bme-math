import { notFound } from 'next/navigation';
import type { PracticeItem } from '@/components/practice';
import {
  exerciseAnchor,
  exerciseId,
  getExam,
  getSubject,
  practiceExerciseHref,
  testHref,
  testTitle,
  topicBadge,
  type Exam,
  type Exercise,
  type Subject,
} from '@/lib/content';

// The practice pages of an exam: /<subject>/exams/<exam>/practice and one
// page per exercise below it.

export async function loadPractice(
  params: Promise<{ subject: string; exam: string }>,
) {
  const { subject: subjectSlug, exam: examSlug } = await params;
  const subject = getSubject(subjectSlug);
  const exam = subject && getExam(subject, examSlug);
  if (!subject || !exam || exam.tests.length === 0) notFound();
  return { subject, exam };
}

// Every exercise of the exam with what the picker needs to know about it.
export function practiceItems(
  subject: Subject,
  exam: Exam,
): { item: PracticeItem; exercise: Exercise }[] {
  return exam.tests.flatMap(test =>
    test.exercises.map(exercise => ({
      exercise,
      item: {
        id: exerciseId(exercise),
        href: practiceExerciseHref(subject, exam, exercise),
        year: exercise.year,
        kind: test.info.kind,
        topic: exercise.topic,
        imsc: exercise.imsc,
        source: {
          label: `${test.year} – ${testTitle(exam, test)}, ${exercise.number}. feladat`,
          href: `${testHref(subject, exam, test)}#${exerciseAnchor(exercise)}`,
        },
        badge: topicBadge(subject, exam, exercise),
      },
    })),
  );
}
