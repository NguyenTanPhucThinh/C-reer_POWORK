import type { RubricItem } from '@/lib/types';

interface RubricScoreBreakdownProps {
  items: RubricItem[];
}

export function RubricScoreBreakdown({ items }: RubricScoreBreakdownProps) {
  if (items.length === 0) {
    return (
      <div className="rounded-lg border-hairline border-border-secondary bg-background p-4 text-sm text-foreground-secondary">
        Chưa có chi tiết rubric cho bằng chứng này.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {items.map((item) => {
        const percent = item.maxScore > 0 ? Math.round((item.score / item.maxScore) * 100) : 0;
        return (
          <div
            key={item.id}
            className="rounded-lg border-hairline border-border-secondary bg-background p-4"
          >
            <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-start">
              <div>
                <h3 className="text-sm font-semibold text-foreground">{item.criterionName}</h3>
                <p className="mt-1 text-2xs text-foreground-tertiary">Trọng số {item.weight}%</p>
              </div>
              <p className="font-mono text-sm text-accent">
                {item.score}/{item.maxScore}
              </p>
            </div>
            <div className="mt-3 h-2 rounded-pill bg-background-tertiary">
              <div
                className="h-full rounded-pill bg-success"
                style={{ width: `${Math.min(percent, 100)}%` }}
              />
            </div>
            {item.feedback && (
              <p className="mt-3 text-sm leading-6 text-foreground-secondary">{item.feedback}</p>
            )}
          </div>
        );
      })}
    </div>
  );
}
