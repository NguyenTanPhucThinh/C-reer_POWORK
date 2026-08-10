import type {
  VerificationAnswer,
  VerificationDashboard,
  VerificationDashboardStatistics,
  VerificationDashboardTimeline,
  VerificationQuestion,
} from '@/lib/types';

const formatTime = (value: string | null) => {
  if (!value) return 'Chưa ghi nhận';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Không xác định';
  return new Intl.DateTimeFormat('vi-VN', {
    dateStyle: 'medium',
    timeStyle: 'medium',
  }).format(date);
};

const formatDuration = (seconds: number | null) => {
  if (seconds === null) return 'Chưa ghi nhận';
  if (seconds < 60) return `${seconds} giây`;
  return `${Math.floor(seconds / 60)} phút ${seconds % 60} giây`;
};

export function VerificationOverview({ dashboard }: { dashboard: VerificationDashboard }) {
  return (
    <section className="rounded-2xl border border-success/35 bg-success-bg p-5">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-success">
            Evidence đã mở khóa
          </p>
          <h2 className="mt-2 text-xl font-semibold text-foreground">
            Xác minh đã sẵn sàng để đánh giá
          </h2>
          <p className="mt-1 text-sm leading-6 text-foreground-secondary">
            Dữ liệu dưới đây thuộc đúng Submission và chỉ xuất hiện sau khi công ty mở khóa.
          </p>
        </div>
        <div className="rounded-xl border border-success/30 bg-background/70 px-4 py-3 text-right">
          <p className="text-2xs uppercase text-foreground-tertiary">Mã xác minh</p>
          <p className="mt-1 break-all font-mono text-xs text-foreground">
            {dashboard.verificationId}
          </p>
        </div>
      </div>
    </section>
  );
}

export function VerificationTimelineSection({
  timeline,
}: {
  timeline: VerificationDashboardTimeline;
}) {
  const events = [
    ['Khởi tạo phiên', timeline.createdAt],
    ['Bắt đầu trình bày', timeline.oralStartedAt],
    ['Hoàn tất trình bày', timeline.oralCompletedAt],
    ['Bắt đầu tự luận', timeline.answeringStartedAt],
    ['Hoàn tất tự luận', timeline.answeringCompletedAt],
    ['Hoàn tất xác minh', timeline.completedAt],
  ];

  return (
    <section className="rounded-2xl border border-border-secondary bg-background-secondary p-5">
      <h2 className="text-lg font-semibold text-foreground">Timeline</h2>
      <div className="mt-5 space-y-0">
        {events.map(([label, value], index) => (
          <div key={label} className="grid grid-cols-[20px_minmax(0,1fr)] gap-3">
            <div className="flex flex-col items-center">
              <span className="mt-1.5 h-2.5 w-2.5 rounded-full bg-accent" />
              {index < events.length - 1 && <span className="min-h-11 w-px flex-1 bg-border" />}
            </div>
            <div className="pb-4">
              <p className="text-sm font-medium text-foreground">{label}</p>
              <p className="mt-1 text-xs text-foreground-tertiary">{formatTime(value)}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

export function VerificationStatisticsSection({
  statistics,
}: {
  statistics: VerificationDashboardStatistics;
}) {
  const metrics = [
    ['Câu hỏi', statistics.questionCount],
    ['Thời lượng đã chọn', formatDuration(statistics.selectedOralDurationSeconds)],
    ['Thời lượng thực tế', formatDuration(statistics.actualOralDurationSeconds)],
    ['Camera gián đoạn', statistics.cameraInterruptionCount],
    ['Thời gian camera gián đoạn', formatDuration(statistics.cameraInterruptionDurationSeconds)],
    ['Mất tập trung', statistics.focusLossCount],
    ['Chặn dán', statistics.pasteBlockedCount],
    ['Chặn chọn tất cả', statistics.selectAllBlockedCount],
    ['Chặn sao chép', statistics.copyBlockedCount],
    ['Chặn kéo thả', statistics.dropBlockedCount],
  ];

  return (
    <section className="rounded-2xl border border-border-secondary bg-background-secondary p-5">
      <h2 className="text-lg font-semibold text-foreground">Statistics</h2>
      <p className="mt-1 text-xs leading-5 text-foreground-secondary">
        Tín hiệu trình duyệt hỗ trợ đánh giá, không phải bằng chứng tuyệt đối về hành vi.
      </p>
      <dl className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3">
        {metrics.map(([label, value]) => (
          <div key={label} className="rounded-xl border border-border bg-background px-3 py-3">
            <dt className="text-2xs leading-4 text-foreground-tertiary">{label}</dt>
            <dd className="mt-1 text-sm font-semibold text-foreground">{value}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}

export function VerificationQuestionAnswersSection({
  questions,
  answers,
}: {
  questions: VerificationQuestion[];
  answers: VerificationAnswer[];
}) {
  const answerByQuestion = new Map(answers.map((answer) => [answer.questionId, answer.answer]));

  return (
    <section className="rounded-2xl border border-border-secondary bg-background-secondary p-5">
      <h2 className="text-lg font-semibold text-foreground">Questions & Answers</h2>
      <div className="mt-5 space-y-4">
        {questions.map((question, index) => (
          <article
            key={question.questionId}
            className="rounded-xl border border-border bg-background p-5"
          >
            <div className="flex items-start gap-3">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-accent-bg text-xs font-semibold text-accent">
                {index + 1}
              </span>
              <div className="min-w-0">
                <h3 className="text-sm font-semibold leading-6 text-foreground">
                  {question.question}
                </h3>
                <p className="mt-1 text-2xs text-foreground-tertiary">
                  Yêu cầu {question.minimumLength}–{question.maximumLength} ký tự
                </p>
              </div>
            </div>
            <div className="mt-4 whitespace-pre-wrap rounded-xl border border-border-secondary bg-background-secondary p-4 text-sm leading-7 text-foreground-secondary">
              {answerByQuestion.get(question.questionId) ?? 'Không có câu trả lời.'}
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
