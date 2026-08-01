'use client';

interface TalentPoolEmptyStateProps {
  isFiltered?: boolean;
  onResetFilter?: () => void;
}

export function TalentPoolEmptyState({
  isFiltered = false,
  onResetFilter,
}: TalentPoolEmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border-secondary bg-background-secondary px-6 py-14 text-center shadow-xs">
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-accent-bg text-accent mb-4 shadow-inner">
        <svg
          className="h-8 w-8"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
        >
          <circle cx="11" cy="11" r="8" />
          <path d="m21 21-4.35-4.35" />
          <path d="M11 8v6M8 11h6" strokeLinecap="round" />
        </svg>
      </div>

      <h3 className="text-base font-semibold text-foreground">
        {isFiltered ? 'Không tìm thấy ứng viên phù hợp' : 'Chưa có ứng viên nào trong Talent Pool'}
      </h3>

      <p className="mt-1.5 max-w-md text-xs text-foreground-tertiary leading-relaxed">
        {isFiltered
          ? 'Không có kết quả nào khớp với tìm kiếm hoặc bộ lọc hiện tại của bạn. Thử thay đổi từ khóa hoặc đặt lại bộ lọc.'
          : 'Mở khóa ứng viên từ các bài chấm thử thách thành công để tích lũy nguồn nhân tài chất lượng cao.'}
      </p>

      {isFiltered && onResetFilter && (
        <button
          type="button"
          onClick={onResetFilter}
          className="mt-5 inline-flex items-center gap-2 rounded-lg border border-accent/40 bg-accent-bg px-4 py-2 text-xs font-medium text-accent transition-colors hover:bg-accent hover:text-white"
        >
          <svg
            className="h-4 w-4"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
            <path d="M3 3v5h5" />
          </svg>
          Xóa bộ lọc &amp; tìm kiếm
        </button>
      )}
    </div>
  );
}
