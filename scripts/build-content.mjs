#!/usr/bin/env node
// Converts the exercise .tex files under content/ to HTML fragments with
// lwarp, renders their math with KaTeX and writes everything, together with
// the YAML metadata, to src/generated/content.json. The topic materials
// (content/<subject>/topics/<NN-topic>/<group>/<name>.tex) are converted the
// same way, and published as PDFs too.
//
// Usage: pnpm content [--force] [--watch]
//
// Each converted file is cached by the hash of its source, so only changed
// files are recompiled. --force ignores the cache. --watch rebuilds whenever a
// .tex file under content/ changes (pnpm dev runs it next to next dev).

import { execFile } from 'node:child_process';
import { createHash } from 'node:crypto';
import { watch } from 'node:fs';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { promisify } from 'node:util';
import katex from 'katex';
import YAML from 'yaml';
import {
  exams as examNames,
  subjects as subjectInfos,
  variants as variantInfos,
} from '../src/lib/catalog.ts';

const run = promisify(execFile);

const ROOT = path.resolve(import.meta.dirname, '..');
const CONTENT_DIR = path.join(ROOT, 'content');
const OUT_FILE = path.join(ROOT, 'src', 'generated', 'content.json');
const CACHE_DIR = path.join(ROOT, 'node_modules', '.cache', 'lwarp');
const DOWNLOADS_DIR = path.join(ROOT, 'public', 'downloads');

// Bump these whenever the conversion below changes, to invalidate the cache:
// one version for the exercises, one for the topic materials.
const PIPELINE_VERSION = { exercise: '9', material: '12' };

const EXERCISE_FILE = /^(\d{4})-([a-z]+)-(\d+)\.tex$/;
// The solution of 2025-a-1.tex lives next to it in 2025-a-1-sol.tex.
const SOLUTION_FILE = /^(\d{4}-[a-z]+-\d+)-sol\.tex$/;
const TOPIC_DIR = /^(\d+)-(.+)$/;

let force = process.argv.includes('--force');
const watchMode = process.argv.includes('--watch');

// ---------------------------------------------------------------------------
// Source discovery

async function listDirs(dir) {
  try {
    const entries = await fs.readdir(dir, { withFileTypes: true });
    return entries
      .filter(e => e.isDirectory() && !e.name.startsWith('.'))
      .map(e => e.name)
      .sort();
  } catch {
    return [];
  }
}

async function discover() {
  const subjects = [];
  for (const subject of await listDirs(CONTENT_DIR)) {
    const subjectDir = path.join(CONTENT_DIR, subject);

    const topics = [];
    for (const dir of await listDirs(path.join(subjectDir, 'topics'))) {
      const match = TOPIC_DIR.exec(dir);
      if (!match) continue;
      const topicDir = path.join(subjectDir, 'topics', dir);
      const materials = [];
      for (const group of await listDirs(topicDir)) {
        const groupDir = path.join(topicDir, group);
        for (const name of (await fs.readdir(groupDir)).sort()) {
          if (!name.endsWith('.tex')) continue;
          const file = path.join(groupDir, name);
          // A file that is still empty is a placeholder, not a document.
          if ((await fs.readFile(file, 'utf8')).trim() === '') continue;
          materials.push({ file, group, slug: name.replace(/\.tex$/, '') });
        }
      }
      topics.push({ id: match[1], slug: match[2], materials });
    }

    const exams = [];
    for (const exam of await listDirs(path.join(subjectDir, 'exams'))) {
      const examDir = path.join(subjectDir, 'exams', exam);
      const files = [];
      for (const year of await listDirs(examDir)) {
        const yearDir = path.join(examDir, year);
        const names = (await fs.readdir(yearDir)).sort();
        for (const name of names) {
          const solution = SOLUTION_FILE.exec(name);
          if (solution && !names.includes(`${solution[1]}.tex`)) {
            console.warn(
              `warning: ${path.relative(ROOT, path.join(yearDir, name))} has no exercise file`,
            );
          }
        }
        for (const name of names) {
          const match = EXERCISE_FILE.exec(name);
          if (!match) continue;
          if (match[1] !== year) {
            throw new Error(
              `${path.join(yearDir, name)}: year does not match its folder`,
            );
          }
          const solutionName = name.replace(/\.tex$/, '-sol.tex');
          files.push({
            file: path.join(yearDir, name),
            solutionFile: names.includes(solutionName)
              ? path.join(yearDir, solutionName)
              : null,
            year: Number(match[1]),
            variant: match[2],
            number: Number(match[3]),
          });
        }
      }
      exams.push({ slug: exam, files });
    }

    subjects.push({ dir: subject, topics, exams });
  }
  return subjects;
}

