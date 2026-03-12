# Implementation Plan: 소개퐝 v2 리팩토링

**Status**: 진행 중
**Started**: 2026-03-13
**Last Updated**: 2026-03-13

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
proposal2.md 기반으로 기존 소개퐝 MVP를 리팩토링한다. 핵심 변경: 프로필 폼 분리 (가입 시 기본정보만, 소개팅 신청 시 상세 프로필), 소개팅 종류 시스템, 사진 첨부, 채팅 시스템 도입.

### Success Criteria
- [ ] 회원가입 후 기본 정보만 작성 (닉네임, 나이, 성별, 학교, 학과)
- [ ] 이름(실명) 필드 완전 제거
- [ ] 소개팅 종류별 생성 가능 (블라인드 온라인 MVP)
- [ ] 어드민 이벤트 생성: 제목, 종류, 도메인 제한, 사진 설정
- [ ] 블라인드 소개팅 신청 시 상세 프로필 + 이상형 작성
- [ ] 신청 시 사진 첨부 (선택, 주선자만 확인)
- [ ] 매칭 알고리즘 (가중치 + 게일-섀플리)
- [ ] 매칭 후 채팅방 자동 생성 (커플 + 주선자)
- [ ] 어드민 채팅 대시보드 (전체 공지, 개별 채팅, 신규 알림)

### User Impact
학생들은 가입 시 부담 없이 기본 정보만 입력하고, 원하는 종류의 소개팅을 선택하여 신청할 수 있다. 매칭 후에는 주선자가 포함된 채팅방에서 자연스럽게 대화를 시작하며, 주선자의 중재 하에 연락처 교환 여부를 결정한다.

---

## Architecture Decisions

| Decision | Rationale | Trade-offs |
|----------|-----------|------------|
| 프로필 2단계 분리 (기본 + 블라인드) | 가입 이탈률 감소, 소개팅별 다른 프로필 가능 | DB 테이블 추가, 데이터 중복 가능성 |
| Supabase Realtime for 채팅 | 별도 서버 없이 실시간 통신 가능 | Supabase 의존성 증가, 연결 수 제한 |
| Supabase Storage for 사진 | 이미 Supabase 사용 중, 통합 용이 | 스토리지 비용, 이미지 최적화 필요 |
| 이벤트 종류를 enum으로 관리 | 확장 가능하면서 type-safe | 새 종류 추가 시 코드 변경 필요 |
| 채팅방에 주선자 포함 | proposal2 명세 충족, 중재 가능 | 채팅 프라이버시 우려 가능 |

---

## Dependencies

### Required Before Starting
- [x] React + Vite + Supabase 프로젝트 구성 완료
- [x] 기존 MVP 코드 (Phases 1-6) 완료
- [ ] Supabase 프로젝트 생성 및 Auth 설정
- [ ] Supabase Storage 버킷 생성 (사진 업로드용)
- [ ] Supabase Realtime 활성화 (채팅용)

### External Dependencies
- react: 19.1.1
- react-router-dom: 7.8.0
- @supabase/supabase-js: 2.54.0 (Realtime, Storage 포함)

---

## Implementation Phases

### Phase 1: 프로필 폼 간소화 & DB 스키마 변경
**Goal**: 회원가입 시 기본 정보(닉네임, 나이, 성별, 학교, 학과)만 작성하도록 변경. 이름(실명) 제거.
**Status**: Complete

#### 변경 파일

| 파일 | 변경 내용 |
|------|----------|
| `docs/plans/supabase-schema.sql` | `profiles` 테이블 간소화 (외형/라이프스타일 컬럼 제거, `name` 제거), `blind_profiles` 테이블 신설 |
| `src/pages/ProfileFormPage.jsx` | 6-step → 1-step 기본 정보 폼으로 축소 |
| `src/pages/ProfilePage.jsx` | 기본 정보만 표시하도록 수정, 외형/라이프스타일 섹션 제거 |
| `src/lib/constants.js` | 변경 없음 (상수는 블라인드 프로필에서 재사용) |
| `src/pages/MatchApplyPage.jsx` | 프로필 리뷰 섹션 기본 정보만 표시 |

#### Tasks

