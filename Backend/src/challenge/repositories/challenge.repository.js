/**
 * CHALLENGE MODULE — Challenge Repository
 *
 * Chỉ chứa câu lệnh Prisma thuần. KHÔNG chứa logic validate nghiệp vụ.
 *
 * Điểm kỹ thuật quan trọng: Prisma Nested Write
 *   prisma.challenge.create({ data: { rubricCriteria: { create: [...] } } })
 *   → Insert Challenge VÀ toàn bộ RubricCriteria trong CÙNG 1 transaction.
 *   → Nếu 1 trong các insert thất bại, Prisma tự ROLLBACK toàn bộ — không
 *     bao giờ xảy ra trường hợp Challenge được tạo nhưng rubrics bị thiếu.
 */
import prisma from '../../shared/config/prisma.js'

// Tạo Challenge kèm Rubric Criteria — Nested Write trong 1 transaction
export const createChallengeWithRubrics = ({
  companyId,
  companyName,
  title,
  description,
  industry,
  deadline,
  rubrics,
}) => {
  return prisma.challenge.create({
    data: {
      companyId,
      companyName, // Snapshot — theo ERD, không JOIN sang IAM
      title,
      description,
      industry,
      deadline: new Date(deadline),
      status: 'OPEN',
      rubricCriteria: {
        create: rubrics.map((r) => ({
          criteriaName: r.criteriaName,
          weight: r.weight,
          maxScore: r.maxScore,
        })),
      },
    },
    include: { rubricCriteria: true }, // Trả luôn rubrics kèm criteria_id mới tạo
  })
}

export const findManyChallenges = ({ industry }) => {
  return prisma.challenge.findMany({
    where: industry ? { industry } : undefined,
    orderBy: { createdAt: 'desc' },
  })
}

export const findChallengeById = (challengeId) => {
  return prisma.challenge.findUnique({
    where: { id: challengeId },
    include: { rubricCriteria: true },
  })
}

export const updateChallengeStatusById = (challengeId, companyId, status) => {
  return prisma.challenge.update({
    where: { id: challengeId, companyId }, // chỉ owner mới update được
    data: { status },
  })
}
