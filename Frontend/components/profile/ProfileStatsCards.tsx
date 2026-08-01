import type { CandidateProfile } from '@/lib/types';

interface ProfileStatsCardsProps {
  profile: CandidateProfile;
}

export function ProfileStatsCards({ profile }: ProfileStatsCardsProps) {
  const stats = [
    {
      label: 'Total Challenges',
      value: profile.totalChallenges,
      tone: 'text-accent',
      icon: 'TC',
      caption: 'Completed evidence',
    },
    {
      label: 'Passed Challenges',
      value: profile.passedChallenges,
      tone: 'text-success',
      icon: 'PC',
      caption: 'Reviewed by employers',
    },
    {
      label: 'Average Score',
      value: `${profile.averageScore}/100`,
      tone: 'text-info',
      icon: 'AS',
      caption: 'Across verified work',
    },
    {
      label: 'Verified Skills',
      value: profile.verifiedSkills.length,
      tone: 'text-warning',
      icon: 'VS',
      caption: 'Rubric-backed signals',
    },
  ];

  return (
    <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {stats.map((stat) => (
        <div
          key={stat.label}
          className="min-h-[132px] rounded-[20px] border-hairline border-border-secondary bg-background-secondary p-5 "
        >
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-xs font-medium text-foreground-secondary">{stat.label}</p>
              <p className="mt-1 text-2xs text-foreground-tertiary">{stat.caption}</p>
            </div>
            <span className="inline-flex h-9 w-9 items-center justify-center rounded-full border-hairline border-border-secondary bg-background-tertiary font-mono text-2xs text-foreground-secondary">
              {stat.icon}
            </span>
          </div>
          <p className={`mt-5 text-3xl font-semibold ${stat.tone}`}>{stat.value}</p>
        </div>
      ))}
    </section>
  );
}
