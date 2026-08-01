import { Badge } from '@/components/ui';
import type { Evidence, EvidenceStatus, SubmissionFile } from '@/lib/types';
import { formatDate } from '@/lib/utils/helpers';
import { VerifiedSkillBadge } from './VerifiedSkillBadge';
import { RubricScoreBreakdown } from './RubricScoreBreakdown';

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

function formatFileSize(fileSize: number) {
  if (fileSize < 1024) return `${fileSize} B`;
  if (fileSize < 1024 * 1024) return `${Math.round(fileSize / 1024)} KB`;
  return `${(fileSize / 1024 / 1024).toFixed(1)} MB`;
}

function SubmissionFileRow({ file }: { file: SubmissionFile }) {
  return (
    <div className="flex flex-col gap-3 rounded-lg border-hairline border-border-secondary bg-background p-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="min-w-0">
        <p className="truncate text-sm font-medium text-foreground">{file.fileName}</p>
        <p className="mt-1 text-2xs text-foreground-tertiary">
          {file.fileType} · {formatFileSize(file.fileSize)}
        </p>
      </div>
      {file.url ? (
        <a
          href={file.url}
          download={file.fileName}
          className="inline-flex shrink-0 items-center justify-center rounded-lg border-hairline border-border-secondary bg-background-tertiary px-[13px] py-1.5 text-xs font-medium text-foreground transition-colors hover:opacity-90"
        >
          Open
        </a>
      ) : (
        <span className="shrink-0 text-2xs text-foreground-tertiary">No URL</span>
      )}
    </div>
  );
}

interface EvidenceDetailPanelProps {
  evidence: Evidence;
}

export function EvidenceDetailPanel({ evidence }: EvidenceDetailPanelProps) {
  return (
    <div className="space-y-5">
      <section className="rounded-lg border-hairline border-border-secondary bg-background-secondary p-5">
        <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-start">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-3xl font-semibold text-foreground">{evidence.challengeTitle}</h1>
              <Badge variant={statusVariants[evidence.status]}>
                {statusLabels[evidence.status]}
              </Badge>
            </div>
            <p className="mt-2 text-sm text-foreground-secondary">{evidence.companyName}</p>
            <p className="mt-2 text-xs text-foreground-tertiary">
              Submitted {formatDate(evidence.submittedAt)} · Completed{' '}
              {formatDate(evidence.completedAt)}
            </p>
          </div>
          <div className="rounded-lg border-hairline border-success bg-success-bg px-4 py-3">
            <p className="text-2xs uppercase text-success">Final score</p>
            <p className="text-3xl font-semibold text-success">
              {evidence.finalScore}
              <span className="text-sm text-foreground-tertiary">/{evidence.maxScore}</span>
            </p>
          </div>
        </div>
      </section>

      <section className="grid grid-cols-1 gap-5 xl:grid-cols-[1.35fr_0.65fr]">
        <div className="space-y-5">
          <section className="rounded-lg border-hairline border-border-secondary bg-background-secondary p-4">
            <h2 className="mb-4 text-lg font-semibold text-foreground">Rubric breakdown</h2>
            <RubricScoreBreakdown items={evidence.rubricItems} />
          </section>

          <section className="rounded-lg border-hairline border-border-secondary bg-background-secondary p-4">
            <h2 className="mb-3 text-lg font-semibold text-foreground">Employer feedback</h2>
            <p className="text-sm leading-6 text-foreground-secondary">
              {evidence.employerFeedback ?? 'Chưa có feedback từ Employer.'}
            </p>
          </section>
        </div>

        <aside className="space-y-5">
          <section className="rounded-lg border-hairline border-border-secondary bg-background-secondary p-4">
            <h2 className="mb-3 text-lg font-semibold text-foreground">Verified skills</h2>
            <div className="flex flex-wrap gap-2">
              {evidence.skills.map((skill) => (
                <VerifiedSkillBadge key={skill.id} skill={skill} compact />
              ))}
            </div>
          </section>

          <section className="rounded-lg border-hairline border-border-secondary bg-background-secondary p-4">
            <h2 className="mb-3 text-lg font-semibold text-foreground">Submission files</h2>
            <div className="space-y-2">
              {evidence.files.length > 0 ? (
                evidence.files.map((file) => <SubmissionFileRow key={file.id} file={file} />)
              ) : (
                <p className="text-sm text-foreground-secondary">Không có file đính kèm.</p>
              )}
            </div>
          </section>
        </aside>
      </section>
    </div>
  );
}
