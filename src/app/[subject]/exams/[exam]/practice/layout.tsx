import { Breadcrumbs } from '@/components/breadcrumbs';
import { PageHeader } from '@/components/page-header';
import { Practice } from '@/components/practice';
import { examHref, exercisesByTopic, years } from '@/lib/content';
import { loadPractice, practiceItems } from '@/lib/practice';

// The filters live in the layout, so they keep their state while the picker
// moves between the exercise pages below it.
export default async function PracticeLayout({
  params,
  children,
}: LayoutProps<'/[subject]/exams/[exam]/practice'>) {
  const { subject, exam } = await loadPractice(params);
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
      <div className='space-y-8'>
        <Practice
          items={practiceItems(subject, exam).map(({ item }) => item)}
          topics={topics}
          years={years(exam)}
        />
        {children}
      </div>
    </>
  );
}
