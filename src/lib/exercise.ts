// The parts of the content model that client components may import. Keep the
// generated content out of this module, or it ends up in the browser bundle.

export type Exercise = {
  year: number;
  variant: string;
  number: number;
  topic: string;
  points: number[];
  imsc: boolean;
  html: string;
  // TeX source of the exercise body, for the "copy TeX" button.
  tex: string;
  solution: string | null;
  // TeX source of the solution body, for the solution's copy button.
  solutionTex: string | null;
};

// "2023-pa-4": unique within an exam.
export function exerciseId(
  exercise: Pick<Exercise, 'year' | 'variant' | 'number'>,
) {
  return `${exercise.year}-${exercise.variant}-${exercise.number}`;
}

export function exerciseAnchor(exercise: Pick<Exercise, 'number'>) {
  return `feladat-${exercise.number}`;
}
