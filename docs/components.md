# Components Documentation

## Route Guards

### ProtectedRoute

**File**: `src/components/ProtectedRoute.jsx`

Wrapper component that redirects unauthenticated users to `/login`.

```jsx
<ProtectedRoute>
  <ProfilePage />
</ProtectedRoute>
```

| Prop | Type | Description |
|------|------|-------------|
| children | ReactNode | The protected page component |

**Behavior**: Shows "로딩 중..." while checking auth state. Redirects via `<Navigate to="/login" replace />` if no user.

---

### AdminRoute

**File**: `src/components/AdminRoute.jsx`

Extends ProtectedRoute with admin email check.

```jsx
<AdminRoute>
  <AdminPage />
</AdminRoute>
```

**Behavior**: Same as ProtectedRoute, plus checks `ADMIN_EMAILS.includes(user.email)`. Shows "접근 권한이 없습니다" message for non-admin users.

**Configuration**: Admin emails are defined in `src/lib/constants.js` → `ADMIN_EMAILS` array.

---

## Form Components

**File**: `src/components/FormFields.jsx`

All form components use Tailwind styling with primary color (#007AFF) for selected/focused states.

### TextInput

Standard text input with label and optional note.

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| label | string | Yes | Field label |
| id | string | Yes | HTML id attribute |
| value | string | Yes | Controlled value |
| onChange | function | Yes | Called with new string value |
| placeholder | string | No | Input placeholder |
| required | boolean | No | Shows red asterisk |
| note | string | No | Small gray hint text below label |

---

### NumberInput

Number input with optional unit label.

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| label | string | Yes | Field label |
| id | string | Yes | HTML id |
| value | string | Yes | Controlled value |
| onChange | function | Yes | Called with new string value |
| placeholder | string | No | Placeholder |
| required | boolean | No | Shows asterisk |
| min | number | No | Minimum value |
| max | number | No | Maximum value |
| unit | string | No | Unit label (e.g., "cm", "kg") |

---

### SelectInput

Dropdown select with options.

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| label | string | Yes | Field label |
| id | string | Yes | HTML id |
| value | string | Yes | Controlled value |
| onChange | function | Yes | Called with new string value |
| options | string[] | Yes | Array of option strings |
| required | boolean | No | Shows asterisk |
| placeholder | string | No | Default empty option text (default: "선택해주세요") |

---

### RadioGroup

Horizontal button-style radio group.

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| label | string | Yes | Group label |
| name | string | Yes | HTML radio name |
| value | string | Yes | Currently selected value |
| onChange | function | Yes | Called with selected string value |
| options | string[] | Yes | Array of option strings |
| required | boolean | No | Shows asterisk |

**Styling**: Selected option gets `bg-primary text-white border-primary`. Options wrap via `flex-wrap`.

---

### CheckboxGroup

Multi-select button-style checkbox group.

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| label | string | Yes | Group label |
| name | string | Yes | HTML checkbox name |
| values | string[] | Yes | Array of selected values |
| onChange | function | Yes | Called with updated values array |
| options | string[] | Yes | Array of option strings |

**Behavior**: Toggles items in/out of the values array. Same visual style as RadioGroup.

---

### RangeInput

Min/max number input pair for range selection.

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| label | string | Yes | Field label |
| id | string | Yes | Base HTML id (appends `-min`/`-max`) |
| minValue | string | Yes | Min field value |
| maxValue | string | Yes | Max field value |
| onMinChange | function | Yes | Called with new min string |
| onMaxChange | function | Yes | Called with new max string |
| unit | string | No | Unit label |
| minPlaceholder | string | No | Min input placeholder (default: "최소") |
| maxPlaceholder | string | No | Max input placeholder (default: "최대") |

**Layout**: Two number inputs side by side with "~" separator.

---

### ToggleField

Number input with a public/private toggle button.

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| label | string | Yes | Field label |
| id | string | Yes | HTML id |
| value | string | Yes | Number input value |
| onChange | function | Yes | Called with new string value |
| publicValue | boolean | Yes | Whether field is public |
| onPublicChange | function | Yes | Called with new boolean |

**Styling**: Toggle shows "공개" (green) or "비공개" (gray).

---

### TextArea (v2 추가)

Multi-line text input.

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| label | string | Yes | Field label |
| id | string | Yes | HTML id |
| value | string | Yes | Controlled value |
| onChange | function | Yes | Called with new string value |
| placeholder | string | No | Placeholder |
| required | boolean | No | Shows asterisk |
| rows | number | No | Textarea rows (default: 3) |

---

### FileInput (v2 추가)

File upload input with custom styling.

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| label | string | Yes | Field label |
| id | string | Yes | HTML id |
| onChange | function | Yes | Called with File object or null |
| accept | string | No | Accept attribute (e.g., "image/*") |
| note | string | No | Hint text below label |

---

## Blind Date Components (v2 추가)

### BlindProfileForm

**File**: `src/components/BlindProfileForm.jsx`

Controlled form for blind date detailed profile. Used in MatchApplyPage step 2.

| Prop | Type | Description |
|------|------|-------------|
| data | object | Current form data (all blind profile fields) |
| onChange | function | Called with updated data object |
| gender | string | 사용자 성별 ('남자' / '여자'). 남자일 때 군복무 필드 표시 |

**Sections**:
1. 외형 정보: 키 (ToggleField), 체형, 얼굴상, 눈 (RadioGroup)
2. 라이프스타일: MBTI, 종교, 담배, 음주, 타투, 군복무 (남자만), 연락주기, 관심사
3. 성향 & 스타일: 나의 성향 (CheckboxGroup), 데이트 스타일 (CheckboxGroup), 연애 스타일 (RadioGroup)
4. 연락 수단: 연락 방법 (RadioGroup), 연락처 (TextInput, 조건부 표시)

---

### IdealTypeForm

**File**: `src/components/IdealTypeForm.jsx`

Controlled form for ideal type preferences. Used in MatchApplyPage step 3.

| Prop | Type | Description |
|------|------|-------------|
| data | object | Current ideal type data |
| onChange | function | Called with updated data object |
| gender | string | 사용자 성별 ('남자' / '여자'). 여자일 때 선호 군복무 필드 표시 |

**Features**:
- 모든 필드에 "상관없음" 옵션 (RadioGroup: 첫 옵션, CheckboxGroup/RangeInput: 별도 버튼)
- 키: RangeInput (min/max) + "상관없음" 클리어 버튼
- NocareButton 내부 컴포넌트로 상관없음 활성 상태 표시
- 여자일 때 "선호 군복무" 필드 표시 (상관없음/완료/아직)

---

### PhotoUpload

**File**: `src/components/PhotoUpload.jsx`

Image upload with preview, size validation, and guidance text.

| Prop | Type | Description |
|------|------|-------------|
| file | File \| null | Currently selected file |
| onFileChange | function | Called with File or null |
| required | boolean | Whether photo is mandatory |

**Features**:
- 10MB 파일 크기 제한
- 이미지 파일만 허용 (`image/*`)
- **자동 리사이징**: 긴 변 1920px 초과 시 비율 유지하며 축소, JPEG 85% 품질로 변환
- 리사이징 처리 중 "이미지 처리 중..." 표시
- 선택 시 미리보기 표시
- 안내문구: 주선자만 확인, 프로필 일치 참고용
- required=true일 때 미첨부 시 경고 메시지

---

### AdminChatDashboard

**File**: `src/components/AdminChatDashboard.jsx`

Admin chat management interface. Used in AdminPage "채팅 관리" tab.

**Features**:
- **소개팅별 채팅 그룹화**: 이벤트 탭으로 채팅방 필터링 (이벤트 제목 + 읽지 않은 메시지/멘션 배지)
- **전체 공지**: 선택된 이벤트 또는 모든 활성 채팅방에 시스템 메시지 일괄 전송
- **채팅방 목록**: 커플 닉네임, 최근 메시지, 읽지 않은 메시지 수 배지(빨강), @주선자 태그 알림 배지(앰버), 활성/종료 상태
- **참가자 프로필 카드**: 채팅방 상단에 매칭된 두 참가자의 프로필 + 제출 사진 표시 (applications.photo_url)
- **개별 채팅방** (AdminChatRoom):
  - 메시지 읽기/쓰기 (useChat 훅)
  - 어드민 자동 참여자 등록
  - 읽음 처리: 채팅방 열기/닫기 시 `last_read_at` 업데이트

---

## UI Components

### DevNavBar

**File**: `src/components/DevNavBar.jsx`

Fixed bottom navigation bar, only visible in development mode.

**Features**:
- Links to all pages with active state highlighting
- Shows current user email (green) when logged in
- Dev login button (orange) / logout button (red)
- Only renders when `import.meta.env.DEV` is true

---

### Logo

**File**: `src/components/Logo.jsx`

Renders the SVG logo as a clickable link.

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| size | `'sm'` \| `'md'` \| `'lg'` | `'md'` | Logo height (h-6 / h-8 / h-12) |
| linkTo | string | `'/'` | Navigation target |

---

## Context & Hooks

### AuthContext / AuthProvider

**Files**: `src/context/AuthContext.jsx`, `src/context/authContextValue.js`

Provides auth state and methods to the entire app.

**Provided values**:

| Value | Type | Description |
|-------|------|-------------|
| user | object \| null | Current Supabase user (or mock dev user) |
| loading | boolean | True while checking initial session |
| signInWithGoogle | async function | Triggers Google OAuth via Supabase |
| signOut | async function | Signs out and clears user state |
| devLogin | function(email?) | Creates mock user for dev mode |

**Note**: Context object is in a separate file (`authContextValue.js`) to satisfy `eslint-plugin-react-refresh` which doesn't allow exporting non-components alongside components.

### useAuth

**File**: `src/hooks/useAuth.js`

```jsx
const { user, loading, signInWithGoogle, signOut, devLogin } = useAuth();
```

Throws `Error('useAuth must be used within an AuthProvider')` if used outside provider.

---

### useChat (v2 추가)

**File**: `src/hooks/useChat.js`

Real-time chat hook using Supabase Realtime.

```jsx
const { messages, participants, loading, sendMessage } = useChat(roomId);
```

| Return | Type | Description |
|--------|------|-------------|
| messages | array | All messages in the room (sorted by created_at) |
| participants | array | Room participants with profile data |
| loading | boolean | Initial data loading state |
| sendMessage | async function(content, type?) | Send a message (default type: 'text') |

**Behavior**:
- Subscribes to `postgres_changes` INSERT on `chat_messages` filtered by room_id
- Auto-updates messages array on new message
- Unsubscribes on unmount

---

### useAdminChat (v2 추가)

**File**: `src/hooks/useAdminChat.js`

Admin hook for managing all chat rooms.

```jsx
const { rooms, loading, markAsRead, refetch } = useAdminChat();
```

| Return | Type | Description |
|--------|------|-------------|
| rooms | array | All chat rooms with participants, messages, latest message |
| loading | boolean | Initial loading state |
| markAsRead | async function(roomId) | Update `last_read_at` for admin in the specified room |
| refetch | function | Manually refetch all rooms |

**Enriched room data**: `latestMessage`, `memberNames`, `unreadCount`, `hasMention`, `eventTitle`

**Behavior**:
- Subscribes to all new `chat_messages` INSERT events, refetches rooms on change
- Profiles fetched separately (no FK join) via `.in('user_id', userIds)`
- Fetches event info for room grouping by event
- Calculates `unreadCount` and `hasMention` based on `last_read_at` timestamp
- `hasMention` detects '@주선자' in unread messages

---

## Library Modules

### matching.js (v2 추가)

**File**: `src/lib/matching.js`

Matching algorithm implementation.

**Exported functions**:

| Function | Description |
|----------|-------------|
| `calculateCompatibility(profile, idealPrefs)` | 가중치 기반 호환성 점수 계산 (0-100). 필드별 가중치, 정확/부분 일치, 상관없음(null) 처리. |
| `galeShapley(malePrefs, femalePrefs)` | 게일-섀플리 안정 매칭 알고리즘. 남녀 인원 불균형 처리 포함. |
| `runMatching(eventId)` | 전체 매칭 파이프라인: 신청 조회 → 점수 계산 → 매칭 → 결과 저장 → 채팅방 생성 → 이벤트 완료 처리 |

**Field weights** (높을수록 중요):
- 4: smoking
- 3: body_type, face_type, religion, height
- 2: mbti, drinking, tattoo, interests, personality, dating_style
- 1: eye_type, contact_frequency, date_style
