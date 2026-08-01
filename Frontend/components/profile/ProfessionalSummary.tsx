import type { CandidateProfile } from '@/lib/types';
import { formatDate } from '@/lib/utils/helpers';

interface ProfessionalSummaryProps {
  profile: CandidateProfile;
}

function averageRubricScore(profile: CandidateProfile) {
  const rubricItems = profile.evidences.flatMap((evidence) => evidence.rubricItems);
  const maxScore = rubricItems.reduce((total, item) => total + item.maxScore, 0);

  if (maxScore === 0) return profile.averageScore;

  const score = rubricItems.reduce((total, item) => total + item.score, 0);
  return Math.round((score / maxScore) * 100);
}

function profileCompletion(profile: CandidateProfile) {
  const checks = [
    Boolean(profile.fullName),
    Boolean(profile.headline),
    Boolean(profile.bio),
    Boolean(profile.location),
    profile.verifiedSkills.length > 0,
    profile.evidences.length > 0,
  ];

  return Math.round((checks.filter(Boolean).length / checks.length) * 100);
}

function currentRank(score: number) {
  if (score >= 92) return 'Top 5%';
  if (score >= 88) return 'Top 12%';
  if (score >= 82) return 'Top 25%';
  return 'Rising';
}

export function ProfessionalSummary({ profile }: ProfessionalSummaryProps) {
  const acceptanceRate =
    profile.totalChallenges > 0
      ? Math.round((profile.passedChallenges / profile.totalChallenges) * 100)
      : 0;
  const latestEvidence = [...profile.evidences].sort(
    (left, right) => new Date(right.completedAt).getTime() - new Date(left.completedAt).getTime()
  )[0];

  const summaryItems = [
    { label: 'Overall Score', value: `${profile.averageScore}/100`, tone: 'text-success' },
    { label: 'Verified Evidence', value: `${profile.evidences.length}`, tone: 'text-foreground' },
    {
      label: 'Completed Challenges',
      value: `${profile.passedChallenges}/${profile.totalChallenges}`,
      tone: 'text-foreground',
    },
    {
      label: 'Average Rubric Score',
      value: `${averageRubricScore(profile)}%`,
      tone: 'text-accent',
    },
    {
      label: 'Company Reviews',
      value: `${profile.evidences.filter((evidence) => evidence.employerFeedback).length}`,
      tone: 'text-foreground',
    },
    { label: 'Acceptance Rate', value: `${acceptanceRate}%`, tone: 'text-success' },
    { label: 'Current Rank', value: currentRank(profile.averageScore), tone: 'text-accent' },
    {
      label: 'Profile Completion',
      value: `${profileCompletion(profile)}%`,
      tone: 'text-foreground',
    },
    {
      label: 'Recent Activity',
      value: latestEvidence ? formatDate(latestEvidence.completedAt) : 'No activity yet',
      tone: 'text-foreground',
    },
  ];

  return (
    <section className="rounded-[24px] border-hairline border-border-secondary bg-background-secondary p-5  md:p-6">
      <div className="mb-4">
        <p className="mb-1 text-xs font-medium text-accent">Professional summary</p>
        <h2 className="text-2xl font-semibold text-foreground">Career signal at a glance</h2>
      </div>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
        {summaryItems.slice(0, 6).map((item) => (
          <div
            key={item.label}
            className="rounded-[16px] border-hairline border-border bg-background-tertiary p-4"
          >
            <p className="text-xs font-medium text-foreground-secondary">{item.label}</p>
            <p className={`mt-2 text-2xl font-semibold leading-none ${item.tone}`}>{item.value}</p>
          </div>
        ))}
      </div>

      <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-3">
        {summaryItems.slice(6).map((item) => (
          <div
            key={item.label}
            className="flex items-center justify-between gap-3 rounded-[16px] border-hairline border-border bg-background-tertiary p-4"
          >
            <p className="text-sm font-medium text-foreground-secondary">{item.label}</p>
            <p className={`text-md font-semibold ${item.tone}`}>{item.value}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
