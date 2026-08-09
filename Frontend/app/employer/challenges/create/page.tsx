'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import axios from 'axios';
import { RubricBuilder } from '@/components/rubric/RubricBuilder';
import { emptyCriteria } from '@/lib/utils/rubric';
import { useCreateChallenge } from '@/lib/hooks/useChallenges';
import type { Challenge, CreateChallengeRequest, RubricCriteriaInput } from '@/lib/types/challenge';

type ModerationIssue = {
  category: string;
  message: string;
  suggestion: string;
};

type ModerationErrorResponse = {
  error_code?: string;
  message?: string;
  details?: {
    decision: 'NEEDS_REVISION';
    summary: string;
    issues: ModerationIssue[];
  };
};

type SubmissionResult =
  | { type: 'published'; challenge: Challenge }
  | { type: 'revision'; summary: string; issues: ModerationIssue[] }
  | { type: 'service-error' }
  | null;

const categoryLabels: Record<string, string> = {
  REAL_COMPANY_DATA: 'Dữ liệu doanh nghiệp thực tế',
  REAL_BUSINESS_PROBLEM: 'Vấn đề kinh doanh thực tế',
  SCOPE_TOO_LARGE: 'Phạm vi quá lớn',
  COMPLETE_DELIVERABLE: 'Yêu cầu sản phẩm hoàn chỉnh',
  DIRECT_COMMERCIAL_VALUE: 'Giá trị thương mại trực tiếp',
  UNCLEAR_EVALUATION_SCOPE: 'Phạm vi đánh giá chưa rõ',
};