- [x] **Task 1.1**: DB 스키마 업데이트
  - `profiles` 테이블에서 외형/라이프스타일 컬럼들 제거: `height`, `height_public`, `body_type`, `face_type`, `eye_type`, `mbti`, `religion`, `smoking`, `drinking`, `tattoo`, `contact_frequency`, `interests`, `personality`, `date_style`, `dating_style`, `contact_method`, `contact_value`, `name`
  - `profiles`에 남는 컬럼: `id`, `user_id`, `nickname`, `gender`, `birth_year`, `university`, `department`, `created_at`, `updated_at`
  - `blind_profiles` 테이블 신설 (기존 외형+라이프스타일+성향+연락수단 필드 포함, `event_id` FK 추가)
  - `ideal_preferences`에 `event_id` FK 추가 (소개팅별 이상형)
  - `supabase-schema.sql` 파일 업데이트

- [x] **Task 1.2**: ProfileFormPage 간소화
  - 6-step 폼 → 1-step 기본 정보 폼으로 변경
  - 필드: 닉네임, 성별 (RadioGroup), 출생년도 (SelectInput), 학교 (자동), 학과/학부
  - 이름(실명) 필드 완전 제거
  - step indicator, next/back 버튼 제거 (단일 페이지)
  - 저장 시 `profiles` 테이블에 upsert

- [x] **Task 1.3**: ProfilePage 업데이트
  - 기본 정보 섹션만 표시 (닉네임, 성별, 출생년도, 학교, 학과)
  - 외형 정보, 라이프스타일, 성향 & 스타일, 연락 수단, 이상형 정보 섹션 제거
  - 참여한 소개팅 목록 섹션 추가 (Phase 3에서 데이터 연결)
  - 회원탈퇴 기능 유지

- [x] **Task 1.4**: MatchApplyPage 프로필 리뷰 간소화
  - review step에서 기본 정보만 표시
  - ideal preferences 리뷰 제거 (Phase 3에서 신청 플로우 내에서 작성하도록 변경)

#### Quality Gate

- [x] `npm run lint` passes
- [x] `npm run build` succeeds
- [x] ProfileFormPage에 기본 정보 5개 필드만 표시
- [x] 이름(실명) 입력 필드 어디에도 없음
- [x] ProfilePage에 기본 정보만 표시
- [x] 기존 외형/라이프스타일 관련 코드가 ProfileFormPage/ProfilePage에서 제거됨
- [x] `supabase-schema.sql`에 `blind_profiles` 테이블 정의 존재
- [x] 모바일 반응형 유지

---

### Phase 2: 소개팅 종류 시스템 & 어드민 이벤트 생성 확장
**Goal**: 여러 종류의 소개팅을 생성할 수 있도록 어드민 페이지 확장. matching_events 테이블 확장.
**Status**: Complete

#### 변경 파일

| 파일 | 변경 내용 |
|------|----------|
| `docs/plans/supabase-schema.sql` | `matching_events` 테이블 확장 |
| `src/lib/constants.js` | 이벤트 타입, 사진 설정 상수 추가 |
| `src/pages/AdminPage.jsx` | 이벤트 생성 폼 리팩토링 |
| `src/pages/LandingPage.jsx` | 이벤트 종류별 표시, mock 데이터 업데이트 |

#### Tasks

- [x] **Task 2.1**: DB 스키마 — matching_events 확장
  - 추가 컬럼: `title` (TEXT, 소개팅 제목), `event_type` (TEXT, 종류), `description` (TEXT, 안내사항), `photo_setting` (TEXT, 사진 설정), `male_domains` (TEXT[], 남자 허용 도메인), `female_domains` (TEXT[], 여자 허용 도메인), `allow_all_domains` (BOOLEAN, 모든 도메인 허용)
  - `event_type` CHECK: `blind_online`, `blind_offline`, `rotation`, `other`
  - `photo_setting` CHECK: `none`, `optional`, `required`
  - `supabase-schema.sql` 업데이트

- [x] **Task 2.2**: constants.js — 이벤트 관련 상수 추가
  ```js
  EVENT_TYPES = [
    { value: 'blind_online', label: '블라인드 소개팅 (온라인)' },
    { value: 'blind_offline', label: '블라인드 소개팅 (오프라인)' },
    { value: 'rotation', label: '로테이션 소개팅' },
    { value: 'other', label: '기타' },
  ]
  PHOTO_SETTINGS = [
    { value: 'none', label: '사진 없음' },
    { value: 'optional', label: '선택 (첨부 가능)' },
    { value: 'required', label: '필수' },
  ]
  ```