// ---------------------------------------------------------------------------
// Metadata

// The exercise itself, without the docstring and preamble: what the "copy
// TeX" button on the website puts on the clipboard.
// The preamble lines of a document (packages, macros), for the combined test
// PDFs, which must load everything the single files load.
function preambleLines(source) {
  const match = /\\documentclass[^\n]*\n([\s\S]*?)\\begin\{document\}/.exec(
    source,
  );
  return (match?.[1] ?? '')
    .split('\n')
    .map(line => line.trim())
    .filter(line => line && !line.startsWith('%'));
}

function documentBody(source) {
  const match = /\\begin\{document\}([\s\S]*?)\\end\{document\}/.exec(source);
  if (!match) throw new Error('no document environment found');
  return match[1].replace(/^\s*\n/, '').trimEnd();
}

// The YAML docstring at the top of a .tex file (between two "% ---" lines),
// or null if there is none.
function readDocstring(source, file) {
  const lines = source.split('\n');
  if (lines[0]?.trim() !== '% ---') return null;
  const end = lines.findIndex((line, i) => i > 0 && line.trim() === '% ---');
  if (end === -1) throw new Error(`${file}: unterminated YAML docstring`);

  const yaml = lines
    .slice(1, end)
    .map(line => line.replace(/^%\s?/, ''))
    .join('\n');
  return YAML.parse(yaml) ?? {};
}

function parseFrontMatter(source, file) {
  const data = readDocstring(source, file);
  if (!data) throw new Error(`${file}: missing YAML docstring`);

  const topic = String(data.topic ?? '').padStart(2, '0');
  const points = Array.isArray(data.points) ? data.points.map(Number) : [];
  if (!data.topic || points.length === 0 || points.some(Number.isNaN)) {
    throw new Error(`${file}: the docstring needs a topic and a points list`);
  }
  return { topic, points, imsc: data.imsc === true };
}

// ---------------------------------------------------------------------------
// lwarp

// Compiled with lualatex, like the PDFs (see .latexmkrc), so the documents keep
// their own preamble. On the website, enumerations are labelled a), b), ...
// instead of 1., 2., ...
const LWARP_PREAMBLE = [
  '\\usepackage[mathjax,HomeHTMLFilename=index]{lwarp}',
  '\\AtBeginDocument{\\renewcommand{\\labelenumi}{\\alph{enumi})}}',
].join('\n');

// A topic material is a whole article: it stays in one HTML file instead of
// one per section, and the page shows its title, so \maketitle goes.
const MATERIAL_PREAMBLE = '\\setcounter{FileDepth}{-5}';

function toLwarpSource(source, kind) {
  const preamble =
    kind === 'material'
      ? `${LWARP_PREAMBLE}\n${MATERIAL_PREAMBLE}`
      : LWARP_PREAMBLE;
  let withLwarp = source.replace(
    /^(\\documentclass(\[[^\]]*\])?\{[^}]*\}\s*\n)/m,
    documentclass => `${documentclass}${preamble}\n`,
  );
  if (withLwarp === source) throw new Error('no \\documentclass found');
  if (kind === 'material') withLwarp = withLwarp.replace(/\\maketitle\b/, '');
  return withLwarp;
}

async function runLwarp(source, kind) {
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), 'lwarp-'));
  try {
    await fs.writeFile(
      path.join(dir, 'exercise.tex'),
      toLwarpSource(source, kind),
    );
    const options = { cwd: dir, maxBuffer: 64 * 1024 * 1024 };
    try {
      await run(
        'lualatex',
        ['-interaction=nonstopmode', '-halt-on-error', 'exercise.tex'],
        options,
      );
      await run('lwarpmk', ['html'], options);
    } catch (error) {
      const log = await fs
        .readFile(path.join(dir, 'exercise_html.log'), 'utf8')
        .catch(() => fs.readFile(path.join(dir, 'exercise.log'), 'utf8'))
        .catch(() => '');
      error.message += `\n--- LaTeX log (tail) ---\n${log.split('\n').slice(-30).join('\n')}`;
      throw error;
    }
    const html = await fs.readFile(path.join(dir, 'index.html'), 'utf8');
    return await embedImages(html, dir, options);
  } finally {
    await fs.rm(dir, { recursive: true, force: true });
  }
}

