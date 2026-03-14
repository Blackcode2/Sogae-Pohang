# Pages Documentation

## LandingPage (`/`)

**File**: `src/pages/LandingPage.jsx`

The public homepage with four sections:

### Sections
1. **Header**: Logo + auth-aware navigation. 어드민 이메일로 로그인 시 "관리자" 링크 표시 (login/signup or 관리자/프로필/로그아웃)
2. **Hero**: Title text ("포항 대학생을 위한 소개팅"), description, hero image, CTA button
3. **Event Status**: 현재 열린 소개팅 이벤트 정보. Supabase `matching_events` 테이블에서 실시간 조회.
   - 선착순 모드: 성별별 현재/최대 인원 + 프로그레스 바
   - 선별 모드: 성별별 모집 인원 + 실제 지원자 수 (applications 테이블 기반, 성별별 표시)
4. **University Logos**: POSTECH (red) and 한동대학교 (blue) badges
5. **Footer**: Copyright

### Behavior
- "소개팅 참여하기" / "참여 신청하기" buttons → `/apply` if logged in, `/login` if not
- Event card displays `title`, `event_type` badge (via `EVENT_TYPE_LABELS`)
- 종료일이 지난 open 이벤트는 프론트에서 자동으로 closed 처리

---

## LoginPage (`/login`)

**File**: `src/pages/LoginPage.jsx`

Google-only login page.

### Elements
- Logo + title "로그인"
- Google OAuth button (calls `signInWithGoogle()` from AuthContext)
- Domain restriction note: "postech.ac.kr 또는 handong.ac.kr 이메일만 사용 가능합니다"
- **Dev mode**: "로그인 없이 둘러보기" button that calls `devLogin()` and navigates to `/`

---

## SignUpPage (`/signup`)

**File**: `src/pages/SignUpPage.jsx`

Google-only signup page.

### Elements
- Logo + title "회원가입"
- Info box listing eligible universities (POSTECH, 한동대학교)
- Google OAuth button (same `signInWithGoogle()` — Supabase handles new vs existing)
- Link to login page for existing users

---

## ProfileFormPage (`/profile/setup`)

**File**: `src/pages/ProfileFormPage.jsx`
**Access**: Protected (requires login)

Single-page basic profile form. (v2에서 6-step → 1-page로 간소화됨)

### Fields
| Field | Component | Description |
|-------|-----------|-------------|
| 닉네임 | TextInput | 서비스에서 사용할 닉네임 |
| 성별 | RadioGroup | 남자 / 여자 |
| 출생년도 | SelectInput | 1995~2007 |
| 학교 | TextInput (readonly) | 이메일 도메인으로 자동 지정 |
| 학과/학부 | TextInput | 사용자 입력 |

### Behavior
- 기존 프로필이 있으면 자동 로드 (편집 모드)
- 필수 항목 미입력 시 에러 메시지 표시
- 저장 시 `profiles` 테이블에 upsert → `/profile`로 이동

### Data Flow
- Saves to `profiles` table only (basic info)
- Uses `upsert` with `onConflict: 'user_id'`
- 이름(실명) 필드 제거됨 (v2)
- 외형/라이프스타일/이상형 정보는 소개팅 신청 시 별도 작성 (MatchApplyPage)

---

## ProfilePage (`/profile`)

**File**: `src/pages/ProfilePage.jsx`
**Access**: Protected

Read-only view of user's basic profile + matching status.

### Sections
1. **Header**: 로고 + 어드민 이메일일 경우 "관리자" 링크 + "프로필 수정" 링크
2. **기본 정보**: Nickname, gender, birth year, university, department
3. **참여한 소개팅**: 신청한 이벤트 목록 (이벤트 상태 배지 + 제목 + 신청일)
4. **매칭 현황**: 매칭 결과 표시 (상대방 닉네임, 학교, 학과, 상태 배지, 채팅방 링크)
5. **회원탈퇴**: Delete account with confirmation dialog

