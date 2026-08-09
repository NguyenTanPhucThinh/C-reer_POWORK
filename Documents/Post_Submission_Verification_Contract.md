# POST-SUBMISSION VERIFICATION — PRODUCT & API CONTRACT

## 1. Mục tiêu

Tính năng này tạo bằng chứng bổ sung ngay sau khi Candidate nộp bài để Employer có thể đối chiếu khả năng trình bày, lập luận, hình ảnh và giọng nói với bài làm đã nhận.

Một phiên xác thực gồm hai phần liên tục:

1. Candidate bật Camera và microphone, đọc mã xác thực rồi trình bày miệng.
2. Camera tiếp tục hoạt động trong khi Candidate tự gõ câu trả lời cho 1–3 câu hỏi do AI tạo.

Tính năng chỉ cung cấp tín hiệu hỗ trợ con người đánh giá. Hệ thống không tự kết luận Candidate gian lận và không tuyên bố chứng minh tuyệt đối ai là người đã làm bài.

---

## 2. Phạm vi MVP đã chốt

### 2.1 Có trong MVP

- Một phiên xác thực hiệu lực cho mỗi Submission.
- Candidate chọn thời lượng trình bày tối đa: 15, 30, 60 hoặc 120 giây.
- Camera và microphone được duy trì từ phần trình bày đến khi gửi câu trả lời.
- Mã xác thực ngẫu nhiên được Backend tạo cho từng phiên.
- AI tạo từ 1 đến 3 câu hỏi tự luận.
- Candidate phải tự gõ câu trả lời trên giao diện.
- Frontend chặn copy, paste, drop và chọn toàn bộ trong vùng trả lời.
- Ghi nhận các tín hiệu Camera gián đoạn, mất focus và thao tác nhập liệu bị chặn.
- Video được upload trực tiếp lên MinIO bằng presigned URL.
- Video chỉ được xem là sẵn sàng sau khi ClamAV trả kết quả sạch rõ ràng.
- Employer có dashboard riêng cho từng Submission.
- Video, câu hỏi, câu trả lời và tín hiệu chi tiết chỉ được Employer xem sau khi unlock.

### 2.2 Không có trong MVP

- Nhận diện hoặc so khớp khuôn mặt.
- Nhận dạng hoặc so khớp giọng nói.
- Phát hiện deepfake.
- Livestream video qua Backend.
- AI chấm điểm gian lận hoặc sinh fraud score.
- Keylogging hoặc lưu nội dung clipboard.
- OCR, giải nén hoặc trích xuất nội dung bài nộp để gửi sang AI.
- Nhiều AI provider hoặc tự động chuyển provider.
- Dashboard so sánh nhiều Candidate.
- Quy trình Admin cấp lại phiên đã hết hạn.

---

## 3. Nguyên tắc quyền riêng tư và Blind Audition

Verification gắn với `submission_id`, không lưu tên, email hoặc `user_id` trong dữ liệu công khai dành cho Employer.

Trước khi unlock, Employer chỉ được biết:

- Trạng thái xác thực.
- Thời điểm hoàn tất nếu có.
- Số câu hỏi đã trả lời.
- Video đã vượt qua kiểm tra an toàn hay chưa.

Trước khi unlock, Backend tuyệt đối không trả:

- Video hoặc presigned URL xem video.
- Thumbnail có hình Candidate.
- Nội dung câu hỏi hoặc câu trả lời.
- Giọng nói, mã xác thực hoặc các tín hiệu hành vi chi tiết.
- Tên, email, `user_id` hoặc metadata có thể nhận dạng Candidate.

Sau khi unlock, chỉ Employer thuộc đúng công ty sở hữu Challenge của Submission mới được lấy dashboard đầy đủ và URL xem video.

Đổi `submission_id` hoặc `verification_id` trong URL không được vượt authorization.

---

## 4. Trạng thái Verification

API sử dụng các giá trị Title Case sau:

| Trạng thái            | Ý nghĩa                                                                 |
| --------------------- | ----------------------------------------------------------------------- |
| `PendingCamera`       | Phiên đã được tạo, đang chờ Camera và microphone sẵn sàng               |
| `CameraActive`        | Camera đã hoạt động; Candidate đang trình bày hoặc đang chờ tạo câu hỏi |
| `GeneratingQuestions` | Backend đang yêu cầu AI tạo bộ câu hỏi                                  |
| `Answering`           | Bộ câu hỏi đã được cố định và Candidate đang tự gõ câu trả lời          |
| `PendingUpload`       | Candidate đã yêu cầu hoàn tất nhưng video chưa được Backend xác nhận    |
| `PendingScan`         | Video đã tồn tại trên MinIO và đang chờ kết quả ClamAV                  |
| `Ready`               | Câu trả lời hợp lệ và video đã được xác nhận an toàn                    |
| `Rejected`            | Video bị phát hiện không an toàn hoặc dữ liệu xác thực bị từ chối       |
| `ScanFailed`          | Không thể xác định video có an toàn hay không                           |
| `Expired`             | Candidate không hoàn thành phiên trong thời hạn                         |

Chỉ `Ready` được hiểu là xác thực đã hoàn tất. `Ready` không phải kết luận Candidate chắc chắn là tác giả bài làm.

### 4.1 Chuyển trạng thái hợp lệ

```text
PendingCamera
      ↓
CameraActive
      ↓
GeneratingQuestions ── AI lỗi ──▶ CameraActive
      ↓
Answering
      ↓
PendingUpload
      ↓
PendingScan
      ├── ClamAV xác nhận sạch ──▶ Ready
      ├── Phát hiện không an toàn ──▶ Rejected
      └── Không xác định được ──▶ ScanFailed
```

Mọi trạng thái chưa hoàn tất có thể chuyển sang `Expired` khi hết hạn. `Ready`, `Rejected`, `ScanFailed` và `Expired` là trạng thái cuối trong MVP.

---

## 5. Quy tắc thời gian

- `oral_duration_seconds` chỉ nhận một trong: `15`, `30`, `60`, `120`.
- Giá trị mặc định trên Frontend là `60`, nhưng Backend không tự điền khi request thiếu.
- Giá trị đã chọn không được thay đổi sau khi Camera bắt đầu.
- Candidate có thể hoàn thành phần trình bày sớm.
- Backend tính thời lượng thực tế từ thời điểm server nhận `ORAL_STARTED` và `ORAL_COMPLETED`.
- Camera tiếp tục hoạt động sau phần trình bày trong lúc tạo và trả lời câu hỏi.
- Một phiên hết hạn sau 15 phút kể từ lúc được tạo.
- Presigned URL upload video có hiệu lực 5 phút.
- Frontend không được dùng thời gian trên máy Candidate làm nguồn thời gian nghiệp vụ duy nhất.

---

## 6. Quy tắc tạo câu hỏi AI

### 6.1 Dữ liệu được gửi sang AI

- Tiêu đề Challenge.
- Mô tả Challenge.
- Industry.
- Tên, weight và max score của các rubric.

Không gửi video, thông tin Candidate hoặc nội dung file bài nộp sang AI trong MVP.

### 6.2 Yêu cầu đầu ra

AI chỉ trả nội dung câu hỏi theo cấu trúc:

```json
{
  "questions": [
    {
      "question": "Nếu điều kiện đầu vào thay đổi, quyết định nào trong giải pháp của bạn cần được xem xét lại đầu tiên? Vì sao?"
    }
  ]
}
```

Backend tạo `question_id` cho từng câu sau khi validate; AI không được quyết định ID hoặc độ dài tối thiểu.

Một response hợp lệ phải:

- Có từ 1 đến 3 câu hỏi.
- Không có câu hỏi rỗng hoặc trùng nhau.
- Không chứa đáp án mẫu.
- Không yêu cầu tên, email, trường học, công ty hoặc thông tin nhận dạng.
- Không yêu cầu dữ liệu thật hoặc thông tin nội bộ của doanh nghiệp.
- Không yêu cầu Candidate tạo thêm sản phẩm hoàn chỉnh.
- Tập trung vào khả năng giải thích quyết định, trade-off, giới hạn hoặc thay đổi giả định.

