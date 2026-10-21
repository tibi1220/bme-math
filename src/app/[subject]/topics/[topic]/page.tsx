import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { Breadcrumbs } from '@/components/breadcrumbs';
import { LinkCard } from '@/components/link-card';
import { PageHeader } from '@/components/page-header';
import {
  exercisesByTopic,
  getSubject,
  getTopic,
  materialHref,
  materialsHref,
  subjects,
  topicHref,
} from '@/lib/content';
import { pageMetadata } from '@/lib/metadata';

type Params = PageProps<'/[subject]/topics/[topic]'>['params'];

export const dynamicParams = false;

// Only topics that already have materials get a page.
export function generateStaticParams() {
  return subjects.flatMap(subject =>
    subject.topics
      .filter(topic => topic.materials.length > 0)
      .map(topic => ({ subject: subject.slug, topic: topic.slug })),
  );
}

async function load(params: Params) {
  const { subject: subjectSlug, topic: topicSlug } = await params;
  const subject = getSubject(subjectSlug);
  const topic = subject && getTopic(subject, topicSlug);
  if (!subject || !topic || topic.materials.length === 0) notFound();
  return { subject, topic };
}

export async function generateMetadata({
  params,
}: {
  params: Params;
}): Promise<Metadata> {
  const { subject, topic } = await load(params);
  return pageMetadata({
    title: `${topic.name} – ${subject.name}`,
    description: `${topic.name} – ${subject.name}: jegyzetek ábrákkal és kidolgozott példákkal, PDF-ben is letölthetően.`,
    path: materialsHref(subject, topic),
  });
}

export default async function TopicPage({ params }: { params: Params }) {
  const { subject, topic } = await load(params);
  // The exam exercises of the same topic.
  const exams = subject.exams
    .map(exam => ({ exam, count: exercisesByTopic(exam, topic).length }))
    .filter(({ count }) => count > 0);

  return (
    <>
      <Breadcrumbs
        items={[
          { label: 'Főoldal', href: '/' },
          { label: subject.name, href: `/${subject.slug}` },
          { label: topic.name },
        ]}
      />
      <PageHeader
        title={topic.name}
        subtitle='Segédanyagok'
      />

      {topic.groups.map(group => (
        <section
          key={group.slug}
          className='mb-10'
        >
          <h2 className='mb-3 text-lg font-semibold'>{group.name}</h2>
          <ul className='grid gap-3 sm:grid-cols-2'>
            {group.materials.map(material => (
              <li key={material.slug}>
                <LinkCard
                  href={materialHref(subject, topic, material)}
                  title={material.title}
                  description={material.subtitle ?? undefined}
                />
              </li>
            ))}
          </ul>
        </section>
      ))}

      {exams.length > 0 && (
        <section>
          <h2 className='mb-3 text-lg font-semibold'>
            Zárthelyi feladatok a témakörből
          </h2>
          <ul className='grid gap-3 sm:grid-cols-2'>
            {exams.map(({ exam, count }) => (
              <li key={exam.slug}>
                <LinkCard
                  href={topicHref(subject, exam, topic)}
                  title={exam.name}
                  description={`${count} feladat megoldásokkal`}
                />
              </li>
            ))}
          </ul>
        </section>
      )}
    </>
  );
}
