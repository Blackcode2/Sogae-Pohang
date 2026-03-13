# Data Model & Constants

## Database Schema

Full SQL: [`docs/plans/supabase-schema.sql`](plans/supabase-schema.sql)

### profiles

기본 정보만 저장 (v2에서 간소화됨. 외형/라이프스타일은 blind_profiles로 분리).

| Column | Type | Nullable | Description |
|--------|------|----------|-------------|
| id | UUID | No | Primary key |
| user_id | UUID | No | References auth.users, unique |
| nickname | TEXT | No | Display name |
| gender | TEXT | No | 남자 / 여자 |
| birth_year | INTEGER | No | e.g., 2001 |
| university | TEXT | No | Auto-filled from email domain |
| department | TEXT | No | 학과/학부 |
| created_at | TIMESTAMPTZ | No | Auto |
| updated_at | TIMESTAMPTZ | No | Auto |

### blind_profiles (v2 추가)

블라인드 소개팅 상세 프로필. 소개팅별로 별도 저장 가능.

| Column | Type | Nullable | Description |
|--------|------|----------|-------------|
| id | UUID | No | Primary key |
| user_id | UUID | No | References auth.users |
| event_id | UUID | Yes | References matching_events (nullable for reusable profile) |
| height | INTEGER | Yes | cm |
| height_public | BOOLEAN | No | Default: true |
| body_type | TEXT | No | 마름 / 보통 / 근육 탄탄 / 통통 |
| face_type | TEXT | No | 11 animal/style types |
| eye_type | TEXT | No | 유쌍 / 무쌍 |
| mbti | TEXT | No | 16 MBTI types + 모름 |
| religion | TEXT | No | 무교 / 기독교 / 천주교 / 불교 / 기타 |
| smoking | TEXT | No | 비흡연 / 흡연 / 가끔 |
| drinking | TEXT | No | 5 levels |
| tattoo | TEXT | No | 없음 / 있음 |
| military_service | TEXT | Yes | 완료 / 아직 (남자만 입력, 여자는 null) |
| contact_frequency | TEXT | No | 8 levels (1-5분 ~ 하루 이상) |
| interests | TEXT[] | No | Multi-select from 9 options |
| personality | TEXT[] | No | Multi-select from 8 options |
| date_style | TEXT[] | No | Multi-select from 6 options |
| dating_style | TEXT | Yes | 4 options |
| contact_method | TEXT | No | 전화번호 / 카카오톡 ID / 인스타그램 / 기타 |
| contact_value | TEXT | No | Actual contact info |
| created_at | TIMESTAMPTZ | No | Auto |
| updated_at | TIMESTAMPTZ | No | Auto |

**Constraint**: `UNIQUE(user_id, event_id)`

### ideal_preferences

이상형 정보. 소개팅별로 별도 저장 가능 (v2에서 event_id 추가).

| Column | Type | Nullable | Description |
|--------|------|----------|-------------|
| id | UUID | No | Primary key |
| user_id | UUID | No | References auth.users |
| event_id | UUID | Yes | References matching_events |
| height_min | INTEGER | Yes | Minimum preferred height (cm) |
| height_max | INTEGER | Yes | Maximum preferred height (cm) |
| body_type | TEXT | Yes | Preferred body type |
| face_type | TEXT | Yes | Preferred face type |
| eye_type | TEXT | Yes | Preferred eye type |
| mbti | TEXT | Yes | Preferred MBTI |
| religion | TEXT | Yes | Preferred religion |
| smoking | TEXT | Yes | Preferred smoking status |
| drinking | TEXT | Yes | Preferred drinking level |
| tattoo | TEXT | Yes | Preferred tattoo status |
| military_service | TEXT | Yes | Preferred military service (여자만 선택, 완료/아직/null=상관없음) |
| contact_frequency | TEXT | Yes | Preferred contact frequency |
| interests | TEXT[] | No | Preferred interests (empty = no preference) |
| personality | TEXT[] | No | Preferred personality traits |
| date_style | TEXT[] | No | Preferred date styles |
| dating_style | TEXT | Yes | Preferred dating style |
| created_at | TIMESTAMPTZ | No | Auto |
| updated_at | TIMESTAMPTZ | No | Auto |

