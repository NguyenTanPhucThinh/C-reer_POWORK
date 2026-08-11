'use client';

import axios from 'axios';
import { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui';
import { assessmentAPI } from '@/lib/api/endpoints';
import type { VerificationDashboard } from '@/lib/types';

interface EmployerVerificationVideoPlayerProps {
  submissionId: string;
  video: VerificationDashboard['video'];
}

interface LocalRecordingAccess {
  url: string;
  expiresAt: number;
}

const getErrorMessage = (error: unknown) => {
  if (!axios.isAxiosError(error)) return 'Không thể mở video xác minh lúc này.';
  if (error.response?.status === 403) return 'Bạn không có quyền xem video xác minh này.';
  if (error.response?.status === 409) return 'Video xác minh chưa sẵn sàng để phát.';
  return 'Không thể mở video xác minh lúc này.';
};

export function EmployerVerificationVideoPlayer({
  submissionId,
  video,
}: EmployerVerificationVideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const playAfterRefreshRef = useRef(false);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [access, setAccess] = useState<LocalRecordingAccess | null>(null);
  const [error, setError] = useState<string | null>(null);

  const size = video.recordingSize
    ? `${(video.recordingSize / 1024 / 1024).toFixed(2)} MB`
    : 'Chưa xác định';

  useEffect(() => {
    if (!access || !playAfterRefreshRef.current || !videoRef.current) return;
    playAfterRefreshRef.current = false;
    videoRef.current.load();
    void videoRef.current.play().catch(() => undefined);
  }, [access]);

  const requestRecordingUrl = async (playAfterRefresh = false) => {
    if (isLoading) return;
    setIsLoading(true);
    setError(null);
    playAfterRefreshRef.current = playAfterRefresh;
    try {
      const result = await assessmentAPI.getVerificationRecording(submissionId);
      setAccess({
        url: result.recordingUrl,
        expiresAt: Date.now() + result.expiresIn * 1000,
      });
    } catch (requestError) {
      playAfterRefreshRef.current = false;
      setError(getErrorMessage(requestError));
    } finally {
      setIsLoading(false);
    }
  };

  const openPlayer = () => {
    setIsOpen(true);
    void requestRecordingUrl();
  };

  const closePlayer = () => {
    videoRef.current?.pause();
    setIsOpen(false);
    setAccess(null);
    setError(null);
  };

  const refreshExpiredUrl = () => {
    if (!access || Date.now() < access.expiresAt - 5_000) return false;
    videoRef.current?.pause();
    void requestRecordingUrl(true);
    return true;
  };

  if (!isOpen) {
    return (
      <section className="rounded-2xl border border-border-secondary bg-background-secondary p-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-semibold text-foreground">Video xác minh</h2>
              <span className="rounded-full border border-success/35 bg-success-bg px-2.5 py-1 text-2xs font-semibold text-success">
                {video.status}
              </span>
            </div>
            <p className="mt-1 text-xs leading-5 text-foreground-secondary">
              {video.recordingMimeType ?? 'Không rõ MIME'} · {size}. URL phát chỉ được cấp khi bạn
              mở video.
            </p>
          </div>
          <Button type="button" variant="primary" size="lg" onClick={openPlayer}>
            Xem video xác minh
          </Button>
        </div>
      </section>
    );
  }

  return (
    <section className="overflow-hidden rounded-2xl border border-border-secondary bg-background-secondary">
      <div className="flex items-center justify-between gap-4 border-b border-border px-5 py-4">
        <div>
          <h2 className="text-lg font-semibold text-foreground">Video xác minh</h2>
          <p className="mt-1 text-xs text-foreground-secondary">
            Liên kết phát có thời hạn và sẽ được làm mới khi cần.
          </p>
        </div>
        <button
          type="button"
          onClick={closePlayer}
          className="text-xs font-semibold text-foreground-secondary hover:text-foreground"
        >
          Đóng video
        </button>
      </div>

      <div className="relative flex min-h-[360px] items-center justify-center bg-black">
        {access && (
          <video
            ref={videoRef}
            src={access.url}
            controls
            playsInline
            preload="metadata"
            className="max-h-[72vh] w-full bg-black"
            onPlay={(event) => {
              if (refreshExpiredUrl()) event.currentTarget.pause();
            }}
            onError={() => {
              if (!refreshExpiredUrl()) {
                setError('Video không thể phát. Hãy yêu cầu một liên kết mới.');
              }
            }}
          >
            Trình duyệt của bạn không hỗ trợ phát video WebM.
          </video>
        )}

        {isLoading && (
          <div
            className="absolute inset-0 flex items-center justify-center bg-black/70 text-sm font-medium text-white"
            aria-live="polite"
          >
            Đang cấp quyền xem video...
          </div>
        )}

        {!access && !isLoading && (
          <div className="p-6 text-center">
            <p className="text-sm text-white">{error ?? 'Chưa thể tải video.'}</p>
            <Button
              type="button"
              variant="primary"
              className="mt-4"
              onClick={() => void requestRecordingUrl()}
            >
              Xin liên kết mới
            </Button>
          </div>
        )}
      </div>

      {error && access && (
        <div
          className="flex flex-col gap-3 border-t border-error/35 bg-error-bg px-5 py-3 text-sm sm:flex-row sm:items-center sm:justify-between"
          role="alert"
        >
          <span className="text-error">{error}</span>
          <button
            type="button"
            onClick={() => void requestRecordingUrl(true)}
            className="text-xs font-semibold text-error underline underline-offset-4"
          >
            Xin liên kết mới
          </button>
        </div>
      )}
    </section>
  );
}
