import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { Breadcrumbs } from '@/components/breadcrumbs';
import { LinkCard } from '@/components/link-card';
import { PageHeader } from '@/components/page-header';
import { examHref, getSubject, subjects } from '@/lib/content';
import { pageMetadata } from '@/lib/metadata';

export const dynamicParams = false;

export function generateStaticParams() {
  return subjects.map(subject => ({ subject: subject.slug }));
}

export async function generateMetadata({
  params,
}: PageProps<'/[subject]'>): Promise<Metadata> {
  const subject = getSubject((await params).subject);
  if (!subject) return {};
  return pageMetadata({
    title: subject.name,
    description: `${subject.name} (${subject.description}): régi zárthelyik és vizsgák feladatai kidolgozott megoldásokkal, évek és témakörök szerint.`,
    path: `/${subject.slug}`,
  });
}

export default async function SubjectPage({ params }: PageProps<'/[subject]'>) {
  const subject = getSubject((await params).subject);
  if (!subject) notFound();

  return (
    <>
      <Breadcrumbs
        items={[{ label: 'Főoldal', href: '/' }, { label: subject.name }]}
      />
      <PageHeader
        title={subject.name}
        subtitle={subject.description}
      />

      <section className='mb-10'>
        <h2 className='mb-3 text-lg font-semibold'>Zárthelyik és vizsgák</h2>
        <ul className='grid gap-3 sm:grid-cols-2'>
          {subject.exams.map(exam => (
            <li key={exam.slug}>
              {exam.tests.length > 0 ? (
                <LinkCard
                  href={examHref(subject, exam)}
                  title={exam.name}
                  description={`${exam.tests.length} feladatsor, ${exam.exercises.length} feladat`}
                />
              ) : (
                <LinkCard
                  title={exam.name}
                  description='Hamarosan'
                />
              )}
            </li>
          ))}
        </ul>
      </section>

      <section>
        <h2 className='mb-3 text-lg font-semibold'>
          Segédanyagok témakörönként
        </h2>
        <ul className='grid gap-3 sm:grid-cols-2'>
          {subject.topics.map(topic => (
            <li key={topic.slug}>
              <LinkCard
                title={topic.name}
                description='Hamarosan'
              />
            </li>
          ))}
        </ul>
      </section>
    </>
  );
}
