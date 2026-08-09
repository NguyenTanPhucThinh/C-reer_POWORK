# Tổng Quan Kiến Trúc Module 2: Luồng Nộp Bài & Cơ Chế Ẩn Danh (Blind Audition)

---

## 1. Mục tiêu cốt lõi của Module 2

Chúng ta đang giải quyết 2 bài toán khó nhất của dự án:
1. **Chống sập Server:** Nếu 100 ứng viên nộp file `.zip` 10MB cùng lúc, Backend Node.js sẽ sập ngay lập tức vì tràn RAM và nghẽn băng thông mạng.
2. **Bảo mật danh tính:** Giám khảo tuyệt đối không được biết ứng viên là ai để đảm bảo tính công bằng. Chúng ta phải cắt đứt hoàn toàn sợi dây liên kết giữa `Tên ứng viên` và `Bài làm`.

---

## 2. Các Mắt Xích Trong Hệ Thống

Để giải quyết bài toán trên, kiến trúc Module 2 sẽ bao gồm 5 thành phần phối hợp với nhau:
- **Frontend (Next.js):** Giao diện ứng viên (Do Nhân và Khoa phụ trách).
- **Backend (Node.js/Express):** Bộ não xử lý logic và xác thực (Do Quang và Phong phụ trách).
- **PostgreSQL (Database):** Lưu trữ thông tin. Sẽ được chia làm 2 bảng: Bảng KÍN (Có tên ứng viên) và Bảng MỞ (Chỉ có mã số ẩn danh).
- **MinIO (Object Storage):** Kho chứa file dung lượng lớn giả lập AWS S3 (Do Thịnh phụ trách).
- **ClamAV:** Quét virus ngầm để bảo vệ hệ thống.

---

## 3. Luồng Dữ Liệu Rành Mạch 

Toàn bộ quá trình nộp bài từ lúc ứng viên ấn nút đến lúc nhận email sẽ diễn ra qua **4 BƯỚC CHUẨN**:

### Bước 1: Xin Giấy Phép (Presigned URL)
- Thay vì Frontend gửi file `.zip` vào Backend, Frontend sẽ gửi một request hỏi Backend: *"Cho tôi xin quyền nộp 1 file tên là `bai_lam.zip`"*.
- Backend xác thực người dùng, sau đó đi hỏi MinIO cấp một cái thẻ thông hành (Presigned URL) có thời hạn 5 phút. Backend ném URL này lại cho Frontend.

### Bước 2: Tải File Trực Tiếp
- Frontend dùng cái URL vừa nhận, lấy cục file `.zip` 10MB bơm thẳng một mạch vào kho MinIO.
- Lợi ích: Backend không hề chạm vào file, băng thông Backend hoàn toàn rảnh rỗi.

### Bước 3: Chốt Đơn & Cắt Đứt Danh Tính
- Nộp lên MinIO xong, Frontend quay lại gọi Backend lần cuối: *"Tôi đã nộp file xong rồi"*.
- Lúc này, Backend dùng HMAC-SHA256 sinh mã ẩn danh 128-bit ổn định theo Candidate–Challenge (ví dụ: `Candidate_9F7A64D4297F45FA1E63B6A027AECE85`).
- **Phân tách DB:** 
  - Backend giấu kín cặp `user_id` và `hash_id` vào bảng `Identity_Mappings` (Bảng KÍN).
  - Backend chỉ lưu `hash_id` và object key không chứa thông tin nhận dạng vào bảng `Submissions` (Bảng MỞ).
  - Từ giờ trở đi, hệ thống chỉ đưa bảng `Submissions` cho Giám khảo chấm.

### Bước 4: Hậu Kỳ (Quét Virus & Báo Cáo)
- Sau khi báo Frontend thành công, Backend tự động âm thầm tạo một Job chạy ngầm:
  - Hút file từ MinIO chảy qua ClamAV để kiểm tra mã độc.
  - Nếu file Sạch: Gọi Nodemailer gửi Email báo cho ứng viên bài làm của họ đã được nộp.
  - Nếu file Độc: Đánh dấu file bị nhiễm, không cho tải, gửi email cảnh báo ứng viên.

---

Module 2 không nặng về số lượng dòng code, mà nặng về **Luồng đi của dữ liệu**. 
Việc áp dụng MinIO Presigned URL, ClamAV và cơ chế sinh Hash_ID tách bảng chính là điểm "ăn tiền" nhất của dự án khi mang đi thi. Các thành viên bám sát tài liệu này và bảng Excel để code cho chuẩn xác nhé!
