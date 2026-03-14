export const ALLOWED_DOMAINS = ['postech.ac.kr', 'handong.ac.kr'];

export const DOMAIN_TO_UNIVERSITY = {
  'postech.ac.kr': 'POSTECH',
  'handong.ac.kr': '한동대학교',
};

// Admin emails — users with these emails get admin access
export const ADMIN_EMAILS = ['doky03115@gmail.com'];

export const GENDER_OPTIONS = ['남자', '여자'];

export const BODY_TYPES = ['마름', '보통', '근육 탄탄', '통통'];

export const FACE_TYPES = [
  '강아지상', '고양이상', '사막여우상', '공룡상', '토끼상',
  '곰상', '늑대상', '꼬북이상', '너구리상', '두부상', '아랍상',
];

export const EYE_TYPES = ['유쌍', '무쌍'];

export const MBTI_TYPES = [
  'ISTJ', 'ISFJ', 'INFJ', 'INTJ',
  'ISTP', 'ISFP', 'INFP', 'INTP',
  'ESTP', 'ESFP', 'ENFP', 'ENTP',
  'ESTJ', 'ESFJ', 'ENFJ', 'ENTJ',
  '모름',
];

export const RELIGION_OPTIONS = ['무교', '기독교', '천주교', '불교', '기타'];

export const SMOKING_OPTIONS = ['비흡연', '흡연', '가끔'];

export const DRINKING_OPTIONS = ['안 마심', '월 1-2회', '주 1회', '주 2-3회', '거의 매일'];

export const TATTOO_OPTIONS = ['없음', '있음'];

export const MILITARY_SERVICE_OPTIONS = ['완료', '미완료'];

export const CONTACT_FREQUENCY_OPTIONS = [
  '1-5분', '5-10분', '10-30분', '1시간', '2시간', '3시간', '5시간 이상', '하루 이상',
];

export const PERSONALITY_OPTIONS = [
  '대화가 잘 통하는 사람',
  '자기 일에 열정적인 사람',
  '외형적이고 활발한 사람',
  '센스있고 유머러스한 사람',
  '적극적이고 리드하는 사람',
  '배려심 깊고 따뜻한 사람',
  '내향적이고 잔잔한 사람',
  '즉흥적이고 모험을 즐기는 사람',
];

export const DATE_STYLE_OPTIONS = [
  '자연 속에서 힐링 (캠핑/등산/드라이브)',
  '활기찬 액티비티 (놀이공원/스포츠/여행)',
  '편안한 실내 데이트 (집/영화/보드게임)',
  '여유로운 데이트 (카페/공원/산책)',
  '문화생활 즐기기 (전시회/공연/영화관람)',
  '맛집탐방 (음식/술 한잔)',
];

export const INTEREST_OPTIONS = [
  '영화/드라마', '전시/공연', '음악/악기', '스포츠/헬스',
  '여행', '캠핑', '카페/맛집', '반려동물', '패션/스타일',
];

export const DATING_STYLE_OPTIONS = [
  '직진형', '리드형', '천천히 진행하는 편', '리드가 필요한 편',
];

export const CONTACT_METHOD_OPTIONS = ['전화번호', '카카오톡 ID', '인스타그램', '기타'];

// Birth year range (for age selection)
export const BIRTH_YEAR_MIN = 1995;
export const BIRTH_YEAR_MAX = 2007;

export const EVENT_STATUS_LABELS = {
  open: '모집 중',
  closed: '모집 마감',
  completed: '매칭 완료',
  ended: '종료',
};

export const EVENT_TYPES = [
  { value: 'blind_online', label: '블라인드 소개팅 (온라인)' },
  { value: 'blind_offline', label: '블라인드 소개팅 (오프라인)' },
  { value: 'rotation', label: '로테이션 소개팅' },
  { value: 'other', label: '기타' },
];

export const PHOTO_SETTINGS = [
  { value: 'none', label: '사진 없음' },
  { value: 'optional', label: '선택 (첨부 가능)' },
  { value: 'required', label: '필수' },
];

export const EVENT_TYPE_LABELS = Object.fromEntries(
  EVENT_TYPES.map(({ value, label }) => [value, label])
);

export const APPLICATION_MODES = [
  { value: 'first_come', label: '선착순 (인원 충족 시 자동 마감)' },
  { value: 'selection', label: '선별 (지원 기간 후 어드민 선발)' },
];

export const APPLICATION_MODE_LABELS = Object.fromEntries(
  APPLICATION_MODES.map(({ value, label }) => [value, label])
);

// Default description templates per event type
export const EVENT_DESCRIPTION_TEMPLATES = {
  blind_online: `[블라인드 소개팅 안내]

1. 지원 기간 내에 프로필과 이상형 정보를 작성하여 신청해주세요.
2. 지원 기간 종료 후 선정 결과가 이메일로 안내됩니다.
3. 정해진 날짜에 매칭 상대 + 주선자가 함께하는 채팅방이 동시에 열립니다.
4. 채팅은 약 30~40분간 진행됩니다.
5. 채팅 종료 전, 서로 연락처를 교환할지 확인한 뒤 마무리됩니다.

* 매칭은 작성하신 이상형 조건을 기반으로 진행됩니다.
* 채팅 시간은 상황에 따라 변동될 수 있습니다.`,
  blind_offline: `[블라인드 소개팅 (오프라인) 안내]

1. 지원 기간 내에 프로필과 이상형 정보를 작성하여 신청해주세요.
2. 지원 기간 종료 후 선정 결과가 이메일로 안내됩니다.
3. 안내된 날짜와 장소에서 매칭 상대를 만나게 됩니다.

* 매칭은 작성하신 이상형 조건을 기반으로 진행됩니다.
* 자세한 장소 및 시간은 선정 후 별도 안내됩니다.`,
  rotation: '',
  other: '',
};