// lwarp turns pictures (tikzpicture, ...) into SVG files referenced from the
// HTML. They are inlined as data URIs, so content.json stays self-contained.
const LATEX_IMAGE =
  /<span\s+id="lateximage-[^"]*"\s+class="lateximagesource"\s*>(?:<!--[\s\S]*?-->)?<img\s+src="([^"]+\.svg)"[\s\S]*?><\/span>/g;

async function embedImages(html, dir, options) {
  const sources = [...html.matchAll(LATEX_IMAGE)].map(match => match[1]);
  if (sources.length === 0) return html;

  await run('lwarpmk', ['limages'], options);
  const svgs = new Map();
  for (const src of new Set(sources)) {
    svgs.set(src, await readFinishedSvg(path.join(dir, src)));
  }
  return html.replace(LATEX_IMAGE, (_, src) => {
    const data = Buffer.from(svgs.get(src)).toString('base64');
    return `<img src="data:image/svg+xml;base64,${data}" alt="" class="lateximage">`;
  });
}

// lwarpmk limages runs pdftocairo in the background on Unix, so wait until
// each SVG has been written completely.
async function readFinishedSvg(file, timeoutMs = 60_000) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    const svg = await fs.readFile(file, 'utf8').catch(() => '');
    if (svg.trimEnd().endsWith('</svg>')) return svg;
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  throw new Error(`timed out waiting for ${path.basename(file)}`);
}

// ---------------------------------------------------------------------------
// HTML post-processing

function decodeNumericEntities(text) {
  return text
    .replace(/&#x([0-9a-f]+);/gi, (_, hex) =>
      String.fromCodePoint(parseInt(hex, 16)),
    )
    .replace(/&#(\d+);/g, (_, dec) => String.fromCodePoint(parseInt(dec, 10)));
}

function unescapeHtml(text) {
  return decodeNumericEntities(text)
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&amp;/g, '&');
}

function extractFragment(html) {
  const start = html.search(/<a id="[^"]*-autopage-1"><\/a>/);
  const end = html.search(/<a id="[^"]*-autofile-last"><\/a>/);
  if (start === -1 || end === -1) throw new Error('unexpected lwarp output');
  // Keep the anchors of \label (targets of \ref links), drop lwarp's own.
  return html.slice(start, end).replace(/<a id="[^"]*auto[^"]*"><\/a>/g, '');
}

// KaTeX builds accented letters in \text{} from a base letter and an accent
// placed with its own font metrics, which misplaces the accent in STIX Two.
// Registered as plain text symbols, they are drawn as single glyphs instead.
for (const char of 'áéíóöőúüűÁÉÍÓÖŐÚÜŰ') {
  katex.__defineSymbol('text', 'main', 'textord', char, char);
}

// Commands from LaTeX packages that KaTeX does not know.
const KATEX_MACROS = {
  // xfrac: a slanted fraction.
  '\\sfrac': '{}^{#1}\\!/\\!{}_{#2}',
};

// The operators a document declares itself (\\DeclareMathOperator{\\arsinh}
// {arsinh}), as KaTeX macros.
function documentMacros(source) {
  const macros = {};
  for (const match of source.matchAll(
    /\\DeclareMathOperator(\*?)\{(\\[A-Za-z]+)\}\{([^}]*)\}/g,
  )) {
    macros[match[2]] = `\\operatorname${match[1]}{${match[3]}}`;
  }
  return macros;
}

function renderTex(tex, displayMode, macros = {}) {
  return katex.renderToString(tex, {
    displayMode,
    macros: { ...KATEX_MACROS, ...macros },
    throwOnError: true,
    // The Hungarian letters registered above have no KaTeX font metrics;
    // the browser measures them itself, so the warning is only noise.
    strict: errorCode =>
      errorCode === 'unicodeTextInMathMode' || errorCode === 'symbolNotInFont'
        ? 'ignore'
        : 'warn',
    output: 'htmlAndMathml',
  });
}

function renderMath(html, macros = {}) {
  return html.replace(
    /\\\[([\s\S]*?)\\\]|\\\(([\s\S]*?)\\\)/g,
    (_, display, inline) =>
      renderTex(
        unescapeHtml(display ?? inline).trim(),
        display !== undefined,
        macros,
      ),
  );
}

// A list item that starts with display math gets its marker in a paragraph of
// its own. The class lets the website place that marker next to the formula;
// CSS alone cannot tell such a paragraph from one with text after the marker.
function tidy(html) {
  return html
    .replace(
      /<p>\s*(<span class="listmarker">[^<]*<\/span>)\s*<\/p>/g,
      '<p class="listmarker-only">$1</p>',
    )
    .replace(
      /<ul class="(enumerate|itemize)" style="list-style-type:none">/g,
      '<ul class="$1">',
    )
    .replace(/\n{2,}/g, '\n')
    .trim();
}

