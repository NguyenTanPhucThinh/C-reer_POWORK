# Tích hợp ClamAV - Hệ thống Quét Virus Tự Động cho POWORK

Tài liệu này giải thích chi tiết về ClamAV, lý do tích hợp vào POWORK và hướng dẫn triển khai cụ thể dành cho khối DevOps (Thịnh) và Backend (Quang).

---

## 1. ClamAV là gì và Tại sao POWORK cần nó?

**ClamAV (Clam AntiVirus)** là một bộ phần mềm diệt virus mã nguồn mở chuẩn công nghiệp. 

**Vấn đề của POWORK:**
Hệ thống cho phép ứng viên nộp bài thi dưới dạng nén `.zip`. Điều này tiềm ẩn rủi ro rất lớn: Ứng viên có thể cố tình đính kèm mã độc, trojan, hoặc ransomware (mã độc tống tiền). Nếu giám khảo tải file này về máy tính cá nhân và giải nén, máy tính của họ sẽ bị nhiễm virus. Điều này sẽ hủy hoại hoàn toàn uy tín của nền tảng POWORK.

**Giải pháp:**
Mọi file `.zip` sau khi nộp lên hệ thống sẽ bị ClamAV check từng byte. Nếu phát hiện virus, hệ thống sẽ tự động phong ấn file đó, bảo vệ an toàn tuyệt đối cho thiết bị của giám khảo.

---

## 2. Kiến trúc Luồng hoạt động 

Thay vì tải file xuống máy chủ Backend rồi mới quét (gây tràn ổ cứng), chúng ta sẽ dùng kỹ thuật **Stream Scanning**:

1. **Upload:** Ứng viên tải file trực tiếp lên **MinIO** bằng Presigned URL.
2. **Kích hoạt:** Sau khi nộp thành công, Backend tạo một Background Job.
3. **Stream:** Backend mở luồng đọc từ MinIO và bơm trực tiếp luồng dữ liệu đó sang container của ClamAV qua giao thức TCP.
4. **Phán quyết:** 
   - `CLEAN` (Sạch rõ ràng): chuyển `file_status = SAFE`. Giám khảo mới được phép xem và tải.
   - `INFECTED` (Nhiễm độc): chuyển `file_status = REJECTED` và từ chối Submission.
   - `ERROR/UNKNOWN`: chuyển `file_status = SCAN_FAILED`. Lỗi hoặc kết quả thiếu boolean tuyệt đối không được hiểu là CLEAN.

Mọi truy vấn Employer chỉ lấy file `SAFE`. Các trạng thái `AWAITING_UPLOAD`, `PENDING_SCAN`, `REJECTED` và `SCAN_FAILED` luôn bị cách ly.

---

## 3. Hướng dẫn cho DevOps (Thịnh)

Nhiệm vụ của Thịnh là đưa ClamAV vào hệ sinh thái Docker để nó chạy ngầm giống như Database.

**Bước 1:** Bổ sung đoạn mã sau vào file `docker-compose.yml` (đặt ngang hàng với khối `postgres` và `minio`):

```yaml
  clamav:
    image: clamav/clamav:latest
    container_name: powork_clamav
    ports:
      - "3310:3310"
    restart: always
    environment:
      - CLAMAV_NO_MILTERD=true
```

**Bước 2:** Chạy `docker-compose up -d`. Lần đầu tiên khởi động, ClamAV sẽ mất khoảng vài phút để tải bản cập nhật Database mẫu virus (Virus Signatures) mới nhất từ Internet.

---

## 4. Hướng dẫn cho Backend Core (Quang)

Nhiệm vụ của Quang là móc nối Node.js với ClamAV thông qua mạng nội bộ Docker.

**Bước 1:** Cài đặt thư viện giao tiếp:
```bash
npm install clamav.js
```

**Bước 2:** Logic quét file (Viết trong thư mục `src/assessment/services/`):
```javascript
const clamav = require('clamav.js');
const { S3Client, GetObjectCommand } = require('@aws-sdk/client-s3');

// Khởi tạo S3 Client kết nối MinIO
const s3 = new S3Client({ /* config MinIO */ });

async function scanFileFromMinIO(bucketName, objectKey) {
    return new Promise(async (resolve, reject) => {
        try {
            // Lấy Read Stream từ MinIO
            const command = new GetObjectCommand({ Bucket: bucketName, Key: objectKey });
            const s3Response = await s3.send(command);
            const fileStream = s3Response.Body;

            // Kết nối tới ClamAV Container
            const scanner = clamav.createScanner(3310, 'localhost'); // Nếu chạy Docker network thì đổi 'localhost' thành 'clamav'
            
            // Quét Stream trực tiếp, không cần lưu ra ổ cứng
            scanner.scan(fileStream, (err, object, malicious) => {
                if (err) return reject(err);
                if (malicious) {
                    console.log(`[CẢNH BÁO] Phát hiện mã độc: ${malicious}`);
                    resolve({ isInfected: true, virusName: malicious });
                } else {
                    resolve({ isInfected: false });
                }
            });
        } catch (error) {
            reject(error);
        }
    });
}
```

**Bước 3:** Sau khi gọi hàm `scanFileFromMinIO`, tùy vào kết quả `isInfected` mà Update lại status của bản ghi trong bảng `Submissions` bằng Prisma.

---
*Tài liệu được soạn thảo để đảm bảo Thịnh và Quang có thể phối hợp nhịp nhàng mà không cần tốn thời gian họp bàn kỹ thuật.*
