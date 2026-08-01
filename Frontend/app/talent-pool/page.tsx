'use client';

import { useMemo, useState } from 'react';
import { DashboardShell } from '@/components/layout';
import {
  CandidateCard,
  CandidateProfileModal,
  FilterTabOption,
  RecentActivitiesCard,
  TalentPoolEmptyState,
  TalentPoolStats,
  TalentPoolToolbar,
} from '@/components/talent-pool';
import type { RecentActivity, TalentPoolEntry, TalentPoolStatus } from '@/lib/types/talent-pool'; // Use types from here
import { useTalentPool, useUpdateTalentPoolStatus } from '@/lib/hooks/useTalentPool'; // Import hooks

export default function TalentPoolPage() {
  const { data: entries, isLoading, isError } = useTalentPool(); // Use data from hook
  const updateStatusMutation = useUpdateTalentPoolStatus(); // Use mutation hook

  const [activities, setActivities] = useState<RecentActivity[]>([]); // Initialize activities as empty, or fetch from API
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<FilterTabOption>('ALL');
  const [selectedCandidate, setSelectedCandidate] = useState<TalentPoolEntry | null>(null);

  // Status Change Handler
  const handleStatusChange = (poolId: string, newStatus: TalentPoolStatus) => {
    updateStatusMutation.mutate(
      { poolId, status: newStatus },
      {
        onSuccess: () => {
          // No need to manually update entries here, react-query will re-fetch
          // Log recent activity (can be moved to backend or a separate hook)
          // For now, keep local for immediate feedback
          if (entries) {
            const entry = entries.find((e) => e.pool_id === poolId); // Using 'pool_id'
            if (entry) {
              const newActivity: RecentActivity = {
                id: `act-${Date.now()}`,
                candidate_name: entry.candidate.full_name, // Using 'candidate.full_name'
                action:
                  newStatus === 'INVITED'
                    ? 'vừa được chuyển trạng thái sang "Đã mời (INVITED)"'
                    : 'vừa được chuyển lại vào Talent Pool (IN POOL)',
                timestamp: 'Vừa xong',
                type: newStatus === 'INVITED' ? 'invited' : 'status_change',
              };
              setActivities((actPrev) => [newActivity, ...actPrev]);

              const updated = { ...entry, status: newStatus };
              if (selectedCandidate?.pool_id === poolId) {
                // Using 'pool_id'
                setSelectedCandidate(updated);
              }
            }
          }
        },
      }
    );
  };

  // Filter & Search computation
  const filteredEntries = useMemo(() => {
    if (isLoading || isError || !entries) return []; // Handle loading/error states

    return entries.filter((entry) => {
      // 1. Status Filter
      if (activeFilter !== 'ALL' && entry.status !== activeFilter) {
        return false;
      }

      // 2. Search Query (Name, University, Skills, Challenges)
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase().trim();
        const nameMatch = entry.candidate.full_name.toLowerCase().includes(query);
        const uniMatch = entry.candidate.university?.toLowerCase().includes(query) ?? false;
        const skillsMatch =
          entry.candidate.primary_skills?.some((skill) => skill.toLowerCase().includes(query)) ??
          false;
        const challengeMatch = entry.challenges_taken.some((ch) =>
          ch.toLowerCase().includes(query)
        );

        return nameMatch || uniMatch || skillsMatch || challengeMatch;
      }

      return true;
    });
  }, [entries, activeFilter, searchQuery, isLoading, isError]); // Added isLoading, isError to dependencies

  // Statistics counters
  const totalCandidates = entries?.length || 0; // Handle entries being undefined during loading
  const inPoolCount = useMemo(
    () => entries?.filter((e) => e.status === 'IN_POOL').length || 0,
    [entries]
  );
  const invitedCount = useMemo(
    () => entries?.filter((e) => e.status === 'INVITED').length || 0,
    [entries]
  );
  const highScorerCount = useMemo(
    () => entries?.filter((e) => e.highest_score >= 85).length || 0,
    [entries]
  );

  // Suggested Actions handler
  const handleSuggestedAction = (actionType: string) => {
    if (actionType === 'invite_top') {
      setActiveFilter('ALL');
      setSearchQuery('');
      if (entries) {
        const topCandidateIds = entries
          .filter((e) => e.highest_score >= 90 && e.status === 'IN_POOL')
          .map((e) => e.pool_id);

        if (topCandidateIds.length === 0) {
          alert('Tất cả ứng viên xuất sắc ≥ 90 điểm đã được gửi lời mời.');
          return;
        }

        // Using mutate for each candidate status update
        topCandidateIds.forEach((poolId) => {
          updateStatusMutation.mutate({ poolId, status: 'INVITED' });
        });

        const newAct: RecentActivity = {
          id: `act-${Date.now()}`,
          candidate_name: `${topCandidateIds.length} ứng viên xuất sắc (≥90 điểm)`,
          action: 'vừa được tự động gửi lời mời phỏng vấn',
          timestamp: 'Vừa xong',
          type: 'invited',
        };
        setActivities((prev) => [newAct, ...prev]);
      }
    } else if (actionType === 'export') {
      alert(`Đã xuất báo cáo ${filteredEntries.length} ứng viên dạng CSV!`);
    }
  };

  const isFiltered = searchQuery.trim().length > 0 || activeFilter !== 'ALL';

  return (
    <DashboardShell>
      <div className="mx-auto max-w-7xl space-y-6 pb-12">
        {/* Page Header */}
        <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-border pb-5">
          <div>
            <div className="flex items-center gap-2.5">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent-bg text-accent">
                <svg
                  className="h-5 w-5"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                  <circle cx="9" cy="7" r="4" />
                  <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
                  <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                </svg>
              </div>
              <h1 className="text-3xl font-bold text-foreground">Talent Pool</h1>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={() => handleSuggestedAction('export')}
              className="inline-flex items-center gap-2 rounded-lg border border-border-secondary bg-background-secondary px-3.5 py-2 text-xs font-medium text-foreground shadow-xs transition-colors hover:bg-background-tertiary"
            >
              <svg
                className="h-4 w-4 text-foreground-tertiary"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="7 10 12 15 17 10" />
                <line x1="12" y1="15" x2="12" y2="3" />
              </svg>
              Xuất CSV
            </button>

            <span className="rounded-lg border border-accent/30 bg-accent-bg px-3 py-2 text-xs font-semibold text-accent">
              {totalCandidates} Ứng viên trong Pool
            </span>
          </div>
        </header>

        {/* 2-Column Main Layout: Left 70-75%, Right 25-30% */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
          {/* Left Column (Candidates List & Toolbar): 8 of 12 cols (~67-75%) */}
          <main className="space-y-5 lg:col-span-8">
            {/* Toolbar: Search + Filter Tabs */}
            <TalentPoolToolbar
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
              activeFilter={activeFilter}
              onFilterChange={setActiveFilter}
              totalCount={totalCandidates}
              filteredCount={filteredEntries.length}
              inPoolCount={inPoolCount}
              invitedCount={invitedCount}
            />

            {/* Candidate List or Empty State */}
            {isLoading ? (
              <p>Đang tải danh sách ứng viên...</p>
            ) : isError ? (
              <p>Đã xảy ra lỗi khi tải danh sách ứng viên.</p>
            ) : filteredEntries.length === 0 ? (
              <TalentPoolEmptyState
                isFiltered={isFiltered}
                onResetFilter={() => {
                  setSearchQuery('');
                  setActiveFilter('ALL');
                }}
              />
            ) : (
              <div className="grid grid-cols-1 gap-4">
                {filteredEntries.map((entry) => (
                  <CandidateCard
                    key={entry.pool_id}
                    entry={entry}
                    onStatusChange={handleStatusChange}
                    onViewProfile={setSelectedCandidate}
                  />
                ))}
              </div>
            )}
          </main>

          {/* Right Column (Dashboard & Stats Sidebar): 4 of 12 cols (~25-33%) */}
          <aside className="space-y-6 lg:col-span-4">
            {/* Dashboard Statistics Widget */}
            <TalentPoolStats
              totalCandidates={totalCandidates}
              invitedCount={invitedCount}
              inPoolCount={inPoolCount}
              highScorerCount={highScorerCount}
            />

            {/* Recent Activities & Suggested Actions */}
            <RecentActivitiesCard
              activities={activities}
              onSuggestedActionClick={handleSuggestedAction}
            />
          </aside>
        </div>

        {/* Candidate Detail Profile Modal */}
        <CandidateProfileModal
          entry={selectedCandidate}
          onClose={() => setSelectedCandidate(null)}
          onStatusChange={handleStatusChange}
        />
      </div>
    </DashboardShell>
  );
}
