import type { Evidence } from '@/lib/types';
import { EmptyEvidenceState } from './EmptyEvidenceState';
import { EvidenceTimelineItem } from './EvidenceTimelineItem';

interface EvidenceTimelineProps {
  evidences: Evidence[];
}

export function EvidenceTimeline({ evidences }: EvidenceTimelineProps) {
  if (evidences.length === 0) {
    return <EmptyEvidenceState />;
  }

  return (
    <section
      id="career-timeline"
      className="rounded-[24px] border-hairline border-border-secondary bg-background-secondary p-5  md:p-6"
    >
      <div className="mb-4 flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
        <div>
          <p className="mb-1 text-xs font-medium text-accent">Timeline</p>
          <h2 className="text-2xl font-semibold text-foreground">Career history</h2>
        </div>
        <p className="max-w-md text-sm leading-5 text-foreground-secondary">
          A chronological record of completed challenges, verified skills, and reviewed work.
        </p>
      </div>

      <div className="relative space-y-3 border-l-hairline border-border-secondary pl-5">
        {evidences.map((evidence) => (
          <EvidenceTimelineItem key={evidence.id} evidence={evidence} />
        ))}
      </div>
    </section>
  );
}
