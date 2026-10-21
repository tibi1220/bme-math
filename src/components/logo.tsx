// The site logo: a radical sign on a rounded square, the same mark as
// src/app/icon.svg, with colors that follow the theme.
export function Logo({ className }: { className?: string }) {
  return (
    <svg
      viewBox='0 0 32 32'
      aria-hidden
      className={className}
    >
      <rect
        width='32'
        height='32'
        rx='7'
        className='fill-zinc-900 dark:fill-zinc-100'
      />
      <path
        d='M5.5 17.5 9 15.5 13.5 24.5 19 7.5H26.5'
        fill='none'
        strokeWidth='2.6'
        strokeLinecap='round'
        strokeLinejoin='round'
        className='stroke-white dark:stroke-zinc-900'
      />
      <circle
        cx='22.75'
        cy='17.5'
        r='2.4'
        className='fill-sky-400 dark:fill-sky-500'
      />
    </svg>
  );
}
