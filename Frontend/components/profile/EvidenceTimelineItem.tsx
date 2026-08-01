import Link from 'next/link';
import { Badge } from '@/components/ui';
import type { Evidence, EvidenceStatus } from '@/lib/types';
import { formatDate } from '@/lib/utils/helpers';
import { VerifiedSkillBadge } from './VerifiedSkillBadge';

const statusLabels: Record<EvidenceStatus, string> = {
  verified: 'Verified',
  passed: 'Passed',
  excellent: 'Excellent',
};

const statusVariants: Record<EvidenceStatus, 'open' | 'done' | 'invited'> = {
  verified: 'done',
  passed: 'open',
  excellent: 'invited',
};

interface EvidenceTimelineItemProps {
  evidence: Evidence;
}

export function EvidenceTimelineItem({ evidence }: EvidenceTimelineItemProps) {
  const description =
    evidence.employerFeedback ??
    `${evidence.challengeTitle} verified ${evidence.skills.length} skill signals.`;

  return (
    <article className="group relative rounded-[18px] border-hairline border-border-secondary bg-background-tertiary p-4  transition-all hover:border-accent ">
      <div className="absolute -left-6 top-6 h-3 w-3 rounded-full border-2 border-background-secondary bg-accent " />

      <div className="flex flex-col justify-between gap-3 md:flex-row md:items-start">
        <div className="min-w-0">
          <div className="mb-2 flex flex-wrap items-center gap-2">
            <span className="rounded-pill border-hairline border-border bg-background px-2 py-0.5 text-2xs font-medium text-foreground-secondary">
              Challenge completed
            </span>
            <Badge variant={statusVariants[evidence.status]}>{statusLabels[evidence.status]}</Badge>
            <span className="text-sm font-medium text-foreground-secondary">
              {formatDate(evidence.completedAt)}
            </span>
          </div>
          <h3 className="text-md font-semibold leading-snug text-foreground">
            {evidence.challengeTitle}
          </h3>
          <p className="mt-1 text-sm font-medium text-foreground-secondary">
            {evidence.companyName}
          </p>
          <p className="mt-3 line-clamp-1 max-w-2xl text-sm leading-5 text-foreground-secondary">
            {description}
          </p>
        </div>

        <div className="shrink-0 rounded-[16px] border-hairline border-success bg-success-bg px-3 py-2 text-left md:text-right">
          <p className="text-xs font-medium text-foreground-secondary">Career signal</p>
          <p className="text-2xl font-semibold leading-none text-success">
            {evidence.finalScore}
            <span className="text-sm text-foreground-secondary">/{evidence.maxScore}</span>
          </p>
        </div>
      </div>

      <div className="mt-3 flex flex-wrap gap-2">
        {evidence.skills.slice(0, 3).map((skill) => (
          <VerifiedSkillBadge key={skill.id} skill={skill} compact />
        ))}
      </div>

      <div className="mt-3 flex justify-end">
        <Link
          href={`/candidate/profile/evidence/${evidence.id}`}
          className="inline-flex h-8 items-center rounded-pill border-hairline border-accent bg-accent-bg px-3 text-xs font-semibold text-accent transition-colors group-hover:border-accent group-hover:bg-accent-bg"
        >
          Open event
        </Link>
      </div>
    </article>
  );
}
