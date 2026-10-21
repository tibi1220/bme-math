import type { Metadata } from 'next';
import Link from 'next/link';
import { Breadcrumbs } from '@/components/breadcrumbs';
import { PageHeader } from '@/components/page-header';
import { Prose } from '@/components/prose';
import { pageMetadata } from '@/lib/metadata';
import { policyDate, siteName } from '@/lib/site';
import { storedItems } from '@/lib/storage';

export const metadata: Metadata = pageMetadata({
  title: 'Süti-tájékoztató',
  description: `A ${siteName} nem használ sütiket; a böngésző helyi tárhelyén csak a téma választása marad meg.`,
  path: '/cookies',
});

export default function CookiesPage() {
  return (
    <>
      <Breadcrumbs
        items={[{ label: 'Főoldal', href: '/' }, { label: 'Süti-tájékoztató' }]}
      />
      <PageHeader
        title='Süti-tájékoztató'
        subtitle={`Hatályos: ${policyDate}`}
      />
      <Prose>
        <p>
          <strong>Az oldal nem használ sütiket (cookie-kat)</strong>, sem
          sajátot, sem harmadik félét. Nincs követés, analitika vagy hirdetés.
        </p>

        <h2>Helyi tárhely</h2>
        <p>
          A böngésződ helyi tárhelyén (localStorage) az oldal az alábbiakat
          jegyzi meg. Ezek csak a te gépeden vannak, a szerverre soha nem
          kerülnek, és nem járnak le: addig maradnak meg, amíg nem törlöd őket.
        </p>
      </Prose>
      <div className='my-6 overflow-x-auto rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900'>
        <table className='w-full text-left text-sm'>
          <thead className='border-b border-zinc-200 dark:border-zinc-800 text-zinc-500 dark:text-zinc-400'>
            <tr>
              <th className='px-4 py-2 font-medium'>Név</th>
              <th className='px-4 py-2 font-medium'>Cél</th>
              <th className='px-4 py-2 font-medium'>Érték</th>
            </tr>
          </thead>
          <tbody className='divide-y divide-zinc-200 dark:divide-zinc-800'>
            {storedItems.map(item => (
              <tr key={item.key}>
                <td className='px-4 py-2 font-mono whitespace-nowrap'>
                  {item.key}
                </td>
                <td className='px-4 py-2'>{item.purpose}</td>
                <td className='px-4 py-2 whitespace-nowrap'>{item.value}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <Prose>
        <h2>Miért nem kérünk hozzájárulást?</h2>
        <p>
          Ez az adat csak azt rögzíti, amit te magad választottál, és kizárólag
          az általad kért funkcióhoz (a téma megtartásához) szükséges. Az
          elektronikus hírközlési szabályok (az ePrivacy-irányelv 5. cikk (3)
          bekezdése) szerint az ilyen tároláshoz nem kell hozzájárulás.
        </p>

        <h2>Törlés</h2>
        <p>
          Az adatot a böngésződ beállításaiban, az oldal adatainak (webhely
          adatainak) törlésével távolíthatod el. Ezután az oldal ismét világos
          témával jelenik meg.
        </p>
        <p>
          Az adatkezelésről általában az{' '}
          <Link href='/privacy'>adatkezelési tájékoztató</Link> szól.
        </p>
      </Prose>
    </>
  );
}