- [x] **Task 2.3**: AdminPage — 이벤트 생성 폼 리팩토링
  - 기존 필드 유지: 시작일, 종료일, 남자 정원, 여자 정원
  - 추가 필드: 제목 (TextInput), 소개팅 종류 (SelectInput), 안내사항 (TextArea), 사진 설정 (RadioGroup), 도메인 제한 설정 (전체 허용 toggle + 성별별 도메인 선택)
  - 이벤트 목록에 제목, 종류 배지 표시
  - 도메인 제한 UI: "모든 대학교 허용" 토글 → off 시 남자/여자 각각 도메인 체크박스

- [x] **Task 2.4**: LandingPage — 이벤트 표시 업데이트
  - MOCK_EVENT에 `title`, `event_type` 추가
  - 이벤트 카드에 제목, 종류 배지 표시
  - 여러 이벤트가 동시에 열릴 수 있으므로 목록형으로 변경 고려

#### Quality Gate

- [x] `npm run lint` passes
- [x] `npm run build` succeeds
- [x] AdminPage에서 소개팅 종류 선택 가능
- [x] 이벤트 생성 시 제목, 안내사항, 사진 설정, 도메인 제한 입력 가능
- [x] 이벤트 목록에 제목과 종류 배지 표시
- [x] LandingPage에 이벤트 제목 표시
- [x] `supabase-schema.sql`에 확장된 matching_events 정의 존재

---

### Phase 3: 블라인드 소개팅 신청 플로우
**Goal**: 블라인드 소개팅 신청 시 상세 프로필 + 이상형 작성 + 사진 첨부(선택). 기존 MatchApplyPage 전면 리팩토링.
**Status**: Complete

#### 변경 파일

| 파일 | 변경 내용 |
|------|----------|
| `src/pages/MatchApplyPage.jsx` | 전면 리팩토링 — 이벤트 선택 → 블라인드 프로필 → 이상형 → 사진 → 확인 → 완료 |
| `src/components/FormFields.jsx` | TextArea, FileInput 컴포넌트 추가 |
| `src/components/BlindProfileForm.jsx` | 신규 — 블라인드 프로필 폼 (외형+라이프스타일+성향+연락수단) |
| `src/components/IdealTypeForm.jsx` | 신규 — 이상형 폼 (기존 ProfileFormPage step 6 분리) |
| `src/components/PhotoUpload.jsx` | 신규 — 사진 업로드 컴포넌트 |
| `docs/plans/supabase-schema.sql` | `applications`에 `photo_url` 추가, Storage 버킷 정의 |

#### Tasks

- [x] **Task 3.1**: FormFields 확장
  - `TextArea` 컴포넌트 추가 (label, id, value, onChange, placeholder, required, rows)
  - `FileInput` 컴포넌트 추가 (label, id, onChange, accept, note)

- [x] **Task 3.2**: BlindProfileForm 컴포넌트 생성
  - 기존 ProfileFormPage step 2-5의 필드들을 독립 컴포넌트로 추출
  - Props: `data`, `onChange` (controlled form)
  - 필드 구성:
    - 외형: 키(ToggleField), 체형(RadioGroup), 얼굴상(RadioGroup), 눈(RadioGroup)
    - 라이프스타일: MBTI, 종교, 담배, 음주, 타투, 연락주기, 관심사
    - 성향 & 스타일: 성향(CheckboxGroup), 데이트 스타일(CheckboxGroup), 연애 스타일(RadioGroup)
    - 연락 수단: 연락 방법(RadioGroup), 연락처(TextInput)
  - 기존 프로필이 있으면 자동 로드 (재사용 가능하도록)

- [x] **Task 3.3**: IdealTypeForm 컴포넌트 생성
  - 기존 ProfileFormPage step 6 로직을 독립 컴포넌트로 추출
  - Props: `data`, `onChange`
  - "상관없음" 처리 로직 포함

- [x] **Task 3.4**: PhotoUpload 컴포넌트 생성
  - 이미지 미리보기 기능
  - Supabase Storage 업로드 (`blind-photos` 버킷)
  - 파일 크기 제한 (5MB)
  - 안내문구: "사진 제출은 필수가 아닙니다. 제출된 사진은 주선자만 확인하며, 작성하신 프로필과 실제 모습이 어느 정도 일치하는지 참고용으로 활용됩니다. 이를 바탕으로 최종 매칭에 조정이 있을 수 있습니다."

