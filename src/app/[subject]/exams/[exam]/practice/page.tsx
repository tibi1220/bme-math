import type { Metadata } from 'next';
import { practiceHref, subjects } from '@/lib/content';
import { pageMetadata } from '@/lib/metadata';
import { loadPractice } from '@/lib/practice';

export const dynamicParams = false;

export function generateStaticParams() {
  return subjects.flatMap(subject =>
    subject.exams
      .filter(exam => exam.tests.length > 0)
      .map(exam => ({ subject: subject.slug, exam: exam.slug })),
  );
}

export async function generateMetadata({
  params,
}: PageProps<'/[subject]/exams/[exam]/practice'>): Promise<Metadata> {
  const { subject, exam } = await loadPractice(params);
  return pageMetadata({
    title: `Gyakorlás – ${exam.name} – ${subject.name}`,
    description: `Véletlen feladatok gyakorláshoz – ${subject.name}, ${exam.name}: szűrés témakör, év és zárthelyitípus szerint, megoldásokkal.`,
    path: practiceHref(subject, exam),
  });
}

// The filters are in the layout; no exercise is picked yet.
export default function PracticePage() {
  return null;
}
