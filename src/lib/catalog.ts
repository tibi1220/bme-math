// Hungarian display names and English URL slugs for everything under
// content/. Folder names in content/ are the keys; the generated content
// (pnpm content) only knows about folders, never about display names.

export type ExternalLink = {
  title: string;
  url: string;
  description: string;
};

export type SubjectInfo = {
  slug: string;
  dir: string;
  name: string;
  // The subject code in Neptun.
  code: string;
  description: string;
  // The official page of the subject.
  website: string;
  // Shown on the subject page, after the official page.
  links: ExternalLink[];
};

// A test is a regular test, a retake (pótzárthelyi) or a second retake
// (aláíráspótló).
export type TestKind = 'regular' | 'retake' | 'second-retake';

export const testKinds: Record<TestKind, { label: string }> = {
  regular: { label: 'Zárthelyi' },
  retake: { label: 'Pótzárthelyi' },
  'second-retake': { label: 'Aláíráspótló' },
};

// The name of the exam for each kind of test, e.g. "1. pótzárthelyi".
export type ExamInfo = Record<TestKind, string>;

export type VariantInfo = {
  slug: string;
  kind: TestKind;
  // α/β; a second retake has a single variant.
  letter?: string;
};

// "1. pótzárthelyi, α-variáns" or "1. aláíráspótló zárthelyi".
export function variantTitle(exam: ExamInfo, variant: VariantInfo) {
  const name = exam[variant.kind];
  return variant.letter ? `${name}, ${variant.letter}-variáns` : name;
}

// "Pótzárthelyi α" or "Aláíráspótló".
export function variantLabel(variant: VariantInfo) {
  const label = testKinds[variant.kind].label;
  return variant.letter ? `${label} ${variant.letter}` : label;
}

export const subjects: SubjectInfo[] = [
  {
    slug: 'analysis-a1',
    dir: 'VIK-A1',
    name: 'Analízis A1',
    code: 'BMETEMIBsVANL1-00',
    description: 'Mérnökinformatikus BSc',
    website: 'https://math.bme.hu/~tasnadi/merninf_anal_1/',
    links: [
      {
        title: 'Matematika G1',
        url: 'https://szilagyi-math.hu/subjects/G1',
        description:
          'Jegyzet és gyakorlati anyagok megoldásokkal, videókkal (Itt tanítottam korábban)',
      },
      {
        title: 'Derivative Calculator',
        url: 'https://www.derivative-calculator.net',
        description: 'Deriváltak kiszámítása lépésről lépésre',
      },
      {
        title: 'Integral Calculator',
        url: 'https://www.integral-calculator.com',
        description: 'Integrálok kiszámítása lépésről lépésre',
      },
    ],
  },
];

// Keyed by the topic folder name without its number prefix. `short` is shown
// on the topic badges of the exercises.
export const topicNames: Record<string, { name: string; short: string }> = {
  series: { name: 'Sorozatok', short: 'Sorozatok' },
  'complex-numbers': { name: 'Komplex számok', short: 'Komplex számok' },
  functions: {
    name: 'Függvények határértéke és folytonossága',
    short: 'Függvények',
  },
  derivatives: { name: 'Differenciálszámítás', short: 'Deriválás' },
  integrals: { name: 'Integrálszámítás', short: 'Integrálás' },
};

// The groups of documents inside a topic folder (topics/02-complex-numbers/
// trig-hyperbolic-functions/…), keyed by folder name. `order` lists the
// documents by file name in reading order; any other document comes after.
export const materialGroups: Record<string, { name: string; order: string[] }> =
  {
    'trig-hyperbolic-functions': {
      name: 'Trigonometrikus és hiperbolikus függvények',
      order: ['trig-functions', 'hyperbolic-functions', 'connection'],
    },
  };

// Keyed by the exam folder name, which is also its URL slug.
export const exams: Record<string, ExamInfo> = {
  'exam-1': {
    regular: '1. zárthelyi',
    retake: '1. pótzárthelyi',
    'second-retake': '1. aláíráspótló zárthelyi',
  },
  'exam-2': {
    regular: '2. zárthelyi',
    retake: '2. pótzárthelyi',
    'second-retake': '2. aláíráspótló zárthelyi',
  },
  'exam-final': {
    regular: 'Vizsga',
    retake: 'Pótvizsga',
    'second-retake': 'Aláíráspótló vizsga',
  },
};

// Keyed by the variant part of the file name (2025-pa-1.tex → pa).
export const variants: Record<string, VariantInfo> = {
  a: { slug: 'a', kind: 'regular', letter: 'α' },
  b: { slug: 'b', kind: 'regular', letter: 'β' },
  pa: { slug: 'retake-a', kind: 'retake', letter: 'α' },
  pb: { slug: 'retake-b', kind: 'retake', letter: 'β' },
  pp: { slug: 'second-retake', kind: 'second-retake' },
};
