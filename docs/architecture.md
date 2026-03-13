# Architecture Overview

## Tech Stack

| Layer | Technology | Version |
|-------|-----------|---------|
| Framework | React (JSX, no TypeScript) | 19.1.1 |
| Build Tool | Vite | 7.1.0 |
| Routing | React Router DOM | 7.8.0 |
| Backend | Supabase (Auth + Database + Realtime + Storage) | 2.54.0 |
| Styling | Tailwind CSS via CDN | latest |
| Font | Pretendard (Korean) via CDN | 1.3.9 |
| Linting | ESLint v9 (flat config) | 9.32.0 |

## Project Structure

```
Sogae-Pohang/
├── public/
│   └── favicon.svg              # App favicon (blue circle + heart)
├── src/
│   ├── main.jsx                 # React entry point (StrictMode)
│   ├── App.jsx                  # Root component, BrowserRouter, all routes
│   ├── index.css                # Global CSS
│   ├── assets/
│   │   ├── images/
│   │   │   └── landing-photo.png  # Hero section image
│   │   └── logo.svg              # Full logo (소개 + 퐝 + POHANG)
│   ├── components/
│   │   ├── AdminChatDashboard.jsx  # Admin chat management (room list, broadcast, individual chat)
│   │   ├── AdminRoute.jsx          # Admin-only route guard
│   │   ├── BlindProfileForm.jsx    # Blind date detailed profile form (외형/라이프스타일/성향/연락수단)
│   │   ├── DevNavBar.jsx           # Dev-mode navigation bar (DEV only)
│   │   ├── FormFields.jsx          # Reusable form components (9 types)
│   │   ├── IdealTypeForm.jsx       # Ideal type preferences form (이상형 정보)
│   │   ├── Logo.jsx                # Logo component with size prop
│   │   ├── PhotoUpload.jsx         # Photo upload with preview (10MB limit, auto-resize to 1920px)
│   │   └── ProtectedRoute.jsx      # Auth-required route guard
│   ├── context/
│   │   ├── AuthContext.jsx      # AuthProvider (session, OAuth, devLogin)
│   │   └── authContextValue.js  # React.createContext (separated for ESLint)
│   ├── hooks/
│   │   ├── useAdminChat.js      # Admin chat dashboard hook (all rooms, realtime updates)
│   │   ├── useAuth.js           # useAuth hook
│   │   └── useChat.js           # Chat room hook (messages, realtime, send)
│   ├── lib/
│   │   ├── constants.js         # All form options, admin emails, domains, event types
│   │   ├── matching.js          # Matching algorithm (compatibility score + Gale-Shapley)
│   │   └── supabase.js          # Supabase client init
│   └── pages/
│       ├── AdminPage.jsx        # Admin dashboard (events + users + chat tabs)
│       ├── ChatPage.jsx         # Real-time chat room (messages + input)
│       ├── LandingPage.jsx      # Homepage / dashboard
│       ├── LoginPage.jsx        # Google login + dev bypass
│       ├── MatchApplyPage.jsx   # 6-step blind date application flow
│       ├── ProfileFormPage.jsx  # Basic profile setup form (1 page)
│       ├── ProfilePage.jsx      # Profile view + matches + chat links
│       └── SignUpPage.jsx       # Google signup with domain info
├── docs/
│   ├── architecture.md          # This file
│   ├── pages.md                 # Page-by-page documentation
│   ├── components.md            # Component API documentation
│   ├── data-model.md            # Database schema & constants
│   └── plans/
│       ├── PLAN_sogae-pohang-mvp.md  # Original 7-phase MVP plan
│       ├── PLAN_v2-refactor.md       # v2 refactor 6-phase plan (complete)
│       ├── proposal.md               # Original project proposal (Korean)
│       ├── proposal2.md              # v2 project proposal (Korean)
│       ├── profile-prd.md            # Profile form PRD / revision spec
│       └── supabase-schema.sql       # SQL schema for Supabase (v2)
├── index.html                   # HTML entry with Tailwind config
├── package.json                 # Dependencies & scripts
├── vite.config.js               # Vite configuration
├── eslint.config.js             # ESLint v9 flat config
├── .env.local                   # Supabase credentials (not committed)
└── CLAUDE.md                    # Claude Code instructions
```

## Routing

All routes are defined in `src/App.jsx`:

