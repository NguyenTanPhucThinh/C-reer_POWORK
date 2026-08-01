'use client';

import type { TalentPoolStatus } from '@/lib/types/talent-pool';

export type FilterTabOption = 'ALL' | TalentPoolStatus;

interface TalentPoolToolbarProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  activeFilter: FilterTabOption;
  onFilterChange: (filter: FilterTabOption) => void;
  totalCount: number;
  filteredCount: number;
  inPoolCount: number;
  invitedCount: number;
}

export function TalentPoolToolbar({
  searchQuery,
  onSearchChange,
  activeFilter,
  onFilterChange,
  totalCount,
  filteredCount,
  inPoolCount,
  invitedCount,
}: TalentPoolToolbarProps) {
  const tabs: { key: FilterTabOption; label: string; count: number }[] = [
    { key: 'ALL', label: 'Tất cả', count: totalCount },
    { key: 'IN_POOL', label: 'In Pool', count: inPoolCount },
    { key: 'INVITED', label: 'Invited', count: invitedCount },
  ];

  return (
    <div className="card flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      {/* Search Bar */}
      <div className="relative min-w-0 flex-1 max-w-md">
        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-foreground-tertiary">
          <svg
            className="h-4 w-4"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <circle cx="11" cy="11" r="8" />
            <path d="m21 21-4.35-4.35" />
          </svg>
        </div>

        <input
          type="text"
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Tìm kiếm ứng viên theo tên, kỹ năng, trường đại học..."
          className="w-full rounded-lg border border-border-secondary bg-background py-2 pl-10 pr-9 text-xs text-foreground placeholder:text-foreground-disabled transition-colors focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
        />

        {searchQuery && (
          <button
            type="button"
            onClick={() => onSearchChange('')}
            className="absolute inset-y-0 right-0 flex items-center pr-3 text-foreground-tertiary hover:text-foreground"
            title="Xóa tìm kiếm"
          >
            <svg
              className="h-4 w-4"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>

      {/* Filter Tabs & Counter */}
      <div className="flex flex-wrap items-center justify-between gap-3 sm:justify-end">
        {/* Filter Pills */}
        <div className="flex items-center gap-1 rounded-lg border border-border bg-background p-1">
          {tabs.map((tab) => {
            const isActive = activeFilter === tab.key;
            return (
              <button
                key={tab.key}
                type="button"
                onClick={() => onFilterChange(tab.key)}
                className={`inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-all ${
                  isActive
                    ? 'bg-background-secondary text-accent shadow-xs border border-border'
                    : 'text-foreground-secondary hover:text-foreground hover:bg-background-tertiary'
                }`}
              >
                <span>{tab.label}</span>
                <span
                  className={`rounded-full px-1.5 py-0.5 text-2xs font-semibold ${
                    isActive ? 'bg-accent-bg text-accent' : 'bg-elevated text-foreground-tertiary'
                  }`}
                >
                  {tab.count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Filtered Count indicator */}
        <div className="text-2xs text-foreground-tertiary hidden md:block">
          Hiển thị <span className="font-semibold text-foreground">{filteredCount}</span> ứng viên
        </div>
      </div>
    </div>
  );
}
