# TÀI LIỆU QUY CHUẨN API CONTRACTS

---

## 1. NGUYÊN TẮC THIẾT KẾ KỸ THUẬT HỆ THỐNG

Tài liệu này quy định chi tiết các API Contracts thuộc phạm vi MVP của dự án POWORK. Toàn bộ đội ngũ kỹ thuật bắt buộc phải tuân thủ:

- **Định dạng dữ liệu:** Toàn bộ Request/Response Body dùng định dạng JSON chuẩn. Naming convention: `snake_case`.
- **Kiến trúc định danh:** 100% các trường khóa chính (PK) và khóa ngoại (FK) phải dùng **UUIDv4 (36 ký tự)** để chống lỗ hổng IDOR.
- **Bảo mật luồng ẩn danh:** Server tuyệt đối không trả về thông tin cá nhân (`user_id`, tên, trường học...) tại các Endpoint duyệt bài. Danh tính ứng viên chỉ được đại diện bằng `hash_id` cho đến khi có lệnh Unlock.

---

## 2. MODULE INTEGRATION & ROUTING TABLE

| Module Hệ thống          | Prefix URL Nghiệp vụ | Trách nhiệm            |
| :----------------------- | :------------------- | :--------------------- |
| **1. IAM Module**        | `/api/v1/auth`       | Backend Core (Quang)   |
| **2. Challenge Module**  | `/api/v1/challenges` | Backend Core (Quang)   |
| **3. Assessment Module** | `/api/v1/assessment` | BE & FE (Quang & Khoa) |
| **4. Profile Module**    | `/api/v1/profiles`   | Frontend Lead (Nhân)   |

---

## 3. CHI TIẾT API CONTRACTS THEO LUỒNG NGHIỆP VỤ

### 3.1 IAM Module - Định danh & Xác thực

#### [POST] `/api/v1/auth/register`

- **Mô tả:** Đăng ký tài khoản mới cho Ứng viên (Candidate) hoặc Doanh nghiệp (Employer).
- **Request Body:**
  ```json
  {
    "email": "string (required)",
    "password": "string (required, min 8 chars)",
    "full_name": "string (required)",
    "role": "string (Enum: Candidate, Employer) (required)",
    "company_name": "string (optional, bắt buộc nếu role là Employer)"
  }
  ```
- **Response (201 Created):**
  ```json
  {
    "status": "success",
    "data": {
      "access_token": "eyJhbG...",
      "token_type": "Bearer",
      "user": {
        "user_id": "de305d54-75b4-431b-adb2-eb6b9e546014",
        "email": "phong.dt@gmail.com",
        "full_name": "Đoàn Tấn Phong",
        "role": "Candidate",
        "company_id": "null hoặc UUID nếu là Employer",
        "created_at": "2026-06-01T08:00:00.000Z"
      }
    }
  }
  ```

---

#### [POST] `/api/v1/auth/login`

- **Mô tả:** Xác thực tài khoản, trả về JWT Access Token.
- **Request Body:**
  ```json
  {
    "email": "string (required)",
    "password": "string (required)"
  }
  ```
- **Response (200 OK):**
  ```json
  {
    "status": "success",
    "data": {
      "access_token": "eyJhbG...",
      "token_type": "Bearer",
      "user": {
        "user_id": "de305d54-75b4-431b-adb2-eb6b9e546014",
        "email": "phong.dt@gmail.com",
        "full_name": "Đoàn Tấn Phong",
        "role": "Candidate",
        "company_id": null,
        "created_at": "2026-06-01T08:00:00.000Z"
      }
    }
  }
  ```

---

### 3.2 Challenge Module - Quản lý thử thách

#### [POST] `/api/v1/challenges`