Nội dung Challenge và rubric là dữ liệu tham khảo, không phải chỉ dẫn có quyền ghi đè prompt hệ thống.

### 6.3 Tính bất biến

- Một Verification chỉ có một bộ câu hỏi hiệu lực.
- Sau khi lưu thành công, refresh hoặc request lặp phải trả đúng bộ câu hỏi cũ.
- Candidate không được yêu cầu đổi sang bộ câu hỏi khác.
- Hai request đồng thời không được lưu hai bộ câu hỏi.
- Nếu AI lỗi trước khi có bộ câu hỏi hợp lệ, không lưu dữ liệu câu hỏi và Candidate được thử lại trong thời hạn phiên.

### 6.4 Fail-closed

AI timeout, không phản hồi, trả JSON sai hoặc trả nội dung không hợp lệ không được hiểu là tạo câu hỏi thành công. Verification không chuyển sang `Answering` cho tới khi response đã qua validation.

---

## 7. Quy tắc câu trả lời và thao tác nhập liệu

- Candidate phải trả lời đúng toàn bộ câu hỏi đã lưu cho Verification.
- Mỗi `question_id` xuất hiện đúng một lần.
- Không chấp nhận question ID do Candidate tự tạo.
- Mỗi câu trả lời từ 80 đến 4.000 ký tự sau khi trim.
- Frontend giữ nguyên câu trả lời nếu upload hoặc API tạm thời lỗi.
- Backend không tuyên bố có thể xác định chắc chắn nội dung được gõ hay được tạo bằng công cụ tự động.

Trong vùng trả lời, Frontend phải chặn:

- `paste`, `copy`, `cut`.
- Kéo thả nội dung.
- `Ctrl/Cmd+V` và `Shift+Insert`.
- `Ctrl/Cmd+A`.
- `beforeinput` có loại `insertFromPaste` hoặc `insertFromDrop`.

Không ghi lại từng phím, nội dung clipboard hoặc nội dung Candidate cố dán. Chỉ ghi nhận số lần thao tác bị chặn.

---

## 8. Các tín hiệu phiên

Backend chỉ chấp nhận các event sau:

| Event                | Ý nghĩa                                           |
| -------------------- | ------------------------------------------------- |
| `CAMERA_INTERRUPTED` | Camera track bị mute hoặc kết thúc ngoài chủ đích |
| `CAMERA_RESTORED`    | Camera được khôi phục sau gián đoạn               |
| `FOCUS_LOST`         | Trang xác thực mất focus hoặc bị chuyển sang nền  |
| `PASTE_BLOCKED`      | Frontend chặn thao tác dán                        |
| `SELECT_ALL_BLOCKED` | Frontend chặn `Ctrl/Cmd+A`                        |
| `COPY_BLOCKED`       | Frontend chặn copy hoặc cut trong vùng trả lời    |
| `DROP_BLOCKED`       | Frontend chặn kéo thả nội dung vào vùng trả lời   |
| `ORAL_STARTED`       | Candidate bắt đầu phần trình bày miệng            |
| `ORAL_COMPLETED`     | Candidate hoàn thành phần trình bày miệng         |
| `ANSWERING_STARTED`  | Candidate nhận bộ câu hỏi và bắt đầu trả lời      |

Các event dùng timestamp của Backend. Event lạ bị từ chối. Candidate khác không được gửi event cho Verification không thuộc mình.

Dashboard phải mô tả đây là tín hiệu hỗ trợ xem xét, không phải chứng cứ tuyệt đối hoặc kết luận gian lận.

---

## 9. Quy tắc video và File Safety