// The extra structure of a topic material: theorem-like blocks, figure
// captions and cross-references.
function tidyMaterial(html) {
  return (
    html
      // amsthm wraps each block in a one-item list, with the label as its
      // marker; unwrap it so the list styles do not apply.
      .replace(
        /<div class="(amsthm(?:body\w+|proof))">\s*<ul class="list"[^>]*>\s*<li>([\s\S]*?)<\/li>\s*<\/ul>\s*<\/div>/g,
        (_, kind, body) =>
          `<div class="theorem ${kind}">${body.replace('<span class="listmarker">', '<span class="theorem-label">')}</div>`,
      )
      // "3. ábra. …" follows the picture as loose text, or in a paragraph of
      // its own (lwarp does that with longer captions).
      .replace(
        /(<figure[^>]*>[\s\S]*?<\/p>)\s*(?:<p>\s*)?(\d+\.&nbsp;ábra\.)([\s\S]*?)\s*(?:<\/p>\s*)?(?=<a id=|<\/div>)/g,
        '$1<figcaption><span class="caption-label">$2</span>$3</figcaption>',
      )
      // The website justifies the materials; a space after a list marker
      // would be stretched too, and the marker has a fixed width anyway.
      .replace(/(<span class="listmarker">[^<]*<\/span>)\s+/g, '$1')
      // \ref links point into lwarp's own HTML files.
      .replace(/href="[^"#]*\.html#/g, 'href="#')
      // lwarp puts the \label of a figure after its caption, so a link to it
      // would scroll the bottom of the figure to the top of the window. The
      // label becomes the id of the figure instead.
      .replace(
        /<figure id="[^"]*"([^>]*)>((?:(?!<\/figure>)[\s\S])*?)<a id="([^"]+)"><\/a>\s*/g,
        '<figure id="$3"$1>$2',
      )
      .replace(/<p>\s*<\/p>/g, '')
  );
}

function toFragment(lwarpHtml, kind, macros) {
  // pdftotext yields decomposed accents (u + U+0308); recompose them.
  const fragment = decodeNumericEntities(extractFragment(lwarpHtml)).normalize(
    'NFC',
  );
  const html = tidy(renderMath(fragment, macros));
  return kind === 'material' ? tidyMaterial(html) : html;
}

// The sections (level 1) and subsections (level 2) of a material, for the
// table of contents on its page. lwarp sets them as <h4> and <h5>, with the
// number in a span of its own; the title is kept as HTML, as it may contain
// math.
function tableOfContents(html) {
  return [...html.matchAll(/<h([45]) id="([^"]+)">([\s\S]*?)<\/h\1>/g)].map(
    ([, level, id, inner]) => {
      const number = /<span class="sectionnumber">([^<]*)<\/span>/.exec(inner);
      return {
        id,
        level: level === '4' ? 1 : 2,
        number: number?.[1].trim() ?? '',
        title: inner.replace(number?.[0] ?? '', '').trim(),
      };
    },
  );
}

// Rewriting an unchanged file would still make next dev reload the page.
async function writeIfChanged(file, data) {
  const previous = await fs.readFile(file).catch(() => null);
  if (previous?.equals(data)) return;
  await fs.mkdir(path.dirname(file), { recursive: true });
  await fs.writeFile(file, data);
}

// ---------------------------------------------------------------------------
// Downloadable tests
//
// Every test is also published as a PDF, with and without the solutions,
// under public/downloads/<subject>/<exam>/<year>-<variant>[-solutions].pdf.

function pointsLabel(points) {
  const total = points.reduce((a, b) => a + b, 0);
  return points.length > 1
    ? `${points.join(' + ')} = ${total} pont`
    : `${total} pont`;
}

// "1. pótzárthelyi" → "1. Pótzárthelyi", as in the headers of the originals.
function capitalize(title) {
  return title.replace(
    /^([\d.\s]*)(\p{L})/u,
    (_, prefix, letter) => prefix + letter.toUpperCase(),
  );
}

// Laid out like the original exam sheets: a three-column header with a rule
// under it, then the exercises as a list labelled "1. feladat (… pont)".
function testDocument({
  subject,
  exam,
  year,
  variant,
  exercises,
  withSolutions,
  preamble,
}) {
  const name = capitalize(exam[variant.kind]);
  const packages = [
    '\\usepackage[stixtwo]{fontsetup}',
    '\\usepackage{amsmath}',
    '\\usepackage{tikz}',
    '\\usepackage[magyar]{babel}',
    '\\usepackage[margin=1in]{geometry}',
    '\\usepackage{enumitem}',
  ];
  // Whatever else the exercises (and solutions) load, e.g. xfrac.
  const extra = [...new Set(preamble)].filter(line => !packages.includes(line));
  const lines = [
    '\\documentclass[11pt]{scrartcl}',
    ...packages,
    ...extra,
    '\\setlength{\\parindent}{0pt}',
    '\\setlength{\\parskip}{0.66em}',
    '\\setlist{parsep=0.66em}',
    '\\setlist[enumerate, 2]{label=\\alph*)}',
    '\\pagestyle{empty}',
    '\\begin{document}',
    '\\begin{tabular*}{\\textwidth}{@{}l@{\\extracolsep{\\fill}}c@{\\extracolsep{\\fill}}r@{}}',
    `\\textbf{\\MakeUppercase{${subject.name}}} & \\textbf{${name}} & \\textbf{${year}.} \\\\`,
    `${subject.description} & ${variant.letter ? `${variant.letter}-variáns` : ''} & ${withSolutions ? 'Megoldásokkal' : ''}`,
    '\\end{tabular*}',
    '',
    '\\vspace{-0.66em}\\rule{\\textwidth}{0.4pt}',
    '',
    '\\begin{enumerate}[wide=0pt, itemsep=1.5em]',
  ];
  for (const exercise of exercises) {
    const points = `${pointsLabel(exercise.points)}${exercise.imsc ? ', IMSC-seknek javasolt' : ''}`;
    lines.push(
      `\\item[\\textbf{${exercise.number}. feladat}] \\textbf{(${points})}`,
      '',
      exercise.tex,
    );
    if (withSolutions && exercise.solutionTex) {
      lines.push('', '\\textit{Megoldás.}', '', exercise.solutionTex);
    }
    lines.push('');
  }
  lines.push('\\end{enumerate}', '\\end{document}', '');
  return lines.join('\n');
}

// `runs` > 1 resolves cross-references (\ref) in the materials.
async function compilePdf(tex, runs = 1) {
  const hash = createHash('sha256').update(`${runs}`).update(tex).digest('hex');
  const cached = path.join(CACHE_DIR, `${hash}.pdf`);
  const hit = await fs.readFile(cached).catch(() => null);
  if (hit) return { pdf: hit, fromCache: true };

  const dir = await fs.mkdtemp(path.join(os.tmpdir(), 'test-pdf-'));
  try {
    await fs.writeFile(path.join(dir, 'test.tex'), tex);
    try {
      for (let i = 0; i < runs; i++) {
        await run(
          'lualatex',
          ['-interaction=nonstopmode', '-halt-on-error', 'test.tex'],
          { cwd: dir, maxBuffer: 64 * 1024 * 1024 },
        );
      }
    } catch (error) {
      const log = await fs
        .readFile(path.join(dir, 'test.log'), 'utf8')
        .catch(() => '');
      error.message += `\n--- LaTeX log (tail) ---\n${log.split('\n').slice(-30).join('\n')}`;
      throw error;
    }
    const pdf = await fs.readFile(path.join(dir, 'test.pdf'));
    await fs.mkdir(CACHE_DIR, { recursive: true });
    await fs.writeFile(cached, pdf);
    return { pdf, fromCache: false };
  } finally {
    await fs.rm(dir, { recursive: true, force: true });
  }
}

async function listFiles(dir) {
  const entries = await fs
    .readdir(dir, { recursive: true, withFileTypes: true })
    .catch(() => []);
  return entries
    .filter(e => e.isFile())
    .map(e => path.join(e.parentPath, e.name));
}

function testPdfJobs(subjects, converted, preambles) {
  const jobs = [];
  for (const subject of subjects) {
    const subjectInfo = subjectInfos.find(info => info.dir === subject.dir);
    if (!subjectInfo) continue;
    for (const exam of subject.exams) {
      const examInfo = examNames[exam.slug] ?? {
        regular: exam.slug,
        retake: exam.slug,
        'second-retake': exam.slug,
      };
      const tests = Map.groupBy(
        exam.files,
        job => `${job.year}-${job.variant}`,
      );
      for (const files of tests.values()) {
        const { year, variant } = files[0];
        const variantInfo = variantInfos[variant];
        if (!variantInfo) continue;
        const exercises = files
          .toSorted((a, b) => a.number - b.number)
          .map(job => ({
            ...converted.get(job.file),
            number: job.number,
            file: job.file,
          }));
        const base = path.join(
          DOWNLOADS_DIR,
          subjectInfo.slug,
          exam.slug,
          `${year}-${variantInfo.slug}`,
        );
        const doc = withSolutions =>
          testDocument({
            subject: subjectInfo,
            exam: examInfo,
            year,
            variant: variantInfo,
            exercises,
            withSolutions,
            preamble: files.flatMap(job => {
              const lines = preambles.get(job.file);
              return withSolutions
                ? [...lines.exercise, ...lines.solution]
                : lines.exercise;
            }),
          });
        jobs.push({ file: `${base}.pdf`, tex: doc(false) });
        jobs.push({ file: `${base}-solutions.pdf`, tex: doc(true) });
      }
    }
  }
  return jobs;
}

// The topic materials as they are, under
// public/downloads/<subject>/topics/<topic>/<name>.pdf.
function materialPdfJobs(subjects, sources) {
  const jobs = [];
  for (const subject of subjects) {
    const subjectInfo = subjectInfos.find(info => info.dir === subject.dir);
    if (!subjectInfo) continue;
    for (const topic of subject.topics) {
      for (const material of topic.materials) {
        const tex = sources.get(material.file);
        if (tex === undefined) continue;
        jobs.push({
          file: path.join(
            DOWNLOADS_DIR,
            subjectInfo.slug,
            'topics',
            topic.slug,
            `${material.slug}.pdf`,
          ),
          tex,
          runs: 2,
        });
      }
    }
  }
  return jobs;
}

// Returns false when some PDF failed to compile.
async function buildPdfs(jobs, limit) {
  let compiled = 0;
  let failed = 0;
  await mapConcurrent(jobs, limit, async job => {
    const rel = path.relative(ROOT, job.file);
    try {
      const { pdf, fromCache } = await compilePdf(job.tex, job.runs);
      if (!fromCache) {
        compiled++;
        console.log(`compiled ${rel}`);
      }
      await writeIfChanged(job.file, pdf);
    } catch (error) {
      failed++;
      console.error(`\n✗ ${rel}\n${error.message}\n`);
    }
  });

  // Remove the PDFs of tests and materials that no longer exist.
  const current = new Set(jobs.map(job => job.file));
  for (const file of await listFiles(DOWNLOADS_DIR)) {
    if (!current.has(file)) await fs.rm(file);
  }

  console.log(
    `${jobs.length} PDFs (${compiled} compiled, ${jobs.length - compiled} cached) → ${path.relative(ROOT, DOWNLOADS_DIR)}`,
  );
  return failed === 0;
}

// ---------------------------------------------------------------------------
// Driver

// The plain text of a short TeX string such as a title: dashes and ties.
function texToText(tex) {
  return tex.replace(/---/g, '—').replace(/--/g, '–').replace(/~/g, '\u00a0');
}

// The end of the element that starts at `start` (a <span>): the index after
// the </span> that closes it.
function spanEnd(html, start) {
  const tags = /<\/?span\b[^>]*>/g;
  tags.lastIndex = start;
  let depth = 0;
  for (let tag; (tag = tags.exec(html));) {
    depth += tag[0][1] === '/' ? -1 : 1;
    if (depth === 0) return tag.index + tag[0].length;
  }
  return html.length;
}

// The parts of a formula between its top-level \qquads, e.g. the two
// equations of "a = b, \qquad c = d"; one part if there is none. A \qquad
// inside braces, \left…\right or an environment does not count.
function splitAtQquad(tex) {
  const parts = [];
  let depth = 0;
  let start = 0;
  const tokens =
    /\\begin\{[^}]*\}|\\end\{[^}]*\}|\\left(?![a-zA-Z])|\\right(?![a-zA-Z])|\\qquad(?![a-zA-Z])|\\[{}]|[{}]/g;
  for (const match of tex.matchAll(tokens)) {
    const token = match[0];
    if (token === '\\{' || token === '\\}') continue;
    if (token === '{' || token === '\\left' || token.startsWith('\\begin')) {
      depth++;
    } else if (
      token === '}' ||
      token === '\\right' ||
      token.startsWith('\\end')
    ) {
      depth--;
    } else if (depth === 0) {
      parts.push(tex.slice(start, match.index));
      start = match.index + token.length;
    }
  }
  parts.push(tex.slice(start));
  return parts.map(part => part.trim()).filter(Boolean);
}

