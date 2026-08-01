import type { SkillSummaryItem } from '@/lib/types';

interface SkillSummaryCardProps {
  skills: SkillSummaryItem[];
}

export function SkillSummaryCard({ skills }: SkillSummaryCardProps) {
  const tones = ['bg-accent', 'bg-success', 'bg-warning', 'bg-info'];

  return (
    <section className="rounded-[22px] border-hairline border-border-secondary bg-background-secondary p-5 ">
      <div className="mb-4">
        <h2 className="text-xl font-semibold text-foreground">Skill Summary</h2>
        <p className="mt-1 text-sm text-foreground-tertiary">
          Rubric-based score grouped by capability area.
        </p>
      </div>

      <div className="space-y-4">
        {skills.map((skill, index) => {
          const percent = skill.maxScore > 0 ? Math.round((skill.score / skill.maxScore) * 100) : 0;
          return (
            <div key={skill.id}>
              <div className="mb-2 flex items-center justify-between gap-3 text-xs">
                <span className="font-medium text-foreground">{skill.name}</span>
                <span className="font-mono text-foreground-secondary">
                  {skill.score}/{skill.maxScore}
                </span>
              </div>
              <div className="h-2.5 rounded-pill bg-background-tertiary">
                <div
                  className={`h-full rounded-pill ${tones[index % tones.length]}`}
                  style={{ width: `${Math.min(percent, 100)}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
