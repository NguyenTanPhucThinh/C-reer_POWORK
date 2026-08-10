'use client';

import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import axios from 'axios';
import { assessmentAPI } from '@/lib/api/endpoints';
import {
  TextSubmissionEditor,
  Uploader,
  type TextSubmissionFormat,
  type UploadMetadata,
} from '@/components/submissions';
import { Badge, Button } from '@/components/ui';

function getChallengeId(params: ReturnType<typeof useParams>): string {
  const rawId = params?.id;
  return Array.isArray(rawId) ? (rawId[0] ?? '') : (rawId ?? '');
}

export default function CandidateChallengeSubmitPage() {
  const challengeId = getChallengeId(useParams());
  const router = useRouter();
  const [isUploaderOpen, setIsUploaderOpen] = useState(false);

  const getErrorMessage = (error: unknown) =>
    axios.isAxiosError(error)
      ? error.response?.data?.message || error.message
      : error instanceof Error
        ? error.message
        : 'Đã xảy ra lỗi không xác định.';

  const { mutateAsync: uploadSubmission, isPending: isUploading } = useMutation({
    mutationFn: async ({ file, metadata }: { file: File; metadata: UploadMetadata }) => {
      const { upload_url, object_key } = await assessmentAPI.getPresignedUploadUrl({
        challenge_id: challengeId,
        filename: metadata.originalFileName,
        content_type: file.type,
      });

      await axios.put(upload_url, file, { headers: { 'Content-Type': file.type } });
      return assessmentAPI.submit({
        challenge_id: challengeId,
        submission_method: 'FILE',
        solution_url: object_key,
      });
    },
    onSuccess: (submission) => {
      setIsUploaderOpen(false);
      router.push(`/candidate/my-submissions/${submission.submission_id}/verification`);
    },
    onError: (error) => {
      alert(`Nộp bài thất bại: ${getErrorMessage(error)}`);
    },
  });

  const textSubmission = useMutation({
    mutationFn: ({
      content,
      contentFormat,
    }: {
      content: string;
      contentFormat: TextSubmissionFormat;
    }) =>
      assessmentAPI.submit({
        challenge_id: challengeId,
        submission_method: 'TEXT',
        content_format: contentFormat,
        content,
      }),
    onSuccess: (submission) => {
      router.push(`/candidate/my-submissions/${submission.submission_id}/verification`);
    },
  });

  return (
    <div className="mx-auto flex h-full min-h-0 max-w-6xl flex-col gap-4">
      <header className="flex shrink-0 flex-col gap-4 border-b-hairline border-border pb-4 sm:min-h-32 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <Link href="/candidate/dashboard" className="back-link hover:underline">
            &larr; Quay lại tổng quan
          </Link>
          <h1 className="mt-4 text-4xl font-semibold tracking-tight text-foreground">
            Nộp bài thử thách
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-foreground-secondary">
            Employer chỉ nhìn thấy mã ẩn danh trong quá trình đánh giá, không thấy danh tính cá nhân
            của bạn.
          </p>
        </div>

        <div className="flex shrink-0 flex-col gap-2 rounded-lg border-hairline border-border bg-background-secondary px-4 py-3">
          <span className="text-xs text-foreground-tertiary">Mã challenge</span>
          <span className="font-mono text-sm text-accent">{challengeId}</span>
          <Badge variant="blind">Sẵn sàng nộp bài</Badge>
        </div>
      </header>

      <section className="flex shrink-0 flex-col gap-3 rounded-lg border-hairline border-border bg-background-secondary px-5 py-4 sm:min-h-16 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-medium text-foreground">Bạn đã có tài liệu hoàn chỉnh?</p>
          <p className="mt-1 text-xs text-foreground-tertiary">
            Nộp PDF hoặc ZIP. Hệ thống sẽ kiểm tra an toàn trước khi chuyển bài cho Employer.
          </p>
        </div>
        <Button
          type="button"
          variant="primary"
          onClick={() => setIsUploaderOpen(true)}
          disabled={isUploading || !challengeId}
        >
          {isUploading ? 'Đang tải lên...' : 'Tải file bài làm'}
        </Button>
      </section>

      <TextSubmissionEditor
        disabled={textSubmission.isPending || !challengeId}
        error={textSubmission.isError ? getErrorMessage(textSubmission.error) : null}
        onSubmit={async ({ content, contentFormat }) => {
          await textSubmission.mutateAsync({ content, contentFormat });
        }}
      />

      <Uploader
        challengeId={challengeId}
        isOpen={isUploaderOpen}
        onClose={() => setIsUploaderOpen(false)}
        onUpload={async (file, metadata) => {
          await uploadSubmission({ file, metadata });
        }}
        hasExistingSubmissions={false}
      />
    </div>
  );
}
