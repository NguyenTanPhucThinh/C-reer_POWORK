'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import _apiClient from '@/lib/api/client'; // Keep this import in case it's used elsewhere or for future real API calls
import { challengeAPI } from '@/lib/api/endpoints'; // Keep this import in case it's used elsewhere or for future real API calls
import { ChallengeSummary } from '@/lib/types/challenge';
import { DashboardShell } from '@/components/layout/DashboardShell';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';

interface ChallengeCardProps {
  challenge: ChallengeSummary;
}

function ChallengeCard({ challenge }: ChallengeCardProps) {
  const _router = useRouter();
  const isChallengeOpen = new Date(challenge.deadline) > new Date();

  return (
    <Link
      href={`/challenges/${challenge.challenge_id}`}
      className="card-base flex flex-col gap-2 transition-colors hover:border-accent h-full"
    >
      <div className="flex justify-between items-start">
        <h3 className="text-2xl font-semibold text-gray-900 dark:text-gray-100 line-clamp-2 flex-grow">
          {challenge.title}
        </h3>
        <Badge
          variant={isChallengeOpen ? 'open' : 'fail'}
          className="flex-shrink-0 whitespace-nowrap"
        >
          {isChallengeOpen ? 'Đang mở' : 'Đã đóng'}
        </Badge>
      </div>

      <div className="flex flex-col gap-2 text-xs text-gray-600 dark:text-gray-400">
        <div className="flex gap-2 items-center">
          <span className="text-sm text-gray-800 dark:text-gray-200">{challenge.company_name}</span>
          <span className="text-gray-400 dark:text-gray-600">•</span>
          <span>Hạn nộp: {new Date(challenge.deadline).toLocaleDateString()}</span>
        </div>
        <div className="flex flex-wrap gap-2">
          <span className="tag">{challenge.industry}</span>
        </div>
      </div>

      <div className="mt-auto mt-4 pt-4 border-t border-gray-200 dark:border-gray-700 flex justify-end">
        <Button variant="default">Xem đề bài</Button>
      </div>
    </Link>
  );
}

export default function ChallengesPage() {
  const [challenges, setChallenges] = useState<ChallengeSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchChallenges() {
      setLoading(true);
      setError(null);
      const res = await challengeAPI.list();
      setChallenges(res);
      setLoading(false);
    }
    fetchChallenges();
  }, []);

  return (
    <DashboardShell>
      <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-gray-100 mb-2">
        Danh sách thử thách
      </h1>
      <p className="text-lg text-gray-600 dark:text-gray-400 mb-6">
        Khám phá các thử thách hiện có
      </p>
      {loading && <p className="text-center text-gray-500">Đang tải thử thách...</p>}
      {error && <p className="text-center text-red-500">Lỗi: {error}</p>}
      {!loading && challenges.length === 0 && !error && (
        <p className="text-center text-gray-500">Không tìm thấy thử thách nào.</p>
      )}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {challenges.map((challenge) => (
          <ChallengeCard key={challenge.challenge_id} challenge={challenge} />
        ))}
      </div>
    </DashboardShell>
  );
}
