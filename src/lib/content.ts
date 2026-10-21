import generated from '@/generated/content.json';
import { withBasePath } from '@/lib/base-path';
import {
  exams as examNames,
  materialGroups,
  subjects as subjectInfos,
  topicNames,
  variantTitle,
  variants as variantInfos,
  type ExamInfo,
  type SubjectInfo,
  type VariantInfo,
} from '@/lib/catalog';
import { exerciseAnchor, exerciseId, type Exercise } from '@/lib/exercise';

export { exerciseAnchor, exerciseId, type Exercise };

// A document of a topic, converted from content/<subject>/topics/….
export type Material = {
  group: string;
  slug: string;
  title: string;
  subtitle: string | null;
  html: string;
};

export type MaterialGroup = {
  slug: string;
  name: string;
  materials: Material[];
};

export type Topic = {
  id: string;
  slug: string;
  name: string;
  short: string;
  materials: Material[];
  groups: MaterialGroup[];
};

export type Test = {
  year: number;
  variant: string;
  info: VariantInfo;
  exercises: Exercise[];
};

export type Exam = {
  slug: string;
  // The name of the regular test, e.g. "1. zárthelyi".
  name: string;
  names: ExamInfo;
  exercises: Exercise[];
  tests: Test[];
};

export type Subject = SubjectInfo & {
  topics: Topic[];
  exams: Exam[];
};

// The shape of src/generated/content.json (written by scripts/build-content.mjs).
// Spelled out instead of inferred from the JSON, which types empty lists as
// never[].
type GeneratedSubject = {
  dir: string;
  topics: { id: string; slug: string; materials: Material[] }[];
  exams: { slug: string; exercises: Exercise[] }[];
};

const generatedSubjects: GeneratedSubject[] = generated.subjects;

function variantOrder(variant: string) {
  const index = Object.keys(variantInfos).indexOf(variant);
  return index === -1 ? Number.MAX_SAFE_INTEGER : index;
}

function compareExercises(a: Exercise, b: Exercise) {
  return (
    b.year - a.year ||
    variantOrder(a.variant) - variantOrder(b.variant) ||
    a.number - b.number
  );
}

function groupTests(exercises: Exercise[]): Test[] {
  const tests = new Map<string, Test>();
  for (const exercise of exercises) {
    const info = variantInfos[exercise.variant];
    if (!info) {
      throw new Error(`Unknown variant "${exercise.variant}" in catalog.ts`);
    }
    const key = `${exercise.year}-${exercise.variant}`;
    let test = tests.get(key);
    if (!test) {
      test = {
        year: exercise.year,
        variant: exercise.variant,
        info,
        exercises: [],
      };
      tests.set(key, test);
    }
    test.exercises.push(exercise);
  }
  return [...tests.values()];
}

function groupMaterials(materials: Material[]): MaterialGroup[] {
  const slugs = [...new Set(materials.map(material => material.group))];
  return slugs.map(slug => {
    const info = materialGroups[slug];
    const rank = (material: Material) => {
      const index = info?.order.indexOf(material.slug) ?? -1;
      return index === -1 ? Number.MAX_SAFE_INTEGER : index;
    };
    return {
      slug,
      name: info?.name ?? slug,
      materials: materials
        .filter(material => material.group === slug)
        .sort((a, b) => rank(a) - rank(b) || a.slug.localeCompare(b.slug)),
    };
  });
}

function buildSubject(
  info: SubjectInfo,
  data: GeneratedSubject | undefined,
): Subject {
  const topics = (data?.topics ?? []).map(topic => {
    const groups = groupMaterials(topic.materials);
    return {
      ...topic,
      name: topicNames[topic.slug]?.name ?? topic.slug,
      short: topicNames[topic.slug]?.short ?? topic.slug,
      // In reading order, as on the topic page.
      materials: groups.flatMap(group => group.materials),
      groups,
    };
  });
  const exams = (data?.exams ?? []).map(exam => {
    const exercises = [...exam.exercises].sort(compareExercises);
    const names = examNames[exam.slug] ?? {
      regular: exam.slug,
      retake: exam.slug,
      'second-retake': exam.slug,
    };
    return {
      slug: exam.slug,
      name: names.regular,
      names,
      exercises,
      tests: groupTests(exercises),
    };
  });
  return { ...info, topics, exams };
}