- **Mô tả:** Doanh nghiệp tạo bài toán kèm bộ tiêu chí chấm điểm.
- **Auth:** `Bearer <Employer_Token>`
- **Rule:** Tổng `weight` của mảng `rubrics` bắt buộc = 100.
- **Request Body:**
  ```json
  {
    "title": "Tối ưu Thuật toán Xử lý Bản đồ",
    "description": "Mô tả chi tiết...",
    "industry": "Công nghệ thông tin",
    "deadline": "2026-06-30T23:59:59Z",
    "rubrics": [
      {
        "criteria_name": "Kiến trúc mã nguồn",
        "weight": 40,
        "max_score": 10
      },
      {
        "criteria_name": "Tối ưu bộ nhớ",
        "weight": 60,
        "max_score": 10
      }
    ]
  }
  ```
- **Response (201 Created):** Trả về object challenge vừa tạo kèm list criteria có `criteria_id` (UUID). Tất cả field JSON dùng `snake_case`; status dùng Title Case.
  ```json
  {
    "status": "success",
    "data": {
      "challenge_id": "403bf47b-231a-4d22-9214-722a4669812a",
      "title": "Tối ưu Thuật toán Xử lý Bản đồ",
      "description": "Mô tả chi tiết...",
      "industry": "Công nghệ thông tin",
      "company_name": "MTech Solutions",
      "deadline": "2026-06-30T23:59:59.000Z",
      "status": "Open",
      "rubrics": [
        {
          "criteria_id": "aa152d43-014b-4892-ba21-cb9e443101d2",
          "criteria_name": "Kiến trúc mã nguồn",
          "weight": 40,
          "max_score": 10
        }
      ],
      "created_at": "2026-06-01T08:00:00.000Z",
      "updated_at": "2026-06-01T08:00:00.000Z"
    }
  }
  ```

#### [GET] `/api/v1/challenges`

- **Mô tả:** Lấy danh sách thử thách công khai cho ứng viên. Hỗ trợ query params `?industry=...` để lọc theo ngành nghề (IT, Thiết kế, Marketing...).
- **Response (200 OK):**
  ```json
  {
    "status": "success",
    "data": [
      {
        "challenge_id": "403bf47b-231a-4d22-9214-722a4669812a",
        "title": "Tối ưu Thuật toán Xử lý Bản đồ",
        "company_name": "MTech Solutions",
        "industry": "Công nghệ thông tin",
        "deadline": "2026-06-30T23:59:59Z"
      }
    ]
  }
  ```

#### [GET] `/api/v1/challenges/{challenge_id}`

- **Mô tả:** Lấy chi tiết một challenge. Response dùng cùng field với object trả về khi tạo challenge.
- **Response (200 OK):** `data` gồm `challenge_id`, `title`, `description`, `industry`, `company_name`, `deadline`, `status`, `rubrics`, `created_at` và `updated_at`.

#### [PATCH] `/api/v1/challenges/{challenge_id}/status`

- **Auth:** `Bearer <Employer_Token>`
- **Request Body:**
  ```json
  {
    "status": "Closed"
  }
  ```
- **Giá trị hợp lệ:** `Open`, `Closed`, `Archived`.
- **Response (200 OK):**
  ```json
  {
    "status": "success",
    "data": {
      "challenge_id": "403bf47b-231a-4d22-9214-722a4669812a",
      "status": "Closed",
      "updated_at": "2026-06-15T08:00:00.000Z"
    }
  }
  ```

---

### 3.3 Assessment Module - Lõi Ẩn Danh (KHU VỰC CÁCH LY)

`Submission.status` tiếp tục mô tả vòng đời chấm bài. `file_status` là trạng thái an toàn độc lập:

| `file_status` | Ý nghĩa | Employer được truy cập file? |
|---|---|---|
| `AwaitingUpload` | Đã cấp presigned URL, MinIO chưa xác nhận file | Không |
| `PendingScan` | Upload hoàn tất, đang chờ ClamAV | Không |
| `Safe` | ClamAV trả kết quả sạch rõ ràng | Có |
| `Rejected` | ClamAV phát hiện mã độc | Không |
| `ScanFailed` | ClamAV, MinIO hoặc quá trình scan gặp lỗi/không xác định | Không |

Hệ thống áp dụng nguyên tắc fail-closed: chỉ `Safe` mới được Employer xem, chấm, reject hoặc unlock.

