import type { SkillSummaryItem, VerifiedSkill } from '@/lib/types';
import { VerifiedSkillBadge } from './VerifiedSkillBadge';

interface SkillsRubricSummaryProps {
  verifiedSkills: VerifiedSkill[];
  skillSummary: SkillSummaryItem[];
}

export function SkillsRubricSummary({ verifiedSkills, skillSummary }: SkillsRubricSummaryProps) {
  const tones = ['bg-accent', 'bg-success', 'bg-warning', 'bg-info'];

  return (
    <section
      id="skills-overview"
      className="rounded-[24px] border-hairline border-border-secondary bg-background-secondary p-5  md:p-6"
    >
      <div className="mb-4">
        <p className="mb-1 text-xs font-medium text-accent">Skills overview</p>
        <h2 className="text-2xl font-semibold text-foreground">Verified capabilities</h2>
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-[minmax(0,1fr)_360px]">
        <div>
          <p className="mb-3 text-base font-medium text-foreground-secondary">
            Skill chips, current levels, and verified challenge signals
          </p>
          <div className="flex flex-wrap gap-2">
            {verifiedSkills.map((skill) => (
              <VerifiedSkillBadge key={skill.id} skill={skill} />
            ))}
          </div>
        </div>

        <div className="space-y-3 lg:border-l-hairline lg:border-border lg:pl-5">
          {skillSummary.map((skill, index) => {
            const percent =
              skill.maxScore > 0 ? Math.round((skill.score / skill.maxScore) * 100) : 0;
            return (
              <div key={skill.id}>
                <div className="mb-2 flex items-center justify-between gap-3 text-sm">
                  <span className="font-medium text-foreground">{skill.name}</span>
                  <span className="font-mono text-foreground-secondary">
                    {skill.score}/{skill.maxScore}
                  </span>
                </div>
                <div className="h-1.5 rounded-pill bg-background-tertiary">
                  <div
                    className={`h-full rounded-pill ${tones[index % tones.length]}`}
                    style={{ width: `${Math.min(percent, 100)}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
