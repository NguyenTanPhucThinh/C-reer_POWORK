# TÀI LIỆU KIẾN TRÚC & Ý NGHĨA THIẾT KẾ ERD

**Mục tiêu tài liệu:** Đồng bộ tư duy thiết kế Database Schema cho toàn bộ thành viên trong đội ngũ phát triển (Backend, Frontend, DevOps), đảm bảo hiện thực hóa luồng Tuyển dụng Ẩn danh triệt để ngay từ tầng dữ liệu.

---

## 1. TRIẾT LÝ THIẾT KẾ TỔNG QUAN

Hệ thống POWORK áp dụng kiến trúc **Modular Monolith** nhằm cân bằng giữa tốc độ phát triển MVP và tính độc lập của các miền nghiệp vụ.

Bản thiết kế ERD này tuân thủ nghiêm ngặt nguyên lý **Loosely Coupling**. Giữa các module cốt lõi tuyệt đối không tồn tại Ràng buộc Khóa ngoại cứng ở cấp độ Database đối với các quan hệ xuyên Domain. Mọi hoạt động giao tiếp, đồng bộ dữ liệu giữa các module sẽ được xử lý thông qua tầng Application (API Contracts) hoặc cơ chế Event-driven.

Mục đích của thiết kế này là xây dựng một **cơ chế ẩn danh vững chắc**, ngăn chặn mọi hành vi rò rỉ thông tin ứng viên trong quá trình doanh nghiệp chấm điểm, giải quyết triệt để bài toán thiên kiến tuyển dụng.

---

## 2. PHÂN TÍCH CHI TIẾT CẤU TRÚC THEO MODULE

### 2.1 IAM Module (Quản lý định danh & Phân quyền)

Module này nắm giữ toàn bộ thông tin thật và nhạy cảm của người dùng. Nó đóng vai trò như một dịch vụ Identity Provider nội bộ.

- **Bảng `Users`:** \* `user_id` (PK, UUID): Định danh duy nhất toàn hệ thống.
  - `email` / `password_hash`: Phục vụ luồng Auth cơ bản.
  - `role` (Enum: `Candidate`, `Employer`): Kiểm soát phân quyền ở tầng Middleware.
- **Bảng `Companies`:** \* `company_id` (PK, UUID): Định danh của doanh nghiệp.
  - `user_id` (FK): Trỏ về tài khoản đại diện sở hữu doanh nghiệp đó.
- **Ranh giới cô lập:** Module IAM cung cấp `user_id` sau khi xác thực JWT Token thành công. Tuy nhiên, nó hoàn toàn mù đối với các hoạt động thi cử, chấm điểm và bồi đắp hồ sơ năng lực của ứng viên.

### 2.2 Challenge Module (Quản lý thử thách & Bộ tiêu chí)

Quản lý toàn bộ kho dữ liệu tĩnh liên quan đến đề bài do nhà tuyển dụng đưa ra.

- **Bảng `Challenges`:** Lưu trữ thông tin tổng quan của thử thách (`title`, `description`, `industry`, `deadline`). Trường `industry` (ví dụ: IT, Thiết kế, Marketing) giúp phân loại bài toán đa ngành. Nó lưu `company_id` dưới dạng một trường dữ liệu thông thường và lưu thêm `company_name` (Snapshot Data) để biết thử thách thuộc về doanh nghiệp nào mà không cần JOIN cứng hay gọi API sang module IAM khi lấy danh sách.
- **Bảng `Rubric_Criteria`:** Cho phép cấu hình bộ tiêu chí đánh giá động (`criteria_name`, `weight`, `max_score`). Một `Challenge` sẽ có một hoặc nhiều tiêu chí thành phần (Quan hệ 1-N tương tác trực tiếp qua Khóa ngoại `challenge_id`).
- **Ranh giới cô lập:** Module này chỉ biết đến đề bài và barem điểm, tuyệt đối không được biết và không quản lý dữ liệu nộp bài của ứng viên.

### 2.3 Assessment Module (Trái tim Ẩn danh - Khu vực cách ly)

Đây là nơi hiện thực hóa tính năng **Blind Audition**. Để bảo vệ tính ẩn danh, module này chia dữ liệu thành hai vùng riêng biệt: **Vùng Nghiệp vụ Công khai** (doanh nghiệp có quyền xem) và **Vùng Kín Bảo mật** (chỉ hệ thống có quyền truy cập).

