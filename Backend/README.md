# POWORK Backend — Hướng dẫn Setup & Giải thích Codebase

> **Stack:** Node.js + Express + Prisma ORM + PostgreSQL  
> **Sprint 0 — Backend Core Engineer: Trương Minh Quang**

---

## Mục lục

1. [Tổng quan cấu trúc thư mục](#1-tổng-quan-cấu-trúc-thư-mục)
2. [Giải thích từng file làm gì](#2-giải-thích-từng-file-làm-gì)
3. [Setup môi trường với Docker (bắt buộc — chạy được trên cả Mac và Windows)](#3-setup-môi-trường-với-docker)
4. [Chạy project lần đầu](#4-chạy-project-lần-đầu)
5. [Danh sách Mock API cho FE test](#5-danh-sách-mock-api-cho-fe-test)
6. [Kiến trúc Blind Audition — tại sao DB lại thiết kế như vậy](#6-kiến-trúc-blind-audition)
7. [Coding Convention cho cả team](#7-coding-convention)

---

## 1. Tổng quan cấu trúc thư mục

```
powork-backend/
│
├── prisma/
│   └── schema.prisma                    ← Toàn bộ cấu trúc Database (4 module)
│
├── src/
│   ├── iam/                             ← IAM Module (Định danh & Phân quyền)
│   │   ├── controllers/
│   │   │   └── auth.controller.js       ← login, register, getMe
│   │   ├── routes/
│   │   │   └── auth.routes.js           ← /api/v1/auth
│   │   ├── services/
│   │   ├── repositories/
│   │   └── models/
│   │
│   ├── challenge/                       ← Challenge Module (Thử thách & Rubric)
│   │   ├── controllers/
│   │   │   └── challenge.controller.js  ← CRUD challenge
│   │   ├── routes/
│   │   │   └── challenge.routes.js      ← /api/v1/challenges
│   │   ├── services/
│   │   ├── repositories/
│   │   └── models/
│   │
│   ├── assessment/                      ← Assessment Module (Trái tim Blind Audition)
│   │   ├── controllers/
│   │   │   └── submission.controller.js ← nộp bài, chấm điểm, unlock
│   │   ├── routes/
│   │   │   └── submission.routes.js     ← /api/v1/assessment
│   │   ├── services/
│   │   ├── repositories/
│   │   └── models/
│   │
│   ├── profile/                         ← Profile Module (Hồ sơ năng lực động)
│   │   ├── controllers/
│   │   │   └── profile.controller.js    ← Dynamic Profile công khai
│   │   ├── routes/
│   │   │   └── profile.routes.js        ← /api/v1/profiles
│   │   ├── services/
│   │   ├── repositories/
│   │   └── models/
│   │
│   ├── talent-pool/                     ← Talent Pool Module (Lưu trữ ứng viên)
│   │   ├── controllers/
│   │   │   └── talent-pool.controller.js ← addToTalentPool, getTalentPool
│   │   ├── routes/
│   │   │   └── talent-pool.routes.js     ← /api/v1/talent-pool
│   │   ├── services/
│   │   ├── repositories/
│   │   └── models/
│   │
│   ├── shared/                          ← Code dùng chung — KHÔNG chứa logic nghiệp vụ
│   │   ├── config/
│   │   │   ├── index.js                 ← Biến cấu hình toàn app
│   │   │   └── prisma.js                ← Kết nối Database (singleton)
│   │   ├── middlewares/
│   │   │   ├── auth.middleware.js       ← JWT auth + Blind Audition Guard
│   │   │   └── error.middleware.js      ← Bắt lỗi tập trung
│   │   └── utils/
│   │       ├── AppError.js              ← Custom error có error_code
│   │       ├── hashId.js                ← Sinh mã ẩn danh Candidate_XXXX
│   │       └── response.js              ← Chuẩn hóa JSON response
│   │
│   ├── app.js                           ← Cấu hình Express (gắn middleware, route)
│   └── server.js                        ← Điểm khởi động server
│
├── .env.example
├── docker-compose.yml
├── package.json
├── .prettierrc
└── eslint.config.js
```

> **Quy tắc DDD (Coding Convention mục 1):** Mỗi module chỉ được query DB và Repository của chính nó.  
> Module giao tiếp với nhau qua Internal Service Interface hoặc Event-driven — KHÔNG query chéo.  
> **Sprint tiếp theo sẽ bổ sung:** `services/`, `repositories/`, `models/` bên trong từng domain. `services/`, `repositories/`, `models/`  
> Sprint 0 đã có đủ `controllers/` — toàn bộ logic hiện dùng Mock Data, chờ kết nối DB thật.

---

## 2. Giải thích từng file làm gì

### `prisma/schema.prisma` — Trái tim của Database

File này định nghĩa **toàn bộ bảng và quan hệ** trong PostgreSQL theo đúng 4 module của ERD. Prisma đọc file này để:

- Tạo bảng thật trong DB khi chạy `prisma migrate`
- Tự sinh JS code để query DB an toàn, có autocomplete

Các module trong schema: **IAM** (`users`, `companies`) → **Challenge** (`challenges`, `rubric_criteria`) → **Assessment** (`identity_mappings`, `submissions`, `evaluation_results`) → **Profile** (`verified_evidences`).

**Tại sao DB được thiết kế tách biệt như vậy?** → Xem [Mục 6](#6-kiến-trúc-blind-audition)

---

### `src/config/index.js` — Biến cấu hình trung tâm

```js
// Thay vì rải rác khắp nơi:
const port = process.env.PORT || 3000

// Tập trung vào 1 chỗ:
import { config } from './config/index.js'
config.port
```

Lý do: Khi TL muốn đổi tên biến môi trường, chỉ sửa 1 file này, không phải đi tìm khắp codebase.

---

### `src/config/prisma.js` — Kết nối Database (Singleton)

```js
// Vấn đề: Nodemon hot-reload liên tục tạo kết nối DB mới → tràn connection pool
// Giải pháp: Singleton — chỉ tạo 1 lần duy nhất, lần sau dùng lại
const prisma = globalForPrisma.prisma ?? new PrismaClient(...)
```

File này export ra object `prisma` dùng để query DB. Mọi file khác muốn truy vấn DB đều `import prisma from './config/prisma.js'`.

---

### `src/{domain}/controllers/*.controller.js` — Điều phối viên

Theo DDD, mỗi controller nằm trong thư mục của domain mình: `iam/controllers/`, `challenge/controllers/`... Nhiệm vụ duy nhất:

1. Đọc dữ liệu từ `req` (body, params, query, user)
2. Gọi service xử lý (Sprint 1 — hiện tại dùng mock)
3. Trả response chuẩn qua `sendSuccess` / `sendCreated`

Controller **không được** tự query DB, không chứa logic nghiệp vụ, không query sang DB của module khác. Mỗi dòng `// TODO Sprint 1` là điểm sẽ thay bằng `ServiceName.method()` khi kết nối DB thật.

### `src/shared/` — Code dùng chung

Theo Coding Convention mục 1: `shared/` chỉ chứa code không thuộc về bất kỳ domain nào — JWT middleware, error handler, utils. **Không được** đặt logic nghiệp vụ vào đây.

---

### `src/middlewares/auth.middleware.js` — 3 middleware quan trọng

File này có **3 hàm**, mỗi hàm là 1 "trạm kiểm soát" Express gắn vào route:

**① `authenticate`** — Kiểm tra token JWT hợp lệ không

```
Request đến → Có header "Authorization: Bearer <token>"? → Hợp lệ? → Cho qua
                                                          → Không?  → Trả 401
```

**② `authorize(...roles)`** — Kiểm tra đúng vai trò không

```js
// Ví dụ dùng:
router.post('/challenges', authenticate, authorize('EMPLOYER'), createChallenge)
//                                       ↑ Chỉ Employer mới tạo được Challenge
```

**③ `blindAuditionGuard`** — **Middleware cốt lõi của Blind Audition**

```
Request nộp bài đến → Tự động XÓA user_id/candidate_id khỏi body và query
                    → Đảm bảo controller KHÔNG BAO GIỜ nhận được user_id từ FE
```

Đây là thứ giám khảo sẽ hỏi trực tiếp khi demo.

---

### `src/middlewares/error.middleware.js` — Bắt lỗi tập trung

Thay vì mỗi route tự `try/catch`, toàn bộ lỗi bị đẩy về đây xử lý một chỗ. Nhận biết được:

- `AppError` → lỗi do dev tự throw (`Challenge not found`, `Forbidden`...)
- Prisma `P2025` → record không tồn tại → tự trả 404
- Prisma `P2002` → trùng unique field → tự trả 409
- Zod error → validate thất bại → trả 422 kèm danh sách field lỗi

---

### `src/routes/*.routes.js` — Định tuyến request

Routes chỉ làm 2 việc: khai báo method + URL, và gắn đúng chuỗi middleware trước khi vào controller. Không chứa logic gì khác.

```js
// Ví dụ: submission.routes.js
router.post(
  '/submissions',
  authenticate,
  authorize('CANDIDATE'),
  blindAuditionGuard,
  submitSolution,
)
//                          ↑ xác thực    ↑ kiểm role             ↑ chặn user_id      ↑ controller
```

---

### `src/utils/AppError.js` — Class lỗi tùy chỉnh

```js
// Cách dùng trong bất kỳ file nào:
throw new AppError('Challenge not found', 404)
throw new AppError('Forbidden', 403)
// Error middleware sẽ tự bắt và trả JSON chuẩn cho FE
```

---

### `src/utils/hashId.js` — Sinh mã ẩn danh

```js
generateHashId(user_id, challenge_id)
// → "Candidate_3941"
```

Dùng SHA-256 để hash `user_id + challenge_id + JWT_SECRET`. Kết quả **không thể reverse** — nhà tuyển dụng thấy `Candidate_3941` nhưng không thể tính ngược ra `user_id` là ai. Cùng 1 cặp input luôn cho ra cùng 1 hash_id.

---

### `src/utils/response.js` — Chuẩn hóa JSON response

```js
// Mọi API response đều có format thống nhất theo API Contracts:
{ "status": "success", "data": { ... } }
{ "status": "success", "message": "...", "data": { ... } }  // khi có message
{ "status": "error", "message": "..." }                     // lỗi
```

---

### `src/app.js` — Cấu hình Express

File này **KHÔNG chứa logic nghiệp vụ**, chỉ làm 3 việc:

1. Gắn các middleware bảo mật (helmet, cors, morgan)
2. Đăng ký các router vào đúng prefix theo Module Routing Table:
   - `/api/v1/auth` → IAM Module
   - `/api/v1/challenges` → Challenge Module
   - `/api/v1/assessment` → Assessment Module
   - `/api/v1/profiles` → Profile Module
3. Gắn error handler ở cuối cùng

---

### `src/server.js` — Điểm khởi động

File duy nhất được chạy trực tiếp (`node src/server.js`). Nhiệm vụ:

1. Load biến môi trường từ `.env`
2. Thử kết nối DB (nếu không có thì chạy Mock mode vẫn được)
3. Lắng nghe port

---

## 3. Setup môi trường với Docker

> **Bắt buộc dùng Docker để chạy PostgreSQL** — đảm bảo 5 máy (kể cả Mac) chạy DB y hệt nhau, không ai bị lỗi version hay config khác nhau.

### Bước 1 — Cài Docker Desktop

| Hệ điều hành                             | Link tải                                        |
| ---------------------------------------- | ----------------------------------------------- |
| **Mac (Intel & Apple Silicon M1/M2/M3)** | https://www.docker.com/products/docker-desktop/ |
| **Windows**                              | https://www.docker.com/products/docker-desktop/ |
| **Linux**                                | `sudo apt install docker.io docker-compose`     |

Sau khi cài xong, mở terminal kiểm tra:

```bash
docker --version
# Docker version 24.x.x

docker compose version
# Docker Compose version v2.x.x
```

---

### Bước 2 — File `docker-compose.yml`

File này đã có sẵn trong project. Nó làm đúng 1 việc: **khởi động PostgreSQL trong container**.

```yaml
# docker-compose.yml — Giải thích từng dòng

services:
  postgres:
    image: postgres:16-alpine # Dùng PostgreSQL v16, bản alpine cho nhẹ
    container_name: powork_db # Tên container (dùng để nhận biết)
    restart: unless-stopped # Tự khởi động lại nếu crash, trừ khi tắt thủ công
    ports:
      - '5432:5432' # Mở cổng 5432 ra ngoài để app Node kết nối
    environment:
      POSTGRES_USER: powork_user # Username DB
      POSTGRES_PASSWORD: powork_pass # Password DB
      POSTGRES_DB: powork_db # Tên database
    volumes:
      - postgres_data:/var/lib/postgresql/data # Lưu data ra ngoài container
        # → Tắt container data vẫn còn
    healthcheck:
      test: ['CMD-SHELL', 'pg_isready -U powork_user -d powork_db']
      interval: 5s
      timeout: 5s
      retries: 5 # Tự kiểm tra DB đã sẵn sàng chưa trước khi app kết nối

volumes:
  postgres_data: # Docker tự quản lý volume này
```

---

### Bước 3 — Khởi động

```bash
# Khởi động PostgreSQL (lần đầu sẽ tải image ~80MB)
docker compose up -d

# -d = detached mode: chạy nền, không chiếm terminal
```

Kiểm tra đã chạy chưa:

```bash
docker compose ps
# NAME          STATUS
# powork_db     Up 3 seconds (healthy)
```

---

### Các lệnh Docker hay dùng hàng ngày

```bash
# Khởi động DB (mỗi sáng trước khi code)
docker compose up -d

# Tắt DB (khi xong việc)
docker compose down

# Xem log DB nếu có lỗi
docker compose logs postgres

# Xóa hoàn toàn data DB (reset sạch khi muốn migrate lại từ đầu)
docker compose down -v

# Truy cập trực tiếp vào PostgreSQL (để debug)
docker exec -it powork_db psql -U powork_user -d powork_db
```

---

## 4. Chạy project lần đầu

Làm theo đúng thứ tự này:

### Bước 1 — Clone và cài thư viện

```bash
git clone <repo-url>
cd powork-backend
npm install
```

### Bước 2 — Tạo file `.env`

```bash
cp .env.example .env
```

Nội dung `.env` (giữ nguyên nếu dùng Docker):

```env
NODE_ENV=development
PORT=3000
DATABASE_URL="postgresql://powork_user:powork_pass@localhost:5432/powork_db"
JWT_SECRET=powork_super_secret_dev_2026
JWT_EXPIRES_IN=7d
```

### Bước 3 — Khởi động PostgreSQL bằng Docker

```bash
docker compose up -d
# Đợi ~5 giây cho DB khởi động xong
```

### Bước 4 — Chạy Prisma Migration (tạo bảng trong DB)

```bash
# Sinh Prisma Client từ schema
npx prisma generate

# Tạo bảng trong DB (chạy 1 lần duy nhất, hoặc khi schema thay đổi)
npx prisma migrate dev --name init
```

### Bước 5 — Khởi động server

```bash
npm run dev
# 🚀 POWORK Backend running on http://localhost:3000
```

### Kiểm tra nhanh

```bash
curl http://localhost:3000/health
# {"status":"ok","service":"powork-backend"}
```

---

### ⚠️ Lưu ý riêng cho Mac (Apple Silicon M1/M2/M3)

Không cần cài thêm gì đặc biệt. Docker Desktop bản mới đã hỗ trợ Apple Silicon native. Chỉ cần đảm bảo Docker Desktop đang **chạy** (thấy icon Docker trên thanh menu bar) trước khi chạy `docker compose up`.

Nếu gặp lỗi `port 5432 already in use` → Mac đã cài PostgreSQL sẵn, tắt nó đi:

```bash
brew services stop postgresql
# Sau đó chạy lại docker compose up -d
```

---

## 5. Danh sách Mock API cho FE test

> Tất cả endpoint dưới đây đều trả **Mock Data** (dữ liệu cứng), không cần DB thật.  
> FE (Khoa) có thể gọi ngay sau khi `npm run dev` chạy thành công.  
> **Tất cả field trong request/response dùng `snake_case`.**

| Module      | Prefix                |
| ----------- | --------------------- |
| IAM         | `/api/v1/auth`        |
| Challenge   | `/api/v1/challenges`  |
| Assessment  | `/api/v1/assessment`  |
| Profile     | `/api/v1/profiles`    |
| Talent Pool | `/api/v1/talent-pool` |

---

### IAM Module — `/api/v1/auth`

| Method | Endpoint                | Body                                                | Mô tả                                                                          |
| ------ | ----------------------- | --------------------------------------------------- | ------------------------------------------------------------------------------ |
| POST   | `/api/v1/auth/register` | `{email, password, role, full_name, company_name?}` | Đăng ký (`role`: `"Candidate"` hoặc `"Employer"`; Employer cần `company_name`) |
| POST   | `/api/v1/auth/login`    | `{email, password}`                                 | Đăng nhập — trả về `access_token`                                              |
| GET    | `/api/v1/auth/me`       | —                                                   | Xem thông tin user hiện tại (cần Bearer token)                                 |

**Response mẫu — login:**

```json
{
  "status": "success",
  "data": {
    "access_token": "mock.jwt.token",
    "token_type": "Bearer",
    "user": { "user_id": "...", "full_name": "...", "role": "Candidate" }
  }
}
```

---

### Challenge Module — `/api/v1/challenges`

| Method | Endpoint                                  | Body / Query                                        | Mô tả                                        |
| ------ | ----------------------------------------- | --------------------------------------------------- | -------------------------------------------- |
| GET    | `/api/v1/challenges`                      | `?industry=Công nghệ thông tin`                     | Danh sách challenge đang mở, lọc theo ngành  |
| GET    | `/api/v1/challenges/:challenge_id`        | —                                                   | Chi tiết challenge + rubrics                 |
| POST   | `/api/v1/challenges`                      | `{title, description, industry, deadline, rubrics}` | Employer tạo challenge (cần Bearer)          |
| PATCH  | `/api/v1/challenges/:challenge_id/status` | `{status}`                                          | Đóng/lưu trữ challenge (cần Bearer Employer) |

**Lưu ý tạo challenge:** `rubrics` là array, tổng `weight` bắt buộc = 100:

```json
{
  "title": "...",
  "industry": "Công nghệ thông tin",
  "deadline": "2026-06-30T23:59:59Z",
  "rubrics": [
    { "criteria_name": "Kiến trúc mã nguồn", "weight": 40, "max_score": 10 },
    { "criteria_name": "Tối ưu bộ nhớ", "weight": 60, "max_score": 10 }
  ]
}
```

---

### Assessment Module — `/api/v1/assessment` (Luồng Blind Audition)

| Method | Endpoint                                                  | Body                             | Auth      | Mô tả                                  |
| ------ | --------------------------------------------------------- | -------------------------------- | --------- | -------------------------------------- |
| POST   | `/api/v1/assessment/submissions`                          | `{challenge_id, solution_url}`   | CANDIDATE | Nộp bài — server tự sinh `hash_id`     |
| GET    | `/api/v1/assessment/challenges/:challenge_id/submissions` | —                                | EMPLOYER  | Xem bài nộp **(chỉ thấy `hash_id`)**   |
| POST   | `/api/v1/assessment/submissions/:submission_id/evaluate`  | `{evaluations, general_comment}` | EMPLOYER  | Chấm điểm theo từng `criteria_id`      |
| POST   | `/api/v1/assessment/submissions/:submission_id/reject`    | —                                | EMPLOYER  | Từ chối bài nhưng vẫn giữ ẩn danh      |
| POST   | `/api/v1/assessment/submissions/:submission_id/unlock`    | `{action: "APPROVE"}`            | EMPLOYER  | **Duy nhất lúc này mới thấy tên thật** |

**Response mẫu — nộp bài** (không có `user_id`):

```json
{
  "status": "success",
  "data": {
    "submission_id": "f5e921dd-...",
    "hash_id": "Candidate_3941",
    "status": "Pending",
    "submitted_at": "2026-06-10T02:15:00Z"
  }
}
```

**Body evaluate:**

```json
{
  "evaluations": [{ "criteria_id": "aa152d43-...", "score": 8.5, "comment": "Tốt" }],
  "general_comment": "Bài làm xuất sắc"
}
```

**Response mẫu — unlock** (lần đầu tiên thấy tên thật):

```json
{
  "status": "success",
  "data": {
    "message": "Identity unlocked.",
    "unlocked_candidate_profile": {
      "user_id": "de305d54-...",
      "full_name": "Đoàn Tấn Phong",
      "email": "phong.dt@gmail.com"
    }
  }
}
```

---

### Profile Module — `/api/v1/profiles`

| Method | Endpoint                    | Mô tả                                                       |
| ------ | --------------------------- | ----------------------------------------------------------- |
| GET    | `/api/v1/profiles/:user_id` | Xem Dynamic Profile công khai của ứng viên (không cần auth) |

---

### Talent Pool Module — `/api/v1/talent-pool`

| Method | Endpoint              | Body        | Auth     | Mô tả                                          |
| ------ | --------------------- | ----------- | -------- | ---------------------------------------------- |
| POST   | `/api/v1/talent-pool` | `{user_id}` | EMPLOYER | Thêm ứng viên đã unlock vào danh sách theo dõi |
| GET    | `/api/v1/talent-pool` | —           | EMPLOYER | Xem danh sách ứng viên trong Talent Pool       |

**Response mẫu — GET /talent-pool:**

```json
{
  "status": "success",
  "data": [
    {
      "pool_id": "8b9e67a1-...",
      "candidate": {
        "user_id": "de305d54-...",
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

---

## 6. Kiến trúc Blind Audition

Đây là phần **quan trọng nhất** của codebase, giám khảo sẽ hỏi thẳng vào đây.

### Vấn đề cần giải quyết

Nếu thiết kế bình thường, bảng `submissions` sẽ có `user_id`. Khi Employer query danh sách bài nộp, JOIN sang bảng `users` là lộ ngay tên ứng viên. Không có cách nào ngăn được nếu thiết kế như vậy.

### Giải pháp: Cô lập ở tầng DB — 2 vùng tách biệt

```
┌──────────────────────────────────────────────────────────┐
│  IAM MODULE (Thông tin thật — hệ thống giữ kín)          │
│  ┌──────────┐       ┌─────────────┐                      │
│  │  users   │──────►│  companies  │                      │
│  │ user_id  │       │ company_id  │                      │
│  │ email    │       │ company_name│                      │
│  └──────────┘       └─────────────┘                      │
└──────────────────────────────┬───────────────────────────┘
                               │ user_id (chỉ system biết)
         ══════════════════════╪═══ RANH GIỚI CÔ LẬP ══════
                               │
┌──────────────────────────────▼───────────────────────────┐
│  ASSESSMENT MODULE (Luồng chấm điểm — Employer chỉ thấy) │
│                                                          │
│  ┌──────────────────────────┐  ← Bảng KÍN               │
│  │    identity_mappings     │    (system dùng nội bộ)    │
│  │  hash_id = "Candidate_   │                            │
│  │           3941"          │                            │
│  │  user_id  ← cất ở đây    │                            │
│  │  is_unlocked = false     │                            │
│  └────────────┬─────────────┘                            │
│               │ hash_id (cầu nối duy nhất)               │
│  ┌────────────▼─────────────┐  ← Bảng CÔNG KHAI          │
│  │       submissions        │    (Employer được xem)     │
│  │  submission_id           │                            │
│  │  hash_id = "Candidate_   │                            │
│  │           3941"          │                            │
│  │  solution_url            │                            │
│  │  status = Pending        │                            │
│  │  ← KHÔNG có user_id      │                            │
│  └────────────┬─────────────┘                            │
│               │                                          │
│  ┌────────────▼─────────────┐                            │
│  │    evaluation_results    │  ← KHÔNG có user_id        │
│  │  criteria_id             │                            │
│  │  score                   │                            │
│  └──────────────────────────┘                            │
└──────────────────────────────────────────────────────────┘

   Chỉ sau lệnh APPROVE → is_unlocked = true
   mới được JOIN identity_mappings để lấy user_id thật
```

### Luồng dữ liệu

```
1. Ứng viên nộp bài
   FE gửi: { challenge_id, solution_url } + JWT token
       │
       ▼
   blindAuditionGuard middleware: xóa user_id nếu FE cố gửi lên
       │
       ▼
   Server tự lấy user_id từ JWT
   Server sinh hash_id = SHA256(user_id + challenge_id + SECRET)
       │
       ▼
   2 INSERT song song:
   ┌─ identity_mappings: { hash_id, user_id, challenge_id, is_unlocked: false }
   └─ submissions:       { submission_id, hash_id, solution_url } ← sạch bóng user_id

2. Employer chấm điểm
   SELECT từ submissions WHERE challenge_id = :id
   → Chỉ thấy: { hash_id: "Candidate_3941", solution_url, status }
   → Không có cách nào biết "Candidate_3941" là ai

3. Employer gửi { action: "APPROVE" } → POST /unlock
   Server UPDATE identity_mappings SET is_unlocked = true
   Server đọc user_id từ identity_mappings → query IAM lấy thông tin thật
   → Lần đầu tiên Employer thấy: { full_name, email }
   → Profile Module nhận Event → ghi Snapshot vào verified_evidences
```

---

## 7. Coding Convention

> Theo chuẩn TL (Phong) ban hành. Mọi PR vi phạm sẽ bị reject khi review.

### Ngôn ngữ & Module

```js
// ✅ Dùng ES Modules
import express from 'express'
export default router

// ❌ Không dùng CommonJS
const express = require('express')
module.exports = router
```

### Naming — snake_case trong mọi request/response

```js
// ✅ snake_case theo API Contracts
{
  ;(challenge_id, solution_url, total_score, full_name)
}

// ❌ camelCase
{
  ;(challengeId, solutionUrl, totalScore, fullName)
}
```

### Async/Await

```js
// ✅ Dùng async/await
const challenge = await prisma.challenge.findUnique({ where: { id } })

// ❌ Không dùng .then().catch()
prisma.challenge.findUnique({ where: { id } }).then(c => ...).catch(e => ...)
```

### Xử lý lỗi — KHÔNG dùng try/catch trong route handler

```js
// ✅ Throw AppError, để error middleware bắt (nhờ express-async-errors)
import { AppError } from '../utils/AppError.js'
if (!challenge) throw new AppError('Challenge not found', 404)

// ❌ Không tự catch trong handler
try {
  ...
} catch (e) {
  res.status(500).json({ error: e.message })
}
```

### Response format — LUÔN dùng utils/response.js

```js
// ✅
import { sendSuccess, sendCreated } from '../utils/response.js'
return sendSuccess(res, data)
return sendCreated(res, newChallenge)

// ❌ Không tự viết JSON response
res.json({ data })
res.status(201).json({ status: 'success', data })
```

### Không hardcode giá trị

```js
// ✅
import { config } from '../../shared/config/index.js'
jwt.sign(payload, config.jwt.secret, { expiresIn: config.jwt.expiresIn })

// ❌
jwt.sign(payload, 'some_secret_123', { expiresIn: '7d' })
```

### Ranh giới module — KHÔNG query chéo

```js
// ✅ Assessment Module giao tiếp với Profile Module qua Event
emitEvent('Submission_Unlocked', { user_id, challenge_id, total_score })

// ❌ Assessment Module KHÔNG được query thẳng DB của Profile
await prisma.verifiedEvidence.create(...)  // ← sai nếu đây là code trong assessment/
```

### Git Workflow

```bash
# Nhánh chính
main      ← chỉ chứa code Production
develop   ← code đang phát triển

# Tên nhánh tính năng: loại/mô-tả-ngắn
feat/blind-audition
fix/login-crash
refactor/challenge-service
docs/readme-update

# Commit message (Conventional Commits)
feat: Thêm luồng tạo Challenge cho doanh nghiệp
fix: Sửa lỗi hiển thị sai điểm số trên Profile
refactor: Tách submission service ra khỏi controller
docs: Cập nhật README theo cấu trúc DDD
```

> **Quy tắc PR:** Mọi code merge vào `develop` phải tạo Pull Request, có ít nhất 1 thành viên Approve.  
> KHÔNG được push thẳng lên `develop` hay `main`.
