# 왓츠앱 출퇴근 관리 시스템 (attendance)

직원이 왓츠앱으로 보낸 **출퇴근 인증 사진**을 자동 수집하고,
사진 속 **현장 디스플레이 보드에 찍힌 날짜/시간을 OCR로 읽어** 공식 근무 기록으로 저장한 뒤,
회계사에게 넘길 **엑셀(xlsx)** 파일을 생성합니다.

> ⚠️ 이 디렉토리는 **독립 Python 프로젝트**입니다.
> 상위 저장소(`abc-store`)는 Next.js 스토어프론트이며, 이 시스템과 코드/빌드를 공유하지 않습니다.

---

## 1. 아키텍처

```
 ┌──────────┐   사진 전송    ┌─────────────────┐   webhook(POST)   ┌────────────────────────┐
 │  직원     │ ────────────▶ │ WhatsApp        │ ────────────────▶ │ FastAPI /webhook/twilio│
 │ (왓츠앱)  │               │ Business API    │                   │  · 서명검증            │
 └──────────┘               │ (Twilio)        │                   │  · 메시지 즉시 저장     │
                            └─────────────────┘                   │  · 200 OK 즉시 응답     │
                                     ▲                             └───────────┬────────────┘
                                     │ 미디어 다운로드                          │ BackgroundTask
                                     └──────────────────────────────┐          ▼
                                                                    │  ┌────────────────────┐
                                                                    └─▶│ 1) 이미지 다운로드   │
                                                                       │ 2) OCR (보드 시각)  │
                                                                       │ 3) 날짜/시간 파싱   │
                                                                       │ 4) 발신번호→직원매칭 │
                                                                       └─────────┬──────────┘
                                                                                 ▼
                                                              ┌──────────────────────────────┐
                                                              │ SQLite (SQLAlchemy)          │
                                                              │  employees / messages /      │
                                                              │  punch_events / work_days    │
                                                              └───────┬──────────────┬───────┘
                                                                      ▼              ▼
                                                        ┌───────────────────┐  ┌──────────────┐
                                                        │ 관리자 대시보드     │  │ 엑셀 다운로드 │
                                                        │ (오늘 현황/이상건) │  │ (월별 xlsx)  │
                                                        └───────────────────┘  └──────────────┘
```

### 데이터 흐름 (핵심 원칙)

| 단계 | 저장되는 시각 | 설명 |
|---|---|---|
| 왓츠앱 수신 | `messages.received_at` | 참고용 (네트워크 지연/재전송으로 실제와 다를 수 있음) |
| OCR 성공 | `punch_events.captured_at` (`source='ocr'`) | **공식 기록.** 사진 속 보드 시각 |
| OCR 실패 | `punch_events.captured_at` (`source='fallback'`) | 수신 시각을 대체값으로 저장 + `needs_review=True` |
| 관리자 수정 | `punch_events.captured_at` (`source='manual'`) | 대시보드에서 직접 교정 |

즉, **집계는 항상 `punch_events.captured_at` 기준**이며 수신 시각은 절대 집계에 쓰이지 않습니다.

### 왜 이 스택인가

| 선택 | 이유 |
|---|---|
| **Python 3.11 + FastAPI** | webhook 수신·백그라운드 처리·대시보드·엑셀을 한 프로세스로. 배포 대상 어디서나 동작 |
| **SQLite (SQLAlchemy 2.0)** | 직원 수십 명 규모에 파일 하나면 충분. `DATABASE_URL`만 바꾸면 Postgres로 이전 가능 |
| **OCR 2단 구성** | 1차 Tesseract(무료) → 실패 시 Claude Vision(유료·고정확도) 폴백. 비용/정확도 균형 |
| **Jinja2 서버 렌더링** | 관리자 1~2명이 쓰는 화면에 SPA는 과함. JS 빌드 없음 |
| **openpyxl** | 회계사용 xlsx를 서식 포함해 생성 |

---

## 2. 준비물 체크리스트

### 필수

- [ ] **Twilio 계정** + WhatsApp Business API 발신번호
  - 가입: https://www.twilio.com/try-twilio
  - 개발/테스트는 **WhatsApp Sandbox**로 승인 없이 즉시 시작 가능
    (Console → Messaging → Try it out → Send a WhatsApp message)
  - 실제 운영은 WhatsApp Business 프로필 승인 필요 (수일~2주)
  - 필요한 값: `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_WHATSAPP_NUMBER`
