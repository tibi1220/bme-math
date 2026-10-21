import type { Metadata } from 'next';
import Link from 'next/link';
import { Breadcrumbs } from '@/components/breadcrumbs';
import { PageHeader } from '@/components/page-header';
import { Prose } from '@/components/prose';
import { pageMetadata } from '@/lib/metadata';
import { operator, policyDate, repositoryUrl, siteName } from '@/lib/site';

export const metadata: Metadata = pageMetadata({
  title: 'Adatkezelési tájékoztató',
  description: `Milyen adatokat kezel a ${siteName}: nincs regisztráció, követés, analitika vagy süti.`,
  path: '/privacy',
});

export default function PrivacyPage() {
  return (
    <>
      <Breadcrumbs
        items={[
          { label: 'Főoldal', href: '/' },
          { label: 'Adatkezelési tájékoztató' },
        ]}
      />
      <PageHeader
        title='Adatkezelési tájékoztató'
        subtitle={`Hatályos: ${policyDate}`}
      />
      <Prose>
        <p>
          Ez a tájékoztató az Európai Unió általános adatvédelmi rendelete
          (GDPR) alapján bemutatja, hogyan bánik a {siteName} (a továbbiakban:
          az oldal) a látogatók adataival.{' '}
          <strong>
            Röviden: az oldal nem gyűjt, nem tárol és nem ad tovább személyes
            adatot.
          </strong>
        </p>

        <h2>Az üzemeltető</h2>
        <p>
          Az oldalt {operator.name} üzemelteti magánszemélyként, ingyenesen és
          nem üzleti céllal (GitHub:{' '}
          <a href={operator.url}>{operator.github}</a>). Az oldal forráskódja
          nyilvános: <a href={repositoryUrl}>{repositoryUrl}</a>.
        </p>

        <h2>Milyen adatokat kezel az oldal?</h2>
        <p>
          Semmilyet. Nincs regisztráció, bejelentkezés, űrlap vagy hírlevél, és
          az oldal nem használ analitikát, hirdetést, közösségi beépülőket vagy
          sütiket. Minden tartalmat (a betűtípusokat is) maga az oldal szolgál
          ki, így a böngésződ harmadik félhez nem küld kérést.
        </p>

        <h2>Tárhelyszolgáltató</h2>
        <p>
          Az oldalt a GitHub Pages szolgáltatás (GitHub, Inc., Egyesült Államok)
          szolgálja ki. Az oldal megnyitásakor a böngésződ a GitHub szervereihez
          csatlakozik, amelyek a szolgáltatás biztonsága és működtetése
          érdekében naplózzák a látogatók IP-címét. Ezekhez a naplókhoz az
          üzemeltető nem fér hozzá. Az adatkezelés jogalapja a biztonságos
          kiszolgáláshoz fűződő jogos érdek (GDPR 6. cikk (1) f) pont); a
          részleteket, köztük az Egyesült Államokba történő adattovábbítás
          garanciáit,{' '}
          <a href='https://docs.github.com/en/site-policy/privacy-policies/github-general-privacy-statement'>
            a GitHub adatvédelmi nyilatkozata
          </a>{' '}
          tartalmazza.
        </p>

        <h2>A böngésződben tárolt adatok</h2>
        <p>
          Az oldal a böngésződ helyi tárhelyén (localStorage) megjegyzi a
          választott témát. Ez az adat nem kerül el a gépedről, és bármikor
          törölheted. A részletek a{' '}
          <Link href='/cookies'>süti-tájékoztatóban</Link> olvashatók.
        </p>

        <h2>Vágólap</h2>
        <p>
          A „TeX másolása” gombok csak megnyomásukkor írnak a vágólapra; az
          oldal a vágólap tartalmát nem olvassa.
        </p>

        <h2>Jogaid</h2>
        <p>
          A GDPR alapján jogod van tájékoztatást kérni a személyes adataid
          kezeléséről, kérheted azok helyesbítését, törlését vagy kezelésük
          korlátozását, és tiltakozhatsz a kezelésük ellen. Mivel az üzemeltető
          nem kezel személyes adatot, a tárhelyszolgáltató naplóival kapcsolatos
          kérésekkel a GitHubhoz fordulhatsz. Panaszt a Nemzeti Adatvédelmi és
          Információszabadság Hatóságnál (<a href='https://naih.hu'>naih.hu</a>)
          tehetsz, vagy bírósághoz fordulhatsz.
        </p>

        <h2>Változások</h2>
        <p>
          Ha az oldal működése adatkezelést érintően megváltozik, ez a
          tájékoztató is frissül; a hatálybalépés dátuma a lap tetején
          olvasható.
        </p>
      </Prose>
    </>
  );
}
