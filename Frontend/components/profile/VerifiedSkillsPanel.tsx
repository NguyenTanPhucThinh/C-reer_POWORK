import type { VerifiedSkill } from '@/lib/types';
import { VerifiedSkillBadge } from './VerifiedSkillBadge';

interface VerifiedSkillsPanelProps {
  skills: VerifiedSkill[];
}

export function VerifiedSkillsPanel({ skills }: VerifiedSkillsPanelProps) {
  return (
    <section className="rounded-[24px] border-hairline border-border-secondary bg-background-secondary p-6 ">
      <div className="mb-5 flex flex-col justify-between gap-2 sm:flex-row sm:items-end">
        <div>
          <p className="mb-2 text-2xs font-semibold uppercase tracking-[0.18em] text-accent">
            Capability signals
          </p>
          <h2 className="text-2xl font-semibold text-foreground">Verified Skills</h2>
        </div>
        <p className="max-w-sm text-sm leading-6 text-foreground-tertiary">
          Skill, score, and level backed by challenge rubrics.
        </p>
      </div>

      {skills.length > 0 ? (
        <div className="flex flex-wrap gap-3">
          {skills.map((skill) => (
            <VerifiedSkillBadge key={skill.id} skill={skill} />
          ))}
        </div>
      ) : (
        <p className="text-sm text-foreground-secondary">No verified skills yet.</p>
      )}
    </section>
  );
}
