import { LinkCard } from '@/components/link-card';
import { PageHeader } from '@/components/page-header';
import { subjects } from '@/lib/content';

export default function Home() {
  return (
    <>
      <PageHeader
        title='Válassz tárgyat'
        subtitle='Régi zárthelyik és vizsgák feladatai, évek és témakörök szerint.'
      />
      <ul className='grid gap-3 sm:grid-cols-2'>
        {subjects.map(subject => (
          <li key={subject.slug}>
            <LinkCard
              href={`/${subject.slug}`}
              title={subject.name}
              description={subject.description}
            />
          </li>
        ))}
      </ul>
    </>
  );
}