// A displayed formula made of several equations side by side ("a = b,
// \qquad c = d") should wrap between the equations on a narrow screen, but
// KaTeX only breaks after relations and operators. Such a display is rendered
// again from its TeX (kept in its MathML annotation), one part per equation;
// the website lays the parts out as a wrapping row (.math-split in
// globals.css). Applied after the cache, like glueMathPunctuation.
const DISPLAY_MATH = '<span class="katex-display">';
const TEX_ANNOTATION =
  /<annotation encoding="application\/x-tex">([\s\S]*?)<\/annotation>/;

function splitDisplays(html, macros) {
  let out = '';
  let rest = 0;
  for (
    let start = html.indexOf(DISPLAY_MATH);
    start !== -1;
    start = html.indexOf(DISPLAY_MATH, rest)
  ) {
    const end = spanEnd(html, start);
    const display = html.slice(start, end);
    out += html.slice(rest, start);
    rest = end;
    const tex = TEX_ANNOTATION.exec(display);
    const parts = tex ? splitAtQquad(unescapeHtml(tex[1])) : [];
    if (parts.length < 2) {
      out += display;
      continue;
    }
    try {
      const rendered = parts.map(part =>
        renderTex(part, true, macros).replace(
          DISPLAY_MATH,
          '<span class="math-split-part">',
        ),
      );
      out += `<span class="katex-display math-split">${rendered.join('')}</span>`;
    } catch {
      out += display;
    }
  }
  return out + html.slice(rest);
}

