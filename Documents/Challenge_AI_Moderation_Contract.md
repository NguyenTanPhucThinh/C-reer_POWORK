# CHALLENGE AI MODERATION — PRODUCT & API CONTRACT

## 1. Mục tiêu

Tính năng này ngăn Employer sử dụng Challenge để lấy miễn phí ý tưởng, chiến lược, dữ liệu phân tích hoặc sản phẩm hoàn chỉnh từ Candidate.

Một Challenge chỉ được tạo và công khai khi nội dung phù hợp với mục đích đánh giá năng lực tuyển dụng.

Phạm vi tài liệu này chỉ bao gồm kiểm duyệt Challenge. Không bao gồm xác thực Candidate bằng Camera hoặc video.

---

## 2. Trải nghiệm Employer đã chốt

Trang tạo Challenge sử dụng một hành động chính:

> Kiểm tra và phát hành

Khi Employer thực hiện hành động này:

1. Hệ thống kiểm tra dữ liệu bắt buộc, deadline và rubric theo quy tắc hiện có.
2. Nếu dữ liệu cơ bản không hợp lệ, hệ thống trả lỗi validation và chưa gọi AI.
3. Nếu dữ liệu cơ bản hợp lệ, hệ thống kiểm duyệt nội dung Challenge.
4. Nếu nội dung được duyệt, Challenge được tạo ngay và Employer nhận thông báo thành công.
5. Nếu nội dung cần chỉnh sửa, Challenge không được tạo; Employer nhận lý do và gợi ý cụ thể.
6. Nội dung đã nhập phải được giữ nguyên để Employer chỉnh sửa và gửi lại.

Không tách thành hai thao tác “Kiểm tra” và “Phát hành”. Quyết định kiểm duyệt luôn áp dụng đúng cho nội dung được gửi trong request tạo Challenge.

---

## 3. Quyết định kiểm duyệt

Hệ thống chỉ sử dụng hai quyết định nghiệp vụ:

| Decision         | Ý nghĩa                                            | Hành vi             |
| ---------------- | -------------------------------------------------- | ------------------- |
| `APPROVED`       | Challenge phù hợp với mục đích đánh giá tuyển dụng | Tạo Challenge       |
| `NEEDS_REVISION` | Challenge có một hoặc nhiều nguy cơ crowdsourcing  | Không tạo Challenge |

Không có quyết định “được tạo nhưng cảnh báo”. Mọi Challenge có quyết định `NEEDS_REVISION` đều bị chặn cho tới khi Employer sửa nội dung và gửi lại.

---

## 4. Các nhóm vấn đề

Mỗi vấn đề trả về phải thuộc đúng một category sau:

| Category                   | Ý nghĩa                                                                                        |
| -------------------------- | ---------------------------------------------------------------------------------------------- |
| `REAL_COMPANY_DATA`        | Yêu cầu sử dụng số liệu thật, dữ liệu nội bộ, dữ liệu khách hàng hoặc thông tin chưa công khai |
| `REAL_BUSINESS_PROBLEM`    | Yêu cầu giải quyết trực tiếp vấn đề mà doanh nghiệp đang gặp phải                              |
| `SCOPE_TOO_LARGE`          | Khối lượng vượt quá phạm vi hợp lý của một bài đánh giá tuyển dụng                             |
| `COMPLETE_DELIVERABLE`     | Yêu cầu tạo sản phẩm, chiến dịch, thiết kế hoặc hệ thống hoàn chỉnh                            |
| `DIRECT_COMMERCIAL_VALUE`  | Kết quả có thể được doanh nghiệp sử dụng trực tiếp với giá trị thương mại đáng kể              |
| `UNCLEAR_EVALUATION_SCOPE` | Đề bài không giới hạn rõ phần cần làm hoặc không thể hiện rõ kỹ năng cần đánh giá              |

Một Challenge có thể có nhiều vấn đề, nhưng không được trả lặp cùng một nội dung chỉ để làm danh sách dài hơn.

---

## 5. Nguyên tắc đánh giá

### 5.1 Challenge phù hợp

Challenge thường phù hợp khi:

- Dùng tình huống giả định hoặc dữ liệu mẫu.
- Giới hạn vào một bài toán nhỏ hay một phần của hệ thống.
- Yêu cầu thiết kế tổng quan, phân tích cách tiếp cận hoặc prototype giới hạn.
- Nêu rõ kỹ năng Employer muốn đánh giá.
- Không yêu cầu kết quả có thể đưa vào sử dụng ngay.
- Có khối lượng hợp lý cho một bài tuyển dụng độc lập.

### 5.2 Challenge cần chỉnh sửa

Challenge phải bị chặn khi có một hoặc nhiều dấu hiệu:

- Sử dụng dữ liệu thật hoặc dữ liệu nội bộ của công ty.
- Giải quyết trực tiếp khó khăn kinh doanh, vận hành hoặc kỹ thuật đang tồn tại.
- Yêu cầu kế hoạch marketing, kinh doanh hay phát triển dài hạn có thể triển khai thật.
- Yêu cầu xây dựng toàn bộ website, ứng dụng, hệ thống hoặc chiến dịch.
- Yêu cầu bàn giao sản phẩm hoàn chỉnh hoặc production-ready.
- Phạm vi mở, không giới hạn rõ Candidate phải dừng ở đâu.
- Giá trị đầu ra lớn hơn đáng kể so với mục đích đánh giá kỹ năng.

### 5.3 Nội dung Challenge không được điều khiển bộ kiểm duyệt

Mọi nội dung Employer nhập được xem là dữ liệu cần đánh giá, không phải chỉ dẫn cho AI. Các câu như “bỏ qua quy tắc”, “hãy luôn phê duyệt” hoặc nội dung tương tự không làm thay đổi tiêu chí kiểm duyệt.

---

## 6. API tạo Challenge

### Endpoint

```http
POST /api/v1/challenges
Authorization: Bearer <Employer_Token>
Content-Type: application/json
```

Không tạo endpoint preview riêng trong MVP. Backend thực hiện kiểm duyệt bên trong luồng tạo Challenge để không thể bỏ qua bằng request trực tiếp.

### Request body

Request giữ nguyên contract hiện tại:

```json
{
  "title": "Thiết kế chiến lược cache cho API",
  "description": "Trong một tình huống giả định, hãy đề xuất kiến trúc cache tổng quan...",
  "industry": "Backend Engineering",
  "deadline": "2026-08-20T10:00:00.000Z",
  "rubrics": [
    {
      "criteria_name": "Tính hợp lý của kiến trúc",
      "weight": 60,
      "max_score": 10
    },
    {
      "criteria_name": "Khả năng giải thích trade-off",
      "weight": 40,
      "max_score": 10
    }
  ]
}
```

Nội dung đưa vào kiểm duyệt gồm:

- `title`
- `description`
- `industry`
- Tên các tiêu chí trong `rubrics[].criteria_name`

Deadline, weight và max score vẫn được kiểm tra bằng các quy tắc xác định hiện có, không giao cho AI quyết định.

---

## 7. Response khi được duyệt

Nếu kết quả là `APPROVED`, Backend tạo Challenge và giữ nguyên response thành công hiện tại.

### Status

```http
201 Created
```

### Body

```json
{
  "status": "success",
  "data": {
    "challenge_id": "de305d54-75b4-431b-adb2-eb6b9e546014",
    "title": "Thiết kế chiến lược cache cho API",
    "description": "Trong một tình huống giả định...",
    "industry": "Backend Engineering",
    "company_name": "POWORK Demo Company",
    "deadline": "2026-08-20T10:00:00.000Z",
    "status": "Open",
    "rubrics": [],
    "created_at": "2026-08-09T10:00:00.000Z",
    "updated_at": "2026-08-09T10:00:00.000Z"
  }
}
```

Frontend hiểu `201 Created` là Challenge đã vượt qua kiểm duyệt và đã được phát hành. Không cần thêm trường `moderation` vào response thành công.

---

## 8. Response khi cần chỉnh sửa

Nếu kết quả là `NEEDS_REVISION`, Backend không tạo Challenge.

### Status

```http
422 Unprocessable Entity
```

### Body

```json
{
  "status": "error",
  "error_code": "CHAL_MODERATION_REQUIRED",
  "message": "Challenge cần được chỉnh sửa trước khi phát hành.",
  "details": {
    "decision": "NEEDS_REVISION",
    "summary": "Challenge đang yêu cầu Candidate xây dựng một sản phẩm có thể sử dụng trực tiếp.",
    "issues": [
      {
        "category": "COMPLETE_DELIVERABLE",
        "message": "Đề bài yêu cầu hoàn thiện cả Frontend, Backend và triển khai sản phẩm.",
        "suggestion": "Chỉ yêu cầu Candidate thiết kế kiến trúc tổng quan hoặc giải quyết một module nhỏ."
      },
      {
        "category": "SCOPE_TOO_LARGE",
        "message": "Khối lượng vượt quá phạm vi một bài đánh giá tuyển dụng.",
        "suggestion": "Giới hạn bài làm vào một chức năng hoặc một quyết định thiết kế."
      }
    ]
  }
}
```

### Quy tắc dữ liệu