- [ ] **직원 명단** — 이름 + 왓츠앱 번호(E.164 형식, 예: `+821012345678`)
- [ ] **Python 3.11+**
- [ ] 로컬 개발 시 **ngrok** 등 터널 (Twilio가 로컬로 webhook 보내려면 공인 URL 필요)
  - https://ngrok.com — 무료 플랜으로 충분

### 선택

- [ ] **Tesseract OCR 바이너리** (무료 1차 OCR)
  - macOS: `brew install tesseract`
  - Ubuntu/Debian: `sudo apt install tesseract-ocr`
  - 미설치 시 자동으로 건너뛰고 다음 provider 사용
- [ ] **Anthropic API 키** (Claude Vision 폴백 — 정확도 보강용)
  - https://console.anthropic.com → API Keys
- [ ] 클라우드 배포 계정 (Render / Railway / Fly.io 등) — 4장 참고

---

## 3. 데이터베이스 스키마

`app/models.py` 참조. 4개 테이블.

### `employees` — 직원
| 컬럼 | 타입 | 설명 |
|---|---|---|
| `id` | int PK | |
| `name` | str | 직원명 (엑셀에 출력) |
| `phone` | str **unique** | 왓츠앱 번호 (E.164, `+821012345678`) |
| `code` | str? | 사번 (선택) |
| `active` | bool | 재직 여부. 퇴사자는 False로 (기록은 보존) |
| `memo` | str? | 비고 |

### `messages` — 수신 원본 (감사 추적용, 절대 수정 안 함)
| 컬럼 | 타입 | 설명 |
|---|---|---|
| `id` | int PK | |
| `provider` | str | `twilio` |
| `provider_sid` | str **unique** | 재전송/중복 webhook 방지 키 |
| `from_phone` | str | 발신 번호 |
| `employee_id` | int? FK | 번호 매칭 결과 (미등록이면 NULL) |
| `received_at` | datetime | 서버 수신 시각 (UTC naive) |
| `body` | str? | 텍스트 본문 |
| `media_url` / `media_content_type` | str? | Twilio 미디어 |
| `media_path` | str? | 로컬 저장 경로 |
| `raw_payload` | text(JSON) | webhook 폼 전체 |
| `process_error` | str? | 처리 실패 사유 |

### `punch_events` — 개별 인증 사진 1장 = 1건
| 컬럼 | 타입 | 설명 |
|---|---|---|
| `id` | int PK | |
| `message_id` | int **unique** FK | 메시지 1건당 이벤트 1건 |
| `employee_id` | int FK | |
| `captured_at` | datetime | **공식 시각** (UTC naive) |
| `work_date` | date | 야간근무 대응 컷오프 적용된 소속 근무일 |
| `source` | str | `ocr` / `fallback` / `manual` |
| `ocr_provider` | str? | `tesseract` / `claude` |
| `ocr_text` | str? | OCR 원문 (검증용) |
| `ocr_confidence` | float? | 0.0~1.0 |
| `needs_review` | bool | 수동 확인 필요 플래그 |
| `review_note` | str? | 플래그 사유 |
| `reviewed_at` / `reviewed_by` | | 확인 처리 이력 |

### `work_days` — 직원×날짜 집계 (파생 테이블, 재계산 가능)
| 컬럼 | 타입 | 설명 |
|---|---|---|
| `id` | int PK | |
| `employee_id` + `work_date` | **unique 복합** | |
| `check_in_at` / `check_out_at` | datetime? | 그날 첫 사진 / 마지막 사진 |
| `check_in_event_id` / `check_out_event_id` | int? FK | 근거 이벤트 추적 |
| `worked_minutes` | int | (퇴근−출근) − 휴게 |
| `break_minutes` | int | 기본 0 (급여 공제는 회계사 담당) |
| `status` | str | `complete` / `open`(퇴근 미기록) / `anomaly` |
| `needs_review` | bool | 하위 이벤트 중 하나라도 검토 필요 시 True |
| `note` | str? | 자동 생성 비고 (예: `사진 1장만 수신`) |

> `work_days`는 언제든 `punch_events`로부터 재생성됩니다 (`rebuild_work_day`).
> 손상되어도 원본(`messages`, `punch_events`)만 있으면 완전 복구 가능.