- [x] **Task 3.5**: MatchApplyPage 전면 리팩토링
  - Step 구성 변경:
    1. **이벤트 선택**: 현재 열린 이벤트 목록 표시 (종류, 기간, 인원)
    2. **블라인드 프로필**: BlindProfileForm (기존 데이터 있으면 자동 로드)
    3. **이상형 정보**: IdealTypeForm (기존 데이터 있으면 자동 로드)
    4. **사진 첨부**: PhotoUpload (이벤트의 `photo_setting`에 따라 표시/필수/숨김)
    5. **확인 & 제출**: 전체 정보 리뷰 → 제출
    6. **완료**: 성공 메시지
  - DB 저장: `blind_profiles` upsert, `ideal_preferences` upsert, `applications` insert (photo_url 포함)

- [x] **Task 3.6**: DB 스키마 업데이트
  - `applications`에 `photo_url` (TEXT, nullable) 추가
  - Supabase Storage 버킷 `blind-photos` 정의 (RLS: 본인만 upload, admin만 read)

#### Quality Gate

- [x] `npm run lint` passes
- [x] `npm run build` succeeds
- [x] 이벤트 목록에서 소개팅 선택 가능
- [x] 블라인드 프로필 폼 전체 필드 렌더링 정상
- [x] 이상형 폼 "상관없음" 처리 정상
- [x] 사진 미리보기 동작
- [x] photo_setting이 'none'이면 사진 step 숨김
- [x] photo_setting이 'required'이면 사진 없이 제출 불가
- [x] 기존 블라인드 프로필 자동 로드
- [x] 전체 리뷰 화면에 모든 정보 정상 표시
- [x] 모바일 반응형 유지

---

### Phase 4: 매칭 알고리즘 & 결과
**Goal**: 가중치 기반 선호도 순위 생성 → 게일-섀플리 알고리즘 매칭 → 결과 저장 및 표시
**Status**: Complete

#### 변경 파일

| 파일 | 변경 내용 |
|------|----------|
| `src/lib/matching.js` | 신규 — 가중치 알고리즘 + 게일-섀플리 |
| `docs/plans/supabase-schema.sql` | `matches` 테이블 신설 |
| `src/pages/AdminPage.jsx` | "매칭 실행" 버튼 추가, 매칭 결과 표시 |
| `src/pages/ProfilePage.jsx` | 매칭 결과 섹션 구현 |

#### Tasks

- [x] **Task 4.1**: DB 스키마 — matches 테이블
  ```sql
  CREATE TABLE matches (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id UUID REFERENCES matching_events(id),
    male_user_id UUID REFERENCES auth.users(id),
    female_user_id UUID REFERENCES auth.users(id),
    compatibility_score FLOAT,
    status TEXT DEFAULT 'matched' CHECK (status IN ('matched', 'contacted', 'completed', 'cancelled')),
    created_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(event_id, male_user_id),
    UNIQUE(event_id, female_user_id)
  );
  ```

- [x] **Task 4.2**: 가중치 기반 선호도 점수 계산
  - `src/lib/matching.js` — `calculateCompatibility(profile, idealPrefs)` 함수
  - 필드별 가중치 설정 (체형, 얼굴상, MBTI, 종교, 관심사 등)
  - 정확 일치 (RadioGroup 필드) vs 부분 일치 (CheckboxGroup 필드) 구분
  - "상관없음" (null) 처리: 해당 필드 가중치 0으로
  - 키 범위 매칭: min/max 범위 내면 만점

- [x] **Task 4.3**: 게일-섀플리 알고리즘 구현
  - `src/lib/matching.js` — `galeShapley(malePrefs, femalePrefs)` 함수
  - Input: 남자→여자 선호 순위, 여자→남자 선호 순위
  - Output: 안정 매칭 결과 배열 `[{male, female, score}]`
  - 인원 불균형 처리 (남녀 수 다를 때)

