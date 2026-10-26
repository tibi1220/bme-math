@AGENTS.md

# Content conventions

- Use English notation for trigonometric and hyperbolic functions, also when
  the source (e.g. a Hungarian exercise sheet) uses another: `\tan`, `\cot`,
  `\arctan`, `\operatorname{arccot}`, `\tanh`, `\coth`; never `tg`, `ctg`,
  `arctg`, `th`, `cth`. In Hungarian prose the names stay Hungarian
  (tangens, kotangens).
- English names for functions, commands and `\label`s; Hungarian text.
- Figures are drawn with TikZ / pgfplots.

# Build cache

`scripts/build-content.mjs` caches every converted `.tex` file by content
hash (`node_modules/.cache/lwarp`); a conversion can take minutes.

- Do not bump `PIPELINE_VERSION` (or `DARK_VERSION`) unless the conversion
  output really changes; prefer changes in the post-cache steps
  (`afterCache`), which need no recompilation.
- Every edit of a `.tex` file recompiles that file: batch the edits to a
  file, check them with a local `lualatex` run (output outside `content/`,
  e.g. in the scratchpad), and avoid cosmetic edits to files that are
  already converted.
- Never commit or push unless asked.