- **Bảng Kín `Identity_Mappings`:**
  - Đây là bảng nhạy cảm nhất hệ thống, đóng vai trò làm cầu nối ẩn giữa thông tin thật và danh tính giả.
  - Nó lưu trữ bộ ba: `hash_id` (Tên giả 128-bit, VD: `Candidate_9F7A64D4297F45FA1E63B6A027AECE85`), `user_id` (ID thật của ứng viên), và `challenge_id`.
  - Trường `is_unlocked` (Boolean) mặc định là `False`. Khi doanh nghiệp chưa duyệt bài đạt, không một luồng logic nào từ phía client được phép truy cập vào bảng này để lấy ra `user_id`.
- **Bảng Công khai `Submissions`:**
  - Khóa chính (PK) là `submission_id`. Bảng này **tuyệt đối không có cột `user_id`**. Danh tính ứng viên được nối với bảng kín thông qua chuỗi mã hóa `hash_id`.
  - Nhà tuyển dụng chỉ được phép tương tác với bảng này khi chấm điểm.
  - `solution_url` lưu trữ đường dẫn chứa mã nguồn, file thiết kế hoặc tài liệu giải pháp của ứng viên trên Cloud Storage.
  - Lưu trữ thêm trường `general_comment` để chứa nhận xét tổng quan của giám khảo lúc duyệt bài.
- **Bảng `Evaluation_Results`:**
  - Lưu trữ điểm số chi tiết do giám khảo chấm dựa trên từng dòng tiêu chí (`criteria_id`).
  - Kết nối trực tiếp với `Submissions` qua khóa ngoại `submission_id`.
- **Ranh giới cô lập:** **CẤM TUYỆT ĐỐI các câu lệnh JOIN** giữa bảng `Submissions`/`Evaluation_Results` sang bảng `Users` ở tầng cơ sở dữ liệu. Giám khảo và hệ thống giám sát chỉ được phép nhìn thấy mã `hash_id` ngẫu nhiên.

### 2.4 Profile Module (Hồ sơ năng lực động)

Xây dựng và hiển thị biểu đồ radar năng lực thực chiến công khai của ứng viên.

- **Bảng `Verified_Evidences`:**
  - Lưu trữ bằng chứng thực chiến của ứng viên sau khi đã vượt qua khâu đánh giá.
  - Bảng này lưu `user_id` để biết hồ sơ thuộc về ai. Tuy nhiên, nó áp dụng chiến lược **Snapshot Data**: copy trực tiếp chuỗi văn bản tĩnh như `challenge_name`, `company_name`, và `industry` tại thời điểm mở khóa để lưu trữ. Điều này phục vụ việc vẽ biểu đồ radar năng lực đa ngành.
- **Ranh giới cô lập:** Profile Module không JOIN ngược về Challenge Module hay IAM Module để lấy tên bài toán hay tên công ty. Việc lưu trữ Snapshot giúp Profile Module hoàn toàn độc lập, đảm bảo tốc độ truy vấn hiển thị cực kỳ nhanh, đồng thời bảo vệ dữ liệu hồ sơ vĩnh viễn kể cả khi bài Challenge gốc bị doanh nghiệp xóa hoặc sửa đổi.

### 2.5 Talent Pool Module (Lưu trữ ứng viên)

Module mở rộng cho phép doanh nghiệp lưu lại danh sách các ứng viên đã được mở khóa danh tính để tiện liên hệ về sau.

- **Bảng `Talent_Pools`:**
  - Lưu trữ `company_id` và `user_id` (của ứng viên).
  - Trường `status` (Enum: `IN_POOL`, `INVITED`, `CONSIDERING`) để theo dõi trạng thái tuyển dụng.
- **Ranh giới cô lập:** Bảng này lưu trữ độc lập, tuân thủ nguyên tắc không sử dụng Khóa ngoại (FK) chéo sang IAM Module. `company_id` và `user_id` chỉ được lưu dưới dạng Data Field để đảm bảo sự lỏng lẻo (Loosely Coupling) giữa các service.

---

## 3. QUY QUYẾT ĐỊNH KỸ THUẬT QUAN TRỌNG: TẠI SAO DÙNG UUID?

Toàn bộ các trường khóa chính (PK) và khóa quan hệ trong ERD này đều thống nhất sử dụng định dạng **UUID (Universally Unique Identifier - 36 ký tự)** thay vì số tự tăng (Auto-increment INT) hay chuỗi tự chế (VARCHAR). Lý do:

