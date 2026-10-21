'use client';

import { useState } from 'react';
import { ExerciseCard } from '@/components/exercise-card';
import { testKinds, type TestKind } from '@/lib/catalog';
import type { Exercise } from '@/lib/exercise';

export type PracticeItem = {
  id: string;
  year: number;
  kind: TestKind;
  topic: string;
  // Where the exercise comes from, linking to its test.
  source: { label: string; href: string };
  badge?: { label: string; href: string };
};

function toggle<T>(set: Set<T>, value: T) {
  const next = new Set(set);
  if (next.has(value)) next.delete(value);
  else next.add(value);
  return next;
}

function Chip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type='button'
      aria-pressed={active}
      onClick={onClick}
      className={`rounded-md border px-2.5 py-1 text-sm transition-colors ${
        active
          ? 'border-zinc-900 dark:border-zinc-100 bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900'
          : 'border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:border-zinc-400 dark:hover:border-zinc-600'
      }`}
    >
      {children}
    </button>
  );
}

function FilterGroup({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <fieldset>
      <legend className='mb-2 text-sm font-medium text-zinc-700 dark:text-zinc-300'>
        {title}{' '}
        <span className='font-normal text-zinc-500 dark:text-zinc-400'>
          (ha egy sincs kijelölve: mind)
        </span>
      </legend>
      <div className='flex flex-wrap gap-2'>{children}</div>
    </fieldset>
  );
}

// Picks random exercises matching the chosen topics, years and test kinds.
// Each exercise is fetched on demand from `dataPath`/<id>.json.
export function Practice({
  items,
  topics,
  years,
  dataPath,
}: {
  items: PracticeItem[];
  topics: { id: string; name: string }[];
  years: number[];
  dataPath: string;
}) {
  const [selectedTopics, setSelectedTopics] = useState(new Set<string>());
  const [selectedYears, setSelectedYears] = useState(new Set<number>());
  const [selectedKinds, setSelectedKinds] = useState(new Set<TestKind>());
  const [current, setCurrent] = useState<{
    item: PracticeItem;
    exercise: Exercise;
  } | null>(null);
  const [status, setStatus] = useState<'idle' | 'loading' | 'error'>('idle');

  const matching = items.filter(
    item =>
      (selectedTopics.size === 0 || selectedTopics.has(item.topic)) &&
      (selectedYears.size === 0 || selectedYears.has(item.year)) &&
      (selectedKinds.size === 0 || selectedKinds.has(item.kind)),
  );
  // Only the kinds of tests that actually have exercises.
  const kinds = (Object.keys(testKinds) as TestKind[]).filter(kind =>
    items.some(item => item.kind === kind),
  );

  async function pick() {
    // Avoid showing the same exercise twice in a row when there is a choice.
    const candidates =
      matching.length > 1
        ? matching.filter(item => item.id !== current?.item.id)
        : matching;
    const item = candidates[Math.floor(Math.random() * candidates.length)];
    if (!item) return;
    setStatus('loading');
    try {
      const response = await fetch(`${dataPath}/${item.id}.json`);
      if (!response.ok) throw new Error(response.statusText);
      setCurrent({ item, exercise: await response.json() });
      setStatus('idle');
    } catch {
      setStatus('error');
    }
  }

  return (
    <div className='space-y-8'>
      <div className='space-y-5 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-5'>
        <FilterGroup title='Témakör'>
          {topics.map(topic => (
            <Chip
              key={topic.id}
              active={selectedTopics.has(topic.id)}
              onClick={() =>
                setSelectedTopics(toggle(selectedTopics, topic.id))
              }
            >
              {topic.name}
            </Chip>
          ))}
        </FilterGroup>
        <FilterGroup title='Év'>
          {years.map(year => (
            <Chip
              key={year}
              active={selectedYears.has(year)}
              onClick={() => setSelectedYears(toggle(selectedYears, year))}
            >
              {year}
            </Chip>
          ))}
        </FilterGroup>
        <FilterGroup title='Típus'>
          {kinds.map(kind => (
            <Chip
              key={kind}
              active={selectedKinds.has(kind)}
              onClick={() => setSelectedKinds(toggle(selectedKinds, kind))}
            >
              {testKinds[kind].label}
            </Chip>
          ))}
        </FilterGroup>
        <div className='flex flex-wrap items-center gap-4 border-t border-zinc-200 dark:border-zinc-800 pt-4'>
          <button
            type='button'
            onClick={pick}
            disabled={matching.length === 0 || status === 'loading'}
            className='rounded-md bg-zinc-900 dark:bg-zinc-100 px-4 py-2 text-sm font-medium text-white dark:text-zinc-900 hover:bg-zinc-700 dark:hover:bg-zinc-300 disabled:cursor-not-allowed disabled:opacity-40'
          >
            {current ? 'Másik véletlen feladat' : 'Véletlen feladat'}
          </button>
          <span className='text-sm text-zinc-500 dark:text-zinc-400'>
            {matching.length} feladat közül
          </span>
        </div>
      </div>

      {status === 'error' && (
        <p className='text-sm text-red-700 dark:text-red-400'>
          Nem sikerült betölteni a feladatot. Próbáld újra!
        </p>
      )}
      {current && (
        <ExerciseCard
          key={current.item.id}
          exercise={current.exercise}
          source={current.item.source}
          topic={current.item.badge}
        />
      )}
    </div>
  );
}