#### [GET] `/api/v1/assessment/challenges/{challenge_id}/presigned-url`

- **Mô tả:** Ứng viên xin cấp phép nộp bài. Backend tạo một URL tạm thời (Presigned URL) trỏ thẳng vào MinIO để Frontend tự tải file lên. `object_key` dùng UUID ngẫu nhiên, không chứa `user_id` hoặc tên file gốc.
- **Auth:** `Bearer <Candidate_Token>`
- **Query Params:** `?filename=bai_lam.zip&content_type=application/zip`
- **Response (200 OK):**
  ```json
  {
    "status": "success",
    "data": {
      "upload_url": "http://minio:9000/powork-submissions/...",
      "object_key": "submissions/403bf47b-231a-4d22-9214-722a4669812a/8da218fa-64c1-4d61-920f-9fbb939263a3.zip",
      "submission_id": "f5e921dd-14bb-421c-a32e-11bc9aef4421",
      "hash_id": "Candidate_9F7A64D4297F45FA1E63B6A027AECE85",
      "version": 2,
      "file_status": "AwaitingUpload",
      "expires_in": 300
    }
  }
  ```

#### [POST] `/api/v1/assessment/submissions`

- **Mô tả:** Ứng viên xác nhận draft đã upload. Backend kiểm tra object thuộc đúng Candidate/Challenge và gọi MinIO `statObject`; chỉ khi object tồn tại mới chuyển `file_status` từ `AwaitingUpload` sang `PendingScan` và xếp lịch quét.
- **Auth:** `Bearer <Candidate_Token>`
- **Request Body:**
  ```json
  {
    "challenge_id": "403bf47b-231a-4d22-9214-722a4669812a",
    "solution_url": "submissions/403bf47b-231a-4d22-9214-722a4669812a/8da218fa-64c1-4d61-920f-9fbb939263a3.zip"
  }
  ```
- **Response (201 Created):** > **Lưu ý:** Tuyệt đối không có `user_id`. Chỉ trả về `hash_id` và `version`.
  ```json
  {
    "status": "success",
    "data": {
      "submission_id": "f5e921dd-14bb-421c-a32e-11bc9aef4421",
      "hash_id": "Candidate_9F7A64D4297F45FA1E63B6A027AECE85",
      "version": 2,
      "status": "Pending",
      "file_status": "PendingScan",
      "submitted_at": "2026-06-10T02:15:00Z"
    }
  }
  ```

#### [GET] `/api/v1/assessment/challenges/{challenge_id}/submissions`

- **Mô tả:** Doanh nghiệp lấy danh sách bài nộp để chấm. Trả về danh sách ứng viên, mỗi ứng viên chứa mảng các `versions` bài làm.
- **Auth:** `Bearer <Employer_Token>`
- **Ownership:** Chỉ công ty sở hữu Challenge mới được đọc danh sách. Công ty khác nhận `403 Forbidden` và không nhận dữ liệu Submission.
- **Blind Audition:** Trước Unlock, truy vấn không đọc hoặc trả `user_id`, tên, email hay tên file gốc. Giao diện chỉ hiển thị tên trung tính như `submission-v2.zip`.
- **File Safety:** Query chỉ lấy Submission có `file_status = Safe`. File đang upload, đang scan, nhiễm mã độc hoặc scan lỗi không có mặt trong danh sách Employer.
- **Response (200 OK):**
  > **NGHIÊM CẤM:** Trả về data dính dáng đến profile ứng viên. Chỉ trả list chứa `hash_id` và link file.
  ```json
  {
    "status": "success",
    "data": [
      {
        "hash_id": "Candidate_9F7A64D4297F45FA1E63B6A027AECE85",
        "is_unlocked": false,
        "submissions": [
          {
            "submission_id": "f5e921dd-14bb-421c-a32e-11bc9aef4421",
            "version": 2,
            "status": "Pending",
            "file_status": "Safe",
            "solution_url": "https://powork-storage...",
            "submitted_at": "2026-06-10T02:15:00Z"
          },
          {
            "submission_id": "old_uuid_here",
            "version": 1,
            "status": "Pending",
            "file_status": "Safe",
            "solution_url": "https://powork-storage...",
            "submitted_at": "2026-06-09T10:00:00Z"
          }
        ]
      }
    ]
  }
  ```

