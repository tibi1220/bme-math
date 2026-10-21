import { Download } from 'lucide-react';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { figureAnimations } from '@/components/animations';
import { Breadcrumbs } from '@/components/breadcrumbs';
import { PageHeader } from '@/components/page-header';
import { TableOfContents } from '@/components/table-of-contents';
import {
  getSubject,
  getTopic,
  materialDownloadHref,
  materialHref,
  materialsHref,
  subjects,
} from '@/lib/content';
import { materialClasses } from '@/lib/lwarp-classes';
import { pageMetadata } from '@/lib/metadata';

type Params = PageProps<'/[subject]/topics/[topic]/[material]'>['params'];

export const dynamicParams = false;

export function generateStaticParams() {
  return subjects.flatMap(subject =>
    subject.topics.flatMap(topic =>
      topic.materials.map(material => ({
        subject: subject.slug,
        topic: topic.slug,
        material: material.slug,
      })),
    ),
  );
}

type Part =
  | { kind: 'html'; html: string }
  | { kind: 'animation'; label: string; caption: string };

// Cuts the document at the figures that have an animated version (see
// figureAnimations). They sit at the top level of the document, so both
// sides of each cut are complete HTML.
function splitAnimatedFigures(html: string): Part[] {
  const parts: Part[] = [];
  let last = 0;
  for (const match of html.matchAll(/<figure[^>]*>[\s\S]*?<\/figure>/g)) {
    const label = Object.keys(figureAnimations).find(key =>
      match[0].includes(`<a id="${key}">`),
    );
    if (!label) continue;
    parts.push({ kind: 'html', html: html.slice(last, match.index) });
    parts.push({
      kind: 'animation',
      label,
      caption: /<figcaption>([\s\S]*?)<\/figcaption>/.exec(match[0])?.[1] ?? '',
    });
    last = match.index + match[0].length;
  }
  parts.push({ kind: 'html', html: html.slice(last) });
  return parts;
}

async function load(params: Params) {
  const {
    subject: subjectSlug,
    topic: topicSlug,
    material: materialSlug,
  } = await params;
  const subject = getSubject(subjectSlug);
  const topic = subject && getTopic(subject, topicSlug);
  const material = topic?.materials.find(m => m.slug === materialSlug);
  if (!subject || !topic || !material) notFound();
  const group = topic.groups.find(g => g.slug === material.group);
  return { subject, topic, material, group };
}

export async function generateMetadata({
  params,
}: {
  params: Params;
}): Promise<Metadata> {
  const { subject, topic, material } = await load(params);
  return pageMetadata({
    title: `${material.title} – ${subject.name}`,
    description: `${material.title}: ${topic.name.toLowerCase()} témakörű jegyzet ábrákkal és kidolgozott példákkal (${subject.name}).`,
    path: materialHref(subject, topic, material),
  });
}

export default async function MaterialPage({ params }: { params: Params }) {
  const { subject, topic, material, group } = await load(params);

  return (
    <>
      <Breadcrumbs
        items={[
          { label: 'Főoldal', href: '/' },
          { label: subject.name, href: `/${subject.slug}` },
          { label: topic.name, href: materialsHref(subject, topic) },
          { label: material.title },
        ]}
      />
      <PageHeader
        title={material.title}
        subtitle={group?.name}
      />
      <a
        href={materialDownloadHref(subject, topic, material)}
        className='mb-8 inline-flex items-center gap-2 rounded-md border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 px-3 py-1.5 text-sm hover:border-zinc-400 dark:hover:border-zinc-600'
      >
        <Download
          aria-hidden
          className='size-4'
        />
        Letöltés PDF-ben
      </a>
      {material.toc && <TableOfContents entries={material.toc} />}
      <article className={materialClasses}>
        {splitAnimatedFigures(material.html).map((part, i) => {
          if (part.kind === 'html') {
            return (
              <div
                key={i}
                dangerouslySetInnerHTML={{ __html: part.html }}
              />
            );
          }
          const Animation = figureAnimations[part.label];
          return (
            // The id keeps \ref links to the figure working.
            <figure
              key={i}
              id={part.label}
            >
              <Animation />
              <figcaption dangerouslySetInnerHTML={{ __html: part.caption }} />
            </figure>
          );
        })}
      </article>
    </>
  );
}
