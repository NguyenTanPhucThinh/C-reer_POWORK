import type { RubricCriteriaInput } from '@/lib/types';

/** Tổng trọng số của một rubric hợp lệ phải đúng bằng 100%. */
export const TOTAL_WEIGHT = 100;

/** Tổng trọng số hiện tại (tính real-time khi người dùng nhập). */
export function getTotalWeight(criteria: RubricCriteriaInput[]): number {
  return criteria.reduce((sum, c) => sum + (Number(c.weight) || 0), 0);
}

/** Rubric hợp lệ: có tiêu chí, mọi tiêu chí có tên + max_score > 0, tổng weight = 100. */
export function isRubricValid(criteria: RubricCriteriaInput[]): boolean {
  if (criteria.length === 0) return false;
  const allValid = criteria.every(
    (c) => c.criteria_name.trim().length > 0 && Number(c.max_score) > 0 && Number(c.weight) > 0
  );
  return allValid && getTotalWeight(criteria) === TOTAL_WEIGHT;
}

/** Một dòng tiêu chí rỗng mặc định. */
export function emptyCriteria(): RubricCriteriaInput {
  return { criteria_name: '', weight: 0, max_score: 10 };
}

/** Điểm tối đa của thang chấm theo trọng số (rubric hợp lệ = 100). */
export const MAX_WEIGHTED_SCORE = TOTAL_WEIGHT;

/** Một dòng chấm điểm: điểm thô của giám khảo trên một tiêu chí. */
export interface RubricScoreInput {
  criteria_id: string;
  weight: number;
  max_score: number;
  score: number;
}

/**
 * Tổng điểm thô (raw) — cộng trực tiếp điểm từng tiêu chí.
 * Khớp với contract `/evaluate`: `total_score` là tổng điểm thô.
 */
export function getRawTotalScore(rows: Pick<RubricScoreInput, 'score'>[]): number {
  return rows.reduce((sum, r) => sum + (Number(r.score) || 0), 0);
}

/**
 * Tổng điểm theo trọng số (0–100), tính real-time khi giám khảo kéo slider.
 * Mỗi tiêu chí đóng góp `score / max_score * weight` vào tổng.
 */
export function getWeightedTotalScore(rows: RubricScoreInput[]): number {
  return rows.reduce((sum, r) => {
    const max = Number(r.max_score) || 0;
    if (max <= 0) return sum;
    const ratio = (Number(r.score) || 0) / max;
    return sum + ratio * (Number(r.weight) || 0);
  }, 0);
}
