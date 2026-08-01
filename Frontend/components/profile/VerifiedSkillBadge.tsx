import type { VerifiedSkill } from '@/lib/types';
import { cn } from '@/lib/utils/cn';

interface VerifiedSkillBadgeProps {
  skill: VerifiedSkill;
  compact?: boolean;
  className?: string;
}

export function VerifiedSkillBadge({ skill, compact, className }: VerifiedSkillBadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center border-hairline ',
        compact
          ? 'gap-2 rounded-pill border-accent bg-accent-bg px-3 py-1.5 text-2xs text-accent'
          : 'gap-3 rounded-[14px] border-border-secondary bg-background-tertiary px-3 py-2 text-xs text-foreground',
        className
      )}
    >
      <span className="font-medium">{skill.name}</span>
      <span className="rounded-pill bg-accent-bg px-2 py-0.5 font-mono text-2xs text-accent">
        {skill.score}
      </span>
      {!compact && <span className="text-2xs text-foreground-secondary">{skill.level}</span>}
    </span>
  );
}
