# Implementation Plan: 소개퐝 MVP Web Service

**Status**: 🔄 In Progress
**Started**: 2026-02-11
**Last Updated**: 2026-02-11

---

**CRITICAL INSTRUCTIONS**: After completing each phase:
1. Check off completed task checkboxes
2. Run `npm run lint && npm run build` for validation
3. Verify ALL quality gate items pass
4. Update "Last Updated" date above
5. Document learnings in Notes section
6. Only then proceed to next phase

**DO NOT skip quality gates or proceed with failing checks**

---

## Overview

### Feature Description
Build the full 소개퐝 MVP — a dating/introduction matching platform for POSTECH and Handong University students. The service allows admin-controlled matching periods where students register profiles, specify ideal type preferences, and get matched via algorithm.

### Success Criteria
- [ ] Google-only authentication with university email domain validation
- [ ] Complete profile form (personal info + ideal type preferences)
- [ ] Dashboard with event status, participant counts, university logos
- [ ] Profile viewing page with match result display
- [ ] Matching application flow with profile review
- [ ] Admin page for event and user management
- [ ] All UI text in Korean, mobile-responsive design

### User Impact
University students in Pohang can sign up, fill out detailed profiles, apply for matching events, and receive 1:1 match results — replacing informal and awkward introduction processes with a structured, algorithm-driven system.

---

## Architecture Decisions

| Decision | Rationale | Trade-offs |
|----------|-----------|------------|
| Google-only auth | Proposal specifies Google login only; simpler flow | Users without Google accounts cannot use the service |
| Frontend-first (no matching backend yet) | Build all UI/UX first, add matching logic later | Matching won't actually function until backend is added |
| Supabase for data storage | Already configured; handles auth + DB without custom server | Dependent on Supabase service availability |
| Tailwind CSS via CDN | Already set up; fast for prototyping | Not tree-shaken for production; larger bundle |
| React hooks only (no state library) | Simple enough for MVP scope | May need global state later for auth context |

---

## Dependencies

### Required Before Starting
- [x] React + Vite project scaffolded
- [x] Supabase client configured (`src/lib/supabase.js`)
- [x] Basic pages exist (Landing, Login, SignUp)
- [ ] Supabase project with Auth + Database tables set up

### External Dependencies
- react: 19.1.1
- react-router-dom: 7.8.0
- @supabase/supabase-js: 2.54.0

---

## Implementation Phases

### Phase 1: Auth System Cleanup & Auth Context
**Goal**: Google-only login, session management across the app, protected routes
**Status**: Pending

#### Tasks

- [ ] **Task 1.1**: Create AuthContext provider
  - File: `src/context/AuthContext.jsx`
  - Provides `user`, `loading`, `signInWithGoogle`, `signOut` to entire app
  - Listens to `supabase.auth.onAuthStateChange` for session persistence

- [ ] **Task 1.2**: Refactor LoginPage to Google-only
  - File: `src/pages/LoginPage.jsx`
  - Remove email/password form
  - Keep only Google OAuth button
  - After successful login, redirect based on whether profile exists

- [ ] **Task 1.3**: Refactor SignUpPage to Google-only
  - File: `src/pages/SignUpPage.jsx`
  - Remove email/password form
  - Keep only Google OAuth button
  - Validate email domain (postech.ac.kr, handong.edu) after OAuth callback

- [ ] **Task 1.4**: Create ProtectedRoute component
  - File: `src/components/ProtectedRoute.jsx`
  - Wraps routes that require authentication
  - Redirects to `/login` if not authenticated

- [ ] **Task 1.5**: Update App.jsx routing
  - File: `src/App.jsx`
  - Wrap app with AuthContext provider
  - Add protected routes for profile, apply, admin pages
  - Add route placeholders for upcoming pages

#### Quality Gate
- [ ] `npm run lint` passes
- [ ] `npm run build` succeeds
- [ ] Google login works (redirects to Google, returns to app)
- [ ] Session persists on page reload
- [ ] Unauthenticated users redirected to login
- [ ] Email domain validation rejects non-university emails

---

### Phase 2: Dashboard (Landing Page) Enhancement
**Goal**: Update landing page per proposal — event status, participant counts, university logos
**Status**: Pending

#### Tasks

- [ ] **Task 2.1**: Add event status section to LandingPage
  - File: `src/pages/LandingPage.jsx`
  - Display matching period dates (mock data for now)
  - Show current participant count: 남자 X/Y, 여자 X/Y
  - Progress bars or visual indicators for fill status

- [ ] **Task 2.2**: Add university logos section
  - File: `src/pages/LandingPage.jsx`
  - Horizontal row of university logos (POSTECH, Handong)
  - File: `src/assets/images/` — add university logo images

- [ ] **Task 2.3**: Wire up "시작하기" and "소개팅 참여하기" buttons
  - If logged in → go to matching application page
  - If not logged in → go to login page

- [ ] **Task 2.4**: Update header navigation
  - Show user info and logout button when logged in (using AuthContext)
  - Show login/signup buttons when not logged in