| Path | Component | Access | Description |
|------|-----------|--------|-------------|
| `/` | LandingPage | Public | Homepage with hero, event status, universities |
| `/login` | LoginPage | Public | Google OAuth login + dev bypass |
| `/signup` | SignUpPage | Public | Google OAuth signup with domain info |
| `/profile` | ProfilePage | Protected | View basic profile, matches, chat links |
| `/profile/setup` | ProfileFormPage | Protected | Basic profile form (nickname, gender, birth year, school, dept) |
| `/apply` | MatchApplyPage | Protected | 6-step blind date application (event → profile → ideal → photo → confirm → done) |
| `/chat/:roomId` | ChatPage | Protected | Real-time chat room |
| `/admin` | AdminPage | Admin only | Event management + user management + chat dashboard |

### Route Guards

- **ProtectedRoute**: Redirects unauthenticated users to `/login`. Shows loading spinner during session check.
- **AdminRoute**: Extends ProtectedRoute. Also checks if `user.email` is in `ADMIN_EMAILS` array from `constants.js`. Shows "접근 권한이 없습니다" for non-admin users.

## Authentication Flow

```
User → Google OAuth (via Supabase Auth SDK)
  ↓
Supabase returns session with user.email
  ↓
AuthContext stores user in React state
  ↓
onAuthStateChange listener keeps session in sync
  ↓
ProtectedRoute checks user !== null
  ↓
AdminRoute additionally checks ADMIN_EMAILS.includes(user.email)
```

### Dev Mode Bypass

In development (`import.meta.env.DEV`):
- LoginPage shows a "로그인 없이 둘러보기 (Dev)" button
- DevNavBar shows at bottom with links to all pages + dev login/logout
- `devLogin(email)` creates a mock user object (no real Supabase session)

## Styling

- Tailwind CSS loaded via CDN `<script>` in `index.html`
- Custom theme config in `index.html`:
  - Primary color: `#007AFF`
  - Primary dark: `#005ecb`
  - Font family: Pretendard (Korean web font)
- Mobile-first responsive design using `md:` and `lg:` breakpoints
- Component styling uses Tailwind utility classes directly in JSX

## State Management

- **No global state library** — React hooks only (`useState`, `useEffect`, `useContext`)
- **AuthContext** is the only shared state (user session)
- Each page manages its own local state for forms, loading, errors
- Data fetched from Supabase on page mount via `useEffect`
- **Supabase Realtime** used for chat message subscriptions (`useChat`, `useAdminChat`)

## Data Flow

```
Frontend (React)
  ↕ Supabase JS Client
Backend (Supabase)
  ├── Auth (Google OAuth, sessions)
  ├── Database (PostgreSQL)
  │   ├── profiles            (기본 정보)
  │   ├── blind_profiles      (블라인드 소개팅 상세 프로필)
  │   ├── ideal_preferences   (이상형 정보, 소개팅별)
  │   ├── matching_events     (소개팅 이벤트)
  │   ├── applications        (신청 내역 + 스냅샷)
  │   ├── matches             (매칭 결과)
  │   ├── chat_rooms          (채팅방)
  │   ├── chat_participants   (채팅방 참여자)
  │   └── chat_messages       (채팅 메시지)
  ├── Realtime (chat_messages INSERT 구독)
  └── Storage (blind-photos 버킷)
```

## Key Subsystems

### Profile System (2-tier)
- **기본 프로필 (`profiles`)**: 회원가입 시 작성. 닉네임, 성별, 출생년도, 학교, 학과.
- **블라인드 프로필 (`blind_profiles`)**: 소개팅 신청 시 작성. 외형, 라이프스타일, 성향, 연락수단. 이벤트별로 별도 저장.

### Event System
- 어드민이 소개팅 이벤트를 생성 (종류, 기간, 인원, 사진설정, 도메인제한)
- 이벤트 종류: 블라인드 온라인, 블라인드 오프라인, 로테이션, 기타
- 상태 전이: open → closed → completed → ended
- 모집 방식: 선착순 (first_come, 인원 충족 시 자동 마감) / 선별 (selection, 어드민 선발)
- 종료일이 지난 open 이벤트는 프론트에서 자동으로 closed 처리

### Matching System
- 가중치 기반 호환성 점수 계산 (`calculateCompatibility`)
- 게일-섀플리 안정 매칭 알고리즘 (`galeShapley`)
- 매칭 완료 시 자동으로 채팅방 생성

### Chat System
- Supabase Realtime 기반 실시간 채팅
- 매칭된 커플 + 주선자(어드민) 채팅방
- 메시지 타입: text, system, contact_share
- 주선자(admin) 메시지는 앰버 색상으로 구분 표시
- 읽지 않은 메시지 추적: `chat_participants.last_read_at` 기반
- @주선자 멘션 감지 및 알림 표시
- 어드민 대시보드: 소개팅별 채팅 그룹화, 전체 공지, 개별 채팅, 참가자 프로필/사진 표시
- 채팅방 열기/닫기/다시 열기 기능
- 소개팅 종료 시 모든 채팅방 자동 종료
