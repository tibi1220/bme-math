import Link from 'next/link';

export function LinkCard({
  href,
  title,
  description,
}: {
  href?: string;
  title: string;
  description?: string;
}) {
  const content = (
    <>
      <span className='font-medium text-zinc-900 dark:text-zinc-100'>
        {title}
      </span>
      {description && (
        <span className='mt-0.5 block text-sm text-zinc-500 dark:text-zinc-400'>
          {description}
        </span>
      )}
    </>
  );

  if (!href) {
    return (
      <div className='block rounded-lg border border-dashed border-zinc-200 dark:border-zinc-800 px-4 py-3 opacity-60'>
        {content}
      </div>
    );
  }

  return (
    <Link
      href={href}
      className='block rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 px-4 py-3 transition-colors hover:border-zinc-400 dark:hover:border-zinc-600'
    >
      {content}
    </Link>
  );
}