#### Quality Gate
- [ ] `npm run lint` passes
- [ ] `npm run build` succeeds
- [ ] Dashboard displays event period and participant counts
- [ ] University logos render correctly
- [ ] Navigation changes based on auth state
- [ ] Mobile responsive layout maintained

---

### Phase 3: Profile Form (본인정보 + 이상형정보)
**Goal**: Multi-step form for personal info and ideal type preferences after first signup
**Status**: Pending

#### Tasks

- [ ] **Task 3.1**: Create Supabase table schema definition
  - File: `docs/plans/supabase-schema.sql` (reference only, apply manually in Supabase dashboard)
  - `profiles` table: user_id, name, nickname, birth_year, university, department, height, height_public, weight, weight_public, body_type, face_type, eye_type, mbti, religion, smoking, drinking, tattoo, contact_frequency, hobbies, contact_method, gender
  - `ideal_preferences` table: user_id, height, weight, body_type, face_type, eye_type, mbti, religion, smoking, drinking, tattoo, contact_frequency, hobbies

- [ ] **Task 3.2**: Create ProfileFormPage — personal info step
  - File: `src/pages/ProfileFormPage.jsx`
  - Step 1: Basic info (이름, 닉네임, 나이/년도, 학교 auto-filled from email domain, 학과/학부, 성별)
  - Step 2: Physical info (키, 몸무게 with 공개/비공개 toggle, 몸매, 얼굴상, 눈)
  - Step 3: Lifestyle (MBTI with 모름 option, 종교, 담배, 음주, 타투, 연락주기, 취미 multi-select)
  - Step 4: Contact method (전화번호, 카카오톡, 인스타그램 등)
  - Note: UI states "이름은 실명이고 공개되지 않습니다"

- [ ] **Task 3.3**: Create ProfileFormPage — ideal type step
  - File: `src/pages/ProfileFormPage.jsx` (continued or separate component)
  - Fields mirror personal info: 키, 몸무게, 몸매, 얼굴상, 눈, MBTI, 종교, 담배, 음주, 타투, 연락주기, 취미
  - Each field allows preference selection (not exact values, but preferred ranges/options)

- [ ] **Task 3.4**: Create shared form field components
  - File: `src/components/FormFields.jsx`
  - Reusable select, radio group, checkbox group, range input, toggle components
  - Consistent styling with Tailwind

- [ ] **Task 3.5**: Add form data constants
  - File: `src/lib/constants.js`
  - Body types: 마름, 보통, 통통
  - Face types: 강아지상, 고양이상, 공룡상, 여우상, 너구리상, etc.
  - Eye types: 무쌍, 겉쌍, 속쌍
  - MBTI options (16 types + 모름)
  - Religion options
  - Drinking levels
  - Contact frequency options: 1-5분, 5-10분, 10-30분, 1시간, 2시간, 3시간, 5시간이상, 하루이상
  - Hobby options: 헬스, 스포츠, 독서, 영화/드라마 시청, etc.

- [ ] **Task 3.6**: Save profile data to Supabase
  - Save to `profiles` and `ideal_preferences` tables
  - Handle loading/error states
  - Redirect to dashboard on completion

#### Quality Gate
- [ ] `npm run lint` passes
- [ ] `npm run build` succeeds
- [ ] All form fields render correctly with proper Korean labels
- [ ] Form validation works (required fields)
- [ ] University auto-fills from email domain
- [ ] Multi-step navigation works (next/back)
- [ ] Data saves to Supabase (or console.log if no Supabase yet)
- [ ] Mobile responsive — form usable on phone screens

---

### Phase 4: Profile Page
**Goal**: Users can view/edit their profile, see ideal type preferences, view match results
**Status**: Pending

#### Tasks

- [ ] **Task 4.1**: Create ProfilePage
  - File: `src/pages/ProfilePage.jsx`
  - Display all personal info fields (read-only mode)
  - Display ideal type preferences
  - "수정" button to switch to edit mode (reuses ProfileFormPage components)

- [ ] **Task 4.2**: Add matching status section
  - Show current/past matching event participation
  - If matched: display matched partner's public info
  - If not matched yet: show "매칭 대기 중" status

- [ ] **Task 4.3**: Add account deletion
  - "회원탈퇴" button with confirmation dialog
  - Calls `supabase.auth.admin.deleteUser()` or marks account as deleted
  - Redirects to landing page

- [ ] **Task 4.4**: Add route to App.jsx
  - `/profile` → ProfilePage (protected route)

#### Quality Gate
- [ ] `npm run lint` passes
- [ ] `npm run build` succeeds
- [ ] Profile displays all saved data correctly
- [ ] Edit mode allows modifying all fields
- [ ] Match status section renders correctly
- [ ] Account deletion confirmation works
- [ ] Mobile responsive

---

### Phase 5: Matching Application Page
**Goal**: Users can view current event and apply for matching with profile review
**Status**: Pending

#### Tasks

