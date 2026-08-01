import type { CandidateProfile } from '@/lib/types';

interface ProfileAnalyticsProps {
  profile: CandidateProfile;
}

export function ProfileAnalytics({ profile }: ProfileAnalyticsProps) {
  const evidenceScores = [...profile.evidences]
    .sort(
      (left, right) => new Date(right.completedAt).getTime() - new Date(left.completedAt).getTime()
    )
    .slice(0, 4);

  return (
    <section
      id="career-analytics"
      className="rounded-[24px] border-hairline border-border-secondary bg-background-secondary p-5  md:p-6"
    >
      <div className="mb-4">
        <p className="mb-1 text-xs font-medium text-accent">Statistics</p>
        <h2 className="text-2xl font-semibold text-foreground">Career analytics</h2>
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        <div>
          <p className="mb-3 text-sm font-medium text-foreground-secondary">Skill distribution</p>
          <div className="space-y-3">
            {profile.skillSummary.map((skill) => {
              const percent =
                skill.maxScore > 0 ? Math.round((skill.score / skill.maxScore) * 100) : 0;

              return (
                <div key={skill.id}>
                  <div className="mb-2 flex items-center justify-between gap-3 text-sm">
                    <span className="font-medium text-foreground">{skill.name}</span>
                    <span className="font-mono text-foreground-secondary">{percent}%</span>
                  </div>
                  <div className="h-1.5 rounded-pill bg-background-tertiary">
                    <div
                      className="h-full rounded-pill bg-accent"
                      style={{ width: `${Math.min(percent, 100)}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div>
          <p className="mb-3 text-sm font-medium text-foreground-secondary">Evidence momentum</p>
          <div className="space-y-3">
            {evidenceScores.map((evidence) => {
              const percent =
                evidence.maxScore > 0
                  ? Math.round((evidence.finalScore / evidence.maxScore) * 100)
                  : 0;

              return (
                <div
                  key={evidence.id}
                  className="rounded-[16px] border-hairline border-border bg-background-tertiary p-3"
                >
                  <div className="mb-2 flex items-center justify-between gap-3">
                    <p className="line-clamp-1 text-sm font-medium text-foreground">
                      {evidence.challengeTitle}
                    </p>
                    <p className="shrink-0 font-mono text-xs text-success">{percent}%</p>
                  </div>
                  <div className="h-1.5 rounded-pill bg-background">
                    <div
                      className="h-full rounded-pill bg-success"
                      style={{ width: `${Math.min(percent, 100)}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