- Frontend dùng `MediaRecorder` có sẵn của trình duyệt; không cần SDK quay video.
- Camera và microphone phải duy trì từ lúc trình bày đến khi gửi câu trả lời.
- Định dạng MVP được chấp nhận: `video/webm` hoặc `video/mp4` nếu trình duyệt hỗ trợ.
- Kích thước video tối đa: 100 MiB (`104857600` byte), phù hợp giới hạn scan hiện tại.
- Object key do Backend sinh bằng UUID ngẫu nhiên.
- Object key không chứa `user_id`, `hash_id`, tên, email hoặc tên file gốc.
- Candidate chỉ được hoàn tất bằng object key đã cấp cho đúng Verification.
- Backend phải xác nhận object tồn tại và kiểm tra metadata trước khi lưu `PendingScan`.
- ClamAV không phản hồi hoặc trả kết quả không xác định phải chuyển thành `ScanFailed`, không phải `Ready`.
- Chỉ video `Ready` mới được cấp presigned GET URL cho Employer đủ quyền.

Object key có dạng:

```text
verifications/{random_uuid}.webm
```

---

## 10. API Candidate

Tất cả request dùng `Authorization: Bearer <Candidate_Token>` và response dùng `snake_case`.

### 10.1 Khởi tạo hoặc tiếp tục phiên

```http
POST /api/v1/assessment/submissions/{submission_id}/verification/start
Content-Type: application/json
```

```json
{
  "oral_duration_seconds": 60
}
```

Response `200 OK` cho cả phiên mới và phiên đã tồn tại để giữ hành vi idempotent:

```json
{
  "status": "success",
  "data": {
    "verification_id": "6f782d36-53a0-4a46-9441-df5bfda7f118",
    "submission_id": "f5e921dd-14bb-421c-a32e-11bc9aef4421",
    "verification_status": "PendingCamera",
    "verification_code": "RIVER-27",
    "oral_duration_seconds": 60,
    "expires_at": "2026-08-09T15:15:00.000Z"
  }
}
```

Nếu phiên đã tồn tại, request phải dùng cùng `oral_duration_seconds`; gửi giá trị khác nhận `409 VERIFICATION_DURATION_LOCKED`.

### 10.2 Lấy trạng thái phiên

```http
GET /api/v1/assessment/verifications/{verification_id}
```

Response chỉ dành cho Candidate sở hữu phiên và trả trạng thái hiện tại, thời hạn, thời lượng, câu hỏi đã lưu nếu trạng thái cho phép, cùng tiến độ upload/scan. Không trả presigned URL cũ.

### 10.3 Ghi nhận event

```http
POST /api/v1/assessment/verifications/{verification_id}/events
Content-Type: application/json
```

```json
{
  "event": "PASTE_BLOCKED"
}
```

Response:

```http
204 No Content
```

Request event lặp được tính là nhiều lần xảy ra, ngoại trừ các event chuyển phase phải idempotent.

### 10.4 Tạo hoặc lấy bộ câu hỏi

```http
POST /api/v1/assessment/verifications/{verification_id}/questions
```

Response `200 OK`:

```json
{
  "status": "success",
  "data": {
    "verification_id": "6f782d36-53a0-4a46-9441-df5bfda7f118",
    "verification_status": "Answering",
    "questions": [
      {
        "question_id": "5ba1683a-d573-46b7-a8a1-632014f578a4",
        "question": "Nếu điều kiện đầu vào thay đổi, phần nào trong giải pháp của bạn cần được xem xét lại đầu tiên? Vì sao?",
        "minimum_length": 80,
        "maximum_length": 4000
      }
    ]
  }
}
```

### 10.5 Xin URL upload video

```http
POST /api/v1/assessment/verifications/{verification_id}/recording-upload
Content-Type: application/json
```

```json
{
  "content_type": "video/webm"
}
```

Response `200 OK`:

```json
{
  "status": "success",
  "data": {
    "upload_url": "https://storage.example/...",
    "object_key": "verifications/92f098bc-93cc-498e-b4bd-36988475256c.webm",
    "expires_in": 300
  }
}
```

### 10.6 Hoàn tất phiên

```http
POST /api/v1/assessment/verifications/{verification_id}/complete
Content-Type: application/json
```

```json
{
  "object_key": "verifications/92f098bc-93cc-498e-b4bd-36988475256c.webm",
  "recording_mime_type": "video/webm",
  "answers": [
    {
      "question_id": "5ba1683a-d573-46b7-a8a1-632014f578a4",
      "answer": "Tôi sẽ xem xét lại chiến lược vô hiệu hóa cache trước tiên vì..."
    }
  ]
}
```