// Browsers may break a line right after an inline formula, even before a
// colon or a comma, which then starts the next line. KaTeX draws a formula as
// a row of boxes (katex-base) and lines may only break between them, so
// punctuation (or a suffix such as "-ból") that touches the formula is moved
// into its last box, and an opening parenthesis right before it into its
// first. Long formulas can still break inside. The website sets these
// characters in the text font (.math-punct in globals.css). Applied after the
// cache, so changing it needs no recompilation.
const INLINE_MATH = '<span class="katex">';
const FORMULA_END = '</span></span></span>';
const FIRST_BOX =
  /<span class="katex-base"><span class="katex-strut"[^>]*><\/span>/;

const punctuation = text => `<span class="math-punct">${text}</span>`;

function glueMathPunctuation(html) {
  let out = '';
  let rest = 0;
  for (
    let start = html.indexOf(INLINE_MATH);
    start !== -1;
    start = html.indexOf(INLINE_MATH, rest)
  ) {
    const end = spanEnd(html, start);
    let before = html.slice(rest, start);
    let math = html.slice(start, end);
    let post = '';
    // Display math is not inline; leave it alone.
    if (
      !before.endsWith('<span class="katex-display">') &&
      !before.endsWith('<span class="math-split-part">')
    ) {
      const pre = /[^\s<>]*$/.exec(before)[0];
      post = /^[^\s<>]*/.exec(html.slice(end))[0];
      if (pre && FIRST_BOX.test(math)) {
        before = before.slice(0, before.length - pre.length);
        math = math.replace(FIRST_BOX, box => box + punctuation(pre));
      }
      if (post && math.endsWith(FORMULA_END)) {
        // Inside the last box: before the </span> that closes it.
        math = `${math.slice(0, -FORMULA_END.length)}${punctuation(post)}${FORMULA_END}`;
      } else {
        post = '';
      }
    }
    out += before + math;
    rest = end + post.length;
  }
  return out + html.slice(rest);
}

