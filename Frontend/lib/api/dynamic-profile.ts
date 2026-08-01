import type { CandidateProfile, Evidence, VerifiedEvidence } from '@/lib/types';
import { apiClient } from './client';

function normalizeProfile(profile: CandidateProfile): CandidateProfile {
  const evidences = profile.evidences ?? [];
  const totalChallenges = profile.totalChallenges ?? evidences.length;
  const passedChallenges =
    profile.passedChallenges ??
    evidences.filter((evidence) => ['passed', 'verified', 'excellent'].includes(evidence.status))
      .length;
  const averageScore =
    profile.averageScore ??
    (evidences.length > 0
      ? Math.round(
          evidences.reduce((total, evidence) => total + evidence.finalScore, 0) / evidences.length
        )
      : 0);

  return {
    ...profile,
    totalChallenges,
    passedChallenges,
    averageScore,
    verifiedSkills: profile.verifiedSkills ?? [],
    skillSummary: profile.skillSummary ?? [],
    evidences,
  };
}

export const dynamicProfileAPI = {
  async getCandidateProfile(userId: string): Promise<CandidateProfile> {
    const response = await apiClient.get('/api/v1/profiles/' + userId);
    const data = response.data.data;

    const mappedProfile: CandidateProfile = {
      id: data.user_id, // Mapped from user_id to id
      fullName: data.full_name,
      evidences: data.verified_evidences.map((evidence: VerifiedEvidence) => {
        const finalScore = evidence.total_score;
        let status: 'pending' | 'rejected' | 'passed' | 'excellent' = 'pending';
        if (finalScore >= 8) {
          status = 'excellent';
        } else if (finalScore >= 5) {
          status = 'passed';
        }
        return {
          id: evidence.evidence_id, // Mapped from evidence_id to id
          challengeTitle: evidence.challenge_name, // Mapped from challenge_name to challengeTitle
          companyName: evidence.company_name,
          industry: evidence.industry,
          completedAt: evidence.unlocked_at,
          submittedAt: evidence.unlocked_at,
          status: status,
          finalScore: finalScore,
          maxScore: 10, // Defaulting as it's not in backend response
          skills: [], // Defaulting as it's not in backend response
          rubricItems: [], // Defaulting as it's not in backend response
          files: [], // Defaulting as it's not in backend response
          employerFeedback: undefined, // Defaulting as it's not in backend response
        };
      }),
      verifiedSkills: [], // Initializing as empty array
      skillSummary: [], // Initializing as empty array
      totalChallenges: 0, // Initializing with a default value
      passedChallenges: 0, // Initializing with a default value
      averageScore: 0, // Initializing with a default value
    };

    return normalizeProfile(mappedProfile);
  },

  async getEvidenceDetail(_evidenceId: string): Promise<Evidence | null> {
    // TODO: Implement actual API call for evidence detail
    return null;
  },
};
