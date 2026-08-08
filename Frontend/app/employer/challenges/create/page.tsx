'use client';

import React, { useState } from 'react';
import { RubricBuilder } from '@/components/rubric/RubricBuilder';
import { emptyCriteria } from '@/lib/utils/rubric';
import { challengeAPI } from '@/lib/api/endpoints';
import type { CreateChallengeRequest, RubricCriteriaInput } from '@/lib/types/challenge';
import { AxiosError } from 'axios';

export default function CreateChallengePage() {
  const [rubrics, setRubrics] = useState<RubricCriteriaInput[]>([emptyCriteria()]);
  const [industry, setIndustry] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [deadline, setDeadline] = useState('');
  // CHỖ THÊM MỚI 1: State kiểm soát trạng thái hiển thị của Box Phát hành
  const [isPublished, setIsPublished] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
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
    setIsLoading(true);
    setError(null);

    try {
      const challengeData: CreateChallengeRequest = {
        title,
        industry,
        description,
        deadline: new Date(deadline).toISOString(),
        rubrics,
      };

      const challenge = await challengeAPI.create(challengeData);
      setIsPublished(true);
      console.log('Challenge created successfully:', challenge);
    } catch (err: unknown) {
      // Catch AxiosError
      if (err instanceof AxiosError) {
        setError(
          err.response?.data?.message || 'Đã xảy ra lỗi khi tạo challenge. Vui lòng thử lại.'
        );
        console.error('Axios error during challenge creation:', err.response?.data);
      } else {
        setError('Đã xảy ra lỗi không mong đợi. Vui lòng thử lại sau.');
        console.error('Lỗi không mong đợi:', err);
      }
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
              type="datetime-local"
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
            {/* CHỖ SỬA 2: Thêm onClick kích hoạt show box invite code khi bấm Phát hành */}
            <span
              style={{
                ...styles.btnPrimary,
                flex: 1,
                opacity: isLoading ? 0.7 : 1,
                cursor: isLoading ? 'not-allowed' : 'pointer',
              }}
              onClick={isLoading ? undefined : handleSubmit}
            >
              {isLoading ? 'Đang phát hành...' : 'Phát hành →'}
            </span>
          </div>

          {/* CHỖ SỬA 3: Bọc điều kiện {isPublished && (...)} bên ngoài Box Invite */}
          {isPublished && (
            <div
              style={{
                marginTop: '24px',
                padding: '20px',
                background: 'var(--bg)',
                border: '0.5px solid rgba(34,197,94,0.35)',
                borderRadius: '10px',
              }}
            >
              <p
                style={{
                  fontSize: '14px',
                  fontWeight: '600',
                  color: 'var(--green)',
                  marginBottom: '12px',
                }}
              >
                ✅ Challenge đã phát hành — Mã invite
              </p>
              <div
                style={{ display: 'flex', gap: '10px', alignItems: 'center', marginBottom: '12px' }}
              >
                <div
                  style={{
                    flex: 1,
                    padding: '12px 16px',
                    background: 'var(--bg3)',
                    border: '0.5px solid var(--border2)',
                    borderRadius: '8px',
                    fontFamily: 'monospace',
                    fontSize: '16px',
                    fontWeight: '600',
                    letterSpacing: '2px',
                    color: 'var(--green)',
                  }}
                >
                  VNG-2026-CACHE
                </div>
                <span style={{ ...styles.btnSecondary, fontSize: '13px', padding: '11px 14px' }}>
                  📋 Copy
                </span>
                <span style={{ ...styles.btnSecondary, fontSize: '13px', padding: '11px 14px' }}>
                  ↗ Share
                </span>
              </div>
              <div
                style={{
                  display: 'flex',
                  gap: '16px',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                }}
              >
                <span style={{ fontSize: '13px', color: 'var(--text3)' }}>
                  🌐 Challenge công khai — ai cũng có thể tìm thấy
                </span>
                <span
                  style={{
                    fontSize: '13px',
                    color: 'var(--accent)',
                    cursor: 'pointer',
                    whiteSpace: 'nowrap',
                    fontWeight: '500',
                  }}
                >
                  Đổi thành riêng tư →
                </span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
