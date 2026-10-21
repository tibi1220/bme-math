'use client';

import { useEffect, useState } from 'react';

// Copies `text` to the clipboard, e.g. an exercise's TeX source, so it can be
// pasted into an AI assistant.
export function CopyButton({ text, label }: { text: string; label: string }) {
  const [status, setStatus] = useState<'idle' | 'copied' | 'failed'>('idle');

  useEffect(() => {
    if (status === 'idle') return;
    const timer = setTimeout(() => setStatus('idle'), 2000);
    return () => clearTimeout(timer);
  }, [status]);

  async function copy() {
    try {
      await navigator.clipboard.writeText(text);
      setStatus('copied');
    } catch {
      setStatus('failed');
    }
  }

  return (
    <button
      type='button'
      onClick={copy}
      className='rounded border border-zinc-200 dark:border-zinc-800 px-1.5 py-0.5 text-xs font-medium text-zinc-600 dark:text-zinc-400 hover:border-zinc-400 dark:hover:border-zinc-600 hover:text-zinc-900 dark:hover:text-zinc-100'
    >
      {status === 'copied'
        ? 'Másolva!'
        : status === 'failed'
          ? 'Nem sikerült'
          : label}
    </button>
  );
}
