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

// ─── Thông báo dành riêng cho Employer ────────────────────────────────────────
export const EMPLOYER_NOTIFICATIONS: AppNotification[] = [
  {
    id: 'e1',
    title: 'Bài nộp mới cần chấm',
    detail: 'Minh Anh vừa nộp bài "React Dashboard".',
    time: '5 phút',
    tone: 'accent',
    unread: true,
    actions: [{ label: 'Chấm bài', href: '/employer/submissions' }, { label: 'Xem hồ sơ' }],
  },
  {
    id: 'e2',
    title: 'Ứng viên nhận lời mời',
    detail: 'Quốc Bảo đã chấp nhận lời mời phỏng vấn.',
    time: '1 giờ',
    tone: 'success',
    unread: true,
    actions: [{ label: 'Xem talent pool', href: '/talent-pool' }],
  },
  {
    id: 'e3',
    title: 'Challenge sắp đến hạn',
    detail: '"UI Challenge" còn 2 ngày trước khi đóng.',
    time: '3 giờ',
    tone: 'warning',
    unread: true,
    actions: [{ label: 'Mở challenge', href: '/challenges' }],
  },
  {
    id: 'e4',
    title: 'Hồ sơ được mở khóa',
    detail: 'Bạn đã unlock hồ sơ của Thu Hà (điểm 85).',
    time: 'Hôm qua',
    tone: 'info',
    unread: false,
    actions: [{ label: 'Xem hồ sơ' }],
  },
];

// ─── Thông báo dành riêng cho Candidate (Employee) ────────────────────────────
export const EMPLOYEE_NOTIFICATIONS: AppNotification[] = [
  {
    id: 'c1',
    title: 'Bài làm đã được ghi nhận',
    detail: 'Bài làm "React Dashboard" của bạn đã được ghi nhận thành công.',
    time: '5 phút',
    tone: 'success',
    unread: true,
    actions: [{ label: 'Xem trạng thái', href: '/candidate/my-submissions' }],
  },
  {
    id: 'c2',
    title: 'Nhà tuyển dụng đã mở khóa hồ sơ',
    detail: 'Hồ sơ ẩn danh của bạn vừa được TechCorp mở khóa. Bạn có thể xem phản hồi chi tiết.',
    time: '2 giờ',
    tone: 'info',
    unread: true,
    actions: [{ label: 'Xem phản hồi', href: '/candidate/my-submissions' }],
  },
  {
    id: 'c3',
    title: 'Được mời vào Talent Pool',
    detail: 'Bạn đã được TechCorp thêm vào danh sách ứng viên tiềm năng.',
    time: 'Hôm qua',
    tone: 'accent',
    unread: true,
    actions: [{ label: 'Xem chi tiết', href: '/candidate/profile' }],
  },
  {
    id: 'c4',
    title: 'Challenge mới phù hợp với bạn',
    detail: '"Senior Frontend Challenge" — kỹ năng React, TypeScript khớp hồ sơ của bạn.',
    time: '2 ngày',
    tone: 'warning',
    unread: false,
    actions: [{ label: 'Xem challenge', href: '/challenges' }],
  },
];

export const toneDot: Record<NotificationTone, string> = {
  success: 'bg-success',
  info: 'bg-info',
  warning: 'bg-warning',
  accent: 'bg-accent',
};
