<p align="center">
  <img src="src/app/icon.svg" width="72" alt="BME Matek logo">
</p>

<h1 align="center">BME Matek</h1>

<p align="center">
  Past exam problems and worked solutions for BME math courses, by year and by topic.
  <br>
  <a href="https://tibi1220.github.io/bme-math/"><strong>tibi1220.github.io/bme-math</strong></a>
</p>

---

Every exercise and solution is written in LaTeX, one file each. A build pipeline
turns them into a static website (in Hungarian) and into downloadable PDFs, so
the same source serves both.

## Features

- **Tests by year**: every midterm, retake (pótzárthelyi) and second retake
  (aláíráspótló) as it was given, with downloadable PDFs with and without
  solutions.
- **Topic materials**: notes with figures and worked examples, readable on the
  site and downloadable as PDF.
- **Exercises by topic**: all exercises of a topic (sequences, complex numbers,
  functions, …) from every year on one page.
- **Random practice**: draw random exercises, filtered by topic, year and kind
  of test. Every exercise has its own prerendered practice page, so a picked
  exercise can be reloaded or shared.
- **Solutions on demand**: every exercise has a worked solution, hidden until
  the student opens it.
- **Copy TeX**: one click copies an exercise (or its solution) as LaTeX, to
  paste into an AI assistant or your own notes.
- **Typeset math**: formulas rendered with KaTeX in STIX Two, the font of the
  PDFs; TikZ figures are rendered to SVG.
- **Light and dark theme**, no JavaScript needed to read the content.

Currently covered: **Analízis A1**, first midterm (2020–2025).

## Writing content

All content lives in `content/`, one folder per subject:

```text
content/VIK-A1/
├── topics/                     # topic folders: 01-series, 02-complex-numbers, …
└── exams/
    └── exam-1/                 # the first midterm
        └── 2025/
            ├── base/           # the original exam PDFs (not in git)
            ├── 2025-a-1.tex    # exercise 1 of the α variant
            ├── 2025-a-1-sol.tex
            └── …
```

File names are `<year>-<variant>-<number>.tex`, where the variant is one of

| Variant | Test               | URL slug        |
| ------- | ------------------ | --------------- |
| `a`     | midterm, α variant | `a`             |
| `b`     | midterm, β variant | `b`             |
| `pa`    | retake, α variant  | `retake-a`      |
| `pb`    | retake, β variant  | `retake-b`      |
| `pp`    | second retake      | `second-retake` |

Each exercise is a complete LaTeX document (it compiles on its own with
`latexmk`) that starts with a YAML docstring:

```latex
% ---
% topic: 02            % the number of the topic folder
% points: [7, 13]      % points per part
% imsc: true           % optional: an IMSC (honours) exercise
% ---
\documentclass[11pt]{scrartcl}
\usepackage[stixtwo]{fontsetup}
\usepackage{amsmath}

\begin{document}
\begin{enumerate}
	\item …
\end{enumerate}
\end{document}
```

The solution goes next to it in `<name>-sol.tex`, without the docstring. Use any
package you need (TikZ for figures, `xfrac`, …); the website and the PDFs pick
it up. Display names (subjects, exams, topics) and the variants are defined in
[`src/lib/catalog.ts`](src/lib/catalog.ts).

Topic materials (notes with figures and worked examples) live in
`topics/<NN-topic>/<group>/<name>.tex`, e.g.
`topics/02-complex-numbers/trig-hyperbolic-functions/trig-functions.tex`. Each
is a complete document with a `\title` (and optionally a `\subtitle`); no
docstring is needed, and empty files are skipped. The site shows them on the
topic's page, with a PDF download. Group names and the reading order of the
documents are set in `materialGroups` in `src/lib/catalog.ts`. A figure can also
get an animated web version: write a component, list it under the figure's
`\label` in
[`src/components/animations/index.ts`](src/components/animations/index.ts) and
add it to `figureAnimations` there; the PDF keeps the TikZ figure. Two are ready
(the sine and sinh figures) but switched off.

## Development

Requirements:

- [Node.js](https://nodejs.org/) 24 or newer and [pnpm](https://pnpm.io/) (the
  version pinned in `package.json`)
- A TeX Live installation with `lualatex` and `lwarp`, and `pdftotext` from
  [Poppler](https://poppler.freedesktop.org/)

```sh
pnpm install
pnpm dev        # http://localhost:3000
```

`pnpm dev` compiles the content, starts Next.js and watches `content/`: save a
`.tex` file and the page reloads with the new version.

| Command        | What it does                                                |
| -------------- | ----------------------------------------------------------- |
| `pnpm dev`     | Content watcher and development server                      |
| `pnpm content` | Compile the content only (`--force` ignores the cache)      |
| `pnpm build`   | Compile the content, then build the static site into `out/` |
| `pnpm lint`    | ESLint                                                      |
| `pnpm format`  | Prettier                                                    |

### How the pipeline works

[`scripts/build-content.mjs`](scripts/build-content.mjs) turns `content/` into
everything the site needs:

1. Each `.tex` file is compiled with `lualatex` and converted to HTML with
   [lwarp](https://ctan.org/pkg/lwarp). TikZ pictures become inline SVGs.
2. The math is rendered with [KaTeX](https://katex.org/) at build time, so pages
   need no math JavaScript.
3. The results go to `src/generated/content.json` (the pages) and
   `public/downloads/` (a PDF of every test, with and without solutions).

Every compiled file is cached by the hash of its source in
`node_modules/.cache/lwarp`, so only changed files are recompiled. All generated
output is ignored by git.

The site itself is a [Next.js](https://nextjs.org/) static export, styled with
[Tailwind CSS](https://tailwindcss.com/).

Every page has a description, a canonical URL and Open Graph tags;
[`src/app/sitemap.ts`](src/app/sitemap.ts) and
[`src/app/robots.ts`](src/app/robots.ts) generate `sitemap.xml` and
`robots.txt`. The site URL is set in [`src/lib/site.ts`](src/lib/site.ts).

## Deployment

Every push to `main` runs
[`.github/workflows/deploy.yml`](.github/workflows/deploy.yml): it compiles the
content in a TeX Live container, builds the site and publishes it to GitHub
Pages. The LaTeX cache is kept between runs, so a push only recompiles the files
it changed.

To set it up on a new repository, choose **GitHub Actions** as the source under
**Settings → Pages**. The site is built for the `/bme-math` path (set by
`PAGES_BASE_PATH` in the workflow); change it there if the repository is
renamed.