Response `202 Accepted`:

```json
{
  "status": "success",
  "data": {
    "verification_id": "6f782d36-53a0-4a46-9441-df5bfda7f118",
    "verification_status": "PendingScan",
    "message": "Nội dung xác thực đã được tiếp nhận và đang được kiểm tra an toàn."
  }
}
```

Request lặp sau khi đã chuyển `PendingScan` không tạo dữ liệu mới và trả trạng thái hiện tại.

---

## 11. API Employer

### 11.1 Tóm tắt trước unlock

```http
GET /api/v1/assessment/submissions/{submission_id}/verification-summary
Authorization: Bearer <Employer_Token>
```

Chỉ công ty sở hữu Challenge được gọi endpoint này.

Response `200 OK`:

```json
{
  "status": "success",
  "data": {
    "submission_id": "f5e921dd-14bb-421c-a32e-11bc9aef4421",
    "verification_status": "Ready",
    "completed_at": "2026-08-09T15:08:00.000Z",
    "question_count": 3,
    "recording_safe": true
  }
}
```

Response này không thay đổi theo unlock và không chứa bằng chứng chi tiết.

### 11.2 Dashboard đầy đủ sau unlock

```http
GET /api/v1/assessment/submissions/{submission_id}/verification-dashboard
Authorization: Bearer <Employer_Token>
```

Điều kiện:

- Employer thuộc công ty sở hữu Challenge.
- IdentityMapping của Submission đã unlock.

Response `200 OK`:

```json
{
  "status": "success",
  "data": {
    "submission_id": "f5e921dd-14bb-421c-a32e-11bc9aef4421",
    "verification_id": "6f782d36-53a0-4a46-9441-df5bfda7f118",
    "verification_status": "Ready",
    "selected_oral_duration_seconds": 60,
    "actual_oral_duration_seconds": 47,
    "answering_duration_seconds": 326,
    "question_count": 3,
    "answered_question_count": 3,
    "signals": {
      "camera_interruption_count": 0,
      "camera_interruption_duration_seconds": 0,
      "focus_loss_count": 1,
      "paste_blocked_count": 0,
      "select_all_blocked_count": 0,
      "copy_blocked_count": 0,
      "drop_blocked_count": 0
    },
    "timeline": [
      {
        "event": "SESSION_STARTED",
        "occurred_at": "2026-08-09T15:00:00.000Z"
      },
      {
        "event": "VERIFICATION_READY",
        "occurred_at": "2026-08-09T15:08:00.000Z"
      }
    ],
    "questions": [
      {
        "question_id": "5ba1683a-d573-46b7-a8a1-632014f578a4",
        "question": "Nếu điều kiện đầu vào thay đổi, phần nào trong giải pháp của bạn cần được xem xét lại đầu tiên? Vì sao?",
        "answer": "Tôi sẽ xem xét lại chiến lược vô hiệu hóa cache trước tiên vì...",
        "answer_length": 214
      }
    ],
    "recording_available": true,
    "completed_at": "2026-08-09T15:08:00.000Z"
  }
}
```

Dashboard không trả fraud score, kết luận gian lận hoặc presigned URL video.

### 11.3 Lấy URL xem video

```http
GET /api/v1/assessment/submissions/{submission_id}/verification-recording
Authorization: Bearer <Employer_Token>
```

Chỉ trả URL khi đúng công ty, đã unlock và Verification ở trạng thái `Ready`.

Response `200 OK`:

```json
{
  "status": "success",
  "data": {
    "recording_url": "https://storage.example/temporary-url",
    "expires_in": 300
  }
}
```

---

## 12. Error contract

