import type { CandidateProfile, Evidence, VerifiedEvidence } from '@/lib/types';
import { profileAPI } from './endpoints';

function mapEvidence(evidence: VerifiedEvidence): Evidence {
  return {
    id: evidence.evidence_id,
    challengeTitle: evidence.challenge_name,
    companyName: evidence.company_name,
    completedAt: evidence.unlocked_at,
    submittedAt: evidence.unlocked_at,
    status: evidence.total_score >= 80 ? 'excellent' : 'verified',
    finalScore: evidence.total_score,
    maxScore: 100,
    skills: [],
    rubricItems: [],
    files: [],
  };
}

async function getCandidateProfile(userId: string): Promise<CandidateProfile> {
  const profile = await profileAPI.getByUserId(userId);
  const evidences = profile.verified_evidences.map(mapEvidence);
  const averageScore = evidences.length
    ? Math.round(
        evidences.reduce((total, evidence) => total + evidence.finalScore, 0) / evidences.length
      )
    : 0;

  return {
    id: profile.user_id,
    fullName: profile.full_name,
    evidences,
    verifiedSkills: [],
    skillSummary: [],
    totalChallenges: evidences.length,
    passedChallenges: evidences.length,
    averageScore,
  };
}

export const dynamicProfileAPI = {
  getCandidateProfile,

  async getEvidenceDetail(evidenceId: string, userId: string): Promise<Evidence | null> {
    const profile = await getCandidateProfile(userId);
    return profile.evidences.find((evidence) => evidence.id === evidenceId) ?? null;
  },
};
