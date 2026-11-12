import type { HoleDef } from '../physics/types';
import { BACK_NINE } from './back9';
import { FRONT_NINE } from './front9';

export const COURSE_IDS = ['front9', 'back9', 'all18'] as const;
export type CourseId = (typeof COURSE_IDS)[number];

export const ALL_HOLES: readonly HoleDef[] = [...FRONT_NINE, ...BACK_NINE];

export function holesFor(course: CourseId): readonly HoleDef[] {
  if (course === 'front9') return FRONT_NINE;
  if (course === 'back9') return BACK_NINE;
  return ALL_HOLES;
}

export const coursePar = (course: CourseId): number => holesFor(course).reduce((a, h) => a + h.par, 0);
