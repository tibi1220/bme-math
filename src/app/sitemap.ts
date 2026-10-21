import type { MetadataRoute } from 'next';
import {
  examHref,
  exercisesByTopic,
  practiceHref,
  subjects,
  testHref,
  topicHref,
} from '@/lib/content';
import { absoluteUrl } from '@/lib/site';

// Static export: written to out/ at build time.
export const dynamic = 'force-static';

// Every page of the site, matching the generateStaticParams of the routes.
export default function sitemap(): MetadataRoute.Sitemap {
  const paths = [
    '/',
    ...subjects.flatMap(subject => [
      `/${subject.slug}`,
      ...subject.exams
        .filter(exam => exam.tests.length > 0)
        .flatMap(exam => [
          examHref(subject, exam),
          practiceHref(subject, exam),
          ...exam.tests.map(test => testHref(subject, exam, test)),
          ...subject.topics
            .filter(topic => exercisesByTopic(exam, topic).length > 0)
            .map(topic => topicHref(subject, exam, topic)),
        ]),
    ]),
    '/privacy',
    '/cookies',
  ];
  return paths.map(path => ({ url: absoluteUrl(path) }));
}