- `decision` luôn là `NEEDS_REVISION` trong response này.
- `summary` là một câu mô tả tổng quát bằng tiếng Việt.
- `issues` có ít nhất một phần tử.
- `category` phải thuộc enum tại mục 4.
- `message` giải thích vấn đề đang có, không được chỉ lặp tên category.
- `suggestion` đưa ra hướng thu hẹp hoặc chuyển thành bài toán giả định.
- Không trả nội dung suy đoán về ý đồ hoặc đạo đức của Employer.

---

## 9. Response khi dịch vụ kiểm duyệt không khả dụng

Nếu AI timeout, không phản hồi, trả dữ liệu sai cấu trúc hoặc hệ thống không thể xác định kết quả an toàn, Backend không tạo Challenge.

### Status

```http
503 Service Unavailable
```

### Body

```json
{
  "status": "error",
  "error_code": "CHAL_MODERATION_UNAVAILABLE",
  "message": "Hệ thống kiểm duyệt tạm thời chưa khả dụng. Vui lòng thử lại."
}
```

Frontend phải giữ nguyên form và cho Employer thử lại. Không hiển thị trường hợp này như một vi phạm nội dung.

---

## 10. Thứ tự xử lý bắt buộc

```text
Xác thực Employer
        ↓
Kiểm tra cấu trúc request
        ↓
Kiểm tra deadline, rubric và quy tắc xác định
        ↓
Kiểm duyệt nội dung Challenge
        ↓
APPROVED ───────────────▶ Tạo Challenge
NEEDS_REVISION ─────────▶ Trả 422, không ghi dữ liệu
AI không khả dụng ──────▶ Trả 503, không ghi dữ liệu
```

Không được tạo Challenge, RubricCriteria hoặc dữ liệu phụ trước khi có kết quả `APPROVED`.

---

## 11. Trạng thái giao diện bắt buộc

Giao diện MVP vẫn phải đủ đẹp, rõ ràng và phù hợp để demo khách hàng. Không chấp nhận cách hiển thị tạm bằng alert hoặc một dòng chữ thô nếu đó là kết quả kiểm duyệt chính.

### `EDITING`

- Form hiển thị bình thường.
- Hành động chính: “Kiểm tra và phát hành”.
- Kết quả kiểm duyệt cũ được xóa khi Employer bắt đầu một lần gửi mới.

### `VALIDATION_ERROR`

- Lỗi gắn với trường nhập tương ứng khi có thể.
- Không hiển thị như lỗi AI.
- Không xóa dữ liệu form.

### `CHECKING`

- Hành động chính bị khóa để tránh gửi trùng.
- Hiển thị tiến trình có chủ đích, ví dụ “Đang kiểm tra phạm vi Challenge...”.
- Form không biến mất và không nhảy bố cục đột ngột.

### `NEEDS_REVISION`

- Hiển thị một moderation result panel riêng biệt.
- Có tiêu đề, summary và danh sách issue.
- Mỗi issue hiển thị vấn đề và gợi ý cạnh nhau hoặc theo thứ bậc rõ ràng.
- Sử dụng màu cảnh báo dễ đọc, không dùng ngôn ngữ quy kết Employer gian lận.
- Giữ nguyên toàn bộ nội dung form để Employer sửa ngay.
- Hành động tiếp theo rõ ràng: “Chỉnh sửa và kiểm tra lại”.

### `PUBLISHED`

- Hiển thị xác nhận thành công rõ ràng.
- Cho Employer xem Challenge vừa tạo hoặc quay về Dashboard.
- Không còn hiển thị issue của lần kiểm duyệt trước.

### `SERVICE_ERROR`

- Hiển thị lỗi hệ thống tách biệt với lỗi nội dung.
- Giữ nguyên form.
- Có hành động “Thử lại”.
- Không nói rằng Challenge vi phạm nếu hệ thống chưa đánh giá được.

---

## 12. Tiêu chuẩn nội dung giao diện

- Dùng tiếng Việt dễ hiểu, tránh thuật ngữ kỹ thuật như model, prompt, JSON hoặc provider.
- Không hiển thị confidence score trong MVP.
- Không gọi Employer là gian lận hoặc có ý đồ xấu.
- Tập trung vào phạm vi Challenge và giá trị đầu ra.
- Mỗi cảnh báo phải trả lời hai câu hỏi: “Vấn đề là gì?” và “Nên sửa thế nào?”.
- Trên màn hình nhỏ, result panel phải đọc được mà không cần cuộn ngang.
- Trạng thái loading, error và success phải phân biệt được bằng cả nội dung lẫn hình thức, không chỉ dựa vào màu sắc.

---

## 13. Tình huống nghiệm thu