**Constraint**: `UNIQUE(user_id, event_id)`

### matching_events

어드민이 관리하는 소개팅 이벤트 (v2에서 확장됨).

| Column | Type | Nullable | Description |
|--------|------|----------|-------------|
| id | UUID | No | Primary key |
| title | TEXT | No | 이벤트 제목 |
| event_type | TEXT | No | blind_online / blind_offline / rotation / other |
| description | TEXT | Yes | 안내사항 |
| photo_setting | TEXT | No | none / optional / required (default: none) |
| start_date | DATE | No | Event start |
| end_date | DATE | No | Event end |
| max_male | INTEGER | No | Male participant cap |
| max_female | INTEGER | No | Female participant cap |
| current_male | INTEGER | No | Default: 0 |
| current_female | INTEGER | No | Default: 0 |
| male_domains | TEXT[] | No | 남자 허용 도메인 (allow_all=true면 빈 배열) |
| female_domains | TEXT[] | No | 여자 허용 도메인 |
| allow_all_domains | BOOLEAN | No | Default: true |
| application_mode | TEXT | No | first_come / selection (default: first_come) |
| status | TEXT | No | open / closed / completed / ended |
| created_at | TIMESTAMPTZ | No | Auto |

### applications

소개팅 신청 내역 + 스냅샷.

| Column | Type | Nullable | Description |
|--------|------|----------|-------------|
| id | UUID | No | Primary key |
| event_id | UUID | No | References matching_events |
| user_id | UUID | No | References auth.users |
| profile_snapshot | JSONB | No | Profile data at time of application |
| preferences_snapshot | JSONB | No | Ideal preferences at time of application |
| photo_url | TEXT | Yes | Uploaded photo URL (v2 추가) |
| applied_at | TIMESTAMPTZ | No | Auto |

**Constraint**: `UNIQUE(event_id, user_id)` — one application per event per user.

### matches (v2 추가)

매칭 결과.

| Column | Type | Nullable | Description |
|--------|------|----------|-------------|
| id | UUID | No | Primary key |
| event_id | UUID | No | References matching_events |
| male_user_id | UUID | No | References auth.users |
| female_user_id | UUID | No | References auth.users |
| compatibility_score | FLOAT | Yes | 호환성 점수 (0-100) |
| status | TEXT | No | matched / contacted / completed / cancelled |
| created_at | TIMESTAMPTZ | No | Auto |

**Constraints**: `UNIQUE(event_id, male_user_id)`, `UNIQUE(event_id, female_user_id)`

### chat_rooms (v2 추가)

채팅방.

| Column | Type | Nullable | Description |
|--------|------|----------|-------------|
| id | UUID | No | Primary key |
| event_id | UUID | Yes | References matching_events |
| match_id | UUID | Yes | References matches |
| name | TEXT | Yes | e.g., "커플 #1 채팅방" |
| status | TEXT | No | active / closed |
| created_at | TIMESTAMPTZ | No | Auto |

### chat_participants (v2 추가)

채팅방 참여자.

| Column | Type | Nullable | Description |
|--------|------|----------|-------------|
| id | UUID | No | Primary key |
| room_id | UUID | No | References chat_rooms |
| user_id | UUID | No | References auth.users |
| role | TEXT | No | member / admin |
| last_read_at | TIMESTAMPTZ | Yes | 마지막 읽은 시간 (읽지 않은 메시지 계산용) |
| joined_at | TIMESTAMPTZ | No | Auto |

**Constraint**: `UNIQUE(room_id, user_id)`

### chat_messages (v2 추가)

채팅 메시지.

| Column | Type | Nullable | Description |
|--------|------|----------|-------------|
| id | UUID | No | Primary key |
| room_id | UUID | No | References chat_rooms |
| sender_id | UUID | Yes | References auth.users (null for system) |
| content | TEXT | No | Message content |
| message_type | TEXT | No | text / system / contact_share |
| created_at | TIMESTAMPTZ | No | Auto |

### Row Level Security (RLS)

