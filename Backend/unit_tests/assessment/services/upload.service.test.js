/**
 * @file upload.service.test.js
 * @description File Unit Test cho module Upload Service (thuộc nhóm Assessment)
 * 
 * ==========================================
 * QUY TRÌNH KIỂM THỬ (TESTING PROCESS)
 * ==========================================
 * 1. KHỞI TẠO (SETUP): 
 *    - Sử dụng `vi.mock` để giả lập (mock) các dependencies bên ngoài (như `minioClient`, `config`).
 *    - Đảm bảo Unit Test không gọi thật xuống MinIO server để giữ tốc độ nhanh và độc lập.
 * 
 * 2. THỰC THI (EXECUTE): 
 *    - Gọi hàm `generatePresignedUploadUrl` với các đầu vào (input) giả lập như `userId`, `challengeId`, `filename`.
 * 
 * 3. KẾT QUẢ MONG ĐỢI (EXPECTED RESULTS):
 *    - Hàm phải gọi đúng phương thức của `minioClient` với bucket name và object key chuẩn xác.
 *    - Phải trả về một Object chứa URL (đã được map từ host nội bộ ra host public), object_key và thời gian hết hạn (expires_in).
 * 
 * 4. Ý NGHĨA CÁC LOG/KẾT QUẢ:
 *    - PASS: Logic sinh presigned URL đúng chuẩn, tính năng che giấu (replace) internal host thành công, đường dẫn object_key tuân thủ đúng format `submissions/{challengeId}/{userId}/...`.
 *    - FAIL: Có thể do thuật toán thay thế URL bằng Regex bị sai, hoặc gọi mock function với sai tham số.
 * 
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { generatePresignedUploadUrl } from '../../../src/assessment/services/upload.service.js';
import minioClient from '../../../src/shared/config/minio.js';
import { config } from '../../../src/shared/config/index.js';

// MOCK: Giả lập minioClient để nó không thực sự kết nối tới MinIO
vi.mock('../../../src/shared/config/minio.js', () => ({
  default: {
    // vi.fn() tạo ra một hàm giả, cho phép ta theo dõi xem nó có được gọi không và được gọi với tham số gì.
    presignedPutObject: vi.fn()
  }
}));

// MOCK: Giả lập các biến cấu hình để không phụ thuộc vào file .env thực tế
vi.mock('../../../src/shared/config/index.js', () => ({
  config: {
    minio: {
      bucket: 'powork-bucket',
      presignedExpirySeconds: 3600
    }
  }
}));

describe('Upload Service - generatePresignedUploadUrl', () => {
  // beforeEach: Chạy trước mỗi test case (it)
  // Ý nghĩa: Xóa sạch lịch sử gọi hàm của các Mock (để test trước không làm bẩn dữ liệu của test sau)
  beforeEach(() => {
    vi.clearAllMocks();
    // Giả lập biến môi trường public URL (đại diện cho domain mà user thấy)
    process.env.NEXT_PUBLIC_MINIO_URL = 'http://public-minio.localhost:9000';
  });

  /**
   * Test Case 1: Kiểm tra luồng Happy Path (Luồng chuẩn xác nhất)
   * 
   * - Mô tả: Khi mọi tham số đều đúng, hệ thống phải sinh ra được URL và chuyển host nội bộ (minio:9000) thành public host.
   * - Kịch bản: 
   *    1. Giả lập MinIO trả về URL nội bộ: 'http://minio:9000/...'
   *    2. Chạy hàm generatePresignedUploadUrl
   * - Kết quả mong đợi: URL trả ra ngoài (upload_url) phải dùng 'http://public-minio.localhost:9000/...'
   */
  it('should generate a presigned URL and correctly replace internal MinIO URL with public URL', async () => {
    // 1. CHUẨN BỊ DỮ LIỆU (ARRANGE)
    const mockInternalUrl = 'http://minio:9000/powork-bucket/submissions/c1/u1/1700000000_solution.zip?X-Amz-Algorithm=...';
    // Ép hàm presignedPutObject trả về URL giả mạo này khi được gọi
    minioClient.presignedPutObject.mockResolvedValue(mockInternalUrl);

    // 2. THỰC THI (ACT)
    const result = await generatePresignedUploadUrl({
      userId: 'u1',
      challengeId: 'c1',
      filename: 'solution.zip'
    });

    // 3. KIỂM TRA (ASSERT)

    // Ý nghĩa: Đảm bảo rằng hàm của thư viện MinIO đã được gọi ĐÚNG với bucket, object_key format và thời gian hết hạn.
    // Nếu Fail ở đây -> Logic code truyền sai tham số cho MinIO.
    expect(minioClient.presignedPutObject).toHaveBeenCalledWith(
      'powork-bucket',
      expect.stringMatching(/^submissions\/c1\/u1\/\d+_solution\.zip$/),
      3600
    );

    // Ý nghĩa: Đảm bảo logic biến đổi URL (Replace URL) hoạt động. Domain nội bộ (minio:9000) phải bị ghi đè.
    // Nếu Fail ở đây -> Regex thay thế chuỗi (replace) trong file service bị code sai.
    expect(result.upload_url).toBe('http://public-minio.localhost:9000/powork-bucket/submissions/c1/u1/1700000000_solution.zip?X-Amz-Algorithm=...');

    // Ý nghĩa: Format của object_key phải lưu đúng đường dẫn để sau này MinIO webhook có thể nhận diện được bài nộp của ai, ở challenge nào.
    // Dấu \d+ đại diện cho Timestamp (Date.now()) được tự động gán vào.
    expect(result.object_key).toMatch(/^submissions\/c1\/u1\/\d+_solution\.zip$/);

    // Ý nghĩa: Đảm bảo trả về đúng thời gian sống của URL để FE biết đường đếm ngược.
    expect(result.expires_in).toBe(3600);
  });

  /**
   * Test Case 2: Kiểm tra luồng Edge Case (Trường hợp thiếu biến môi trường)
   * 
   * - Mô tả: Khi biến NEXT_PUBLIC_MINIO_URL không tồn tại trong file .env, hệ thống có bị sập không?
   * - Kịch bản: Cố tình xóa biến môi trường, sau đó chạy lại hàm.
   * - Kết quả mong đợi: Hệ thống phải có fallback về giá trị mặc định là 'http://localhost:9000' chứ không bị crash.
   */
  it('should fallback to localhost:9000 if NEXT_PUBLIC_MINIO_URL is not set', async () => {
    // 1. CHUẨN BỊ (ARRANGE) - Xóa biến môi trường
    delete process.env.NEXT_PUBLIC_MINIO_URL;

    const mockInternalUrl = 'http://minio:9000/powork-bucket/submissions/c2/u2/1700000000_test.pdf?sig=123';
    minioClient.presignedPutObject.mockResolvedValue(mockInternalUrl);

    // 2. THỰC THI (ACT)
    const result = await generatePresignedUploadUrl({
      userId: 'u2',
      challengeId: 'c2',
      filename: 'test.pdf'
    });

    // 3. KIỂM TRA (ASSERT)
    // Ý nghĩa: Đảm bảo code có cơ chế an toàn (fallback default value). 
    // Nếu test này PASS, tức là khi lên server thật mà Devops quên setup cấu hình .env thì app vẫn không sập (tuy URL có thể trỏ về localhost nhưng vẫn xử lý được).
    expect(result.upload_url).toBe('http://localhost:9000/powork-bucket/submissions/c2/u2/1700000000_test.pdf?sig=123');
  });
});