| HTTP  | `error_code`                        | Khi sử dụng                                                                 |
| ----- | ----------------------------------- | --------------------------------------------------------------------------- |
| `400` | `VERIFICATION_VALIDATION`           | Payload, duration, answer, MIME type hoặc event không hợp lệ                |
| `403` | `VERIFICATION_FORBIDDEN`            | Không sở hữu Submission/Verification hoặc Employer không thuộc đúng công ty |
| `403` | `VERIFICATION_LOCKED`               | Employer yêu cầu bằng chứng chi tiết trước khi unlock                       |
| `404` | `VERIFICATION_NOT_FOUND`            | Không tìm thấy Submission hoặc Verification trong phạm vi được phép biết    |
| `409` | `VERIFICATION_DURATION_LOCKED`      | Cố đổi thời lượng sau khi phiên đã được tạo                                 |
| `409` | `VERIFICATION_INVALID_STATE`        | Hành động không hợp lệ với trạng thái hiện tại                              |
| `409` | `VERIFICATION_ALREADY_COMPLETED`    | Cố thay đổi một phiên đã ở trạng thái cuối                                  |
| `410` | `VERIFICATION_EXPIRED`              | Phiên đã hết hạn                                                            |
| `413` | `VERIFICATION_RECORDING_TOO_LARGE`  | Video vượt quá 100 MiB                                                      |
| `415` | `VERIFICATION_RECORDING_TYPE`       | MIME type video không được hỗ trợ                                           |
| `503` | `VERIFICATION_QUESTION_UNAVAILABLE` | AI timeout, không phản hồi hoặc trả dữ liệu không hợp lệ                    |
| `503` | `VERIFICATION_SCAN_UNAVAILABLE`     | Không thể xác định video có an toàn hay không                               |

Response lỗi dùng envelope hiện tại:

```json
{
  "status": "error",
  "error_code": "VERIFICATION_INVALID_STATE",
  "message": "Phiên xác thực chưa sẵn sàng cho thao tác này."
}
```

Thông báo không được làm lộ Submission hoặc Verification của người khác.

---

## 13. Thứ tự xử lý và tính toàn vẹn

```text
Xác thực Candidate
        ↓
Kiểm tra Candidate sở hữu Submission
        ↓
Tạo hoặc lấy Verification duy nhất
        ↓
Camera bắt đầu và Backend ghi nhận phase
        ↓
AI tạo, Backend validate và cố định câu hỏi
        ↓
Candidate tự gõ câu trả lời trong khi Camera tiếp tục hoạt động
        ↓
Frontend upload video bằng presigned URL
        ↓
Backend xác nhận object, câu trả lời và trạng thái trong transaction
        ↓
ClamAV scan
        ├── Sạch ──────▶ Ready
        ├── Nguy hiểm ─▶ Rejected
        └── Lỗi ───────▶ ScanFailed
```

Các ràng buộc bắt buộc:

- Một Submission chỉ có một Verification.
- Một Verification chỉ có một bộ câu hỏi.
- Một câu hỏi chỉ có một câu trả lời hiệu lực.
- Request đồng thời không tạo hai phiên, hai bộ câu hỏi hoặc hai lần hoàn tất.
- Không lưu câu trả lời và không đổi trạng thái nếu object video chưa tồn tại.
- Transaction thất bại không để Verification hoàn thành một phần.
- Request trái phép không tạo event, object key, câu hỏi, câu trả lời hoặc thay đổi trạng thái.
- Candidate không được hoàn tất bằng object key của Verification khác.

---

## 14. Trạng thái giao diện Candidate

### `SETUP`

- Giải thích mục đích Camera và microphone.
- Candidate chọn 15 giây, 30 giây, 1 phút hoặc 2 phút.
- Mặc định chọn 1 phút.
- Không bắt đầu phiên ghi hình trước khi Candidate chủ động cho phép.

### `CAMERA_READY`

- Hiển thị preview, trạng thái microphone và mã xác thực.
- Không cho tiếp tục nếu Camera hoặc microphone chưa sẵn sàng.

### `ORAL_RECORDING`

- Hiển thị dấu hiệu đang ghi và đồng hồ đếm ngược.
- Candidate có thể hoàn thành sớm.
- Hết thời gian tự chuyển sang bước tiếp theo.

### `GENERATING_QUESTIONS`

- Camera và recording tiếp tục hoạt động.
- Khóa hành động gửi lặp.
- AI lỗi được hiển thị như lỗi hệ thống và cho thử lại trong thời hạn phiên.

