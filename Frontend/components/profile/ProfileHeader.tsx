import { Avatar, Button } from '@/components/ui';
import type { CandidateProfile } from '@/lib/types';
import { getInitials } from '@/lib/utils/helpers';
import { VerifiedSkillBadge } from './VerifiedSkillBadge';

interface ProfileHeaderProps {
  profile: CandidateProfile;
  isOwner?: boolean;
  onShare?: () => void;
}

function getUsername(fullName: string) {
  return `@${fullName
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '.')
    .replace(/(^\.|\.$)/g, '')}`;
}

function getJoinedDate(profile: CandidateProfile) {
  const firstEvidence = [...profile.evidences].sort(
    (left, right) => new Date(left.completedAt).getTime() - new Date(right.completedAt).getTime()
  )[0];

  if (!firstEvidence) return 'Joined POWORK';

  return `Joined ${new Intl.DateTimeFormat('en', {
    month: 'short',
    year: 'numeric',
  }).format(new Date(firstEvidence.completedAt))}`;
}

export function ProfileHeader({ profile, isOwner = false, onShare }: ProfileHeaderProps) {
  const topSkills = profile.verifiedSkills.slice(0, 4);

  return (
    <section className="overflow-hidden rounded-[24px] border-hairline border-border-secondary bg-background-secondary ">
      <div className="border-b-hairline border-border px-5 py-5 md:px-6">
        <div className="flex flex-col gap-5 md:flex-row md:items-start md:justify-between">
          <div className="flex min-w-0 flex-col gap-4 sm:flex-row sm:items-start">
            <Avatar
              initials={getInitials(profile.fullName)}
              size="lg"
              className="h-24 w-24 border border-accent bg-background-tertiary text-3xl shadow-md shadow-black/20"
            />

            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-[28px] font-semibold leading-tight text-foreground md:text-[34px]">
                  {profile.fullName}
                </h1>
                <span className="rounded-pill border-hairline border-success bg-success-bg px-2.5 py-1 text-xs font-medium text-success">
                  Verified
                </span>
              </div>

              <div className="mt-1 flex flex-wrap items-center gap-2 text-sm text-foreground-secondary">
                <span>{getUsername(profile.fullName)}</span>
                <span className="h-1 w-1 rounded-full bg-foreground-tertiary" />
                <span>{profile.headline ?? 'Verified professional'}</span>
              </div>

              {profile.bio && (
                <p className="mt-3 line-clamp-2 max-w-3xl text-md leading-6 text-foreground-secondary">
                  {profile.bio}
                </p>
              )}

              <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-foreground-secondary">
                {profile.location && <span>{profile.location}</span>}
                <span>{getJoinedDate(profile)}</span>
                <span>Open to interview</span>
                <span>{profile.totalChallenges} verified proofs</span>
              </div>
            </div>
          </div>

          <div className="flex shrink-0 flex-wrap gap-2 md:justify-end">
            {isOwner && (
              <Button variant="default" size="sm" className="h-9 rounded-pill px-4 text-xs">
                Edit Profile
              </Button>
            )}
            <Button
              variant="accent"
              size="sm"
              className="h-9 rounded-pill px-4 text-xs hover:border-accent"
              onClick={onShare}
            >
              Share Profile
            </Button>
          </div>
        </div>
      </div>

      <div className="grid gap-4 px-5 py-4 md:grid-cols-[1fr_auto] md:px-6">
        <div>
          <p className="mb-2 text-sm font-medium text-foreground-secondary">Top skills</p>
          <div className="flex flex-wrap gap-2">
            {topSkills.map((skill) => (
              <VerifiedSkillBadge key={skill.id} skill={skill} compact />
            ))}
          </div>
        </div>

        <div className="flex flex-wrap gap-2 md:justify-end">
          {['Portfolio', 'GitHub', 'Website', 'Contact'].map((label) => (
            <button
              key={label}
              type="button"
              className="h-8 rounded-pill border-hairline border-border-secondary bg-background-tertiary px-3 text-xs font-medium text-foreground-secondary transition-colors hover:border-accent hover:text-foreground"
            >
              {label}
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}
