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

function ProfilePage() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [matches, setMatches] = useState([]);
  const [chatRooms, setChatRooms] = useState({}); // matchId -> roomId
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

      setProfile(profileData);

      // Fetch matches where user is involved
      const { data: matchData } = await supabase
        .from('matches')
        .select('*')
        .or(`male_user_id.eq.${user.id},female_user_id.eq.${user.id}`);

      if (matchData) {
        // For each match, fetch the partner's basic profile
        const enriched = await Promise.all(matchData.map(async (m) => {
          const partnerId = m.male_user_id === user.id ? m.female_user_id : m.male_user_id;
          const { data: partnerProfile } = await supabase
            .from('profiles')
            .select('nickname, university, department')
            .eq('user_id', partnerId)
            .single();
          return { ...m, partner: partnerProfile };
        }));
        setMatches(enriched);

        // Fetch chat rooms for matches
        const matchIds = enriched.map((m) => m.id);
        if (matchIds.length > 0) {
          const { data: rooms } = await supabase
            .from('chat_rooms')
            .select('id, match_id')
            .in('match_id', matchIds);

          if (rooms) {
            const roomMap = {};
            rooms.forEach((r) => { roomMap[r.match_id] = r.id; });
            setChatRooms(roomMap);
          }
        }
      }

      setLoading(false);
    }

    if (user) fetchProfile();
  }, [user]);

  const handleDeleteAccount = async () => {
    setDeleting(true);
    await supabase.from('ideal_preferences').delete().eq('user_id', user.id);
    await supabase.from('blind_profiles').delete().eq('user_id', user.id);
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

        {/* Participated Events — placeholder for Phase 3 */}
        <SectionCard title="참여한 소개팅">
          <div className="text-center py-4">
            <p className="text-gray-400 text-sm">아직 참여한 소개팅이 없습니다.</p>
          </div>
        </SectionCard>

        {/* Matching Status */}
        <SectionCard title="매칭 현황">
          {matches.length === 0 ? (
            <div className="text-center py-4">
              <p className="text-gray-400 text-sm">아직 매칭 내역이 없습니다.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {matches.map((m) => (
                <div key={m.id} className="bg-gray-50 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className={`text-xs font-semibold px-2 py-1 rounded-full ${
                      m.status === 'matched' ? 'bg-green-100 text-green-700' :
                      m.status === 'contacted' ? 'bg-blue-100 text-blue-700' :
                      m.status === 'completed' ? 'bg-purple-100 text-purple-700' :
                      'bg-gray-100 text-gray-500'
                    }`}>
                      {m.status === 'matched' ? '매칭됨' :
                       m.status === 'contacted' ? '연락 중' :
                       m.status === 'completed' ? '완료' : '취소됨'}
                    </span>
                  </div>
                  {m.partner ? (
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-800">{m.partner.nickname}</p>
                        <p className="text-xs text-gray-500">{m.partner.university} · {m.partner.department}</p>
                      </div>
                      {chatRooms[m.id] && (
                        <Link
                          to={`/chat/${chatRooms[m.id]}`}
                          className="text-xs bg-primary text-white px-3 py-1.5 rounded-lg hover:bg-primary-dark transition-all"
                        >
                          채팅방 가기
                        </Link>
                      )}
                    </div>
                  ) : (
                    <p className="text-sm text-gray-400">상대방 정보를 불러올 수 없습니다.</p>
                  )}
                </div>
              ))}
            </div>
          )}
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
