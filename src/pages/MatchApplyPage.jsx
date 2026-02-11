import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { supabase } from '../lib/supabase';

// Mock event data — will be replaced with Supabase query
const MOCK_EVENT = {
  id: 'mock-event-1',
  isOpen: true,
  startDate: '2026-02-15',
  endDate: '2026-02-28',
  maxMale: 10,
  maxFemale: 10,
  currentMale: 3,
  currentFemale: 5,
};

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

function MatchApplyPage() {
  const { user } = useAuth();
  const [profile, setProfile] = useState(null);
  const [ideal, setIdeal] = useState(null);
  const [loading, setLoading] = useState(true);
  const [step, setStep] = useState('info'); // 'info' | 'review' | 'done'
  const [applying, setApplying] = useState(false);
  const [error, setError] = useState('');

  const event = MOCK_EVENT;

  useEffect(() => {
    async function fetchData() {
      const { data: profileData } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user.id)
        .single();

      const { data: idealData } = await supabase
        .from('ideal_preferences')
        .select('*')
        .eq('user_id', user.id)
        .single();

      setProfile(profileData);
      setIdeal(idealData);
      setLoading(false);
    }

    if (user) fetchData();
  }, [user]);

  const handleApply = async () => {
    setError('');
    setApplying(true);

    const { error: applyError } = await supabase
      .from('applications')
      .insert({
        event_id: event.id,
        user_id: user.id,
        profile_snapshot: profile,
        preferences_snapshot: ideal,
      });

    if (applyError) {
      setError('신청에 실패했습니다: ' + applyError.message);
      setApplying(false);
      return;
    }

    setStep('done');
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
          <p className="text-gray-500 text-sm mb-6">
            소개팅 신청을 위해서는 프로필이 필요합니다.
          </p>
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

        {/* Step: Event Info */}
        {step === 'info' && (
          <>
            <h2 className="text-xl font-bold text-gray-900 mb-6">소개팅 신청</h2>

            <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-gray-800">현재 소개팅</h3>
                {event.isOpen ? (
                  <span className="bg-green-100 text-green-700 text-xs font-semibold px-3 py-1 rounded-full">모집 중</span>
                ) : (
                  <span className="bg-gray-100 text-gray-500 text-xs font-semibold px-3 py-1 rounded-full">마감</span>
                )}
              </div>

              <InfoRow label="참여 기간" value={`${event.startDate} ~ ${event.endDate}`} />
              <InfoRow label="남자" value={`${event.currentMale} / ${event.maxMale}명`} />
              <InfoRow label="여자" value={`${event.currentFemale} / ${event.maxFemale}명`} />
            </div>

            {/* Guidelines */}
            <div className="bg-blue-50 rounded-xl p-6 mb-6">
              <h3 className="text-sm font-bold text-blue-800 mb-3">안내사항</h3>
              <ul className="text-sm text-blue-700 space-y-2">
                <li>- 신청 후 프로필과 이상형 정보를 기반으로 매칭됩니다.</li>
                <li>- 매칭 결과는 모집 마감 후 이메일로 알려드립니다.</li>
                <li>- 한 이벤트에 한 번만 신청할 수 있습니다.</li>
                <li>- 신청 시 기존 프로필을 확인하고 수정할 수 있습니다.</li>
              </ul>
            </div>

            {event.isOpen ? (
              <button
                onClick={() => setStep('review')}
                className="w-full bg-primary text-white py-3 rounded-lg font-semibold hover:bg-primary-dark transition-all duration-200"
              >
                신청하기
              </button>
            ) : (
              <button disabled className="w-full bg-gray-300 text-gray-500 py-3 rounded-lg font-semibold cursor-not-allowed">
                모집이 마감되었습니다
              </button>
            )}
          </>
        )}

        {/* Step: Profile Review */}
        {step === 'review' && (
          <>
            <h2 className="text-xl font-bold text-gray-900 mb-2">프로필 확인</h2>
            <p className="text-sm text-gray-500 mb-6">
              아래 프로필로 신청됩니다. 수정이 필요하면 프로필 수정 후 다시 신청해주세요.
            </p>

            {/* Profile Summary */}
            <div className="bg-white rounded-xl shadow-sm p-6 mb-4">
              <h3 className="text-sm font-bold text-gray-700 mb-3">내 정보</h3>
              <InfoRow label="닉네임" value={profile.nickname} />
              <InfoRow label="성별" value={profile.gender} />
              <InfoRow label="출생년도" value={`${profile.birth_year}년`} />
              <InfoRow label="학교" value={profile.university} />
              <InfoRow label="학과" value={profile.department} />
              <InfoRow label="몸매" value={profile.body_type} />
              <InfoRow label="얼굴상" value={profile.face_type} />
              <InfoRow label="MBTI" value={profile.mbti} />
              <InfoRow label="취미" value={profile.hobbies?.join(', ')} />
            </div>

            {/* Ideal Summary */}
            {ideal && (
              <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
                <h3 className="text-sm font-bold text-gray-700 mb-3">이상형 정보</h3>
                <InfoRow label="몸매" value={ideal.body_type} />
                <InfoRow label="얼굴상" value={ideal.face_type} />
                <InfoRow label="MBTI" value={ideal.mbti} />
                <InfoRow label="종교" value={ideal.religion} />
                <InfoRow label="담배" value={ideal.smoking} />
                <InfoRow label="음주" value={ideal.drinking} />
                <InfoRow label="취미" value={ideal.hobbies?.join(', ')} />
              </div>
            )}

            {error && <p className="text-center text-red-500 text-sm mb-4">{error}</p>}

            <div className="flex gap-3">
              <Link
                to="/profile/setup"
                className="flex-1 text-center py-3 rounded-lg border border-gray-300 text-gray-700 font-medium hover:bg-gray-50 transition-all duration-200"
              >
                수정하기
              </Link>
              <button
                onClick={handleApply}
                disabled={applying}
                className="flex-1 bg-primary text-white py-3 rounded-lg font-semibold hover:bg-primary-dark transition-all duration-200 disabled:bg-gray-400"
              >
                {applying ? '신청 중...' : '이대로 신청하기'}
              </button>
            </div>

            <button
              onClick={() => setStep('info')}
              className="w-full mt-3 text-sm text-gray-400 hover:text-gray-600"
            >
              이전으로
            </button>
          </>
        )}

        {/* Step: Done */}
        {step === 'done' && (
          <div className="text-center py-16">
            <div className="text-5xl mb-4">&#10003;</div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">신청 완료!</h2>
            <p className="text-gray-500 text-sm mb-8">
              매칭 결과는 모집 마감 후 이메일과 프로필 페이지에서 확인할 수 있습니다.
            </p>
            <div className="flex justify-center gap-3">
              <Link
                to="/"
                className="px-6 py-3 rounded-lg border border-gray-300 text-gray-700 font-medium hover:bg-gray-50"
              >
                홈으로
              </Link>
              <Link
                to="/profile"
                className="px-6 py-3 rounded-lg bg-primary text-white font-medium hover:bg-primary-dark"
              >
                내 프로필
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default MatchApplyPage;
