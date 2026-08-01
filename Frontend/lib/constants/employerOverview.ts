import type {
  ActivityAction,
  OverviewMetricKey,
  SettingsSection,
  TaskKey,
} from '@/lib/types/employerOverview';

export const EMPLOYER_COPY = {
  pageTitle: 'Employer Overview',
  pageDescription: 'Theo dõi challenge, bài nộp và hoạt động tuyển dụng trong một workspace.',
  activeChallenges: 'Challenge đang hoạt động',
  reviewQueue: 'Review Queue',
  tasks: 'Việc cần làm',
  recentActivity: 'Hoạt động gần đây',
  bookmarks: 'Bookmarks',
  settings: 'Settings',
  viewAll: 'Xem tất cả',
  viewSubmissions: 'Xem bài nộp',
  noChallenges: 'Chưa có challenge đang hoạt động.',
  noReviews: 'Không có bài nộp nào đang chờ chấm.',
  noActivity: 'Chưa có hoạt động gần đây.',
  loadError: 'Không thể tải dữ liệu Employer Overview.',
} as const;

export const METRIC_LABELS: Record<OverviewMetricKey, { label: string; description: string }> = {
  activeChallenges: { label: 'Challenge đang mở', description: 'Đang nhận bài nộp' },
  pendingReviews: { label: 'Bài chờ chấm', description: 'Trong Review Queue' },
  unlockedProfiles: { label: 'Hồ sơ đã unlock', description: 'Trong talent pool' },
  nextDeadline: { label: 'Hạn gần nhất', description: 'Mốc cần theo dõi' },
};

export const TASK_LABELS: Record<TaskKey, { title: string; description: string }> = {
  createChallenge: {
    title: 'Tạo challenge đầu tiên',
    description: 'Khởi động quy trình tuyển dụng dựa trên năng lực.',
  },
  reviewSubmissions: {
    title: 'Chấm bài đang chờ',
    description: 'Hoàn tất đánh giá ẩn danh trong Review Queue.',
  },
  deadlineSoon: {
    title: 'Kiểm tra challenge sắp hết hạn',
    description: 'Rà soát deadline và bài nộp trước khi đóng.',
  },
};

export const ACTIVITY_LABELS: Record<ActivityAction, string> = {
  challengeCreated: 'đã tạo challenge',
  submissionReceived: 'đã gửi bài cho',
};

export const SETTINGS_LABELS: Record<SettingsSection, string> = {
  profile: 'Workspace profile',
  members: 'Members',
  notifications: 'Notifications',
  appearance: 'Appearance',
  privacy: 'Privacy',
};