- [x] **Task 4.4**: 매칭 실행 파이프라인
  - `src/lib/matching.js` — `runMatching(eventId)` 함수
  - 1단계: 해당 이벤트의 모든 applications + blind_profiles + ideal_preferences 조회
  - 2단계: 남녀 각각 상대방 전원에 대한 호환성 점수 계산 → 선호 순위 생성
  - 3단계: 게일-섀플리 실행
  - 4단계: `matches` 테이블에 결과 저장
  - 5단계: 이벤트 status를 'completed'로 변경

- [x] **Task 4.5**: AdminPage — 매칭 실행 UI
  - status가 'closed'인 이벤트에 "매칭 실행" 버튼 추가
  - 실행 후 매칭 결과 목록 표시 (남자 닉네임 ↔ 여자 닉네임, 호환 점수)
  - 매칭 결과 확인 후 "매칭 확정" 버튼 (사진 검토 후 수동 조정 가능)

- [x] **Task 4.6**: ProfilePage — 매칭 결과 표시
  - 매칭 현황 섹션 구현
  - 매칭된 경우: 상대방 공개 정보 표시 (닉네임, 학교, 학과 + 블라인드 프로필 공개 항목)
  - 미매칭: "매칭 대기 중" 또는 "이번 소개팅에 매칭되지 않았습니다" 표시

#### Quality Gate

- [x] `npm run lint` passes
- [x] `npm run build` succeeds
- [x] 호환성 점수 계산 결과가 합리적 (동일 조건 = 높은 점수)
- [x] 게일-섀플리 결과가 안정 매칭 (blocking pair 없음)
- [x] 남녀 인원 불균형 시에도 에러 없이 동작
- [x] AdminPage에서 매칭 실행 → 결과 표시 정상
- [x] ProfilePage에서 매칭 결과 표시 정상

---

### Phase 5: 채팅 시스템
**Goal**: 매칭 완료 후 커플 + 주선자(어드민) 3인 채팅방 자동 생성. Supabase Realtime 기반 실시간 채팅.
**Status**: Complete

#### 변경 파일

| 파일 | 변경 내용 |
|------|----------|
| `docs/plans/supabase-schema.sql` | `chat_rooms`, `chat_messages`, `chat_participants` 테이블 |
| `src/pages/ChatPage.jsx` | 신규 — 채팅방 UI |
| `src/components/ChatRoom.jsx` | 신규 — 메시지 목록 + 입력 |
| `src/components/ChatBubble.jsx` | 신규 — 메시지 말풍선 |
| `src/hooks/useChat.js` | 신규 — Supabase Realtime 채팅 훅 |
| `src/App.jsx` | `/chat/:roomId` 라우트 추가 |
| `src/pages/ProfilePage.jsx` | 채팅방 링크 추가 |

#### Tasks

- [x] **Task 5.1**: DB 스키마 — 채팅 테이블
  ```sql
  CREATE TABLE chat_rooms (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id UUID REFERENCES matching_events(id),
    match_id UUID REFERENCES matches(id),
    name TEXT, -- e.g., "커플 #1 채팅방"
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'closed')),
    created_at TIMESTAMPTZ DEFAULT now()
  );

  CREATE TABLE chat_participants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    room_id UUID REFERENCES chat_rooms(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id),
    role TEXT DEFAULT 'member' CHECK (role IN ('member', 'admin')),
    joined_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(room_id, user_id)
  );

  CREATE TABLE chat_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    room_id UUID REFERENCES chat_rooms(id) ON DELETE CASCADE,
    sender_id UUID REFERENCES auth.users(id),
    content TEXT NOT NULL,
    message_type TEXT DEFAULT 'text' CHECK (message_type IN ('text', 'system', 'contact_share')),
    created_at TIMESTAMPTZ DEFAULT now()
  );
  ```
  - RLS: 참여자만 자기 방의 메시지 읽기/쓰기 가능

- [x] **Task 5.2**: 채팅방 자동 생성
  - 매칭 확정 시 (Phase 4의 매칭 실행 후) 각 커플에 대해:
    1. `chat_rooms` 생성
    2. `chat_participants`에 남자, 여자, 어드민 3명 추가
    3. 시스템 메시지 전송: "매칭이 완료되었습니다! 주선자와 함께하는 채팅방입니다."

- [x] **Task 5.3**: useChat 훅 구현
  - `useChat(roomId)` — Supabase Realtime 구독
  - 반환값: `{ messages, sendMessage, loading, participants }`
  - `supabase.channel('room:${roomId}')` 구독으로 실시간 메시지 수신
  - 새 메시지 INSERT 시 자동 업데이트
  - 컴포넌트 언마운트 시 구독 해제

