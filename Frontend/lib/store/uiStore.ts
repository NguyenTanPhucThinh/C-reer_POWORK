import { create } from 'zustand';

interface UIStore {
  sidebarOpen: boolean;
  toggleSidebar: () => void;
  setSidebarOpen: (open: boolean) => void;
  // Panel thông báo (chuông trên header). Sidebar cũng mở panel này để dùng chung.
  notificationsOpen: boolean;
  toggleNotifications: () => void;
  setNotificationsOpen: (open: boolean) => void;
}

export const useUIStore = create<UIStore>((set) => ({
  sidebarOpen: true,
  toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
  setSidebarOpen: (open) => set({ sidebarOpen: open }),
  notificationsOpen: false,
  toggleNotifications: () => set((state) => ({ notificationsOpen: !state.notificationsOpen })),
  setNotificationsOpen: (open) => set({ notificationsOpen: open }),
}));
