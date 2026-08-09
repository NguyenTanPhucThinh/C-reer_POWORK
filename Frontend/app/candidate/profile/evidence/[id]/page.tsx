'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { EvidenceDetailPanel, LoadingSkeleton } from '@/components/profile';
import { useEvidenceDetail } from '@/lib/hooks';
import { useAuth } from '@/lib/hooks/useAuth';

function getEvidenceId(params: ReturnType<typeof useParams>) {
  const rawId = params?.id;
  if (Array.isArray(rawId)) return rawId[0] ?? '';
  return rawId ?? '';
}

export default function CandidateEvidenceDetailPage() {
  const evidenceId = getEvidenceId(useParams());
  const { user } = useAuth();
  const {
    data: evidence,
    isLoading,
    isError,
    error,
  } = useEvidenceDetail(evidenceId, user?.user_id ?? '');

  if (isLoading) {
    return <LoadingSkeleton />;
  }

  if (isError) {
    return (
      <div className="mx-auto max-w-3xl rounded-lg border-hairline border-border-secondary bg-background-secondary p-5 text-sm text-error">
        {error?.message || 'Không thể tải evidence detail. Vui lòng thử lại sau.'}
      </div>
    );
  }

  if (!evidence) {
    return (
      <div className="mx-auto max-w-3xl rounded-lg border-hairline border-border-secondary bg-background-secondary p-5">
        <p className="text-sm font-medium text-foreground">Không tìm thấy evidence.</p>
        <Link
          href="/candidate/profile"
          className="mt-3 inline-flex text-sm text-accent hover:underline"
        >
          Quay lại Dynamic Profile
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl space-y-4">
      <Link href="/candidate/profile" className="back-link hover:underline">
        &larr; Quay lại Dynamic Profile
      </Link>
      <EvidenceDetailPanel evidence={evidence} />
    </div>
  );
}
