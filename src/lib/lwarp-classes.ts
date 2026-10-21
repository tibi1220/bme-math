// Styles the HTML produced by lwarp (paragraphs, enumerate/itemize lists with
// inline .listmarker spans) and the KaTeX output inside it.
export const lwarpClasses = [
  'leading-relaxed text-zinc-800 dark:text-zinc-200',
  '[&_p]:my-2',
  '[&_ul]:my-3 [&_ul]:space-y-2',
  '[&_li]:relative [&_li]:pl-7 [&_li>p:first-child]:-indent-7',
  '[&_li_p]:my-1 [&_li_p:first-child]:mt-0',
  '[&_.listmarker]:inline-block [&_.listmarker]:w-7 [&_.listmarker]:indent-0 [&_.listmarker]:font-medium',
  '[&_.katex]:indent-0',
  // An item that starts with display math gets its marker in a paragraph of
  // its own; collapse it so the marker sits next to the formula.
  '[&_li>p.listmarker-only]:my-0',
  '[&_li>p.listmarker-only>.listmarker]:absolute [&_li>p.listmarker-only>.listmarker]:left-0',
  '[&_li>p.listmarker-only+p]:mt-0',
  '[&_li>p.listmarker-only+p>.katex-display:first-child]:mt-0',
  '[&_.katex-display]:my-3 [&_.katex-display]:overflow-x-auto [&_.katex-display]:overflow-y-hidden [&_.katex-display]:py-1',
  // Pictures (TikZ) that lwarp rendered to SVG.
  '[&_.center]:my-3 [&_.center]:text-center',
  '[&_.lateximage]:inline-block [&_.lateximage]:h-auto [&_.lateximage]:max-w-full',
  // In the dark theme the pictures are inverted; turning the hue back keeps
  // their colours (blue stays blue). Blending with the page makes the white
  // background, and the white boxes behind labels, take the page's colour:
  // darken keeps the darker of picture and page, lighten (after the
  // inversion) the lighter.
  '[&_.lateximage]:mix-blend-darken',
  'dark:[&_.lateximage]:invert dark:[&_.lateximage]:hue-rotate-180 dark:[&_.lateximage]:mix-blend-lighten',
].join(' ');

// A whole document (a topic material): sections, theorem-like blocks, figures
// with captions and tables, on top of lwarpClasses.
export const materialClasses = [
  lwarpClasses,
  // Justified like the PDF, with hyphenation (the page is lang="hu") to avoid
  // wide gaps. Figures, captions and tables sit in lwarp's centred blocks.
  'text-justify hyphens-auto',
  // The table of contents jumps here; leave some room above the heading.
  '[&_h4]:scroll-mt-8 [&_h5]:scroll-mt-8 [&_figure]:scroll-mt-8',
  '[&_h4]:mt-12 [&_h4]:mb-4 [&_h4]:text-xl [&_h4]:font-semibold [&_h4]:tracking-tight [&_h4]:text-zinc-900 dark:[&_h4]:text-zinc-100',
  '[&_h5]:mt-8 [&_h5]:mb-3 [&_h5]:text-lg [&_h5]:font-semibold [&_h5]:text-zinc-900 dark:[&_h5]:text-zinc-100',
  '[&_.sectionnumber]:text-zinc-400 dark:[&_.sectionnumber]:text-zinc-500',
  // Definitions, theorems, examples, remarks and proofs.
  '[&_.theorem]:my-5 [&_.theorem]:rounded-lg [&_.theorem]:border [&_.theorem]:border-zinc-200 dark:[&_.theorem]:border-zinc-800 [&_.theorem]:bg-white dark:[&_.theorem]:bg-zinc-900 [&_.theorem]:px-5 [&_.theorem]:py-3',
  '[&_.amsthmbodyremark]:border-amber-200 [&_.amsthmbodyremark]:bg-amber-50 dark:[&_.amsthmbodyremark]:border-amber-900/60 dark:[&_.amsthmbodyremark]:bg-amber-950/30',
  '[&_.amsthmproof]:border-dashed [&_.amsthmproof]:bg-transparent dark:[&_.amsthmproof]:bg-transparent',
  '[&_.theorem-label]:font-semibold [&_.theorem-label]:text-zinc-900 dark:[&_.theorem-label]:text-zinc-100',
  // Figures and tables.
  '[&_figure]:my-8 [&_figure_.center]:my-0',
  '[&_figcaption]:mx-auto [&_figcaption]:mt-3 [&_figcaption]:max-w-xl [&_figcaption]:text-sm [&_figcaption]:text-zinc-600 dark:[&_figcaption]:text-zinc-400',
  '[&_.caption-label]:font-semibold',
  '[&_table]:mx-auto [&_table]:my-4 [&_td]:px-3 [&_td]:py-1.5',
  '[&_tr.tbrule]:border-t [&_tr.tbrule]:border-zinc-400 [&_tr.hline]:border-t [&_tr.hline]:border-zinc-300 dark:[&_tr.tbrule]:border-zinc-500 dark:[&_tr.hline]:border-zinc-700',
  // Cross-references (\ref) to figures.
  '[&_a[href^="#"]]:underline [&_a[href^="#"]]:decoration-zinc-400 [&_a[href^="#"]]:underline-offset-2',
].join(' ');