### `ANSWERING`

- Hiển thị từ 1 đến 3 câu hỏi.
- Camera preview vẫn hiển thị.
- Camera gián đoạn thì khóa vùng trả lời cho tới khi được khôi phục.
- Mọi câu trả lời được giữ nguyên khi request tạm thời lỗi.
- Thao tác nhập liệu bị chặn phải có thông báo bằng chữ, không chỉ đổi màu.

### `UPLOADING_AND_SCANNING`

- Khóa nút hoàn tất để tránh gửi trùng.
- Phân biệt “Đang tải video”, “Đang lưu câu trả lời” và “Đang kiểm tra video”.
- Không báo thành công trước trạng thái `Ready`.

### `COMPLETED`

Hiển thị khi Backend trả `Ready`:

> Xác thực đã hoàn tất
>
> Cảm ơn bạn đã dành thời gian tham gia phiên phỏng vấn.
>
> Phần trình bày và câu trả lời của bạn đã được ghi nhận thành công. Nhà tuyển dụng sẽ đánh giá bài làm theo quy trình Blind Audition trước khi xem thông tin xác thực của bạn.
>
> Chúc bạn có một kết quả thật tốt!

Cho Candidate mở “Bài nộp của tôi” hoặc quay về Dashboard.

### `FAILED`

- Phân biệt hết hạn, upload lỗi, scan lỗi và video bị từ chối.
- Không xóa câu trả lời chỉ vì lỗi mạng tạm thời.
- Không hiển thị lời cảm ơn hoàn tất khi Backend chưa trả `Ready`.

---

## 15. Quy tắc Dashboard Employer

Mỗi Submission có một dashboard riêng. Dashboard đầy đủ chỉ xuất hiện sau unlock và gồm:

1. Trạng thái tổng quan.
2. Thời lượng trình bày đã chọn và thực tế.
3. Thời gian trả lời, số câu hỏi và số câu hoàn thành.
4. Các tín hiệu Camera, focus và thao tác nhập liệu bị chặn.
5. Timeline của phiên.
6. Video xác thực.
7. Bộ câu hỏi và câu trả lời.

Dashboard phải hiển thị ghi chú:

> Các chỉ số trên là tín hiệu hỗ trợ Employer đánh giá tính nhất quán của phiên xác thực. Chúng không phải bằng chứng tuyệt đối và không được sử dụng như kết luận gian lận tự động.

Không thêm biểu đồ, thư viện chart, fraud score hoặc xếp hạng Candidate trong MVP. Summary cards và timeline là đủ cho dashboard một Submission.

---

## 16. Tình huống nghiệm thu

