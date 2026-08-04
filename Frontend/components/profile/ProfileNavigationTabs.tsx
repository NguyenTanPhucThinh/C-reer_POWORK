const tabs = [
  { label: 'Dòng thời gian', href: '#career-timeline' },
  { label: 'Bằng chứng', href: '#evidence' },
  { label: 'Dự án', href: '#evidence' },
  { label: 'Thành tích', href: '#career-analytics' },
  { label: 'Hoạt động', href: '#career-timeline' },
  { label: 'Thống kê', href: '#career-analytics' },
  { label: 'Đã lưu', href: '#evidence' },
  { label: 'Challenge đã lưu', href: '#evidence' },
];

export function ProfileNavigationTabs() {
  return (
    <nav className="sticky top-0 z-20 -mx-6 border-y-hairline border-border-secondary bg-background/95 px-6 backdrop-blur supports-[backdrop-filter]:bg-background/80">
      <div className="mx-auto flex max-w-[1240px] gap-1 overflow-x-auto py-2">
        {tabs.map((tab) => (
          <a
            key={tab.label}
            href={tab.href}
            className="shrink-0 rounded-pill px-4 py-2 text-sm font-medium text-foreground-secondary transition-colors hover:bg-background-tertiary hover:text-foreground"
          >
            {tab.label}
          </a>
        ))}
      </div>
    </nav>
  );
}