// The steps that run on the HTML after the cache, so changing them needs no
// recompilation.
function afterCache(html, source) {
  return glueMathPunctuation(splitDisplays(html, documentMacros(source)));
}

async function convert(source, kind) {
  const hash = createHash('sha256')
    .update(PIPELINE_VERSION[kind])
    .update(kind)
    .update(katex.version)
    .update(source)
    .digest('hex');
  const cached = path.join(CACHE_DIR, `${hash}.html`);
  if (!force) {
    const hit = await fs.readFile(cached, 'utf8').catch(() => null);
    if (hit !== null) {
      return { html: afterCache(hit, source), fromCache: true };
    }
  }
  const html = toFragment(
    await runLwarp(source, kind),
    kind,
    documentMacros(source),
  );
  await fs.mkdir(CACHE_DIR, { recursive: true });
  await fs.writeFile(cached, html);
  return { html: afterCache(html, source), fromCache: false };
}

async function mapConcurrent(items, limit, fn) {
  const results = new Array(items.length);
  let next = 0;
  async function worker() {
    while (next < items.length) {
      const i = next++;
      results[i] = await fn(items[i], i);
    }
  }
  await Promise.all(
    Array.from({ length: Math.min(limit, items.length) }, worker),
  );
  return results;
}

// Returns false when some file failed; the output is then left untouched.
async function build() {
  const subjects = await discover();
  const jobs = subjects.flatMap(s => s.exams.flatMap(e => e.files));
  const limit = Math.max(1, Math.min(8, os.availableParallelism() - 1));

  let total = 0;
  let compiled = 0;
  let failed = 0;

  async function convertFile(file, kind = 'exercise') {
    const rel = path.relative(ROOT, file);
    total++;
    try {
      const source = await fs.readFile(file, 'utf8');
      const { html, fromCache } = await convert(source, kind);
      if (!fromCache) {
        compiled++;
        console.log(`converted ${rel}`);
      }
      return { source, html };
    } catch (error) {
      failed++;
      console.error(`\n✗ ${rel}\n${error.message}\n`);
      return null;
    }
  }

  const converted = new Map();
  const preambles = new Map();
  await mapConcurrent(jobs, limit, async job => {
    const exercise = await convertFile(job.file);
    const solution = job.solutionFile
      ? await convertFile(job.solutionFile)
      : null;
    if (!exercise) return;
    try {
      const meta = parseFrontMatter(
        exercise.source,
        path.relative(ROOT, job.file),
      );
      converted.set(job.file, {
        ...meta,
        html: exercise.html,
        tex: documentBody(exercise.source),
        solution: solution?.html ?? null,
        solutionTex: solution ? documentBody(solution.source) : null,
      });
      preambles.set(job.file, {
        exercise: preambleLines(exercise.source),
        solution: solution ? preambleLines(solution.source) : [],
      });
    } catch (error) {
      failed++;
      console.error(`\n✗ ${error.message}\n`);
    }
  });

  // Topic materials: the title comes from \title (and \subtitle). The
  // optional docstring may turn on the table of contents (toc: true).
  const materials = new Map();
  const materialSources = new Map();
  const materialJobs = subjects.flatMap(subject =>
    subject.topics.flatMap(topic => topic.materials),
  );
  await mapConcurrent(materialJobs, limit, async material => {
    const result = await convertFile(material.file, 'material');
    if (!result) return;
    const title = /\\title\{([^}]*)\}/.exec(result.source)?.[1];
    if (!title) {
      failed++;
      console.error(
        `\n✗ ${path.relative(ROOT, material.file)}: the document needs a \\title\n`,
      );
      return;
    }
    materials.set(material.file, {
      group: material.group,
      slug: material.slug,
      title: texToText(title),
      subtitle:
        texToText(/\\subtitle\{([^}]*)\}/.exec(result.source)?.[1] ?? '') ||
        null,
      html: result.html,
      toc:
        readDocstring(result.source, path.relative(ROOT, material.file))
          ?.toc === true
          ? tableOfContents(result.html)
          : null,
    });
    materialSources.set(material.file, result.source);
  });

  if (failed > 0) {
    console.error(
      `${failed} file(s) failed; ${path.relative(ROOT, OUT_FILE)} was not updated.`,
    );
    return false;
  }

  const output = {
    subjects: subjects.map(subject => ({
      dir: subject.dir,
      topics: subject.topics.map(topic => ({
        id: topic.id,
        slug: topic.slug,
        materials: topic.materials.map(material =>
          materials.get(material.file),
        ),
      })),
      exams: subject.exams.map(exam => ({
        slug: exam.slug,
        exercises: exam.files.map(job => ({
          year: job.year,
          variant: job.variant,
          number: job.number,
          ...converted.get(job.file),
        })),
      })),
    })),
  };

  // Rewriting an unchanged file would still make next dev reload the page.
  const json = `${JSON.stringify(output, null, 2)}\n`;
  const previous = await fs.readFile(OUT_FILE, 'utf8').catch(() => null);
  if (json !== previous) {
    await fs.mkdir(path.dirname(OUT_FILE), { recursive: true });
    await fs.writeFile(OUT_FILE, json);
  }
  const pdfsOk = await buildPdfs(
    [
      ...testPdfJobs(subjects, converted, preambles),
      ...materialPdfJobs(subjects, materialSources),
    ],
    limit,
  );

  const solutions = jobs.filter(job => job.solutionFile).length;
  console.log(
    `${jobs.length} exercises, ${solutions} solutions, ${materialJobs.length} materials (${compiled} compiled, ${total - compiled} cached) → ${path.relative(ROOT, OUT_FILE)}`,
  );
  return pdfsOk;
}

// Rebuilds after each burst of .tex changes; a change that arrives during a
// build schedules one more build afterwards.
function watchContent() {
  let timer = null;
  let running = false;
  let pending = false;

  async function rebuild() {
    if (running) {
      pending = true;
      return;
    }
    running = true;
    try {
      await build();
    } catch (error) {
      console.error(error);
    } finally {
      running = false;
    }
    if (pending) {
      pending = false;
      await rebuild();
    }
  }

  watch(CONTENT_DIR, { recursive: true }, (_event, filename) => {
    if (!filename?.endsWith('.tex')) return;
    clearTimeout(timer);
    timer = setTimeout(rebuild, 200);
  });
  console.log(`watching ${path.relative(ROOT, CONTENT_DIR)}/ for .tex changes`);
}

if (watchMode) {
  await build();
  force = false;
  watchContent();
} else if (!(await build())) {
  process.exit(1);
}