1.  **Chống lỗ hổng IDOR tuyệt đối:** Nếu sử dụng số tự tăng, URL bài nộp sẽ có dạng `api/submissions/101`. Ứng viên chỉ cần thay đổi số ID trên trình duyệt thành `102`, `103` là có thể xem trộm bài làm của người khác. UUID sinh ra chuỗi ngẫu nhiên không thể đoán trước (`e.g., 550e8400-e29b-41d4-a716-446655440000`), triệt tiêu hoàn toàn nguy cơ rò rỉ dữ liệu bài làm.
2.  **Tối ưu hóa tầng Backend:** Khác với số tự tăng phải đợi ghi vào Database thành công mới sinh được ID, UUID được sinh ra ngay tại code Backend (ví dụ: `Guid.NewGuid()` trong C# hoặc `uuid.uuid4()` trong Python). Điều này giúp Backend chủ động đóng gói dữ liệu và đẩy xuống DB một cách bất đồng bộ, loại bỏ hoàn toàn bước kiểm tra trùng lặp ID, giúp hệ thống không bị thắt cổ chai hiệu năng.
3.  **Sẵn sàng cho khả năng mở rộng:** Mặc dù hiện tại chạy Modular Monolith, nhưng UUID đảm bảo tính độc nhất trên toàn cầu. Sau này khi hệ thống lớn mạnh và bóc tách thành các dịch vụ Microservices nằm trên các cụm Server và Database độc lập, dữ liệu khi gộp lại (Merge DB) sẽ không bao giờ bị xung đột hay đụng độ ID.

---

## 4. LUỒNG ĐIỀU HƯỚNG DỮ LIỆU CỐT LÕI

### Luồng 1: Ứng viên nộp bài (Cách ly danh tính)

1.  Ứng viên nhấn nút nộp bài. Frontend gửi HTTP Request kèm Token JWT của ứng viên và file bài làm.
2.  Middleware của hệ thống giải mã JWT để lấy ra `user_id` thật.
3.  Hệ thống chuyển giao gói tin vào **Assessment Module**. Tại đây, HMAC-SHA256 sinh ra mã định danh 128-bit ổn định theo cặp Candidate–Challenge (VD: `hash_id = "Candidate_9F7A64D4297F45FA1E63B6A027AECE85"`).
4.  Hệ thống thực hiện 2 thao tác Insert ghi nhận dữ liệu:
    - Ghi cặp quan hệ mật mã `[hash_id, user_id, challenge_id, is_unlocked = False]` vào bảng kín `Identity_Mappings`.
    - Ghi thông tin bài nộp vào bảng công khai `Submissions` với khóa chính là `submission_id` và chứa `hash_id` để nối danh tính (Hoàn toàn sạch bóng thông tin `user_id`).

### Luồng 2: Doanh nghiệp chấm điểm và mở khóa thông tin (Unlock)

1.  Nhà tuyển dụng vào Dashboard, hệ thống lấy các trường công khai của Submission theo `challenge_id`. Giao diện chỉ hiển thị mã ẩn danh (`Candidate_9F7A64D4297F45FA1E63B6A027AECE85`) và tên file trung tính. Nhà tuyển dụng xem file giải pháp và tiến hành chấm điểm theo Rubric, lưu kết quả vào bảng `Evaluation_Results`.
2.  Nếu bài làm không đạt, nhà tuyển dụng bấm từ chối, trạng thái `Submissions.status` đổi thành `Rejected`. Bức tường ẩn danh giữ nguyên.
3.  Nếu bài làm xuất sắc, nhà tuyển dụng bấm nút **"Duyệt & Mở khóa" (Approve & Unlock)**:
    - Hệ thống cập nhật `Submissions.status = 'Approved'`.
    - Backend truy cập vào bảng kín `Identity_Mappings`, tìm bản ghi theo mã `hash_id`, cập nhật trường `is_unlocked = True`.
    - Hệ thống bóc tách `user_id` thật từ bảng kín, thực hiện truy vấn sang module IAM để lấy ra thông tin liên hệ (Họ tên, email, trường học) trả về cho nhà tuyển dụng để mời phỏng vấn.
    - Đồng thời, Assessment Module kích hoạt Event `Submission_Unlocked` chứa payload `{user_id, challenge_id, total_score}`. Profile Module (hoặc Middleware) bắt Event, gọi sang Challenge Module để lấy `challenge_name`, `company_name`, `industry` và ghi nhận một bản ghi năng lực mới vào bảng `Verified_Evidences`.

_Tài liệu này là quy chuẩn kỹ thuật bắt buộc của Sprint 0. Mọi thay đổi liên quan đến cấu trúc bảng và luồng dữ liệu bắt buộc phải thông báo và thông qua sự phê duyệt của Tech Lead trước khi tiến hành tạo Pull Request (PR)._