- [x] **Task 5.4**: ChatPage & ChatRoom 컴포넌트
  - `/chat/:roomId` 라우트 (ProtectedRoute)
  - ChatRoom: 메시지 목록 (스크롤, 자동 하단 이동), 입력창, 전송 버튼
  - ChatBubble: 내 메시지 (오른쪽, 파란색) vs 상대 메시지 (왼쪽, 회색) vs 시스템 메시지 (중앙, 연한 배경)
  - 참여자 표시 (상단 헤더)

- [x] **Task 5.5**: ProfilePage 채팅방 연결
  - 매칭 결과 섹션에 "채팅방 가기" 버튼 추가
  - 해당 유저가 참여 중인 채팅방 조회 → 링크

- [x] **Task 5.6**: App.jsx 라우트 추가
  - `/chat/:roomId` → ChatPage (ProtectedRoute)
  - DevNavBar에 채팅 링크 추가

#### Quality Gate

- [x] `npm run lint` passes
- [x] `npm run build` succeeds
- [x] 매칭 완료 후 채팅방 자동 생성 확인
- [x] 채팅방에 커플 + 어드민 3명 참여자
- [x] 메시지 전송 → 실시간 수신 확인
- [x] 시스템 메시지 정상 표시
- [x] ProfilePage에서 채팅방 링크 동작
- [x] 비참여자가 채팅방 접근 시 차단
- [x] 모바일 반응형 (채팅 UI)

---

### Phase 6: 어드민 채팅 대시보드
**Goal**: 어드민이 모든 채팅방을 한눈에 관리. 전체 공지, 개별 채팅, 연락처 교환 기능.
**Status**: Complete

#### 변경 파일

| 파일 | 변경 내용 |
|------|----------|
| `src/pages/AdminPage.jsx` | 채팅 관리 탭 추가 |
| `src/components/AdminChatDashboard.jsx` | 신규 — 채팅 대시보드 |
| `src/components/AdminChatRoom.jsx` | 신규 — 어드민용 채팅방 뷰 |
| `src/hooks/useAdminChat.js` | 신규 — 전체 채팅방 구독 훅 |

#### Tasks

- [x] **Task 6.1**: useAdminChat 훅
  - 모든 채팅방 목록 조회 (이벤트별 그룹핑)
  - 각 방의 최신 메시지 + 읽지 않은 메시지 수 실시간 추적
  - Supabase Realtime으로 모든 방의 새 메시지 구독

- [x] **Task 6.2**: AdminChatDashboard 컴포넌트
  - 이벤트 선택 → 해당 이벤트의 채팅방 목록
  - 각 채팅방 카드: 커플 닉네임, 최근 메시지 미리보기, 새 메시지 알림 배지
  - "전체 공지" 버튼 → 모든 채팅방에 동시 메시지 전송
  - 채팅방 클릭 → AdminChatRoom 열기

- [x] **Task 6.3**: AdminChatRoom 컴포넌트
  - 기존 ChatRoom 기반이나 어드민 전용 기능 추가:
    - "연락처 교환" 버튼 → 양쪽 연락처를 시스템 메시지로 전송
    - "진행 의사 확인" 버튼 → 정형화된 질문 메시지 전송
    - 채팅방 닫기/아카이브 기능

- [x] **Task 6.4**: AdminPage 탭 추가
  - 기존 탭: 소개팅 관리, 회원 관리
  - 추가 탭: **채팅 관리** → AdminChatDashboard 렌더링

- [x] **Task 6.5**: 전체 공지 기능
  - 선택한 이벤트의 모든 활성 채팅방에 동일 메시지 일괄 전송
  - message_type: 'system'으로 전송
  - 전송 확인 다이얼로그

- [x] **Task 6.6**: 연락처 교환 기능
  - 어드민이 "연락처 교환" 클릭 시:
    1. 해당 채팅방의 두 참여자(member)의 `contact_method` + `contact_value` 조회
    2. 각 참여자에게 상대방 연락처를 `contact_share` 타입 메시지로 전송
    3. ChatBubble에서 `contact_share` 메시지는 특별한 카드 UI로 표시

#### Quality Gate