- [ ] **Task 5.1**: Create MatchApplyPage
  - File: `src/pages/MatchApplyPage.jsx`
  - Display current event info: period dates, target count, current count
  - "안내사항" section with rules/guidelines
  - "신청하기" button (disabled if event closed or full)

- [ ] **Task 5.2**: Add profile review modal/step
  - When user clicks "신청하기", show their current profile + ideal type
  - Options: "이대로 신청하기" (apply as-is) or "수정하기" (edit first)
  - If edit → navigate to profile form, return after save

- [ ] **Task 5.3**: Create Supabase table for applications
  - `matching_events` table: id, start_date, end_date, max_male, max_female, current_male, current_female, status (open/closed/completed)
  - `applications` table: id, event_id, user_id, profile_snapshot, preferences_snapshot, applied_at

- [ ] **Task 5.4**: Submit application logic
  - Save application to Supabase
  - Increment participant count
  - Show success confirmation
  - Auto-close event if capacity reached

- [ ] **Task 5.5**: Add route to App.jsx
  - `/apply` → MatchApplyPage (protected route)

#### Quality Gate
- [ ] `npm run lint` passes
- [ ] `npm run build` succeeds
- [ ] Event info displays correctly
- [ ] Profile review shows all user data before applying
- [ ] Application submits successfully
- [ ] Cannot apply twice to same event
- [ ] Mobile responsive

---

### Phase 6: Admin Page
**Goal**: Admin can manage users and matching events
**Status**: Pending

#### Tasks

- [ ] **Task 6.1**: Create AdminPage
  - File: `src/pages/AdminPage.jsx`
  - Only accessible by designated admin users
  - Tab or section layout: 회원 관리, 소개팅 관리

- [ ] **Task 6.2**: User management section
  - List all registered users
  - View user profiles
  - Delete/ban users if needed

- [ ] **Task 6.3**: Event management section
  - Create new matching event (set period, max participants)
  - Open/close event manually
  - Extend deadline or adjust capacity
  - View current applications for each event

- [ ] **Task 6.4**: Admin route protection
  - File: `src/components/AdminRoute.jsx`
  - Check if user has admin role (stored in Supabase user metadata or separate admin table)
  - Redirect non-admin users

- [ ] **Task 6.5**: Add route to App.jsx
  - `/admin` → AdminPage (admin-protected route)

#### Quality Gate
- [ ] `npm run lint` passes
- [ ] `npm run build` succeeds
- [ ] Admin page only accessible by admin users
- [ ] User list loads and displays correctly
- [ ] Event creation/management works
- [ ] Non-admin users cannot access admin page

---

### Phase 7 (Future): Matching Algorithm & Notifications
**Goal**: Implement weighted preference scoring, Gale-Shapley matching, email notifications
**Status**: Deferred (frontend-only for now)

#### Notes
This phase requires backend logic (Supabase Edge Functions or separate server):
- Weighted scoring: Assign weights to each preference field, calculate compatibility scores between all participant pairs
- Gale-Shapley algorithm: Use preference rankings to produce stable 1:1 matches
- Email notifications: Send match results with partner's contact info (phone, KakaoTalk, Instagram)
- This phase will be planned in detail when the frontend is complete

---

## Risk Assessment

| Risk | Probability | Impact | Mitigation Strategy |
|------|-------------|--------|---------------------|
| Supabase not configured | High | High | Use placeholder env vars; build UI with mock data first |
| Google OAuth domain restriction complexity | Medium | Medium | Validate domain after OAuth callback on frontend |
| Large form causes user abandonment | Medium | High | Multi-step form with progress indicator; save partial data |
| No test framework | Low | Medium | Manual testing per phase; add Vitest later if needed |

---

## Rollback Strategy

### Per Phase
Each phase creates new files or modifies existing ones. Rollback via `git revert` of the phase's commit(s). No database migrations are destructive — tables are additive only.

---

## Progress Tracking

### Completion Status
- **Phase 1 (Auth)**: 0%
- **Phase 2 (Dashboard)**: 0%
- **Phase 3 (Profile Form)**: 0%
- **Phase 4 (Profile Page)**: 0%
- **Phase 5 (Match Apply)**: 0%
- **Phase 6 (Admin)**: 0%
- **Phase 7 (Matching Algorithm)**: Deferred

**Overall Progress**: 0% complete

---

## Validation Commands

```bash
npm run lint       # ESLint check
npm run build      # Production build verification
npm run dev        # Manual testing on localhost:5173
```

---

## Notes & Learnings

### Implementation Notes
- (To be filled during implementation)

---

## References

- [Proposal (기획서)](proposal.md)
- [Gale-Shapley Algorithm](https://en.wikipedia.org/wiki/Gale%E2%80%93Shapley_algorithm)
- [Supabase Auth Docs](https://supabase.com/docs/guides/auth)
- [Supabase Database Docs](https://supabase.com/docs/guides/database)

---

**Plan Status**: Awaiting Approval
**Next Action**: User approval, then begin Phase 1
**Blocked By**: None
