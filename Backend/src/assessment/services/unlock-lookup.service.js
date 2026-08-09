import prisma from '../../shared/config/prisma.js'

export const hasCompanyUnlockedCandidate = async ({ companyId, userId }, database = prisma) => {
  const mappings = await database.identityMapping.findMany({
    where: { userId, isUnlocked: true },
    select: { challengeId: true },
  })
  if (mappings.length === 0) return false

  const challenge = await database.challenge.findFirst({
    where: {
      id: { in: mappings.map(({ challengeId }) => challengeId) },
      companyId,
    },
    select: { id: true },
  })
  return Boolean(challenge)
}
