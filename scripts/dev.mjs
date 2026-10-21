#!/usr/bin/env node
// pnpm dev: builds the content once, then runs next dev together with the
// content watcher, which recompiles changed .tex files. Stopping either one
// stops both.

import { spawn, spawnSync } from 'node:child_process';
import path from 'node:path';

const ROOT = path.resolve(import.meta.dirname, '..');

// The generated content is not in git, so a fresh clone has none yet; build
// it before next dev starts importing it. A failed file is reported, and the
// watcher retries it after the next edit.
spawnSync(process.execPath, [path.join(ROOT, 'scripts', 'build-content.mjs')], {
  cwd: ROOT,
  stdio: 'inherit',
});

const children = [
  // --watch-path restarts the watcher when the pipeline itself changes, so it
  // never keeps writing content with outdated code.
  spawn(
    process.execPath,
    [
      '--watch-path',
      path.join(ROOT, 'scripts', 'build-content.mjs'),
      '--watch-path',
      path.join(ROOT, 'src', 'lib', 'catalog.ts'),
      path.join(ROOT, 'scripts', 'build-content.mjs'),
      '--watch',
    ],
    {
      cwd: ROOT,
      stdio: 'inherit',
    },
  ),
  spawn(
    process.execPath,
    [
      path.join(ROOT, 'node_modules', 'next', 'dist', 'bin', 'next'),
      'dev',
      ...process.argv.slice(2),
    ],
    {
      cwd: ROOT,
      stdio: 'inherit',
    },
  ),
];

let exiting = false;
function stopAll(code) {
  if (exiting) return;
  exiting = true;
  for (const child of children) {
    if (child.exitCode === null) child.kill('SIGTERM');
  }
  process.exitCode = code;
}

for (const child of children) {
  child.on('exit', code => stopAll(code ?? 0));
}
for (const signal of ['SIGINT', 'SIGTERM']) {
  process.on(signal, () => stopAll(0));
}
