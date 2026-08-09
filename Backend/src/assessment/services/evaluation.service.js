import { AppError } from '../../shared/utils/AppError.js'
import prisma from '../../shared/config/prisma.js'
import { assertChallengeOwnership } from './ownership.service.js'

export const evaluateSubmission = async (
  submissionId,
  { evaluations, generalComment },
  companyId,
  database = prisma,
) => {
  await database.$transaction(async (tx) => {
    const submission = await tx.submission.findUnique({
      where: { id: submissionId },
      include: { identityMapping: true },
    })

    if (!submission) throw new AppError('Không tìm thấy submission', 404, 'ASSESS_002')

    const challenge = await tx.challenge.findUnique({ where: { id: submission.challengeId } })
    assertChallengeOwnership(challenge, companyId)

    if (!submission.identityMapping) {
      throw new AppError('Không tìm thấy identity mapping', 404, 'ASSESS_003')
    }
    if (submission.identityMapping.isUnlocked) {
      throw new AppError(
        'Cannot evaluate. This submission has already been unlocked and frozen.',
        403,
        'ASSESS_006',
      )
    }

    const criteriaIds = [...new Set(evaluations.map((evaluation) => evaluation.criteriaId))]
    const criteriaCount = await tx.rubricCriteria.count({
      where: { id: { in: criteriaIds }, challengeId: submission.challengeId },
    })
    if (criteriaCount !== criteriaIds.length) {
      throw new AppError('Rubric criteria không thuộc challenge của submission.', 400, 'ASSESS_007')
    }

    await tx.evaluationResult.createMany({
      data: evaluations.map((evaluation) => ({
        submissionId,
        criteriaId: evaluation.criteriaId,
        score: evaluation.score,
        comment: evaluation.comment,
      })),
    })
    await tx.submission.update({
      where: { id: submissionId },
      data: { status: 'EVALUATED', generalComment },
    })
  })

  const totalScore = evaluations.reduce((sum, e) => sum + e.score, 0)

  return {
    submissionId,
    evaluations,
    generalComment,
    totalScore,
    evaluatedAt: new Date().toISOString(),
  }
}
