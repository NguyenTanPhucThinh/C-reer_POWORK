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
| **TC_SEC_004** | Employer đọc Submission của công ty khác | Employer A thay `challenge_id` trong URL bằng Challenge của Employer B. | IDOR qua `GET /challenges/{challenge_id}/submissions`. | - HTTP `403 Forbidden`.<br>- Không trả bất kỳ Submission nào. |
| **TC_SEC_005** | Employer chấm hoặc reject Submission của công ty khác | Employer A thay `submission_id` bằng Submission của Employer B. | IDOR qua `/evaluate` hoặc `/reject`. | - HTTP `403 Forbidden`.<br>- Không tạo Evaluation Result.<br>- Không đổi Submission status. |
| **TC_SEC_006** | Employer approve/unlock Submission của công ty khác | Employer A thay `submission_id` bằng Submission của Employer B rồi gọi `/unlock`. | IDOR làm lộ danh tính và tạo Verified Evidence trái phép. | - HTTP `403 Forbidden`.<br>- Không đổi Submission status.<br>- Không đổi `is_unlocked`.<br>- Không tạo Verified Evidence.<br>- Không trả profile Candidate. |
| **TC_SEC_007** | Employer gửi criteria của Challenge khác | Submission thuộc Challenge A nhưng body chứa `criteria_id` của Challenge B. | Ghi điểm chéo Rubric. | - HTTP `400 Bad Request`.<br>- Không tạo Evaluation Result.<br>- Không đổi Submission status. |
| **TC_SEC_008** | Tên file chứa thông tin nhận dạng | Candidate upload file `Nguyen-Van-A_CV.pdf`. | Object key hoặc tên hiển thị làm lộ danh tính. | - `object_key` không chứa `user_id` hoặc tên gốc.<br>- Employer chỉ thấy tên trung tính như `submission-v1.pdf`. |
| **TC_SEC_009** | Candidate xác nhận object key tự chế | Candidate gửi `solution_url` chứa `user_id`, tên thật hoặc Challenge khác. | Bỏ qua ranh giới cấp presigned URL. | - HTTP `400 Bad Request` với `ASSESS_008`.<br>- Không tạo Identity Mapping hoặc Submission. |
| **TC_SEC_010** | Candidate nộp nhiều phiên bản trong cùng Challenge | Cùng Candidate nộp bài nhiều lần cho một Challenge. | Sinh nhiều anonymous identity cho cùng người. | - Mọi phiên bản giữ nguyên một `hash_id`.<br>- Database chỉ có một Identity Mapping cho cặp Candidate–Challenge. |
| **TC_FILE_001** | Candidate mới xin presigned URL | File chưa được PUT lên MinIO. | Draft bị hiểu nhầm là bài đã nộp. | - Tạo Submission với `file_status = AwaitingUpload`.<br>- Employer không thấy draft. |
| **TC_FILE_002** | Candidate xác nhận trước khi upload hoàn tất | MinIO không tìm thấy object key. | Scan file không tồn tại hoặc bài giả. | - HTTP `409` với `ASSESS_010`.<br>- Trạng thái vẫn là `AwaitingUpload`.<br>- Không chạy scan. |
| **TC_FILE_003** | ClamAV trả CLEAN rõ ràng | `isInfected === false`. | File sạch bị giữ cách ly. | - Chuyển `file_status` thành `Safe`.<br>- Employer mới được truy cập. |
| **TC_FILE_004** | ClamAV phát hiện mã độc | `isInfected === true`. | File độc xuất hiện như bài hợp lệ. | - `file_status = Rejected` và `status = Rejected`.<br>- Không xuất hiện trong danh sách Employer. |
| **TC_FILE_005** | ClamAV mất kết nối hoặc trả kết quả không xác định | Exception, timeout hoặc thiếu boolean `isInfected`. | Lỗi scan bị hiểu là CLEAN. | - `file_status = ScanFailed`.<br>- Tuyệt đối không chuyển `Safe`.<br>- Employer không thể xem, chấm hoặc unlock. |
| **TC_FILE_006** | Employer đoán `submission_id` chưa sạch | Gọi evaluate, reject hoặc unlock khi file không phải `Safe`. | Bypass danh sách để truy cập file chưa kiểm duyệt. | - HTTP `409` với `ASSESS_009`.<br>- Không tạo thay đổi dữ liệu phụ. |
