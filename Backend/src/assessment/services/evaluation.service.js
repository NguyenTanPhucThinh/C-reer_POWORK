import { AppError } from '../../shared/utils/AppError.js'
import prisma from '../../shared/config/prisma.js'
import * as companyService from '../../iam/services/company.service.js' // Internal Service Interface

export const evaluateSubmission = async (
  submissionId,
  { evaluations, generalComment },
  currentUserId,
) => {
  // Lấy bài nộp
  const submission = await prisma.submission.findUnique({
    where: { id: submissionId },
    include: { identityMapping: true },
  })

  if (!submission) throw new AppError('Không tìm thấy submission', 404, 'ASSESS_002')
  if (submission.identityMapping.isUnlocked) {
    throw new AppError(
      'Cannot evaluate. This submission has already been unlocked and frozen.',
      403,
      'ASSESS_006',
    )
  }

  // Lấy thử thách để kiểm tra quyền sở hữu của công ty
  const challenge = await prisma.challenge.findUnique({
    where: { id: submission.challengeId },
  })

  if (!challenge) throw new AppError('Không tìm thấy challenge tương ứng', 404, 'CHAL_004')

  const { company_id: companyId } = await companyService.getCompanyByUserId(currentUserId)
  const isOwner = challenge.companyId === companyId

  if (!isOwner) {
    throw new AppError(
      'Forbidden: Bạn không có quyền chấm điểm bài nộp của công ty khác!',
      403,
      'ASSESS_005',
    )
  }
  await prisma.$transaction([
    ...evaluations.map((e) =>
      prisma.evaluationResult.create({
        data: {
          submissionId,
          criteriaId: e.criteriaId,
          score: e.score,
          comment: e.comment,
        },
      }),
    ),
    prisma.submission.update({
      where: { id: submissionId },
      data: { status: 'EVALUATED', generalComment: generalComment },
    }),
  ])

  const totalScore = evaluations.reduce((sum, e) => sum + e.score, 0)

  return {
    submissionId,
    evaluations,
    generalComment,
    totalScore,
    evaluatedAt: new Date().toISOString(),
  }
}
