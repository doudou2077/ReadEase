import type { GRADE_LEVELS } from '../public/gradeConfig.js';

export type GradeLevel = typeof GRADE_LEVELS[keyof typeof GRADE_LEVELS];