All tables have RLS enabled:
- **profiles**: Users can only SELECT/INSERT/UPDATE their own rows (`auth.uid() = user_id`)
- **blind_profiles**: Users can only SELECT/INSERT/UPDATE their own rows
- **ideal_preferences**: Users can only SELECT/INSERT/UPDATE their own rows
- **matching_events**: All authenticated users can SELECT
- **applications**: Users can only SELECT/INSERT their own rows
- **matches**: Users can SELECT where they are male_user_id or female_user_id
- **chat_rooms**: Users can SELECT rooms they participate in (via chat_participants). Admin can UPDATE (열기/닫기)
- **chat_participants**: Users can SELECT participants of rooms they're in. Users can UPDATE own record (`last_read_at`)
- **chat_messages**: Users can SELECT/INSERT messages in rooms they participate in

### Supabase Realtime

`chat_messages` table is added to `supabase_realtime` publication for real-time message delivery.

### Supabase Storage

`blind-photos` bucket (public): 블라인드 소개팅 사진 업로드용.
- Authenticated users can upload to their own folder (`{user_id}/{event_id}/`)
- Public access for photo display (admin dashboard, event detail page)

---

## Constants Reference

**File**: `src/lib/constants.js`

### Domain & University

```
ALLOWED_DOMAINS: ['postech.ac.kr', 'handong.ac.kr']

DOMAIN_TO_UNIVERSITY: {
  'postech.ac.kr': 'POSTECH',
  'handong.ac.kr': '한동대학교',
}
```

### Admin Access

```
ADMIN_EMAILS: ['doky03115@gmail.com']
```

### Form Options

| Constant | Values |
|----------|--------|
| GENDER_OPTIONS | 남자, 여자 |
| BODY_TYPES | 마름, 보통, 근육 탄탄, 통통 |
| FACE_TYPES | 강아지상, 고양이상, 사막여우상, 공룡상, 토끼상, 곰상, 늑대상, 꼬북이상, 너구리상, 두부상, 아랍상 |
| EYE_TYPES | 유쌍, 무쌍 |
| MBTI_TYPES | 16 standard types + 모름 |
| RELIGION_OPTIONS | 무교, 기독교, 천주교, 불교, 기타 |
| SMOKING_OPTIONS | 비흡연, 흡연, 가끔 |
| DRINKING_OPTIONS | 안 마심, 월 1-2회, 주 1회, 주 2-3회, 거의 매일 |
| TATTOO_OPTIONS | 없음, 있음 |
| MILITARY_SERVICE_OPTIONS | 완료, 아직 |
| CONTACT_FREQUENCY_OPTIONS | 1-5분, 5-10분, 10-30분, 1시간, 2시간, 3시간, 5시간 이상, 하루 이상 |
| PERSONALITY_OPTIONS | 8 personality traits (대화가 잘 통하는 사람, etc.) |
| DATE_STYLE_OPTIONS | 6 date style descriptions |
| INTEREST_OPTIONS | 영화/드라마, 전시/공연, 음악/악기, 스포츠/헬스, 여행, 캠핑, 카페/맛집, 반려동물, 패션/스타일 |
| DATING_STYLE_OPTIONS | 직진형, 리드형, 천천히 진행하는 편, 리드가 필요한 편 |
| CONTACT_METHOD_OPTIONS | 전화번호, 카카오톡 ID, 인스타그램, 기타 |
| BIRTH_YEAR_MIN / MAX | 1995 / 2007 |
| EVENT_STATUS_LABELS | { open: '모집 중', closed: '모집 마감', completed: '매칭 완료', ended: '종료' } |
| APPLICATION_MODE_OPTIONS | first_come (선착순), selection (선별) |

### Event Constants (v2 추가)

| Constant | Values |
|----------|--------|
| EVENT_TYPES | blind_online (블라인드 소개팅 온라인), blind_offline (오프라인), rotation (로테이션), other (기타) |
| PHOTO_SETTINGS | none (사진 없음), optional (선택), required (필수) |
| EVENT_TYPE_LABELS | EVENT_TYPES의 value→label 매핑 객체 |