| Mã        | Tình huống                                   | Kết quả mong đợi                                                |
| --------- | -------------------------------------------- | --------------------------------------------------------------- |
| `VER-001` | Candidate tạo phiên cho Submission của mình  | Trả một Verification hợp lệ                                     |
| `VER-002` | Candidate đổi sang Submission của người khác | `403`, không tạo dữ liệu phụ                                    |
| `VER-003` | Chọn 15, 30, 60 hoặc 120 giây                | Được chấp nhận                                                  |
| `VER-004` | Chọn thời lượng ngoài danh sách              | `400 VERIFICATION_VALIDATION`                                   |
| `VER-005` | Gọi start lặp với cùng thời lượng            | Trả cùng Verification                                           |
| `VER-006` | Gọi start lặp với thời lượng khác            | `409 VERIFICATION_DURATION_LOCKED`                              |
| `VER-007` | AI trả 1–3 câu hợp lệ                        | Lưu đúng một bộ câu hỏi và chuyển `Answering`                   |
| `VER-008` | AI timeout hoặc output sai                   | `503`, không lưu câu hỏi lỗi                                    |
| `VER-009` | Gọi tạo câu hỏi lặp hoặc đồng thời           | Không tạo bộ câu hỏi thứ hai                                    |
| `VER-010` | Candidate gửi thiếu hoặc sai question ID     | `400`, không lưu câu trả lời                                    |
| `VER-011` | Candidate dùng object key khác               | Bị chặn, không đổi trạng thái                                   |
| `VER-012` | Candidate hoàn tất đúng dữ liệu              | `202`, chuyển `PendingScan`                                     |
| `VER-013` | ClamAV xác nhận sạch                         | Chuyển `Ready`                                                  |
| `VER-014` | ClamAV phát hiện không an toàn               | Chuyển `Rejected`                                               |
| `VER-015` | ClamAV lỗi hoặc không xác định               | Chuyển `ScanFailed`, không coi là thành công                    |
| `VER-016` | Phiên hết 15 phút                            | Chuyển `Expired`, không nhận hoàn tất mới                       |
| `VER-017` | Camera bị gián đoạn                          | Khóa trả lời, ghi nhận tín hiệu và cho khôi phục trong thời hạn |
| `VER-018` | Candidate paste hoặc nhấn `Ctrl/Cmd+A`       | Frontend chặn và ghi nhận event                                 |
| `VER-019` | Employer chưa unlock lấy dashboard/video     | `403 VERIFICATION_LOCKED`                                       |
| `VER-020` | Employer công ty khác đổi Submission ID      | `403`, không lộ dữ liệu                                         |
| `VER-021` | Employer đúng công ty đã unlock              | Nhận dashboard và URL video tạm thời                            |
| `VER-022` | Employer xem summary trước unlock            | Chỉ nhận metadata trung tính                                    |
| `VER-023` | Request hoàn tất lặp hoặc đồng thời          | Không tạo câu trả lời hoặc scan job trùng                       |
| `VER-024` | Upload hoặc transaction thất bại             | Không để phiên ở trạng thái hoàn thành một phần                 |
| `VER-025` | Verification đạt `Ready`                     | Hiển thị thông báo hoàn tất và lời cảm ơn                       |

---

## 17. Điều kiện đóng băng Backend contract

Contract được xem là đóng băng sau khi test Backend chứng minh:

- Ownership Candidate và Employer được kiểm tra ở mọi endpoint.
- Một Submission chỉ có một Verification.
- Thời lượng chỉ nhận 15, 30, 60, 120 giây.
- AI chỉ tạo một bộ 1–3 câu hỏi hợp lệ và fail-closed khi lỗi.
- Question ID và object key giả không vượt qua validation.
- Câu trả lời và trạng thái được hoàn tất nguyên tử.
- Request lặp hoặc đồng thời không tạo dữ liệu hay scan job trùng.
- Chỉ video được ClamAV xác nhận sạch mới chuyển `Ready`.
- Employer chưa unlock hoặc công ty khác không nhận bằng chứng chi tiết.
- API summary trước unlock không làm lộ danh tính, video hoặc nội dung trả lời.

Test deterministic phải chạy trong CI mà không gọi Gemini thật. Kiểm thử Gemini thật chỉ chạy khi chủ động bật biến môi trường dành cho live test để tránh tiêu quota ngoài ý muốn.

Sau khi các điều kiện trên đạt, Frontend phải sử dụng nguyên trạng status, field và error code trong tài liệu này. Mọi thay đổi tiếp theo là thay đổi API có chủ đích.

---

## 18. Điều kiện hoàn thành Bước 1

Bước 1 được xem là hoàn thành khi đội phát triển thống nhất:

1. Một Verification hiệu lực cho mỗi Submission.
2. Bốn thời lượng hợp lệ: 15, 30, 60, 120 giây.
3. Camera được duy trì qua phần nói và phần trả lời.
4. AI tạo đúng một bộ 1–3 câu hỏi từ Challenge và rubric.
5. Candidate phải tự gõ; Frontend chặn các thao tác đã quy định.
6. Video và câu trả lời chỉ hoàn tất sau validation và scan an toàn.
7. Employer chỉ nhận bằng chứng đầy đủ sau khi đúng công ty đã unlock.
8. Dashboard chỉ hiển thị tín hiệu, không kết luận gian lận.
9. Màn hình chỉ cảm ơn hoàn tất khi Verification ở trạng thái `Ready`.
10. Không cài dependency mới cho Camera, Gemini, biểu đồ hoặc state management.
