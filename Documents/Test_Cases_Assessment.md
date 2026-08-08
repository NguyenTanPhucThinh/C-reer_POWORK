# KỊCH BẢN TEST BẢO MẬT (ASSESSMENT MODULE)
**Mục tiêu:** Đảm bảo tính "Ẩn danh" (Blind Audition) tuyệt đối. Không một lỗ hổng nào cho phép Employer biết được thông tin thật của ứng viên trước khi Unlock.

---

## 1. Mẫu Email Gửi Ứng Viên (Nodemailer)

*Mẫu email này sẽ được Backend tự động gửi đi sau khi ClamAV quét file an toàn (CLEAN).*

**Tiêu đề:** [POWORK] Xác nhận nộp bài thành công - Mã số ẩn danh của bạn là {{hash_id}}
**Nội dung:**
> Chào bạn,
> 
> Hệ thống POWORK đã nhận được bài giải của bạn cho thử thách **"{{challenge_title}}"**.
> File của bạn đã vượt qua vòng kiểm tra mã độc của ClamAV và hiện đã được mã hóa an toàn trên hệ thống.
> 
> Nhằm đảm bảo tính công bằng tuyệt đối, danh tính của bạn đã được ẩn đi. Nhà tuyển dụng sẽ chỉ biết đến bạn qua mã số: **{{hash_id}}**. 
> Phiên bản bài nộp: **Version {{version}}**.
> 
> Chúc bạn may mắn trong đợt đánh giá này!
> POWORK Team.

---

## 2. Kịch Bản Test (Test Cases) Chống Rò Rỉ ID

| Mã TC | Kịch bản Test | Dữ liệu đầu vào | Lỗi cần bắt | Kết quả mong đợi |
| :--- | :--- | :--- | :--- | :--- |
| **TC_SEC_001** | Cố tình gài `user_id` vào Body lúc nộp bài | Gửi Request POST `/api/v1/assessment/submissions` với JSON Body cố tình thêm trường `"user_id": "uuid-cua-phong"`. | Middleware hoặc Zod Schema phải chặn. | - HTTP Status: `400 Bad Request`<br>- Message: "Payload chứa trường dữ liệu không được phép (user_id)." |
| **TC_SEC_002** | Employer dùng API chặn để soi thông tin | Employer dùng Token gọi GET `/api/v1/assessment/challenges/{id}/submissions` | Kiểm tra Response Body có chứa `user_id`, `email`, `fullName` không. | - Response CHỈ chứa `hash_id` và mảng `versions`.<br>- KHÔNG lọt bất kỳ field nào từ bảng `users`. |
| **TC_SEC_003** | Frontend truyền sai file nguy hiểm | Cố tình nộp file `.exe` giả làm `.zip` | Nộp file `malware.exe` lên MinIO, Backend gọi ClamAV. | - Hàm quét trả về `isInfected: true`.<br>- Background scan cập nhật status Submission thành `REJECTED`. |