### Matching Status
- 매칭이 없으면: "아직 매칭 내역이 없습니다."
- 매칭이 있으면: 상대방 기본 정보 + 상태 배지 (매칭됨/연락 중/완료/취소됨)
- 채팅방이 존재하면 "채팅방 가기" 버튼 표시 → `/chat/:roomId`
- 채팅방이 종료된 경우 "채팅 종료" 회색 라벨 표시
- 이벤트 상태 배지: 모집 중(녹색) / 모집 마감(노란색) / 매칭 완료(보라색) / 종료(회색)

### Empty State
If no profile exists, shows a prompt to create one with a link to `/profile/setup`.

---

## MatchApplyPage (`/apply`)

**File**: `src/pages/MatchApplyPage.jsx`
**Access**: Protected

6-step blind date application flow. (v2에서 3-step → 6-step으로 확장됨)

### Steps
| Step | Name | Description |
|------|------|-------------|
| 1 | **이벤트 선택** | 현재 열린 소개팅 목록에서 선택 (종류, 기간, 인원 표시) |
| 2 | **블라인드 프로필** | BlindProfileForm — 외형, 라이프스타일, 성향, 연락수단 |
| 3 | **이상형 정보** | IdealTypeForm — 원하는 상대 조건 (상관없음 처리 포함) |
| 4 | **사진 첨부** | PhotoUpload — 이벤트 photo_setting에 따라 표시/필수/숨김 |
| 5 | **확인 & 제출** | 전체 정보 리뷰 → 제출 |
| 6 | **완료** | 성공 메시지 + 홈/프로필 링크 |

### Photo Step Logic
- `photo_setting === 'none'`: 사진 step 건너뜀
- `photo_setting === 'optional'`: 사진 step 표시, 제출은 선택
- `photo_setting === 'required'`: 사진 step 표시, 사진 없이 제출 불가

### Domain Restriction
- 이벤트에 도메인 제한이 걸린 경우, 허용되지 않은 도메인 유저에게는 "참가 불가" 배지 + 안내 문구 표시
- 도메인 제한 이벤트는 목록에 표시되지만 선택(클릭) 불가 (disabled, 회색 배경)
- 신청 제출 시에도 도메인 이중 검증

### Event Display by Application Mode
- **선착순 (first_come)**: 성별별 현재/최대 인원 표시 (`matching_events.current_male/current_female` 기반). 특정 성별 정원이 차면 "남자/여자 마감" 배지 표시 + 선택 불가
- **선별 (selection)**: 성별별 모집 인원 + 실제 지원자 수 표시
- 선착순/선별 모드 구분은 유저에게 표시하지 않음
- 신청 시 서버 측 정원 재검증 (race condition 방지)

### Data Flow
- Step indicator: 현재 step 위치를 시각적으로 표시 (done 제외)
- 기존 `blind_profiles` / `ideal_preferences` 자동 로드 (재사용)
- 종료일이 지난 open 이벤트는 프론트에서 자동으로 closed 처리
- 제출 시:
  1. `blind_profiles` upsert (user_id + event_id)
  2. `ideal_preferences` upsert (user_id + event_id)
  3. `blind-photos` Storage 업로드 (사진 있을 경우, 자동 리사이징 적용)
  4. `applications` insert (profile_snapshot + preferences_snapshot + photo_url)

---

## ChatPage (`/chat/:roomId`)

**File**: `src/pages/ChatPage.jsx`
**Access**: Protected

Real-time chat room for matched couples + admin.

### Layout
- **Header**: 뒤로가기 (→ /profile), 채팅방 이름, 참여자 수
- **Messages**: 스크롤 가능한 메시지 목록 (자동 하단 이동)
- **Input**: 메시지 입력창 + 전송 버튼

