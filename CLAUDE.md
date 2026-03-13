# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

소개퐝 (Sogae-Pohang) — a blind dating/introduction matching platform for university students in the Pohang region (POSTECH and Handong University). Built with React + Supabase. Features a 2-tier profile system, event-based blind date matching (Gale-Shapley algorithm), and real-time chat.

## Commands

```bash
npm run dev        # Start Vite dev server (localhost:5173)
npm run build      # Production build to dist/
npm run preview    # Preview production build locally
npm run lint       # ESLint (v9 flat config)
```

No test framework is configured.

## Environment Setup

Requires a `.env.local` file with Supabase credentials:
```
VITE_SUPABASE_URL=<supabase-project-url>
VITE_SUPABASE_ANON_KEY=<supabase-anon-key>
```

## Architecture

- **Framework**: React 19 + Vite 7, JavaScript (JSX, no TypeScript)
- **Routing**: React Router DOM v7 (BrowserRouter in App.jsx)
- **Backend**: Supabase (Auth + Database + Realtime + Storage, no custom server)
- **Styling**: Tailwind CSS via CDN with custom theme in index.html (primary color `#007AFF`, Pretendard Korean font)
- **State**: React hooks only (useState, useContext), no global state library
- **Auth**: Google OAuth only via Supabase Auth SDK, with AuthContext provider
- **Realtime**: Supabase Realtime for chat messages (postgres_changes subscription)
- **Storage**: Supabase Storage for blind date photo uploads (blind-photos bucket)

### Source Layout

- `src/App.jsx` — Root component, BrowserRouter, all routes
- `src/pages/` — 8 page components (Landing, Login, SignUp, ProfileForm, Profile, MatchApply, Chat, Admin)
- `src/components/` — Reusable components:
  - Form: FormFields (9 types: TextInput, NumberInput, SelectInput, RadioGroup, CheckboxGroup, RangeInput, ToggleField, TextArea, FileInput)
  - Blind date: BlindProfileForm, IdealTypeForm, PhotoUpload
  - Chat: AdminChatDashboard
  - Route guards: ProtectedRoute, AdminRoute
  - UI: DevNavBar, Logo
- `src/context/` — AuthContext (provider + context value separated for ESLint react-refresh)
- `src/hooks/` — useAuth, useChat (realtime chat), useAdminChat (admin chat dashboard)
- `src/lib/constants.js` — All form options, admin emails, domain mappings, event types, photo settings
- `src/lib/matching.js` — Matching algorithm (compatibility scoring + Gale-Shapley stable matching)
- `src/lib/supabase.js` — Supabase client init (reads env vars via `import.meta.env`)
- `src/assets/` — Images and SVG logo

### Routes

| Path | Component | Access | Description |
|------|-----------|--------|-------------|
| `/` | LandingPage | Public | Homepage with hero, event status, universities |
| `/login` | LoginPage | Public | Google OAuth login + dev bypass |
| `/signup` | SignUpPage | Public | Google OAuth signup with domain info |
| `/profile` | ProfilePage | Protected | View basic profile, matches, chat links |
| `/profile/setup` | ProfileFormPage | Protected | Basic profile form (nickname, gender, birth year, school, dept) |
| `/apply` | MatchApplyPage | Protected | 6-step blind date application (event → profile → ideal → photo → confirm → done) |
| `/chat/:roomId` | ChatPage | Protected | Real-time chat room for matched couples (admin messages in amber) |
| `/admin` | AdminPage | Admin only | Event/user/chat management + event detail page |

### Auth Flow

Google OAuth only. AuthContext manages session via `supabase.auth.onAuthStateChange`. ProtectedRoute redirects to `/login`. AdminRoute checks `ADMIN_EMAILS` array in constants.js. Dev mode has bypass login via `devLogin()`. Admin link shown in LandingPage/ProfilePage headers for admin users.

### Event Lifecycle

open → closed → completed → ended. 종료일 지난 open 이벤트는 프론트에서 자동 closed 처리. 선착순 모드는 인원 충족 시 자동 마감. "소개팅 종료" 시 모든 채팅방 종료 + ended 상태.

### Domain Restrictions

이벤트별 성별 도메인 제한. 제한된 도메인 유저에게 이벤트는 보이지만 "참가 불가" 표시 + 클릭 불가. 신청 제출 시 이중 검증.

## Conventions

- All UI text is in Korean
- ESLint rule: unused vars starting with uppercase or `_` are allowed (`varsIgnorePattern: '^[A-Z_]'`)
- PascalCase for components, camelCase for variables/functions
- Tailwind utility classes for styling (mobile-first responsive with `md:`, `lg:` breakpoints)
- Context object separated from provider component to satisfy eslint-plugin-react-refresh

## Documentation

- [`docs/architecture.md`](docs/architecture.md) — Full architecture overview, project structure, routing, auth flow, styling, state management
- [`docs/pages.md`](docs/pages.md) — Page-by-page documentation with sections, behavior, and data flow
- [`docs/components.md`](docs/components.md) — Component API reference (props, behavior) for all form fields, route guards, and UI components
- [`docs/data-model.md`](docs/data-model.md) — Database schema (all tables and columns), RLS policies, and constants reference

## Plans & Specs

- [`docs/plans/proposal.md`](docs/plans/proposal.md) — Original project proposal (Korean)
- [`docs/plans/profile-prd.md`](docs/plans/profile-prd.md) — Profile form revision spec (added personality/style/interests sections, removed weight)
- [`docs/plans/PLAN_sogae-pohang-mvp.md`](docs/plans/PLAN_sogae-pohang-mvp.md) — 7-phase implementation plan (Phases 1-6 complete, Phase 7 deferred)
- [`docs/plans/supabase-schema.sql`](docs/plans/supabase-schema.sql) — SQL schema to apply in Supabase SQL Editor
- [`docs/plans/proposal2.md`](docs/plans/proposal2.md) — Updated project proposal (v2, 소개팅 종류/채팅 시스템 추가)
- [`docs/plans/PLAN_v2-refactor.md`](docs/plans/PLAN_v2-refactor.md) — v2 리팩토링 6-phase 계획 (proposal2 기반)
