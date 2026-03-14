# TODO

## 이메일 알림 설정 (Resend + Supabase Edge Function)

매칭 완료 시 참가자에게 이메일 알림을 보내기 위한 설정 단계.
코드는 이미 구현 완료 (`supabase/functions/send-match-notification/`, `src/lib/notifications.js`).

### 1. Resend 가입 및 API 키 발급
- [ ] [Resend](https://resend.com) 가입
- [ ] 대시보드 → API Keys → API 키 생성 (이름: `sogae-pohang`)
- [ ] 발급된 키 복사 (`re_` 로 시작)

### 2. (선택) 커스텀 발신 도메인 설정
- [ ] Resend 대시보드 → Domains → 도메인 추가
- [ ] DNS에 SPF, DKIM, DMARC 레코드 추가
- [ ] 도메인 인증 완료 확인
- 커스텀 도메인 없이 테스트만 할 경우 `onboarding@resend.dev`로 발송 가능 (하루 100통 제한)

### 3. Supabase 프로젝트 연결
```bash
npx supabase link --project-ref movnyfwkrivpejwubacg
```
- [ ] 연결 완료 확인

### 4. Supabase Secrets 설정
```bash
# Resend API 키
npx supabase secrets set RESEND_API_KEY=re_여기에_API키_입력

# 발신 이메일 (커스텀 도메인이 있으면 해당 주소, 없으면 테스트용)
npx supabase secrets set RESEND_FROM_EMAIL=onboarding@resend.dev
```
- [ ] RESEND_API_KEY 설정 완료
- [ ] RESEND_FROM_EMAIL 설정 완료

### 5. Edge Function 배포
```bash
npx supabase functions deploy send-match-notification --project-ref movnyfwkrivpejwubacg
```
- [ ] 배포 완료 확인

### 6. 테스트
- [ ] 어드민 페이지에서 매칭 실행
- [ ] 매칭 완료 메시지에 "(이메일 N건 발송)" 표시 확인
- [ ] 참가자 이메일 수신 확인

### 참고
- Resend 무료 플랜: 하루 100통, 월 3,000통
- Edge Function에서 `SUPABASE_SERVICE_ROLE_KEY`로 유저 이메일 조회 (자동 주입)
- 이메일 발송 실패해도 매칭 결과에는 영향 없음