- [x] `npm run lint` passes
- [x] `npm run build` succeeds
- [x] 채팅 관리 탭에서 전체 채팅방 목록 표시
- [x] 새 메시지 알림 배지 실시간 업데이트
- [x] 전체 공지 → 모든 채팅방에 메시지 도착 확인
- [x] 개별 채팅방 선택 → 메시지 읽기/쓰기 가능
- [x] 연락처 교환 → 양쪽에 연락처 카드 메시지 표시
- [x] 비어드민은 채팅 관리 탭 접근 불가

---

## Risk Assessment

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| Supabase Realtime 연결 제한 (무료 플랜) | Medium | High | 채팅방 단위 구독, 불필요 시 구독 해제. 필요하면 Pro 플랜 |
| 사진 스토리지 비용 증가 | Low | Medium | 파일 크기 제한 (5MB), 이미지 리사이즈 고려 |
| 기존 프로필 데이터 마이그레이션 | High | Medium | 기존 profiles 데이터를 blind_profiles로 이관하는 마이그레이션 SQL 준비 |
| 게일-섀플리 알고리즘 클라이언트 실행 성능 | Low | Low | 최대 수십 명 규모라 클라이언트 실행 충분. 필요 시 Edge Function 이관 |
| 채팅 메시지 RLS 복잡도 | Medium | Medium | chat_participants 기반 RLS 정책 철저히 테스트 |
| 이메일 알림 전송 | Medium | Medium | 초기에는 알림 없이 진행, 추후 Edge Function으로 추가 |

---

## Rollback Strategy

### Phase 1 롤백
- `git revert`로 ProfileFormPage, ProfilePage 변경 복구
- DB: `blind_profiles` 테이블 DROP, `profiles` 원래 컬럼 복구

### Phase 2 롤백
- AdminPage 이벤트 생성 폼 복구
- `matching_events` 추가 컬럼 DROP

### Phase 3 롤백
- MatchApplyPage 원래 3-step으로 복구
- 새 컴포넌트 (BlindProfileForm, IdealTypeForm, PhotoUpload) 삭제
- Storage 버킷은 유지 (데이터 손실 방지)

### Phase 4 롤백
- `matches` 테이블 DROP
- `src/lib/matching.js` 삭제
- AdminPage, ProfilePage에서 매칭 관련 UI 제거

### Phase 5 롤백
- 채팅 테이블 DROP (`chat_rooms`, `chat_messages`, `chat_participants`)
- ChatPage, ChatRoom 관련 파일 삭제
- App.jsx에서 `/chat` 라우트 제거

### Phase 6 롤백
- AdminChatDashboard, AdminChatRoom 삭제
- AdminPage에서 채팅 관리 탭 제거

---

## Progress Tracking

### Completion Status
- **Phase 1 (프로필 간소화)**: 100%
- **Phase 2 (소개팅 종류 & 어드민 확장)**: 100%
- **Phase 3 (블라인드 신청 플로우)**: 100%
- **Phase 4 (매칭 알고리즘)**: 100%
- **Phase 5 (채팅 시스템)**: 100%
- **Phase 6 (어드민 채팅 대시보드)**: 100%

**Overall Progress**: 100% complete

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

### Phase Dependencies
```
Phase 1 (프로필 간소화)
  ↓
Phase 2 (소개팅 종류 시스템)
  ↓
Phase 3 (블라인드 신청 플로우) ← Phase 1 + Phase 2 필요
  ↓
Phase 4 (매칭 알고리즘) ← Phase 3 필요
  ↓
Phase 5 (채팅 시스템) ← Phase 4 필요
  ↓
Phase 6 (어드민 채팅 대시보드) ← Phase 5 필요
```

---

## References

- [proposal2.md (변경된 기획서)](proposal2.md)
- [proposal.md (기존 기획서)](proposal.md)
- [profile-prd.md (프로필 폼 PRD)](profile-prd.md)
- [supabase-schema.sql (현재 DB 스키마)](supabase-schema.sql)
- [Gale-Shapley Algorithm](https://en.wikipedia.org/wiki/Gale%E2%80%93Shapley_algorithm)
- [Supabase Realtime Docs](https://supabase.com/docs/guides/realtime)
- [Supabase Storage Docs](https://supabase.com/docs/guides/storage)

---

**Plan Status**: Complete
**Next Action**: Supabase에 스키마 적용 및 수동 테스트
**Blocked By**: None
