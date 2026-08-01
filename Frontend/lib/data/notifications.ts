export type NotificationTone = 'success' | 'info' | 'warning' | 'accent';

export interface NotificationAction {
  label: string;
  href?: string;
}

export interface AppNotification {
  id: string;
  title: string;
  detail: string;
  time: string;
  tone: NotificationTone;
  unread: boolean;
  actions?: NotificationAction[];
}

// Mock thông báo dùng chung cho chuông trên header và mục Notifications ở sidebar.
export const NOTIFICATIONS: AppNotification[] = [
  {
    id: 'n1',
    title: 'Bài nộp mới cần chấm',
    detail: 'Minh Anh vừa nộp bài "React Dashboard".',
    time: '5 phút',
    tone: 'accent',
    unread: true,
    actions: [{ label: 'Chấm bài', href: '/employer/submissions' }, { label: 'Xem hồ sơ' }],
  },
  {
    id: 'n2',
    title: 'Ứng viên nhận lời mời',
    detail: 'Quốc Bảo đã chấp nhận lời mời phỏng vấn.',
    time: '1 giờ',
    tone: 'success',
    unread: true,
    actions: [{ label: 'Xem talent pool', href: '/talent-pool' }],
  },
  {
    id: 'n3',
    title: 'Challenge sắp đến hạn',
    detail: '"UI Challenge" còn 2 ngày trước khi đóng.',
    time: '3 giờ',
    tone: 'warning',
    unread: true,
    actions: [{ label: 'Mở challenge', href: '/challenges' }],
  },
  {
    id: 'n4',
    title: 'Hồ sơ được mở khóa',
    detail: 'Bạn đã unlock hồ sơ của Thu Hà.',
    time: 'Hôm qua',
    tone: 'info',
    unread: false,
    actions: [{ label: 'Xem hồ sơ' }],
  },
];

export const toneDot: Record<NotificationTone, string> = {
  success: 'bg-success',
  info: 'bg-info',
  warning: 'bg-warning',
  accent: 'bg-accent',
};