#### [POST] `/api/v1/assessment/submissions/{submission_id}/evaluate`

- **Mô tả:** Gửi kết quả chấm điểm Rubric.
- **Auth:** `Bearer <Employer_Token>`
- **Integrity:** Submission phải thuộc Challenge của công ty hiện tại, có `file_status = Safe`, `status = Pending` và chưa unlock. Mỗi `criteria_id` chỉ xuất hiện một lần, phải thuộc chính Challenge đó; `score` phải nằm trong `[0, max_score]`. Mọi kiểm tra hoàn tất trong transaction trước khi tạo Evaluation hoặc đổi status.
- **Request Body:**
  ```json
  {
    "evaluations": [
      {
        "criteria_id": "aa152d43-014b-4892-ba21-cb9e443101d2",
        "score": 8.5,
        "comment": "Tốt"
      }
    ],
    "general_comment": "Bài làm xuất sắc"
  }
  ```
- **Response (201 Created):**
  ```json
  {
    "status": "success",
    "data": {
      "submission_id": "f5e921dd-14bb-421c-a32e-11bc9aef4421",
      "evaluations": [
        {
          "criteria_id": "aa152d43-014b-4892-ba21-cb9e443101d2",
          "score": 8.5,
          "comment": "Tốt"
        }
      ],
      "general_comment": "Bài làm xuất sắc",
      "total_score": 8.5,
      "evaluated_at": "2026-06-10T03:00:00.000Z"
    }
  }
  ```
- **Response (403 Forbidden):** Trả về khi hồ sơ đã được Unlock (Đóng băng điểm số).
  ```json
  {
    "status": "error",
    "message": "Cannot evaluate. This submission has already been unlocked and frozen."
  }
  ```
- **Response (400 Bad Request):** Trả về khi criterion bị lặp, không thuộc Challenge, hoặc `score` vượt ngoài `[0, max_score]`. Không tạo Evaluation Result hay đổi Submission status.
- **Response (409 Conflict):** Trả về khi Submission không còn ở trạng thái `Pending`. Database đồng thời giữ unique constraint trên cặp `(submission_id, criteria_id)` để không thể sinh hai Evaluation Result hiệu lực khi có request đồng thời.

#### [POST] `/api/v1/assessment/submissions/{submission_id}/reject`

- **Mô tả:** Từ chối bài nộp nhưng không mở khóa danh tính Candidate.
- **Auth:** `Bearer <Employer_Token>`
- **Ownership & Safety:** Chỉ công ty sở hữu Challenge của Submission mới được từ chối; file phải có `file_status = Safe`. Submission đã unlock không thể bị thay đổi.
- **Response (200 OK):**
  ```json
  {
    "status": "success",
    "data": {
      "submission_id": "f5e921dd-14bb-421c-a32e-11bc9aef4421",
      "status": "Rejected"
    }
  }
  ```

#### [POST] `/api/v1/assessment/submissions/{submission_id}/unlock`

- **Mô tả:** Duyệt bài, mở khóa danh tính và tạo Verified Evidence trong cùng transaction.
- **Auth:** `Bearer <Employer_Token>`
- **Ownership, Safety & Snapshot:** Chỉ công ty sở hữu Challenge của Submission mới được approve và unlock. File phải có `file_status = Safe`, Submission phải ở trạng thái `Evaluated` và có kết quả chấm. Transaction bao gồm compare-and-set `is_unlocked`, cập nhật Submission, tạo Verified Evidence và lookup profile trả về. Nếu bất kỳ bước nào lỗi, toàn bộ thay đổi được rollback. Mỗi anonymous `hash_id` chỉ tạo được một Verified Evidence; gọi lặp hoặc request đồng thời nhận `409` và không tạo snapshot thứ hai.
- **Request Body:**
  ```json
  {
    "action": "APPROVE"
  }
  ```
