import type { ComponentType } from 'react';
import { SineUnitCircle } from '@/components/animations/sine-unit-circle';
import { SinhHyperbola } from '@/components/animations/sinh-hyperbola';

// Ready-made web versions of figures in the topic materials, keyed by the
// \label of the figure they replace. They are not shown at the moment; to
// turn one on, add it to figureAnimations below.
export const availableAnimations = {
  'fig:sine-from-circle': SineUnitCircle,
  'fig:sinh-from-hyperbola': SinhHyperbola,
} satisfies Record<string, ComponentType>;

// The figures the website shows animated, e.g.
//   'fig:sine-from-circle': availableAnimations['fig:sine-from-circle'],
// The page keeps the caption and replaces the picture; the PDF always keeps
// the static TikZ figure.
export const figureAnimations: Record<string, ComponentType> = {};
