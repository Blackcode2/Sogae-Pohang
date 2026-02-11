import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { supabase } from '../lib/supabase';

function SectionCard({ title, children }) {
  return (
    <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
      <h3 className="text-lg font-bold text-gray-800 mb-4">{title}</h3>
      {children}
    </div>
  );
}

function InfoRow({ label, value, isPrivate }) {
  return (
    <div className="flex justify-between py-2 border-b border-gray-100 last:border-0">
      <span className="text-sm text-gray-500">{label}</span>
      <span className="text-sm font-medium text-gray-800">
        {isPrivate ? (
          <span className="text-gray-400">비공개</span>
        ) : (
          value || <span className="text-gray-300">-</span>
        )}
      </span>
    </div>
  );
}

function ProfilePage() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [ideal, setIdeal] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    async function fetchProfile() {
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

    if (user) fetchProfile();
  }, [user]);

  const handleDeleteAccount = async () => {
    setDeleting(true);
    await supabase.from('ideal_preferences').delete().eq('user_id', user.id);
    await supabase.from('profiles').delete().eq('user_id', user.id);
    await signOut();
    navigate('/');
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
          <h2 className="text-xl font-bold text-gray-900 mb-3">프로필을 설정해주세요</h2>
          <p className="text-gray-500 text-sm mb-6">
            소개팅 참여를 위해 프로필을 먼저 작성해야 합니다.
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
          <Link
            to="/profile/setup"
            className="text-sm text-primary font-medium hover:underline"
          >
            프로필 수정
          </Link>
        </div>

        <h2 className="text-xl font-bold text-gray-900 mb-6">내 프로필</h2>

        {/* Basic Info */}
        <SectionCard title="기본 정보">
          <InfoRow label="닉네임" value={profile.nickname} />
          <InfoRow label="성별" value={profile.gender} />
          <InfoRow label="출생년도" value={profile.birth_year && `${profile.birth_year}년`} />
          <InfoRow label="학교" value={profile.university} />
          <InfoRow label="학과/학부" value={profile.department} />
        </SectionCard>

        {/* Physical Info */}
        <SectionCard title="외형 정보">
          <InfoRow label="키" value={profile.height && `${profile.height}cm`} isPrivate={!profile.height_public} />
          <InfoRow label="몸무게" value={profile.weight && `${profile.weight}kg`} isPrivate={!profile.weight_public} />
          <InfoRow label="몸매" value={profile.body_type} />
          <InfoRow label="얼굴상" value={profile.face_type} />
          <InfoRow label="눈" value={profile.eye_type} />
        </SectionCard>

        {/* Lifestyle */}
        <SectionCard title="라이프스타일">
          <InfoRow label="MBTI" value={profile.mbti} />
          <InfoRow label="종교" value={profile.religion} />
          <InfoRow label="담배" value={profile.smoking} />
          <InfoRow label="음주" value={profile.drinking} />
          <InfoRow label="타투" value={profile.tattoo} />
          <InfoRow label="연락 주기" value={profile.contact_frequency} />
          <InfoRow label="취미" value={profile.hobbies?.join(', ')} />
        </SectionCard>

        {/* Contact */}
        <SectionCard title="연락 수단">
          <InfoRow label={profile.contact_method} value={profile.contact_value} />
        </SectionCard>

        {/* Ideal Type */}
        {ideal && (
          <SectionCard title="이상형 정보">
            <InfoRow label="키" value={ideal.height && `${ideal.height}cm 이상`} />
            <InfoRow label="몸무게" value={ideal.weight && `${ideal.weight}kg 이하`} />
            <InfoRow label="몸매" value={ideal.body_type} />
            <InfoRow label="얼굴상" value={ideal.face_type} />
            <InfoRow label="눈" value={ideal.eye_type} />
            <InfoRow label="MBTI" value={ideal.mbti} />
            <InfoRow label="종교" value={ideal.religion} />
            <InfoRow label="담배" value={ideal.smoking} />
            <InfoRow label="음주" value={ideal.drinking} />
            <InfoRow label="타투" value={ideal.tattoo} />
            <InfoRow label="연락 주기" value={ideal.contact_frequency} />
            <InfoRow label="취미" value={ideal.hobbies?.join(', ')} />
          </SectionCard>
        )}

        {/* Matching Status */}
        <SectionCard title="매칭 현황">
          <div className="text-center py-4">
            <p className="text-gray-400 text-sm">아직 매칭 내역이 없습니다.</p>
          </div>
        </SectionCard>

        {/* Account Deletion */}
        <div className="mt-8 text-center">
          {showDeleteConfirm ? (
            <div className="bg-red-50 rounded-xl p-6">
              <p className="text-sm text-red-700 mb-4">
                정말 탈퇴하시겠습니까? 모든 프로필 데이터가 삭제됩니다.
              </p>
              <div className="flex justify-center gap-3">
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 text-sm font-medium hover:bg-gray-50"
                >
                  취소
                </button>
                <button
                  onClick={handleDeleteAccount}
                  disabled={deleting}
                  className="px-4 py-2 rounded-lg bg-red-500 text-white text-sm font-medium hover:bg-red-600 disabled:bg-gray-400"
                >
                  {deleting ? '처리 중...' : '탈퇴 확인'}
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={() => setShowDeleteConfirm(true)}
              className="text-sm text-gray-400 hover:text-red-500 transition-colors duration-200"
            >
              회원탈퇴
            </button>
          )}
        </div>

        <div className="h-8" />
      </div>
    </div>
  );
}

export default ProfilePage;