export default function CreateChallengePage() {
  const createChallenge = useCreateChallenge();
  const [rubrics, setRubrics] = useState<RubricCriteriaInput[]>([emptyCriteria()]);
  const [industry, setIndustry] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [deadline, setDeadline] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<SubmissionResult>(null);
  const [error, setError] = useState<string | null>(null);

  // Hệ thống style đã scale-up kích thước chữ và padding phù hợp với font nền lớn của Dashboard
  const styles = {
    secLabel: {
      fontSize: '14px', // Tăng từ 12px
      fontWeight: '600',
      color: 'var(--text3)',
      textTransform: 'uppercase',
      letterSpacing: '0.8px',
      marginBottom: '16px', // Tăng từ 12px
      display: 'block',
    },
    input: {
      padding: '12px 16px', // Tăng từ 10px 14px
      borderRadius: '8px', // Tăng từ 6px để cân đối
      border: '0.5px solid var(--border2)',
      background: 'var(--bg3)',
      color: 'var(--text2)',
      fontSize: '15px', // Tăng từ 13px cho đồng bộ font 15px nền
      fontFamily: 'var(--font)',
      outline: 'none',
      width: '100%',
      boxSizing: 'border-box',
    },
    tag: {
      fontSize: '14px', // Tăng từ 12px
      padding: '6px 16px', // Tăng từ 4px 12px
      borderRadius: '6px', // Tăng từ 4px
      background: 'var(--bg3)',
      border: '0.5px solid var(--border2)',
      color: 'var(--text2)',
      display: 'inline-block',
      cursor: 'pointer',
    },
    tagActive: {
      background: 'var(--accent-bg)',
      border: '0.5px solid var(--accent)',
      color: 'var(--accent)',
    },
    btnPrimary: {
      display: 'inline-block',
      fontSize: '14px',
      fontWeight: '500',
      padding: '10px 20px',
      borderRadius: '8px',
      border: '0.5px solid var(--border2)',
      color: 'var(--bg)',
      background: 'var(--text)',
      whiteSpace: 'nowrap',
      cursor: 'pointer',
      borderColor: 'transparent',
    },
    btnSecondary: {
      display: 'inline-block',
      fontSize: '15px',
      fontWeight: '500',
      padding: '10px 20px',
      borderRadius: '8px',
      background: 'var(--bg3)',
      color: 'var(--text)',
      border: '0.5px solid var(--border2)',
      whiteSpace: 'nowrap',
      cursor: 'pointer',
      textAlign: 'center',
    },
  } as const;

  const handleSubmit = async () => {
    if (isLoading) return;

    if (!title.trim() || !industry.trim() || !description.trim() || !deadline) {
      setError('Vui lòng điền đầy đủ tiêu đề, lĩnh vực, mô tả và deadline.');
      return;
    }

    const deadlineDate = new Date(deadline);
    if (Number.isNaN(deadlineDate.getTime()) || deadlineDate.getTime() <= Date.now()) {
      setError('Deadline phải là một thời điểm trong tương lai.');
      return;
    }

    setIsLoading(true);
    setResult(null);
    setError(null);

    try {
      const challengeData: CreateChallengeRequest = {
        title,
        industry,
        description,
        deadline: deadlineDate.toISOString(),
        rubrics,
      };

      const challenge = await createChallenge.mutateAsync(challengeData);
      setResult({ type: 'published', challenge });
    } catch (err: unknown) {
      if (axios.isAxiosError<ModerationErrorResponse>(err)) {
        const response = err.response;
        const data = response?.data;

        if (data?.error_code === 'CHAL_MODERATION_REQUIRED' && data.details) {
          setResult({
            type: 'revision',
            summary: data.details.summary,
            issues: data.details.issues,
          });
          return;
        }

        if (
          !response ||
          response.status >= 500 ||
          ['CHAL_MODERATION_UNAVAILABLE', 'UPSTREAM_UNAVAILABLE'].includes(data?.error_code ?? '')
        ) {
          setResult({ type: 'service-error' });
          return;
        }

        setError(data?.message || 'Dữ liệu Challenge chưa hợp lệ. Vui lòng kiểm tra lại.');
        return;
      }

      setResult({ type: 'service-error' });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div style={{ padding: '32px 32px 40px', flex: 1, overflowY: 'auto' }}>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1.4fr 1fr',
          gap: '32px',
          maxWidth: '1200px',
          margin: '0 auto',
        }}
      >
        {/* Cột trái: Thông tin biểu mẫu nhập liệu */}
        <div>
          <span style={styles.secLabel}>Thông tin đề bài</span>

          <div style={{ marginBottom: '24px' }}>
            <p
              style={{
                fontSize: '14px',
                color: 'var(--text2)',
                marginBottom: '8px',
                fontWeight: '500',
              }}
            >
              Tiêu đề Challenge <span style={{ color: '#e05c5c' }}>*</span>
            </p>
            <input
              type="text"
              style={styles.input}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Thiết kế hệ thống caching cho API"
            />
          </div>

          <div style={{ marginBottom: '24px' }}>
            <p
              style={{
                fontSize: '14px',
                color: 'var(--text2)',
                marginBottom: '8px',
                fontWeight: '500',
              }}
            >
              Lĩnh vực
            </p>
            <input
              style={styles.input}
              value={industry}
              onChange={(e) => setIndustry(e.target.value)}
              placeholder="ví dụ: Backend, System Design"
            />
          </div>

          <div style={{ marginBottom: '24px' }}>
            <p
              style={{
                fontSize: '14px',
                color: 'var(--text2)',
                marginBottom: '8px',
                fontWeight: '500',
              }}
            >
              Mô tả bài toán <span style={{ color: '#e05c5c' }}>*</span>
            </p>
            <textarea
              style={{ ...styles.input, height: '160px', resize: 'none', lineHeight: '1.6' }}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Mô tả bài toán chi tiết mà doanh nghiệp đang gặp phải và kỳ vọng giải quyết..."
            />
          </div>

          <div>
            <p
              style={{
                fontSize: '14px',
                color: 'var(--text2)',
                marginBottom: '8px',
                fontWeight: '500',
              }}
            >
              Deadline <span style={{ color: '#e05c5c' }}>*</span>
            </p>
            <input
              type="datetime-local"
              style={styles.input}
              value={deadline}
              onChange={(e) => setDeadline(e.target.value)}
            />
          </div>
          {error && <p style={{ color: '#e05c5c', marginTop: '10px' }}>{error}</p>}
        </div>

        {/* Cột phải: Rubric chấm điểm & Trạng thái phát hành */}
        <div>
          <p style={styles.secLabel}>
            Rubric chấm điểm{' '}
            <span
              style={{
                color: 'var(--text3)',
                fontWeight: '400',
                textTransform: 'none',
                letterSpacing: '0',
              }}
            >
              (tổng = 100%)
            </span>
          </p>

          <div style={{ fontSize: '15px' }}>
            <RubricBuilder value={rubrics} onChange={setRubrics} />
          </div>

          <div
            style={{
              display: 'flex',
              gap: '14px',
              paddingTop: '20px',
              borderTop: '0.5px solid var(--border)',
            }}
          >
            <span style={{ ...styles.btnSecondary, flex: 1 }}>Lưu nháp</span>
            <button
              type="button"
              disabled={isLoading}
              style={{
                ...styles.btnPrimary,
                flex: 1,
                opacity: isLoading ? 0.7 : 1,
                cursor: isLoading ? 'not-allowed' : 'pointer',
              }}
              onClick={handleSubmit}
            >
              {isLoading ? 'Đang kiểm tra...' : 'Kiểm tra và phát hành'}
            </button>
          </div>

          <div aria-live="polite">
            {isLoading && (
              <div className="mt-6 flex items-center gap-3 rounded-lg border border-info/30 bg-info-bg p-4 text-info">
                <span className="h-4 w-4 shrink-0 animate-spin rounded-full border-2 border-info/30 border-t-info" />
                <div>
                  <p className="text-sm font-semibold">Đang kiểm tra Challenge...</p>
                  <p className="mt-1 text-xs text-foreground-secondary">
                    Hệ thống đang đánh giá phạm vi và nội dung trước khi phát hành.
                  </p>
                </div>
              </div>
            )}

            {result?.type === 'published' && (
              <div className="mt-6 rounded-lg border border-success/35 bg-success-bg p-5">
                <p className="text-sm font-semibold text-success">Challenge đã được tạo</p>
                <p className="mt-2 text-sm leading-6 text-foreground-secondary">
                  “{result.challenge.title}” đã vượt qua kiểm duyệt và được phát hành thành công.
                </p>
                <div className="mt-4 flex flex-wrap gap-3">
                  <Link
                    href="/employer/dashboard"
                    className="rounded-lg bg-success px-4 py-2 text-xs font-semibold text-white transition-opacity hover:opacity-90"
                  >
                    Về Dashboard
                  </Link>
                  <Link
                    href={`/challenges/${result.challenge.challenge_id}`}
                    className="rounded-lg border border-success/40 px-4 py-2 text-xs font-semibold text-success transition-colors hover:bg-success-bg"
                  >
                    Xem Challenge
                  </Link>
                </div>
              </div>
            )}

            {result?.type === 'revision' && (
              <div className="mt-6 rounded-lg border border-warning/40 bg-warning-bg p-5">
                <p className="text-sm font-semibold text-warning">Challenge cần được chỉnh sửa</p>
                <p className="mt-2 text-sm leading-6 text-foreground-secondary">{result.summary}</p>
                <div className="mt-4 space-y-3">
                  {result.issues.map((issue, index) => (
                    <div
                      key={`${issue.category}-${index}`}
                      className="rounded-lg border border-warning/25 bg-background p-4"
                    >
                      <p className="text-xs font-semibold uppercase tracking-wide text-warning">
                        {categoryLabels[issue.category] ?? issue.category}
                      </p>
                      <p className="mt-2 text-sm leading-6 text-foreground">{issue.message}</p>
                      <div className="mt-3 rounded-md bg-warning-bg px-3 py-2.5">
                        <p className="text-xs font-semibold text-warning">Gợi ý chỉnh sửa</p>
                        <p className="mt-1 text-xs leading-5 text-foreground-secondary">
                          {issue.suggestion}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
                <p className="mt-4 text-xs text-foreground-secondary">
                  Toàn bộ nội dung đã được giữ nguyên. Hãy chỉnh sửa form rồi kiểm tra lại.
                </p>
              </div>
            )}

            {result?.type === 'service-error' && (
              <div role="alert" className="mt-6 rounded-lg border border-error/35 bg-error-bg p-5">
                <p className="text-sm font-semibold text-error">Chưa thể kiểm tra Challenge</p>
                <p className="mt-2 text-sm leading-6 text-foreground-secondary">
                  Hệ thống kiểm duyệt đang tạm thời gián đoạn. Challenge chưa được tạo và toàn bộ
                  nội dung của bạn vẫn được giữ nguyên. Vui lòng thử lại sau.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
