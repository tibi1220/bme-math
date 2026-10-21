import Link from 'next/link';
import { repositoryUrl } from '@/lib/site';

const linkClass =
  'hover:text-zinc-900 dark:hover:text-zinc-100 hover:underline';

export function Footer() {
  return (
    <footer className='border-t border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900'>
      <div className='mx-auto flex max-w-3xl flex-col gap-3 px-4 py-6 text-sm text-zinc-500 dark:text-zinc-400 sm:flex-row sm:items-center sm:justify-between'>
        <p>Nem hivatalos, hallgatói oldal; nem a BME kiadványa.</p>
        <nav aria-label='Jogi információk'>
          <ul className='flex flex-wrap gap-x-4 gap-y-1'>
            <li>
              <Link
                href='/privacy'
                className={linkClass}
              >
                Adatkezelési tájékoztató
              </Link>
            </li>
            <li>
              <Link
                href='/cookies'
                className={linkClass}
              >
                Sütik
              </Link>
            </li>
            <li>
              <a
                href={repositoryUrl}
                className={linkClass}
              >
                Forráskód
              </a>
            </li>
          </ul>
        </nav>
      </div>
    </footer>
  );
}
