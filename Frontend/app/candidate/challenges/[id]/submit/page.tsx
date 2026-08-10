'use client';

import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { assessmentAPI, challengeAPI } from '@/lib/api/endpoints';
import {
  TextSubmissionEditor,
  Uploader,
  type TextSubmissionFormat,
  type UploadMetadata,
} from '@/components/submissions';
import { Badge, Button } from '@/components/ui';

type SubmissionMethod = 'TEXT' | 'FILE' | null;

function getChallengeId(params: ReturnType<typeof useParams>): string {
  const rawId = params?.id;
  return Array.isArray(rawId) ? (rawId[0] ?? '') : (rawId ?? '');
}

function formatDeadline(value?: string) {
  if (!value) return 'Chưa xác định';
  return new Intl.DateTimeFormat('vi-VN', {
    dateStyle: 'long',
    timeStyle: 'short',
  }).format(new Date(value));
}

export default function CandidateChallengeSubmitPage() {
  const challengeId = getChallengeId(useParams());
  const router = useRouter();
  const [submissionMethod, setSubmissionMethod] = useState<SubmissionMethod>(null);
  const [isUploaderOpen, setIsUploaderOpen] = useState(false);

  const challengeQuery = useQuery({
    queryKey: ['challenge', challengeId],
    queryFn: () => challengeAPI.getById(challengeId),
    enabled: Boolean(challengeId),
  });

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

  const chooseFile = () => {
    setSubmissionMethod('FILE');
    setIsUploaderOpen(true);
  };

  const closeUploader = () => {
    if (isUploading) return;
    setIsUploaderOpen(false);
    setSubmissionMethod(null);
  };

  return (
    <div className="mx-auto flex min-h-full w-full max-w-[1600px] flex-col gap-5">
      <header className="flex shrink-0 flex-col gap-4 border-b-hairline border-border pb-5 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0">
          <Link href={`/challenges/${challengeId}`} className="back-link hover:underline">
            &larr; Quay lại thử thách
          </Link>
          <h1 className="mt-4 text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
            Nộp bài thử thách
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-foreground-secondary">
            Chọn cách bạn muốn trình bày bài làm. Danh tính vẫn được ẩn trong toàn bộ quá trình đánh
            giá.
          </p>
        </div>
        {submissionMethod && (
          <Button
            type="button"
            onClick={() => setSubmissionMethod(null)}
            disabled={textSubmission.isPending || isUploading}
          >
            Đổi phương thức nộp
          </Button>
        )}
      </header>

      {!submissionMethod && (
        <section className="animate-in flex flex-1 items-center justify-center py-6 fade-in slide-in-from-bottom-2 duration-300 motion-reduce:animate-none">
          <div className="w-full max-w-4xl overflow-hidden rounded-2xl border border-border-secondary bg-background-secondary shadow-2xl shadow-black/20">
            <div className="border-b border-border px-6 py-6 text-center sm:px-10">
              <Badge variant="blind">Bước đầu tiên</Badge>
              <h2 className="mt-4 text-2xl font-semibold text-foreground sm:text-3xl">
                Bạn muốn nộp bài theo cách nào?
              </h2>
              <p className="mx-auto mt-2 max-w-2xl text-sm leading-6 text-foreground-secondary">
                Chọn một phương thức để mở đúng không gian làm việc. Bạn vẫn có thể quay lại thay
                đổi trước khi gửi bài.
              </p>
            </div>

            <div className="grid gap-4 p-5 sm:grid-cols-2 sm:p-8">
              <button
                type="button"
                onClick={() => setSubmissionMethod('TEXT')}
                className="group min-h-64 rounded-2xl border border-border-secondary bg-background p-6 text-left transition duration-200 hover:-translate-y-1 hover:border-accent hover:bg-accent-bg/40 hover:shadow-xl focus:outline-none focus-visible:ring-2 focus-visible:ring-accent motion-reduce:transform-none"
              >
                <span className="flex h-14 w-14 items-center justify-center rounded-2xl border border-accent/30 bg-accent-bg text-accent transition-transform group-hover:scale-105 motion-reduce:transform-none">
                  <svg
                    viewBox="0 0 24 24"
                    className="h-7 w-7"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    aria-hidden="true"
                  >
                    <path d="M4 19.5V4.8A1.8 1.8 0 0 1 5.8 3h8.8L20 8.4v11.1A1.5 1.5 0 0 1 18.5 21h-13A1.5 1.5 0 0 1 4 19.5Z" />
                    <path d="M14 3v6h6M8 13h8M8 17h6" />
                  </svg>
                </span>
                <span className="mt-6 block text-xl font-semibold text-foreground">
                  Nhập bài trực tiếp
                </span>
                <span className="mt-2 block text-sm leading-6 text-foreground-secondary">
                  Làm bài ngay trên hệ thống bằng trình soạn thảo trực quan hoặc Markdown có xem
                  trước.
                </span>
                <span className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-accent">
                  Mở trình soạn thảo <span aria-hidden="true">→</span>
                </span>
              </button>

              <button
                type="button"
                onClick={chooseFile}
                className="group min-h-64 rounded-2xl border border-border-secondary bg-background p-6 text-left transition duration-200 hover:-translate-y-1 hover:border-info hover:bg-info-bg/30 hover:shadow-xl focus:outline-none focus-visible:ring-2 focus-visible:ring-info motion-reduce:transform-none"
              >
                <span className="flex h-14 w-14 items-center justify-center rounded-2xl border border-info/30 bg-info-bg text-info transition-transform group-hover:scale-105 motion-reduce:transform-none">
                  <svg
                    viewBox="0 0 24 24"
                    className="h-7 w-7"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    aria-hidden="true"
                  >
                    <path d="M12 16V4m0 0L7.5 8.5M12 4l4.5 4.5" />
                    <path d="M5 13v6a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-6" />
                  </svg>
                </span>
                <span className="mt-6 block text-xl font-semibold text-foreground">
                  Tải tệp bài làm
                </span>
                <span className="mt-2 block text-sm leading-6 text-foreground-secondary">
                  Phù hợp với PDF, mã nguồn ZIP hoặc bài làm đã được hoàn thiện bằng công cụ khác.
                </span>
                <span className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-info">
                  Chọn tệp để tải lên <span aria-hidden="true">→</span>
                </span>
              </button>
            </div>
          </div>
        </section>
      )}

      {submissionMethod === 'TEXT' && (
        <main className="animate-in grid min-h-0 flex-1 gap-5 fade-in slide-in-from-bottom-2 duration-300 motion-reduce:animate-none lg:grid-cols-[minmax(320px,0.75fr)_minmax(0,1.5fr)]">
          <aside className="overflow-hidden rounded-2xl border border-border-secondary bg-background-secondary lg:max-h-[calc(100vh-12rem)]">
            {challengeQuery.isLoading && (
              <div className="space-y-4 p-6" aria-label="Đang tải đề bài">
                <div className="h-7 w-3/4 animate-pulse rounded bg-background-tertiary" />
                <div className="h-4 w-1/2 animate-pulse rounded bg-background-tertiary" />
                <div className="h-32 animate-pulse rounded bg-background-tertiary" />
              </div>
            )}
            {challengeQuery.isError && (
              <div className="p-6 text-sm leading-6 text-error" role="alert">
                Không thể tải đề bài. Hãy kiểm tra kết nối trước khi tiếp tục.
              </div>
            )}
            {challengeQuery.data && (
              <div className="h-full overflow-y-auto">
                <div className="border-b border-border bg-background px-6 py-5">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant="open">Đề bài</Badge>
                    <span className="text-xs text-foreground-tertiary">
                      {challengeQuery.data.industry}
                    </span>
                  </div>
                  <h2 className="mt-4 text-xl font-semibold leading-7 text-foreground">
                    {challengeQuery.data.title}
                  </h2>
                  <p className="mt-3 text-xs text-foreground-tertiary">
                    Hạn nộp: {formatDeadline(challengeQuery.data.deadline)}
                  </p>
                </div>

                <div className="space-y-7 p-6">
                  <section>
                    <h3 className="text-xs font-semibold uppercase tracking-[0.16em] text-accent">
                      Yêu cầu thử thách
                    </h3>
                    <p className="mt-3 whitespace-pre-wrap text-sm leading-7 text-foreground-secondary">
                      {challengeQuery.data.description}
                    </p>
                  </section>

                  <section>
                    <h3 className="text-xs font-semibold uppercase tracking-[0.16em] text-accent">
                      Tiêu chí đánh giá
                    </h3>
                    <div className="mt-3 space-y-3">
                      {challengeQuery.data.rubrics.map((rubric, index) => (
                        <div
                          key={rubric.criteria_id}
                          className="rounded-xl border border-border bg-background p-4"
                        >
                          <div className="flex items-start gap-3">
                            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-accent-bg text-xs font-semibold text-accent">
                              {index + 1}
                            </span>
                            <div>
                              <p className="text-sm font-medium text-foreground">
                                {rubric.criteria_name}
                              </p>
                              <p className="mt-1 text-xs text-foreground-tertiary">
                                Trọng số {rubric.weight}% · Tối đa {rubric.max_score} điểm
                              </p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </section>
                </div>
              </div>
            )}
          </aside>

          <section className="min-w-0">
            <TextSubmissionEditor
              disabled={textSubmission.isPending || !challengeId}
              error={textSubmission.isError ? getErrorMessage(textSubmission.error) : null}
              onSubmit={async ({ content, contentFormat }) => {
                await textSubmission.mutateAsync({ content, contentFormat });
              }}
            />
          </section>
        </main>
      )}

      <Uploader
        challengeId={challengeId}
        isOpen={isUploaderOpen}
        onClose={closeUploader}
        onUpload={async (file, metadata) => {
          await uploadSubmission({ file, metadata });
        }}
        hasExistingSubmissions={false}
      />
    </div>
  );
}
