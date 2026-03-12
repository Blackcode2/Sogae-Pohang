import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { supabase } from '../lib/supabase';
import { TextInput, SelectInput, RadioGroup } from '../components/FormFields';
import {
  DOMAIN_TO_UNIVERSITY, GENDER_OPTIONS,
  BIRTH_YEAR_MIN, BIRTH_YEAR_MAX,
} from '../lib/constants';

const BIRTH_YEARS = Array.from(
  { length: BIRTH_YEAR_MAX - BIRTH_YEAR_MIN + 1 },
  (_, i) => String(BIRTH_YEAR_MAX - i)
);

function getUniversityFromEmail(email) {
  if (!email) return '';
  const domain = email.split('@')[1];
  return DOMAIN_TO_UNIVERSITY[domain] || '';
}

function ProfileFormPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [nickname, setNickname] = useState('');
  const [gender, setGender] = useState('');
  const [birthYear, setBirthYear] = useState('');
  const university = getUniversityFromEmail(user?.email);
  const [department, setDepartment] = useState('');

  useEffect(() => {
    async function fetchProfile() {
      const { data } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (data) {
        setNickname(data.nickname || '');
        setGender(data.gender || '');
        setBirthYear(data.birth_year ? String(data.birth_year) : '');
        setDepartment(data.department || '');
      }
      setLoading(false);
    }

    if (user) fetchProfile();
  }, [user]);

  const handleSubmit = async () => {
    if (!nickname || !gender || !birthYear || !department) {
      setError('모든 필수 항목을 입력해주세요.');
      return;
    }

    setError('');
    setSaving(true);

    const profileData = {
      user_id: user.id,
      nickname,
      gender,
      birth_year: Number(birthYear),
      university,
      department,
    };

    const { error: profileError } = await supabase
      .from('profiles')
      .upsert(profileData, { onConflict: 'user_id' });

    if (profileError) {
      setError('프로필 저장에 실패했습니다: ' + profileError.message);
      setSaving(false);
      return;
    }

    navigate('/profile');
    setSaving(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <p className="text-gray-500">로딩 중...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-lg mx-auto">
        {/* Header */}
        <div className="text-center mb-6">
          <Link to="/" className="text-2xl font-bold text-primary">소개퐝</Link>
          <h2 className="mt-2 text-xl font-bold text-gray-900">프로필 설정</h2>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-lg">
          <div className="space-y-5">
            <h3 className="text-lg font-bold text-gray-800 mb-4">기본 정보</h3>
            <TextInput
              label="닉네임" id="nickname" value={nickname} onChange={setNickname}
              placeholder="서비스에서 사용할 닉네임" required
            />
            <RadioGroup
              label="성별" name="gender" value={gender} onChange={setGender}
              options={GENDER_OPTIONS} required
            />
            <SelectInput
              label="출생년도" id="birthYear" value={birthYear} onChange={setBirthYear}
              options={BIRTH_YEARS} required placeholder="년도 선택"
            />
            <TextInput
              label="학교" id="university" value={university} onChange={() => {}}
              placeholder="이메일로 자동 지정" required
              note="이메일 도메인에 따라 자동 지정됩니다"
            />
            <TextInput
              label="학과/학부" id="department" value={department} onChange={setDepartment}
              placeholder="컴퓨터공학과" required
            />
          </div>

          {/* Error */}
          {error && <p className="mt-4 text-center text-red-500 text-sm">{error}</p>}

          {/* Save Button */}
          <div className="flex justify-end mt-8">
            <button
              type="button"
              onClick={handleSubmit}
              disabled={saving}
              className="px-6 py-3 rounded-lg bg-primary text-white font-medium hover:bg-primary-dark transition-all duration-200 disabled:bg-gray-400"
            >
              {saving ? '저장 중...' : '프로필 저장'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ProfileFormPage;
