'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/lib/hooks/useAuth';
import _Link from 'next/link';
import _apiClient from '@/lib/api/client';
import { challengeAPI } from '@/lib/api/endpoints';
import { Challenge } from '@/lib/types/challenge';
import { DashboardShell } from '@/components/layout/DashboardShell';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';

export default function ChallengeDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const [challenge, setChallenge] = useState<Challenge | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchChallengeDetail() {
      try {
        setLoading(true);
        setError(null);
        const res = await challengeAPI.getById(id as string);
        setChallenge(res);
      } catch (err) {
        setError('An error occurred while fetching challenge details.');
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    if (id) {
      fetchChallengeDetail();
    }
  }, [id]);

  const isChallengeOpen = challenge ? new Date(challenge.deadline) > new Date() : false;

  if (loading) {
    return (
      <DashboardShell>
        <p className="text-center text-gray-500">Đang tải chi tiết thử thách...</p>
      </DashboardShell>
    );
  }

  if (error) {
    return (
      <DashboardShell>
        <p className="text-center text-red-500">Lỗi: {error}</p>
      </DashboardShell>
    );
  }

  if (!challenge) {
    return (
      <DashboardShell>
        <p className="text-center text-gray-500">Không tìm thấy thử thách.</p>
      </DashboardShell>
    );
  }

  return (
    <DashboardShell>
      <div className="mx-auto max-w-4xl space-y-6">
        <div className="flex justify-between items-start">
          <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-gray-100 pr-4">
            {challenge.title}
          </h1>
          <Badge
            variant={isChallengeOpen ? 'open' : 'fail'}
            className="flex-shrink-0 whitespace-nowrap"
          >
            {isChallengeOpen ? 'Đang mở' : 'Đã đóng'}
          </Badge>
        </div>

        <div className="flex flex-col gap-2 text-sm text-gray-600 dark:text-gray-400">
          <p>Công ty: {challenge.company_name}</p>
          <p>
            Ngành nghề: <span className="tag">{challenge.industry}</span>
          </p>
          <p>Hạn nộp: {new Date(challenge.deadline).toLocaleDateString()}</p>
        </div>

        <div className="prose dark:prose-invert max-w-none">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">Mô tả</h2>
          <p>{challenge.description}</p>
        </div>

        <div className="prose dark:prose-invert max-w-none">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
            Tiêu chí chấm điểm
          </h2>
          <ul className="list-disc list-inside space-y-1">
            {challenge.rubrics.map((rubric) => (
              <li key={rubric.criteria_id}>
                {rubric.criteria_name} (Trọng số: {rubric.weight}%, Điểm tối đa: {rubric.max_score})
              </li>
            ))}
          </ul>
        </div>

        {isChallengeOpen && user?.role === 'Candidate' && (
          <div className="pt-6 border-t border-gray-200 dark:border-gray-700 flex justify-end">
            <Button
              onClick={() => router.push(`/candidate/challenges/${challenge.challenge_id}/submit`)}
            >
              Nộp bài
            </Button>
          </div>
        )}
      </div>
    </DashboardShell>
  );
}