- **Response (200 OK):**
  > Giai đoạn này mới được phép lột mặt nạ, trả về `unlocked_candidate_profile` thật.
  ```json
  {
    "status": "success",
    "data": {
      "message": "Identity unlocked successfully.",
      "unlocked_candidate_profile": {
        "user_id": "de305d54-...",
        "full_name": "Đoàn Tấn Phong",
        "email": "phong.dt@gmail.com"
      }
    }
  }
  ```
- **Response (409 Conflict):** Trả về khi xảy ra hiện tượng Race Condition (2 giám khảo cùng bấm Unlock). Yêu cầu Backend dùng Prisma Interactive Transaction để bắt lỗi này.
  ```json
  {
    "status": "error",
    "message": "Conflict! This candidate has already been unlocked by another evaluator."
  }
  ```

---

### 3.4 Profile Module - Hồ sơ năng lực

#### [GET] `/api/v1/profiles/{user_id}`

- **Mô tả:** Lấy thông tin chứng nhận thực chiến của ứng viên (Công khai).
- **Response (200 OK):**
  ```json
  {
    "status": "success",
    "data": {
      "user_id": "de305d54-...",
      "full_name": "Đoàn Tấn Phong",
      "verified_evidences": [
        {
          "evidence_id": "7712aaeb-...",
          "challenge_name": "Tối ưu Thuật toán Xử lý Bản đồ Geolocation Grid-Defense",
          "company_name": "MTech Solutions",
          "industry": "Công nghệ thông tin",
          "total_score": 8.6,
          "unlocked_at": "2026-06-10T02:16:45Z"
        }
      ]
    }
  }
  ```

---

### 3.5 Talent Pool Module - Lưu trữ ứng viên (Dành cho Employer)

#### [POST] `/api/v1/talent-pool`

- **Mô tả:** Thêm một ứng viên đã được mở khóa (unlock) vào Talent Pool của công ty.
- **Auth:** `Bearer <Employer_Token>`
- **Authorization:** `company_id` chỉ lấy từ JWT. Candidate phải có Identity Mapping đã unlock cho một Challenge thuộc đúng công ty hiện tại; việc đã được công ty khác unlock không cấp quyền thêm vào Talent Pool.
- **Request Body:**
  ```json
  {
    "user_id": "de305d54-75b4-431b-adb2-eb6b9e546014"
  }
  ```
- **Response (201 Created):**
  ```json
  {
    "status": "success",
    "message": "Candidate added to Talent Pool"
  }
  ```
- **Response (403 Forbidden):** `POOL_007` khi Candidate chưa được chính công ty hiện tại unlock. Không tạo Talent Pool entry và không tiết lộ công ty nào đã unlock Candidate.

#### [GET] `/api/v1/talent-pool`

- **Mô tả:** Lấy danh sách ứng viên trong Talent Pool của công ty hiện tại.
- **Auth:** `Bearer <Employer_Token>`
- **Response (200 OK):**
  ```json
  {
    "status": "success",
    "data": [
      {
        "pool_id": "8b9e67a1-1234-421c-a32e-11bc9aef4421",
        "candidate": {
          "user_id": "de305d54-75b4-431b-adb2-eb6b9e546014",
          "full_name": "Đoàn Tấn Phong",
          "university": "HCMUS",
          "year": "Năm 4",
          "primary_skills": ["System Design", "Redis"]
        },
        "highest_score": 92.0,
        "challenges_taken": ["Caching", "API Design"],
        "status": "INVITED",
        "added_at": "2026-06-12T10:00:00Z"
      }
    ]
  }
  ```

#### [PATCH] `/api/v1/talent-pool/:pool_id/status`

- **Mô tả:** Cập nhật trạng thái của ứng viên trong Talent Pool.
- **Auth:** `Bearer <Employer_Token>`
- **Request Body:**
  ```json
  {
    "status": "INVITED" // Chỉ nhận: "IN_POOL" hoặc "INVITED"
  }
  ```
- **Response (200 OK):**
  ```json
  {
    "status": "success",
    "message": "Cập nhật trạng thái thành công"
  }
  ```
