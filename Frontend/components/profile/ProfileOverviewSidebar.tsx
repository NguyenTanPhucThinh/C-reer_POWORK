import type { CandidateProfile } from '@/lib/types';

interface ProfileOverviewSidebarProps {
  profile: CandidateProfile;
}

function SnapshotRow({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className="py-3">
      <p className="text-xs font-medium text-foreground-secondary">{label}</p>
      <p className="mt-1 text-base font-semibold leading-5 text-foreground">{value}</p>
      {hint && <p className="mt-1 text-sm leading-5 text-foreground-secondary">{hint}</p>}
    </div>
  );
}

export function ProfileOverviewSidebar({ profile }: ProfileOverviewSidebarProps) {
  const topSkill = profile.verifiedSkills[0];
  const roleFit = profile.headline ?? topSkill?.name ?? 'Verified candidate';

  return (
    <aside id="quick-overview" className="h-full">
      <section className="flex h-full flex-col rounded-[20px] border-hairline border-border-secondary bg-background-secondary p-5 ">
        <div className="mb-4 flex items-start justify-between gap-3">
          <div>
            <p className="mb-1 text-xs font-medium text-accent">Recruiter snapshot</p>
            <h2 className="text-2xl font-semibold text-foreground">Quick overview</h2>
          </div>
          <span className="rounded-pill border-hairline border-success bg-success-bg px-2.5 py-1 text-2xs font-medium text-success">
            Unlocked
          </span>
        </div>

        <div className="rounded-[16px] border-hairline border-success bg-success-bg px-3 py-2">
          <p className="text-sm font-semibold text-success">
            Profile unlocked by verified performance
          </p>
        </div>

        <div className="mt-3 divide-y divide-border">
          <SnapshotRow label="Contact" value="Available on request" />
          <SnapshotRow label="Role fit" value={roleFit} />
          <SnapshotRow label="Education" value="Candidate has not provided this yet" />
          <SnapshotRow label="Availability" value="Open to interview" />
          <SnapshotRow label="Links" value="Available after candidate update" />
        </div>

        <div className="mt-auto rounded-[16px] border-hairline border-accent bg-accent-bg p-3">
          <p className="text-xs font-medium text-accent">Suggested action</p>
          <p className="mt-1 text-base font-semibold text-foreground">Strong fit for interview</p>
          <p className="mt-1 text-sm leading-5 text-foreground-secondary">
            Review the top evidence before outreach. Average score is {profile.averageScore}/100
            across {profile.passedChallenges} passed challenges.
          </p>
        </div>
      </section>
    </aside>
  );
}