export const subjects: Subject[] = subjectInfos.map(info =>
  buildSubject(
    info,
    generatedSubjects.find(subject => subject.dir === info.dir),
  ),
);

export function getSubject(slug: string) {
  return subjects.find(subject => subject.slug === slug);
}

export function getExam(subject: Subject, slug: string) {
  return subject.exams.find(exam => exam.slug === slug);
}

export function getTest(exam: Exam, year: string, variantSlug: string) {
  return exam.tests.find(
    test => String(test.year) === year && test.info.slug === variantSlug,
  );
}

// The page of a topic's materials, e.g. /analysis-a1/topics/complex-numbers.
export function materialsHref(subject: Subject, topic: Topic) {
  return `/${subject.slug}/topics/${topic.slug}`;
}

export function materialHref(
  subject: Subject,
  topic: Topic,
  material: Material,
) {
  return `${materialsHref(subject, topic)}/${material.slug}`;
}

// The PDF written by the content pipeline (scripts/build-content.mjs).
export function materialDownloadHref(
  subject: Subject,
  topic: Topic,
  material: Material,
) {
  return withBasePath(
    `/downloads/${subject.slug}/topics/${topic.slug}/${material.slug}.pdf`,
  );
}

export function getTopic(subject: Subject, slug: string) {
  return subject.topics.find(topic => topic.slug === slug);
}

export function exercisesByTopic(exam: Exam, topic: Topic) {
  return exam.exercises.filter(exercise => exercise.topic === topic.id);
}

// The badge of an exercise: its topic's short name, linking to the topic page.
export function topicBadge(subject: Subject, exam: Exam, exercise: Exercise) {
  const topic = subject.topics.find(t => t.id === exercise.topic);
  return topic
    ? { label: topic.short, href: topicHref(subject, exam, topic) }
    : undefined;
}

export function years(exam: Exam) {
  return [...new Set(exam.tests.map(test => test.year))];
}

// "1. pótzárthelyi, α-variáns" or "1. aláíráspótló zárthelyi"
export function testTitle(exam: Exam, test: Test) {
  return variantTitle(exam.names, test.info);
}

export function testHref(subject: Subject, exam: Exam, test: Test) {
  return `/${subject.slug}/exams/${exam.slug}/${test.year}/${test.info.slug}`;
}

// The PDFs written by the content pipeline (scripts/build-content.mjs).
export function testDownloadHref(
  subject: Subject,
  exam: Exam,
  test: Test,
  withSolutions: boolean,
) {
  const suffix = withSolutions ? '-solutions' : '';
  return withBasePath(
    `/downloads/${subject.slug}/${exam.slug}/${test.year}-${test.info.slug}${suffix}.pdf`,
  );
}

export function practiceHref(subject: Subject, exam: Exam) {
  return `/${subject.slug}/exams/${exam.slug}/practice`;
}

// The practice page showing one exercise, e.g. …/practice/2025-a-1.
export function practiceExerciseHref(
  subject: Subject,
  exam: Exam,
  exercise: Exercise,
) {
  return `${practiceHref(subject, exam)}/${exerciseId(exercise)}`;
}

export function examHref(subject: Subject, exam: Exam) {
  return `/${subject.slug}/exams/${exam.slug}`;
}

export function topicHref(subject: Subject, exam: Exam, topic: Topic) {
  return `/${subject.slug}/exams/${exam.slug}/topics/${topic.slug}`;
}

export function totalPoints(exercises: Exercise[]) {
  const sum = (list: Exercise[]) =>
    list.reduce((acc, e) => acc + e.points.reduce((a, b) => a + b, 0), 0);
  return {
    regular: sum(exercises.filter(e => !e.imsc)),
    imsc: sum(exercises.filter(e => e.imsc)),
  };
}
