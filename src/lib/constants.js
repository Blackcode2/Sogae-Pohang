export const ALLOWED_DOMAINS = ['postech.ac.kr', 'handong.edu'];

export const DOMAIN_TO_UNIVERSITY = {
  'postech.ac.kr': 'POSTECH',
  'handong.edu': '한동대학교',
};

// Admin emails — users with these emails get admin access
export const ADMIN_EMAILS = [];

export const GENDER_OPTIONS = ['남자', '여자'];

export const BODY_TYPES = ['마름', '보통', '통통'];

export const FACE_TYPES = ['강아지상', '고양이상', '공룡상', '여우상', '너구리상', '곰상', '토끼상'];

export const EYE_TYPES = ['무쌍', '속쌍', '겉쌍'];

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

export const CONTACT_FREQUENCY_OPTIONS = [
  '1-5분', '5-10분', '10-30분', '1시간', '2시간', '3시간', '5시간 이상', '하루 이상',
];

export const HOBBY_OPTIONS = [
  '헬스', '스포츠', '독서', '영화/드라마', '음악', '게임',
  '요리', '여행', '사진', '그림', '댄스', '카페투어',
  '산책', '등산', '자전거', '수영', '봉사활동', '기타',
];

export const CONTACT_METHOD_OPTIONS = ['전화번호', '카카오톡 ID', '인스타그램'];

// Birth year range (for age selection)
export const BIRTH_YEAR_MIN = 1995;
export const BIRTH_YEAR_MAX = 2007;

export const EVENT_STATUS_LABELS = {
  open: '모집 중',
  closed: '모집 마감',
  completed: '매칭 완료',
};
