import type { UserRole } from '@/lib/types';

export type NavIconName =
  | 'home'
  | 'challenge'
  | 'submission'
  | 'profile'
  | 'create'
  | 'talent'
  | 'bookmark'
  | 'notification'
  | 'settings';

export interface NavItem {
  label: string;
  href: string;
  icon: NavIconName;
}

/**
 * Menu điều hướng theo vai trò. Sidebar render danh sách tương ứng role của
 * user hiện tại. Thêm/bớt mục ở đây để đổi điều hướng toàn cục.
 */
export const NAV_BY_ROLE: Record<UserRole, NavItem[]> = {
  Candidate: [
    { label: 'Tổng quan', href: '/candidate/dashboard', icon: 'home' },
    { label: 'Thử thách', href: '/challenges', icon: 'challenge' },
    { label: 'Bài nộp của tôi', href: '/candidate/my-submissions', icon: 'submission' },
    { label: 'Hồ sơ động', href: '/candidate/profile', icon: 'profile' },
  ],
  Employer: [
    { label: 'Tổng quan', href: '/employer/dashboard', icon: 'home' },
    { label: 'Bài nộp', href: '/employer/submissions', icon: 'submission' },
    { label: 'Thử thách', href: '/challenges', icon: 'challenge' },
    { label: 'Tạo thử thách', href: '/employer/challenges/create', icon: 'create' },
    { label: 'Kho ứng viên', href: '/talent-pool', icon: 'talent' },
  ],
};