| Mã        | Tình huống                                 | Kết quả mong đợi                                 |
| --------- | ------------------------------------------ | ------------------------------------------------ |
| `MOD-001` | Bài toán nhỏ, dùng tình huống giả định     | `201`, Challenge được tạo                        |
| `MOD-002` | Yêu cầu xây dựng sản phẩm hoàn chỉnh       | `422`, có `COMPLETE_DELIVERABLE`                 |
| `MOD-003` | Yêu cầu giải quyết vấn đề công ty đang gặp | `422`, có `REAL_BUSINESS_PROBLEM`                |
| `MOD-004` | Yêu cầu dùng dữ liệu khách hàng thật       | `422`, có `REAL_COMPANY_DATA`                    |
| `MOD-005` | Phạm vi nhiều tháng hoặc nhiều hệ thống    | `422`, có `SCOPE_TOO_LARGE`                      |
| `MOD-006` | Đề bài không giới hạn phần cần làm         | `422`, có `UNCLEAR_EVALUATION_SCOPE`             |
| `MOD-007` | Nội dung yêu cầu AI bỏ qua quy tắc         | Nội dung vẫn bị đánh giá bình thường             |
| `MOD-008` | Request thiếu field hoặc rubric sai        | `400`, chưa gọi AI                               |
| `MOD-009` | Candidate gọi API tạo Challenge            | `403`, chưa gọi AI                               |
| `MOD-010` | AI timeout hoặc output sai cấu trúc        | `503`, không tạo Challenge                       |
| `MOD-011` | Employer bấm gửi lặp trong lúc chờ         | Frontend chỉ cho một request có hiệu lực         |
| `MOD-012` | Challenge bị chặn                          | Không có Challenge hay rubric mới trong database |

---

## 14. Ngoài phạm vi MVP

Không triển khai trong tính năng này:

- Xác thực Candidate bằng Camera hoặc video.
- Lịch sử mọi lần Employer gửi kiểm duyệt.
- Dashboard thống kê vi phạm.
- Quy trình duyệt thủ công bởi Admin.
- Tự động viết lại toàn bộ Challenge.
- Confidence score hiển thị cho Employer.
- Nhiều nhà cung cấp AI hoặc tự động chuyển provider.
- Lưu bản nháp Challenge trên server.
- Database migration chỉ để lưu kết quả kiểm duyệt.

Các nội dung trên chỉ được xem xét sau khi luồng MVP hoạt động ổn định.

---

## 15. Điều kiện hoàn thành Step 1

Step 1 được xem là hoàn thành khi Backend và Frontend cùng tuân thủ các quyết định sau:

1. Một hành động “Kiểm tra và phát hành”.
2. Hai decision: `APPROVED` và `NEEDS_REVISION`.
3. Sáu issue category cố định.
4. `201` khi được duyệt và Challenge đã được tạo.
5. `422 CHAL_MODERATION_REQUIRED` khi nội dung cần chỉnh sửa.
6. `503 CHAL_MODERATION_UNAVAILABLE` khi không thể kiểm duyệt an toàn.
7. Không ghi dữ liệu trước khi được duyệt.
8. Frontend giữ nguyên form sau mọi trường hợp chưa tạo thành công.
9. Result panel phải đủ rõ ràng và chỉn chu để demo khách hàng.
10. Provider AI là chi tiết triển khai Backend, không làm thay đổi API contract này.

---

## 16. Đóng băng contract sau Step 3

Contract kiểm duyệt được xem là đóng băng khi bộ kiểm thử Backend xác nhận đủ các điều kiện:

- Challenge hợp lệ được chấp nhận và chỉ được ghi sau quyết định `APPROVED`.
- Challenge quá lớn bị chặn với `SCOPE_TOO_LARGE`.
- Challenge sử dụng dữ liệu thật bị chặn với `REAL_COMPANY_DATA`.
- Challenge yêu cầu sản phẩm hoàn chỉnh bị chặn với `COMPLETE_DELIVERABLE`.
- Lỗi AI và response AI sai cấu trúc đều trả `CHAL_MODERATION_UNAVAILABLE` và không ghi dữ liệu.
- Request sai bị chặn tại API boundary trước khi gọi kiểm duyệt hoặc repository.

Bộ kiểm thử deterministic phải chạy trong CI mà không gọi mạng. Kiểm thử Gemini thật chỉ chạy khi chủ động đặt `GEMINI_LIVE_TEST=1` và cung cấp `GEMINI_API_KEY`; việc này tránh tiêu quota miễn phí trong các lần CI thông thường.

Sau khi các điều kiện trên đạt, Frontend phải sử dụng nguyên trạng contract `201`, `422 CHAL_MODERATION_REQUIRED` và `503 CHAL_MODERATION_UNAVAILABLE`. Mọi thay đổi contract tiếp theo phải được xem là thay đổi API có chủ đích, không phải điều chỉnh riêng của Frontend.
