import type { RubricCriteria } from '@/lib/types';
import type { GradingSubmission, ReviewDocument } from '@/lib/types';

/**
 * Dữ liệu mock cho màn hình chấm điểm (Split-view).
 * Dùng data-URI để xem trước hoạt động offline trong bản Docker production.
 */

/** Rubric của challenge đang chấm (tổng trọng số = 100%). */
export const MOCK_GRADING_CRITERIA: RubricCriteria[] = [
  {
    criteria_id: 'crit-architecture',
    criteria_name: 'Kiến trúc & thiết kế hệ thống',
    weight: 30,
    max_score: 10,
  },
  {
    criteria_id: 'crit-code-quality',
    criteria_name: 'Chất lượng code & khả năng bảo trì',
    weight: 25,
    max_score: 10,
  },
  {
    criteria_id: 'crit-correctness',
    criteria_name: 'Tính đúng đắn & xử lý edge-case',
    weight: 25,
    max_score: 10,
  },
  {
    criteria_id: 'crit-docs',
    criteria_name: 'Tài liệu & trình bày',
    weight: 20,
    max_score: 5,
  },
];

/** Ảnh SVG minh hoạ, nhúng iframe xem trước được ngay cả khi offline. */
const SAMPLE_IMAGE_SVG = `<svg xmlns='http://www.w3.org/2000/svg' width='640' height='420'>
  <rect width='100%' height='100%' fill='#0f1115'/>
  <rect x='40' y='40' width='560' height='120' rx='10' fill='#1b1f27' stroke='#7c6ff7'/>
  <text x='60' y='105' fill='#e7e9ee' font-family='monospace' font-size='22'>Diagram: Caching Layer</text>
  <rect x='40' y='190' width='260' height='180' rx='10' fill='#151922' stroke='#2a2f3a'/>
  <rect x='340' y='190' width='260' height='180' rx='10' fill='#151922' stroke='#2a2f3a'/>
  <text x='70' y='285' fill='#9aa0ac' font-family='monospace' font-size='16'>API Gateway</text>
  <text x='380' y='285' fill='#9aa0ac' font-family='monospace' font-size='16'>Redis Cache</text>
</svg>`;

/** PDF tối giản hợp lệ, xem trước bằng iframe. */
const SAMPLE_PDF = `data:application/pdf;base64,JVBERi0xLjQKMSAwIG9iago8PC9UeXBlL0NhdGFsb2cvUGFnZXMgMiAwIFI+PgplbmRvYmoKMiAwIG9iago8PC9UeXBlL1BhZ2VzL0tpZHNbMyAwIFJdL0NvdW50IDE+PgplbmRvYmoKMyAwIG9iago8PC9UeXBlL1BhZ2UvUGFyZW50IDIgMCBSL01lZGlhQm94WzAgMCAzMDAgMjAwXS9SZXNvdXJjZXM8PC9Gb250PDwvRjEgNCAwIFI+Pj4+L0NvbnRlbnRzIDUgMCBSPj4KZW5kb2JqCjQgMCBvYmoKPDwvVHlwZS9Gb250L1N1YnR5cGUvVHlwZTEvQmFzZUZvbnQvSGVsdmV0aWNhPj4KZW5kb2JqCjUgMCBvYmoKPDwvTGVuZ3RoIDQ0Pj4Kc3RyZWFtCkJUIC9GMSAxOCBUZiAzMCAxMDAgVGQgKE1vY2sgU29sdXRpb24pIFRqIEVUCmVuZHN0cmVhbQplbmRvYmoKeHJlZgowIDYKMDAwMDAwMDAwMCA2NTUzNSBmIAowMDAwMDAwMDA5IDAwMDAwIG4gCjAwMDAwMDAwNTUgMDAwMDAgbiAKMDAwMDAwMDExMCAwMDAwMCBuIAowMDAwMDAwMjUxIDAwMDAwIG4gCjAwMDAwMDAzMjIgMDAwMDAgbiAKdHJhaWxlcgo8PC9TaXplIDYvUm9vdCAxIDAgUj4+CnN0YXJ0eHJlZgo0MTYKJSVFT0Y=`;

/** File ZIP rỗng hợp lệ (data-URI) để minh hoạ nút Tải xuống ở Fallback. */
const SAMPLE_ZIP = `data:application/zip;base64,UEsFBgAAAAAAAAAAAAAAAAAAAAAAAA==`;

/**
 * Các tài liệu mẫu của bài nộp — cho phép giám khảo chuyển tab để kiểm tra
 * cả preview (PDF/Ảnh) lẫn Fallback (ZIP).
 */
export const MOCK_REVIEW_DOCUMENTS: ReviewDocument[] = [
  {
    fileName: 'solution.pdf',
    url: SAMPLE_PDF,
    kind: 'pdf',
    fileSize: 8_200,
  },
  {
    fileName: 'architecture-diagram.svg',
    url: `data:image/svg+xml;utf8,${encodeURIComponent(SAMPLE_IMAGE_SVG)}`,
    kind: 'image',
    fileSize: 3_400,
  },
  {
    fileName: 'source-code.zip',
    url: SAMPLE_ZIP,
    kind: 'zip',
    fileSize: 1_540_096,
  },
];

export const MOCK_GRADING_SUBMISSION: GradingSubmission = {
  submission_id: 'f5e921dd-14bb-421c-a32e-11bc9aef4421',
  hash_id: 'Candidate_9F7A64D4297F45FA1E63B6A027AECE85',
  status: 'Pending',
  challenge_id: '403bf47b-231a-4d22-9214-722a4669812a',
  challenge_title: 'Thiết kế hệ thống caching cho API',
  submitted_at: '2026-07-06T09:24:00.000Z',
  criteria: MOCK_GRADING_CRITERIA,
  documents: MOCK_REVIEW_DOCUMENTS,
  data_source: 'mock',
};
