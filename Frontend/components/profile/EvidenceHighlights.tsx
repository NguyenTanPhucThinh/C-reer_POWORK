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

interface EvidenceHighlightsProps {
  evidences: Evidence[];
}

export function EvidenceHighlights({ evidences }: EvidenceHighlightsProps) {
  const highlighted = [...evidences]
    .sort((left, right) => right.finalScore - left.finalScore)
    .slice(0, 3);

  if (highlighted.length === 0) return null;

  return (
    <section
      id="evidence"
      className="rounded-[24px] border-hairline border-border-secondary bg-background-secondary p-5  md:p-6"
    >
      <div className="mb-4 flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
        <div>
          <p className="mb-1 text-xs font-medium text-accent">Evidence</p>
          <h2 className="text-2xl font-semibold text-foreground">Project showcases</h2>
        </div>
        {evidences.length > highlighted.length && (
          <a href="#career-timeline" className="text-xs font-medium text-accent hover:underline">
            View full timeline
          </a>
        )}
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        {highlighted.map((evidence) => (
          <article
            key={evidence.id}
            className="group flex h-full flex-col rounded-[18px] border-hairline border-border-secondary bg-background-tertiary p-4  transition-all hover:border-accent "
          >
            <div className="mb-3 flex items-start justify-between gap-3">
              <Badge variant={statusVariants[evidence.status]}>
                {statusLabels[evidence.status]}
              </Badge>
              <div className="rounded-[14px] border-hairline border-success bg-success-bg px-3 py-2 text-right">
                <p className="text-xs font-medium text-foreground-secondary">Verified score</p>
                <p className="text-2xl font-semibold leading-none text-success">
                  {evidence.finalScore}
                  <span className="text-xs text-foreground-secondary">/{evidence.maxScore}</span>
                </p>
              </div>
            </div>

            <h3 className="line-clamp-2 text-md font-semibold leading-5 text-foreground">
              {evidence.challengeTitle}
            </h3>
            <div className="mt-1 flex flex-wrap items-center gap-2 text-sm font-medium text-foreground-secondary">
              <span>{evidence.companyName}</span>
              <span className="h-1 w-1 rounded-full bg-foreground-secondary" />
              <span>{formatDate(evidence.completedAt)}</span>
            </div>
            <p className="mt-3 line-clamp-2 text-sm leading-5 text-foreground-secondary">
              {evidence.employerFeedback ?? 'Verified proof-of-work project.'}
            </p>

            <div className="mt-3 flex flex-wrap gap-1.5">
              {evidence.skills.slice(0, 2).map((skill) => (
                <VerifiedSkillBadge key={skill.id} skill={skill} compact />
              ))}
            </div>

            <div className="mt-auto pt-4">
              <Link
                href={`/candidate/profile/evidence/${evidence.id}`}
                className="inline-flex h-8 w-fit items-center justify-center rounded-pill border-hairline border-accent bg-accent px-3 text-xs font-semibold text-foreground transition-colors hover:bg-accent-hover"
              >
                View showcase
              </Link>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