---

## 4. 설치 & 실행

```bash
cd attendance
python3 -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt

cp .env.example .env      # 값 채우기
python -m scripts.seed_employees employees.csv   # 직원 등록 (아래 참고)

uvicorn app.main:app --reload --port 8000
```

접속:
- 대시보드: http://localhost:8000/ (ADMIN_USER / ADMIN_PASSWORD 로 Basic 인증)
- 헬스체크: http://localhost:8000/health

### 직원 등록

`employees.csv`:
```csv
name,phone,code,memo
김철수,+821012345678,E001,주간
이영희,+821087654321,E002,
```
```bash
python -m scripts.seed_employees employees.csv
```
(이미 있는 번호는 이름/사번만 갱신하고 중복 생성하지 않습니다.)

### Twilio webhook 연결 (로컬)

```bash
ngrok http 8000
# → https://xxxx.ngrok-free.app 발급
```
Twilio Console → WhatsApp Sandbox Settings →
**"When a message comes in"** 에 `https://xxxx.ngrok-free.app/webhook/twilio` (HTTP POST) 저장.

직원 휴대폰에서 샌드박스 참여 코드(`join xxx-xxx`)를 보낸 뒤 사진을 전송하면 대시보드에 즉시 반영됩니다.

### 실제 이미지 없이 파이프라인 테스트

```bash
python -m scripts.simulate_message +821012345678 sample.jpg
```
webhook을 거치지 않고 OCR→저장→집계 전체 경로를 그대로 태웁니다.

---

## 5. OCR 동작 방식

`OCR_PROVIDERS` 순서대로 시도하고, 파싱에 성공하면 즉시 중단합니다.

1. **`tesseract`** — 무료. 이미지 전처리(그레이스케일 → 확대 → 대비 보정 → 이진화) 후 인식.
   보드 시각이 항상 우측 상단이라면 `OCR_CROP=0.5,0,1,0.35` (left,top,right,bottom 비율)로
   해당 영역만 잘라 인식률을 크게 올릴 수 있습니다.
2. **`claude`** — Anthropic Claude Vision. 이미지를 그대로 보내 보드에 표시된 날짜/시간만
   JSON으로 추출합니다. 흐릿하거나 각도가 틀어진 사진에서 Tesseract보다 훨씬 강합니다.

**비용 기준 (2026-08 시점, 사진 1장 ≒ 이미지 토큰 1.6K~4.8K + 출력 100토큰 미만)**

| 모델 | 입력 $/MTok | 출력 $/MTok | 사진 1장 대략 |
|---|---|---|---|
| `claude-opus-5` (기본값) | $5 | $25 | 약 $0.01~0.025 |
| `claude-haiku-4-5` | $1 | $5 | 약 $0.002~0.005 |

직원 20명 × 2장 × 22일 = 월 880장 기준, **Tesseract가 80% 처리하고 나머지만 Claude로 폴백**하면
Haiku 사용 시 월 $1 미만, Opus 사용 시 월 $5 이하입니다.
비용을 더 줄이려면 `.env`에서 `OCR_CLAUDE_MODEL=claude-haiku-4-5`로 바꾸세요.

**파싱 지원 포맷** (`app/services/ocr/parser.py`)

```
8/14/2026 6:02 AM        08/14/2026 06:02:15 AM
2026-08-14 06:02         2026.08.14 06:02
14/08/2026 06:02         (DATE_ORDER=DMY 일 때)
2026년 8월 14일 오전 6:02   8월 14일 06:02 (연도 생략 → 수신일 기준 추론)
06:02 AM                 (날짜 전체 생략 → 수신일 기준 추론, 신뢰도 하향)
```

OCR이 흔히 틀리는 `O→0`, `l/I→1`, `S→5`, `B→8` 은 숫자 구간에 한해 자동 교정합니다.

**검증(sanity check)** — 읽어낸 시각이 수신 시각 ±`SANITY_WINDOW_HOURS`(기본 48h)를 벗어나면
값은 저장하되 `needs_review=True`로 표시합니다. 미래 시각도 동일 처리.

---

## 6. 출퇴근 판별 규칙