### Message Types (ChatBubble)
| Type | Display |
|------|---------|
| `text` | 내 메시지 (오른쪽, 파란색) / 상대 메시지 (왼쪽, 회색) / 주선자 메시지 (왼쪽, 앰버색) |
| `system` | 중앙 정렬, 연한 배경, 둥근 알약 모양 |
| `contact_share` | 중앙 정렬, 보라색 카드 UI |

### Admin Messages
- 주선자(admin) 메시지는 앰버 색상으로 구분 (`bg-amber-100 text-amber-900`)
- 발신자명은 닉네임 대신 "주선자" 로 표시 (`text-amber-500 font-semibold`)

### Room Status
- 종료된 채팅방은 메시지 입력 불가, "채팅방이 종료되었습니다" 표시

### Data Flow
- `useChat(roomId)` 훅 사용 (Supabase Realtime 구독)
- 초기 로드: 기존 메시지 + 참여자 목록 fetch (FK 조인 없이 별도 profiles 조회)
- 실시간: `postgres_changes` INSERT 이벤트 구독
- 언마운트 시 채널 구독 해제

---

## AdminPage (`/admin`)

**File**: `src/pages/AdminPage.jsx`
**Access**: Admin only (email in `ADMIN_EMAILS`)

### Tabs

#### 소개팅 관리 (Events)
- List all matching events with status badges (모집 중/모집 마감/매칭 완료/종료) + event type badges
- Event card shows: title, type badge, period, 남녀 인원
- Create new event form:
  - 제목, 소개팅 종류, 안내사항, 사진 설정, 모집 방식 (선착순/선별), 시작일/종료일, 남녀 정원
  - 소개팅 종류 변경 시 안내사항에 기본 템플릿 자동 채움 (`EVENT_DESCRIPTION_TEMPLATES`), 수정/삭제 가능
  - 도메인 제한: "모든 대학교 허용" 토글 → off 시 성별별 도메인 체크박스
- **이벤트 수정**: 기존 이벤트의 모든 설정을 수정 가능 (인라인 편집 폼)
- **상세 관리 페이지**: 이벤트 선택 시 상세 페이지로 이동
  - 이벤트 정보 표시 + 인라인 수정
  - 지원자 목록 (남녀 분리, 프로필 + 제출 사진 표시)
  - 사진 클릭 시 전체 화면 모달
  - 매칭 결과 보기 (completed 상태)
- Status transitions: open → closed → completed → ended
- Closed 상태에서 "매칭 실행" 버튼 (게일-섀플리 알고리즘)
- Completed 상태에서:
  - "매칭 결과 보기" → 매칭된 커플 목록 + 호환 점수 표시
  - "채팅방 열기/닫기/다시 열기" 버튼
  - "소개팅 종료" 버튼 → 모든 채팅방 종료 + 이벤트 ended 상태로 전환

#### 회원 관리 (Users)
- Table of all registered users: nickname, university, department, gender
- Delete user button with `window.confirm()` dialog
- Shows total user count in tab label

#### 채팅 관리 (Chat) — v2 추가
- `AdminChatDashboard` 컴포넌트 렌더링
- **소개팅별 채팅 그룹화**: 이벤트 탭으로 채팅방 필터링 (이벤트 제목 + 읽지 않은 메시지/멘션 배지)
- 전체 공지: 선택된 이벤트 또는 모든 활성 채팅방에 시스템 메시지 일괄 전송. 매크로 버튼 지원 (첫인사, 10분 남음, 연락처 교환, 종료 인사)
- 채팅방 목록: 커플 닉네임, 최근 메시지, 읽지 않은 메시지 수 배지(빨강), @주선자 태그 알림 배지(앰버)
- **참가자 프로필 카드**: 채팅방 상단에 매칭된 두 참가자의 프로필 + 제출 사진 표시
- 개별 채팅방 선택 → AdminChatRoom:
  - 메시지 읽기/쓰기 (읽음 처리: `last_read_at` 업데이트)
