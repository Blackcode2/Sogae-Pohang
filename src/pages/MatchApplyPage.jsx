import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { supabase } from '../lib/supabase';
import { EVENT_TYPE_LABELS } from '../lib/constants';
import BlindProfileForm from '../components/BlindProfileForm';
import IdealTypeForm from '../components/IdealTypeForm';
import PhotoUpload from '../components/PhotoUpload';


function InfoRow({ label, value }) {
  return (
    <div className="flex justify-between py-2 border-b border-gray-100 last:border-0">
      <span className="text-sm text-gray-500">{label}</span>
      <span className="text-sm font-medium text-gray-800">
        {value || <span className="text-gray-300">-</span>}
      </span>
    </div>
  );
}

const STEPS = ['event', 'blind', 'ideal', 'photo', 'confirm', 'done'];

function MatchApplyPage() {
  const { user } = useAuth();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [stepIndex, setStepIndex] = useState(0);
  const [applying, setApplying] = useState(false);
  const [error, setError] = useState('');

  // Selected event
  const [selectedEvent, setSelectedEvent] = useState(null);

  // Blind profile data
  const [blindData, setBlindData] = useState({
    height: '', height_public: true,
    body_type: '', face_type: '', eye_type: '',
    mbti: '', religion: '', smoking: '', drinking: '', tattoo: '',
    contact_frequency: '', interests: [], personality: [], date_style: [],
    dating_style: '', contact_method: '', contact_value: '',
    military_service: '',
  });

  // Ideal type data
  const [idealData, setIdealData] = useState({
    height_min: '', height_max: '',
    body_type: '', face_type: '', eye_type: '',
    mbti: '', religion: '', smoking: '', drinking: '', tattoo: '',
    contact_frequency: '', interests: [], personality: [], date_style: [],
    dating_style: '',
    military_service: '',
  });

  // Photo
  const [photoFile, setPhotoFile] = useState(null);

  // Events from DB
  const [events, setEvents] = useState([]);

  const step = STEPS[stepIndex];

  // Determine if photo step should show
  const showPhotoStep = selectedEvent && selectedEvent.photo_setting !== 'none';
  const photoRequired = selectedEvent && selectedEvent.photo_setting === 'required';

  useEffect(() => {
    async function fetchData() {
      // Fetch open events
      const { data: eventsData } = await supabase
        .from('matching_events')
        .select('*')
        .eq('status', 'open')
        .order('created_at', { ascending: false });

      // Auto-close expired events
      const today = new Date().toISOString().split('T')[0];
      const activeEvents = [];
      for (const evt of (eventsData || [])) {
        if (evt.end_date && evt.end_date < today) {
          await supabase
            .from('matching_events')
            .update({ status: 'closed' })
            .eq('id', evt.id);
        } else {
          activeEvents.push(evt);
        }
      }
      // Filter events by user's email domain
      const userDomain = user.email?.split('@')[1];
      const { data: profileData } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user.id)
        .single();

      setProfile(profileData);

      const userGender = profileData?.gender;
      // Mark domain-restricted events instead of filtering them out
      const markedEvents = activeEvents.map((evt) => {
        if (evt.allow_all_domains) return { ...evt, domainAllowed: true };
        const domainList = userGender === '남자' ? evt.male_domains : evt.female_domains;
        const allowed = domainList && domainList.includes(userDomain);
        return { ...evt, domainAllowed: !!allowed };
      });
      // Check which events user already applied to
      const { data: myApps } = await supabase
        .from('applications')
        .select('event_id')
        .eq('user_id', user.id);
      const appliedEventIds = new Set((myApps || []).map(a => a.event_id));
      const markedWithApplied = markedEvents.map((evt) => ({
        ...evt,
        alreadyApplied: appliedEventIds.has(evt.id),
      }));

      // Use current_male/current_female from matching_events (readable by all users)
      const enrichedEvents = markedWithApplied.map((evt) => ({
        ...evt,
        applicant_male: evt.current_male,
        applicant_female: evt.current_female,
      }));
      setEvents(enrichedEvents);

      // Try loading existing blind profile
      const { data: blindProfileData } = await supabase
        .from('blind_profiles')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (blindProfileData) {
        setBlindData({
          height: blindProfileData.height ? String(blindProfileData.height) : '',
          height_public: blindProfileData.height_public ?? true,
          body_type: blindProfileData.body_type || '',
          face_type: blindProfileData.face_type || '',
          eye_type: blindProfileData.eye_type || '',
          mbti: blindProfileData.mbti || '',
          religion: blindProfileData.religion || '',
          smoking: blindProfileData.smoking || '',
          drinking: blindProfileData.drinking || '',
          tattoo: blindProfileData.tattoo || '',
          contact_frequency: blindProfileData.contact_frequency || '',
          interests: blindProfileData.interests || [],
          personality: blindProfileData.personality || [],
          date_style: blindProfileData.date_style || [],
          dating_style: blindProfileData.dating_style || '',
          contact_method: blindProfileData.contact_method || '',
          contact_value: blindProfileData.contact_value || '',
          military_service: blindProfileData.military_service || '',
        });
      }

      // Try loading existing ideal preferences
      const { data: idealPrefData } = await supabase
        .from('ideal_preferences')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (idealPrefData) {
        setIdealData({
          height_min: idealPrefData.height_min ? String(idealPrefData.height_min) : '',
          height_max: idealPrefData.height_max ? String(idealPrefData.height_max) : '',
          body_type: idealPrefData.body_type || '',
          face_type: idealPrefData.face_type || '',
          eye_type: idealPrefData.eye_type || '',
          mbti: idealPrefData.mbti || '',
          religion: idealPrefData.religion || '',
          smoking: idealPrefData.smoking || '',
          drinking: idealPrefData.drinking || '',
          tattoo: idealPrefData.tattoo || '',
          contact_frequency: idealPrefData.contact_frequency || '',
          interests: idealPrefData.interests || [],
          personality: idealPrefData.personality || [],
          date_style: idealPrefData.date_style || [],
          dating_style: idealPrefData.dating_style || '',
          military_service: idealPrefData.military_service || '',
        });
      }

      setLoading(false);
    }

    if (user) fetchData();
  }, [user]);

  const getEffectiveSteps = () => {
    if (showPhotoStep) return STEPS;
    return STEPS.filter((s) => s !== 'photo');
  };

  const effectiveSteps = getEffectiveSteps();
  const effectiveIndex = effectiveSteps.indexOf(step);
  const totalSteps = effectiveSteps.length;

  const goNext = () => {
    const nextIdx = effectiveSteps.indexOf(step) + 1;
    if (nextIdx < effectiveSteps.length) {
      setStepIndex(STEPS.indexOf(effectiveSteps[nextIdx]));
    }
    setError('');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const goBack = () => {
    const prevIdx = effectiveSteps.indexOf(step) - 1;
    if (prevIdx >= 0) {
      setStepIndex(STEPS.indexOf(effectiveSteps[prevIdx]));
    }
    setError('');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSubmit = async () => {
    setError('');
    setApplying(true);

    // Capacity check: re-fetch latest event data to prevent race conditions
    if (selectedEvent.application_mode === 'first_come') {
      const { data: latestEvent } = await supabase
        .from('matching_events')
        .select('current_male, current_female, max_male, max_female, status')
        .eq('id', selectedEvent.id)
        .single();

      if (latestEvent?.status !== 'open') {
        setError('이 소개팅은 이미 마감되었습니다.');
        setApplying(false);
        return;
      }

      const currentCount = profile.gender === '남자' ? latestEvent.current_male : latestEvent.current_female;
      const maxCount = profile.gender === '남자' ? latestEvent.max_male : latestEvent.max_female;
      if (currentCount >= maxCount) {
        setError(`${profile.gender} 정원이 마감되었습니다.`);
        setApplying(false);
        return;
      }
    }

    // Domain restriction check
    if (!selectedEvent.allow_all_domains) {
      const userDomain = user.email?.split('@')[1];
      const domainList = profile.gender === '남자' ? selectedEvent.male_domains : selectedEvent.female_domains;
      if (!domainList || !domainList.includes(userDomain)) {
        setError('이 소개팅에 참여할 수 없는 도메인입니다.');
        setApplying(false);
        return;
      }
    }

    const nocare = (v) => (!v || v === '상관없음') ? null : v;

    // Upsert blind_profiles
    const blindProfilePayload = {
      user_id: user.id,
      event_id: selectedEvent.id,
      height: blindData.height ? Number(blindData.height) : null,
      height_public: blindData.height_public,
      body_type: blindData.body_type,
      face_type: blindData.face_type,
      eye_type: blindData.eye_type,
      mbti: blindData.mbti,
      religion: blindData.religion,
      smoking: blindData.smoking,
      drinking: blindData.drinking,
      tattoo: blindData.tattoo,
      contact_frequency: blindData.contact_frequency,
      interests: blindData.interests,
      personality: blindData.personality,
      date_style: blindData.date_style,
      dating_style: blindData.dating_style,
      contact_method: blindData.contact_method,
      contact_value: blindData.contact_value,
      military_service: blindData.military_service || null,
    };

    const { error: blindError } = await supabase
      .from('blind_profiles')
      .upsert(blindProfilePayload, { onConflict: 'user_id,event_id' });

    if (blindError) {
      setError('블라인드 프로필 저장 실패: ' + blindError.message);
      setApplying(false);
      return;
    }

    // Upsert ideal_preferences
    const idealPayload = {
      user_id: user.id,
      event_id: selectedEvent.id,
      height_min: idealData.height_min ? Number(idealData.height_min) : null,
      height_max: idealData.height_max ? Number(idealData.height_max) : null,
      body_type: nocare(idealData.body_type),
      face_type: nocare(idealData.face_type),
      eye_type: nocare(idealData.eye_type),
      mbti: nocare(idealData.mbti),
      religion: nocare(idealData.religion),
      smoking: nocare(idealData.smoking),
      drinking: nocare(idealData.drinking),
      tattoo: nocare(idealData.tattoo),
      contact_frequency: nocare(idealData.contact_frequency),
      interests: idealData.interests,
      personality: idealData.personality,
      date_style: idealData.date_style,
      dating_style: nocare(idealData.dating_style),
      military_service: nocare(idealData.military_service),
    };

    const { error: idealError } = await supabase
      .from('ideal_preferences')
      .upsert(idealPayload, { onConflict: 'user_id,event_id' });

    if (idealError) {
      setError('이상형 정보 저장 실패: ' + idealError.message);
      setApplying(false);
      return;
    }

    // Upload photo if present
    let photoUrl = null;
    if (photoFile) {
      const filePath = `${user.id}/${selectedEvent.id}/${Date.now()}_${photoFile.name}`;
      const { error: uploadError } = await supabase.storage
        .from('blind-photos')
        .upload(filePath, photoFile);

      if (uploadError) {
        setError('사진 업로드 실패: ' + uploadError.message);
        setApplying(false);
        return;
      }

      const { data: urlData } = supabase.storage.from('blind-photos').getPublicUrl(filePath);
      photoUrl = urlData?.publicUrl || filePath;
    }

    // Insert application
    const { error: applyError } = await supabase
      .from('applications')
      .insert({
        event_id: selectedEvent.id,
        user_id: user.id,
        profile_snapshot: { ...profile, blind: blindProfilePayload },
        preferences_snapshot: idealPayload,
        photo_url: photoUrl,
      });

    if (applyError) {
      setError('신청 실패: ' + applyError.message);
      setApplying(false);
      return;
    }

    // Increment participant count and check auto-close
    {
      const genderField = profile.gender === '남자' ? 'current_male' : 'current_female';
      // Re-fetch latest to get accurate count after insert
      const { data: latest } = await supabase
        .from('matching_events')
        .select('current_male, current_female, max_male, max_female')
        .eq('id', selectedEvent.id)
        .single();

      const newCount = (latest[genderField] || 0) + 1;
      const updatePayload = { [genderField]: newCount };

      // Auto-close for first_come mode when both genders are full
      if (selectedEvent.application_mode === 'first_come') {
        const maleCount = profile.gender === '남자' ? newCount : latest.current_male;
        const femaleCount = profile.gender === '여자' ? newCount : latest.current_female;
        if (maleCount >= latest.max_male && femaleCount >= latest.max_female) {
          updatePayload.status = 'closed';
        }
      }

      await supabase
        .from('matching_events')
        .update(updatePayload)
        .eq('id', selectedEvent.id);
    }

    // Move to done step
    setStepIndex(STEPS.indexOf('done'));
    setApplying(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <p className="text-gray-500">로딩 중...</p>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
        <div className="bg-white rounded-xl shadow-lg p-8 max-w-md w-full text-center">
          <h2 className="text-xl font-bold text-gray-900 mb-3">프로필을 먼저 작성해주세요</h2>
          <p className="text-gray-500 text-sm mb-6">소개팅 신청을 위해서는 기본 프로필이 필요합니다.</p>
          <Link
            to="/profile/setup"
            className="inline-block bg-primary text-white px-6 py-3 rounded-lg font-semibold hover:bg-primary-dark transition-all duration-200"
          >
            프로필 작성하기
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-lg mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <Link to="/" className="text-2xl font-bold text-primary">소개퐝</Link>
          <Link to="/profile" className="text-sm text-gray-600 hover:text-primary font-medium">
            내 프로필
          </Link>
        </div>

        {/* Step Indicator (hide on done) */}
        {step !== 'done' && (
          <div className="flex items-center justify-center gap-2 mb-6">
            {effectiveSteps.filter((s) => s !== 'done').map((s, i) => (
              <div
                key={s}
                className={`h-2 rounded-full transition-all duration-300 ${
                  i === effectiveIndex ? 'w-8 bg-primary' :
                  i < effectiveIndex ? 'w-8 bg-primary/40' : 'w-8 bg-gray-200'
                }`}
              />
            ))}
          </div>
        )}

        {/* Step 1: Event Selection */}
        {step === 'event' && (
          <>
            <h2 className="text-xl font-bold text-gray-900 mb-6">소개팅 선택</h2>
            {events.length === 0 ? (
              <div className="bg-white rounded-xl shadow-sm p-8 text-center">
                <p className="text-gray-400 text-sm">현재 열린 소개팅이 없습니다.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {events.map((evt) => {
                  const myGenderFull = evt.application_mode === 'first_come' && profile && (
                    profile.gender === '남자' ? evt.current_male >= evt.max_male : evt.current_female >= evt.max_female
                  );
                  const canSelect = evt.domainAllowed && !evt.alreadyApplied && !myGenderFull;
                  return (
                  <button
                    key={evt.id}
                    type="button"
                    onClick={() => { if (canSelect) { setSelectedEvent(evt); goNext(); } }}
                    disabled={!canSelect}
                    className={`w-full text-left rounded-xl shadow-sm p-6 border-2 transition-all ${
                      !canSelect ? 'bg-gray-100 border-transparent cursor-not-allowed opacity-70' :
                      selectedEvent?.id === evt.id ? 'bg-white border-primary' : 'bg-white border-transparent hover:border-primary'
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-2">
                      {evt.alreadyApplied ? (
                        <span className="bg-blue-100 text-blue-600 text-xs font-semibold px-2 py-1 rounded-full">신청 완료</span>
                      ) : myGenderFull ? (
                        <span className="bg-gray-200 text-gray-500 text-xs font-semibold px-2 py-1 rounded-full">{profile.gender} 마감</span>
                      ) : !evt.domainAllowed ? (
                        <span className="bg-red-100 text-red-600 text-xs font-semibold px-2 py-1 rounded-full">참가 불가</span>
                      ) : (
                        <span className="bg-green-100 text-green-700 text-xs font-semibold px-2 py-1 rounded-full">모집 중</span>
                      )}
                      <span className={`text-xs font-semibold px-2 py-1 rounded-full ${
                        evt.event_type === 'blind_online' ? 'bg-purple-100 text-purple-700' :
                        evt.event_type === 'blind_offline' ? 'bg-orange-100 text-orange-700' :
                        'bg-gray-100 text-gray-600'
                      }`}>
                        {EVENT_TYPE_LABELS[evt.event_type] || evt.event_type}
                      </span>
                    </div>
                    <h3 className="text-base font-bold text-gray-800 mb-1">{evt.title}</h3>
                    <p className="text-sm text-gray-500 mb-2">{evt.start_date} ~ {evt.end_date}</p>
                    <div className="flex gap-4 text-sm text-gray-600">
                      {evt.application_mode === 'selection' ? (
                        <>
                          <span>남자 {evt.max_male}명 모집</span>
                          <span>여자 {evt.max_female}명 모집</span>
                          <span>·</span>
                          <span>지원자: 남 {evt.applicant_male ?? 0} · 여 {evt.applicant_female ?? 0}</span>
                        </>
                      ) : (
                        <>
                          <span>남자 {evt.current_male}/{evt.max_male}</span>
                          <span>여자 {evt.current_female}/{evt.max_female}</span>
                        </>
                      )}
                    </div>
                    {evt.description && (
                      <p className="text-xs text-gray-400 mt-2">{evt.description}</p>
                    )}
                    {evt.alreadyApplied && (
                      <p className="text-xs text-blue-500 mt-2">이미 신청한 소개팅입니다.</p>
                    )}
                    {myGenderFull && !evt.alreadyApplied && (
                      <p className="text-xs text-gray-500 mt-2">{profile.gender} 모집 인원이 마감되었습니다.</p>
                    )}
                    {!evt.domainAllowed && !evt.alreadyApplied && !myGenderFull && (
                      <p className="text-xs text-red-500 mt-2">소속 대학교가 참가 대상에 포함되지 않습니다.</p>
                    )}
                  </button>
                  );
                })}
              </div>
            )}
          </>
        )}

        {/* Step 2: Blind Profile */}
        {step === 'blind' && (
          <div className="bg-white p-6 rounded-xl shadow-lg">
            <BlindProfileForm data={blindData} onChange={setBlindData} gender={profile.gender} />
            {error && <p className="mt-4 text-center text-red-500 text-sm">{error}</p>}
            <div className="flex justify-between mt-8">
              <button type="button" onClick={goBack}
                className="px-6 py-3 rounded-lg border border-gray-300 text-gray-700 font-medium hover:bg-gray-50 transition-all duration-200">
                이전
              </button>
              <button type="button" onClick={goNext}
                className="px-6 py-3 rounded-lg bg-primary text-white font-medium hover:bg-primary-dark transition-all duration-200">
                다음
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Ideal Type */}
        {step === 'ideal' && (
          <div className="bg-white p-6 rounded-xl shadow-lg">
            <IdealTypeForm data={idealData} onChange={setIdealData} gender={profile.gender} />
            {error && <p className="mt-4 text-center text-red-500 text-sm">{error}</p>}
            <div className="flex justify-between mt-8">
              <button type="button" onClick={goBack}
                className="px-6 py-3 rounded-lg border border-gray-300 text-gray-700 font-medium hover:bg-gray-50 transition-all duration-200">
                이전
              </button>
              <button type="button" onClick={goNext}
                className="px-6 py-3 rounded-lg bg-primary text-white font-medium hover:bg-primary-dark transition-all duration-200">
                다음
              </button>
            </div>
          </div>
        )}

        {/* Step 4: Photo Upload */}
        {step === 'photo' && (
          <div className="bg-white p-6 rounded-xl shadow-lg">
            <PhotoUpload file={photoFile} onFileChange={setPhotoFile} required={photoRequired} />
            {error && <p className="mt-4 text-center text-red-500 text-sm">{error}</p>}
            <div className="flex justify-between mt-8">
              <button type="button" onClick={goBack}
                className="px-6 py-3 rounded-lg border border-gray-300 text-gray-700 font-medium hover:bg-gray-50 transition-all duration-200">
                이전
              </button>
              <button
                type="button"
                onClick={() => {
                  if (photoRequired && !photoFile) {
                    setError('이 소개팅은 사진 제출이 필수입니다.');
                    return;
                  }
                  goNext();
                }}
                className="px-6 py-3 rounded-lg bg-primary text-white font-medium hover:bg-primary-dark transition-all duration-200">
                다음
              </button>
            </div>
          </div>
        )}

        {/* Step 5: Confirm & Submit */}
        {step === 'confirm' && (
          <>
            <h2 className="text-xl font-bold text-gray-900 mb-2">신청 확인</h2>
            <p className="text-sm text-gray-500 mb-6">아래 정보를 확인하고 제출해주세요.</p>

            {/* Basic Profile */}
            <div className="bg-white rounded-xl shadow-sm p-6 mb-4">
              <h3 className="text-sm font-bold text-gray-700 mb-3">기본 정보</h3>
              <InfoRow label="닉네임" value={profile.nickname} />
              <InfoRow label="성별" value={profile.gender} />
              <InfoRow label="출생년도" value={`${profile.birth_year}년`} />
              <InfoRow label="학교" value={profile.university} />
              <InfoRow label="학과" value={profile.department} />
            </div>

            {/* Blind Profile Summary */}
            <div className="bg-white rounded-xl shadow-sm p-6 mb-4">
              <h3 className="text-sm font-bold text-gray-700 mb-3">블라인드 프로필</h3>
              <InfoRow label="체형" value={blindData.body_type} />
              <InfoRow label="얼굴상" value={blindData.face_type} />
              <InfoRow label="눈" value={blindData.eye_type} />
              <InfoRow label="MBTI" value={blindData.mbti} />
              <InfoRow label="종교" value={blindData.religion} />
              <InfoRow label="담배" value={blindData.smoking} />
              <InfoRow label="음주" value={blindData.drinking} />
              {profile.gender === '남자' && <InfoRow label="군복무" value={blindData.military_service} />}
              <InfoRow label="관심사" value={blindData.interests?.join(', ')} />
              <InfoRow label="연애 스타일" value={blindData.dating_style} />
            </div>

            {/* Ideal Type Summary */}
            <div className="bg-white rounded-xl shadow-sm p-6 mb-4">
              <h3 className="text-sm font-bold text-gray-700 mb-3">이상형 정보</h3>
              <InfoRow label="키" value={
                (idealData.height_min || idealData.height_max)
                  ? `${idealData.height_min || '?'}cm ~ ${idealData.height_max || '?'}cm`
                  : null
              } />
              <InfoRow label="체형" value={idealData.body_type} />
              <InfoRow label="얼굴상" value={idealData.face_type} />
              <InfoRow label="MBTI" value={idealData.mbti} />
              <InfoRow label="종교" value={idealData.religion} />
              {profile.gender === '여자' && <InfoRow label="군복무" value={idealData.military_service} />}
              <InfoRow label="관심사" value={idealData.interests?.join(', ')} />
              <InfoRow label="연애 스타일" value={idealData.dating_style} />
            </div>

            {/* Photo */}
            {showPhotoStep && (
              <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
                <h3 className="text-sm font-bold text-gray-700 mb-3">사진</h3>
                {photoFile ? (
                  <p className="text-sm text-green-600">사진 1장 첨부됨</p>
                ) : (
                  <p className="text-sm text-gray-400">사진 미첨부</p>
                )}
              </div>
            )}

            {error && <p className="text-center text-red-500 text-sm mb-4">{error}</p>}

            <div className="flex gap-3">
              <button type="button" onClick={goBack}
                className="flex-1 py-3 rounded-lg border border-gray-300 text-gray-700 font-medium hover:bg-gray-50 transition-all duration-200">
                이전
              </button>
              <button
                onClick={handleSubmit}
                disabled={applying}
                className="flex-1 bg-primary text-white py-3 rounded-lg font-semibold hover:bg-primary-dark transition-all duration-200 disabled:bg-gray-400">
                {applying ? '신청 중...' : '신청하기'}
              </button>
            </div>
          </>
        )}

        {/* Step 6: Done */}
        {step === 'done' && (
          <div className="text-center py-16">
            <div className="text-5xl mb-4">&#10003;</div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">신청 완료!</h2>
            <p className="text-gray-500 text-sm mb-8">
              매칭 결과는 모집 마감 후 이메일과 프로필 페이지에서 확인할 수 있습니다.
            </p>
            <div className="flex justify-center gap-3">
              <Link to="/"
                className="px-6 py-3 rounded-lg border border-gray-300 text-gray-700 font-medium hover:bg-gray-50">
                홈으로
              </Link>
              <Link to="/profile"
                className="px-6 py-3 rounded-lg bg-primary text-white font-medium hover:bg-primary-dark">
                내 프로필
              </Link>
            </div>
          </div>
        )}

        {/* Step Label */}
        {step !== 'done' && (
          <p className="text-center text-sm text-gray-400 mt-4">
            {effectiveIndex + 1} / {totalSteps - 1} 단계
          </p>
        )}
      </div>
    </div>
  );
}

export default MatchApplyPage;