- 같은 근무일의 **첫 사진 = 출근**, **마지막 사진 = 퇴근**
- `DEDUPE_MINUTES`(기본 10분) 이내 연속 사진은 1건으로 취급 → 중복 전송해도 안전
- 사진이 1장뿐이면 `status='open'` (퇴근 미기록) + 검토 플래그
- **야간근무**: `DAY_CUTOFF_HOUR`(기본 4시) 이전 시각은 전날 근무로 귀속.
  예) 8/15 01:30 퇴근 → 8/14 근무일
- 근무시간이 `MAX_SHIFT_HOURS`(기본 16h)를 넘거나 음수면 `status='anomaly'`

---

## 7. 엑셀 출력

대시보드 상단 **"엑셀 다운로드"** 또는 직접 호출:

```
GET /export/monthly.xlsx?year=2026&month=8
GET /export/range.xlsx?start=2026-08-01&end=2026-08-15
```

**시트 1 — 근무기록**: `직원명 | 사번 | 날짜 | 요일 | 출근시각 | 퇴근시각 | 총 근무시간 | 상태 | 비고`
**시트 2 — 직원별 합계**: `직원명 | 근무일수 | 총 근무시간 | 검토필요 건수`

총 근무시간은 `7:30` 형식 문자열과 `7.5` 소수 시간 두 컬럼을 모두 넣어 회계사가 바로 계산에 쓸 수 있게 했습니다.

---

## 8. 클라우드 배포

가장 저렴하고 빠른 경로는 **Render** 또는 **Railway** 입니다.

### Render (권장)

1. 이 저장소를 GitHub에 push
2. Render → New → Web Service → 저장소 선택
3. 설정:
   - Root Directory: `attendance`
   - Build Command: `pip install -r requirements.txt`
   - Start Command: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
4. Environment → `.env.example` 의 값들을 등록
5. **Disk 추가** (SQLite/미디어 영속화):
   Mount Path `/data`, 1GB → 환경변수 `DATABASE_URL=sqlite:////data/attendance.db`,
   `MEDIA_DIR=/data/media`
   (디스크를 붙이지 않으면 재배포 때마다 DB가 초기화됩니다 — 반드시 설정)
6. 배포 완료 후 발급된 `https://xxx.onrender.com/webhook/twilio` 를 Twilio webhook에 등록

### 그 외

- **Railway**: 동일. Volume을 `/data`에 마운트
- **Fly.io**: `fly launch` 후 `fly volumes create data --size 1`
- **직접 서버(VPS)**: `uvicorn` + `systemd` + `nginx` 리버스 프록시, 미디어는 로컬 디스크

**운영 전 필수 확인**
- [ ] `TWILIO_VALIDATE_SIGNATURE=true` (기본값). 끄면 누구나 위조 요청 가능
- [ ] `PUBLIC_BASE_URL`을 실제 https 주소로 (Twilio 서명 검증에 URL이 포함됨)
- [ ] `ADMIN_PASSWORD`를 강한 값으로 변경
- [ ] DB/미디어가 영속 볼륨에 있는지
- [ ] DB 파일 정기 백업 (월말 엑셀 생성 전 필수)

---

## 9. 테스트

```bash
pytest -q
```

파싱 로직(`test_parser.py`)과 출퇴근 집계 로직(`test_attendance.py`)을 커버합니다.
새 보드 포맷이 나오면 `test_parser.py`에 케이스를 먼저 추가하세요.

---

## 10. 남은 결정사항 / 기본값

프롬프트에서 비워두신 항목은 아래 기본값으로 구현했고, 모두 `.env`로 바꿀 수 있습니다.

| 항목 | 적용한 기본값 | 바꾸는 법 |
|---|---|---|
| 직원 수 | 수십 명 규모 가정 (SQLite로 충분) | 100명 이상이면 `DATABASE_URL`을 Postgres로 |
| OCR 정확도/예산 | Tesseract 우선 → Claude 폴백 | `OCR_PROVIDERS`, `OCR_CLAUDE_MODEL` |
| 대시보드 | 웹 대시보드 + 엑셀 둘 다 제공 | 엑셀만 쓰려면 대시보드를 무시하면 됨 |
| 시간대 | `Asia/Seoul` | `TIMEZONE` |
| 날짜 순서 | `MDY` (예: `8/14/2026`) | `DATE_ORDER=DMY` |
| 휴게시간 | 0분 (급여 공제는 회계사) | `work_days.break_minutes` 수동 입력 |
