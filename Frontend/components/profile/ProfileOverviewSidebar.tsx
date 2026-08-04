import type { CandidateProfile } from '@/lib/types';

interface ProfileOverviewSidebarProps {
  profile: CandidateProfile;
}

function SnapshotRow({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className="py-3">
      <p className="text-xs font-medium text-foreground-secondary">{label}</p>
      <p className="mt-1 text-base font-semibold leading-5 text-foreground">{value}</p>
      {hint && <p className="mt-1 text-sm leading-5 text-foreground-secondary">{hint}</p>}
    </div>
  );
}

export function ProfileOverviewSidebar({ profile }: ProfileOverviewSidebarProps) {
  const topSkill = profile.verifiedSkills[0];
  const roleFit = profile.headline ?? topSkill?.name ?? 'Ứng viên đã xác thực';

  return (
    <aside id="quick-overview" className="h-full">
      <section className="flex h-full flex-col rounded-[20px] border-hairline border-border-secondary bg-background-secondary p-5 ">
        <div className="mb-4 flex items-start justify-between gap-3">
          <div>
            <p className="mb-1 text-xs font-medium text-accent">
              Thông tin nhanh cho Nhà tuyển dụng
            </p>
            <h2 className="text-2xl font-semibold text-foreground">Tóm tắt nhanh</h2>
          </div>
          <span className="rounded-pill border-hairline border-success bg-success-bg px-2.5 py-1 text-2xs font-medium text-success">
            Đã mở khóa
          </span>
        </div>

        <div className="rounded-[16px] border-hairline border-success bg-success-bg px-3 py-2">
          <p className="text-sm font-semibold text-success">
            Hồ sơ được mở khóa nhờ bằng chứng đã xác thực
          </p>
        </div>

        <div className="mt-3 divide-y divide-border">
          <SnapshotRow label="Liên hệ" value="Cung cấp khi yêu cầu" />
          <SnapshotRow label="Vị trí phù hợp" value={roleFit} />
          <SnapshotRow label="Học vấn" value="Ứng viên chưa cung cấp" />
          <SnapshotRow label="Tình trạng" value="Sẵn sàng phỏng vấn" />
          <SnapshotRow label="Liên kết" value="Có sẵn sau khi cập nhật" />
        </div>

        <div className="mt-auto rounded-[16px] border-hairline border-accent bg-accent-bg p-3">
          <p className="text-xs font-medium text-accent">Hành động gợi ý</p>
          <p className="mt-1 text-base font-semibold text-foreground">Phù hợp để phỏng vấn</p>
          <p className="mt-1 text-sm leading-5 text-foreground-secondary">
            Xem bằng chứng hàng đầu trước khi liên hệ. Điểm trung bình là {profile.averageScore}/100
            trong {profile.passedChallenges} challenge đã vượt.
          </p>
        </div>
      </section>
    </aside>
  );
}
