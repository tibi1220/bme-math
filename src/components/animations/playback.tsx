'use client';

import { Pause, Play } from 'lucide-react';
import { useEffect, useState, useSyncExternalStore } from 'react';

// Shared by the figure animations: a parameter that sweeps from `min` to
// `max` in `seconds`, rests for `restSeconds` on the full sweep and starts
// over. It plays unless the visitor prefers reduced motion; pressing play or
// moving the slider overrides that.

const reducedMotionQuery = '(prefers-reduced-motion: reduce)';

function subscribeReducedMotion(onChange: () => void) {
  const query = window.matchMedia(reducedMotionQuery);
  query.addEventListener('change', onChange);
  return () => query.removeEventListener('change', onChange);
}

export function usePlayback({
  initial,
  min,
  max,
  seconds,
  restSeconds = 1,
}: {
  initial: number;
  min: number;
  max: number;
  seconds: number;
  restSeconds?: number;
}) {
  const speed = (max - min) / seconds;
  const rest = speed * restSeconds;
  // Past `max` the figure rests on the full sweep.
  const [phase, setPhase] = useState(initial);
  // null: play unless the visitor prefers reduced motion.
  const [playing, setPlaying] = useState<boolean | null>(null);
  const reducedMotion = useSyncExternalStore(
    subscribeReducedMotion,
    () => window.matchMedia(reducedMotionQuery).matches,
    // The server renders the first frame, still.
    () => true,
  );
  const running = playing ?? !reducedMotion;

  useEffect(() => {
    if (!running) return;
    let frame = 0;
    let last: number | null = null;
    const tick = (now: number) => {
      if (last !== null) {
        const step = ((now - last) / 1000) * speed;
        setPhase(p => (p + step > max + rest ? min : p + step));
      }
      last = now;
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [running, speed, rest, min, max]);

  return {
    value: Math.min(phase, max),
    running,
    toggle: () => setPlaying(!running),
    scrub: (value: number) => {
      setPlaying(false);
      setPhase(value);
    },
  };
}

// Hungarian decimal comma, and a real minus sign.
export const decimal = (value: number) =>
  value.toFixed(2).replace('.', ',').replace('-', '−');

export const mathFont = { fontFamily: 'var(--font-stix-two), serif' };

// The colours of the TikZ figures, with lighter versions for the dark theme.
export const colors = {
  blue: 'stroke-[#1f77b4] dark:stroke-[#5aa9e6]',
  orange: 'stroke-[#ff7f0e] dark:stroke-[#ffa357]',
  orangeFill: 'fill-[#ff7f0e] dark:fill-[#ffa357]',
  axis: 'stroke-zinc-500 dark:stroke-zinc-400',
  axisFill: 'fill-zinc-500 dark:fill-zinc-400',
  ink: 'stroke-zinc-900 dark:stroke-zinc-100',
  inkFill: 'fill-zinc-900 dark:fill-zinc-100',
  faded: 'stroke-zinc-300 dark:stroke-zinc-700',
  fadedFill: 'fill-zinc-300 dark:fill-zinc-700',
  guide: 'stroke-zinc-400 dark:stroke-zinc-500',
};

// Play/pause, a slider for the parameter and a readout of the values.
export function PlaybackControls({
  playback,
  min,
  max,
  label,
  children,
}: {
  playback: ReturnType<typeof usePlayback>;
  min: number;
  max: number;
  // What the slider sets, e.g. "Az α szög".
  label: string;
  children: React.ReactNode;
}) {
  const { running, toggle, scrub, value } = playback;
  return (
    <div className='mt-2 flex flex-wrap items-center justify-center gap-x-4 gap-y-2 text-sm'>
      <button
        type='button'
        onClick={toggle}
        aria-label={running ? 'Szünet' : 'Lejátszás'}
        title={running ? 'Szünet' : 'Lejátszás'}
        className='rounded-md border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-1.5 hover:border-zinc-400 dark:hover:border-zinc-600'
      >
        {running ? (
          <Pause
            aria-hidden
            className='size-4'
          />
        ) : (
          <Play
            aria-hidden
            className='size-4'
          />
        )}
      </button>
      <input
        type='range'
        min={min}
        max={max}
        step={0.01}
        value={value}
        onChange={event => scrub(Number(event.target.value))}
        aria-label={label}
        className='w-48 accent-[#ff7f0e]'
      />
      <span
        className='tabular-nums text-zinc-600 dark:text-zinc-400'
        style={mathFont}
      >
        {children}
      </span>
    </div>
  );
}
