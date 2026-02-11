import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { supabase } from '../lib/supabase';
import {
  TextInput, NumberInput, SelectInput, RadioGroup, CheckboxGroup, ToggleField,
} from '../components/FormFields';
import {
  DOMAIN_TO_UNIVERSITY, GENDER_OPTIONS, BODY_TYPES, FACE_TYPES, EYE_TYPES,
  MBTI_TYPES, RELIGION_OPTIONS, SMOKING_OPTIONS, DRINKING_OPTIONS, TATTOO_OPTIONS,
  CONTACT_FREQUENCY_OPTIONS, HOBBY_OPTIONS, CONTACT_METHOD_OPTIONS,
  BIRTH_YEAR_MIN, BIRTH_YEAR_MAX,
} from '../lib/constants';

const TOTAL_STEPS = 5;

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
  const [step, setStep] = useState(1);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  // Step 1: Basic info
  const [name, setName] = useState('');
  const [nickname, setNickname] = useState('');
  const [gender, setGender] = useState('');
  const [birthYear, setBirthYear] = useState('');
  const university = getUniversityFromEmail(user?.email);
  const [department, setDepartment] = useState('');

  // Step 2: Physical info
  const [height, setHeight] = useState('');
  const [heightPublic, setHeightPublic] = useState(true);
  const [weight, setWeight] = useState('');
  const [weightPublic, setWeightPublic] = useState(false);
  const [bodyType, setBodyType] = useState('');
  const [faceType, setFaceType] = useState('');
  const [eyeType, setEyeType] = useState('');

  // Step 3: Lifestyle
  const [mbti, setMbti] = useState('');
  const [religion, setReligion] = useState('');
  const [smoking, setSmoking] = useState('');
  const [drinking, setDrinking] = useState('');
  const [tattoo, setTattoo] = useState('');
  const [contactFrequency, setContactFrequency] = useState('');
  const [hobbies, setHobbies] = useState([]);

  // Step 4: Contact method
  const [contactMethod, setContactMethod] = useState('');
  const [contactValue, setContactValue] = useState('');

  // Step 5: Ideal type preferences
  const [idealHeight, setIdealHeight] = useState('');
  const [idealWeight, setIdealWeight] = useState('');
  const [idealBodyType, setIdealBodyType] = useState('');
  const [idealFaceType, setIdealFaceType] = useState('');
  const [idealEyeType, setIdealEyeType] = useState('');
  const [idealMbti, setIdealMbti] = useState('');
  const [idealReligion, setIdealReligion] = useState('');
  const [idealSmoking, setIdealSmoking] = useState('');
  const [idealDrinking, setIdealDrinking] = useState('');
  const [idealTattoo, setIdealTattoo] = useState('');
  const [idealContactFrequency, setIdealContactFrequency] = useState('');
  const [idealHobbies, setIdealHobbies] = useState([]);

  const handleNext = () => {
    setError('');
    setStep((s) => Math.min(s + 1, TOTAL_STEPS));
  };

  const handleBack = () => {
    setError('');
    setStep((s) => Math.max(s - 1, 1));
  };

  const handleSubmit = async () => {
    setError('');
    setSaving(true);

    const profileData = {
      user_id: user.id,
      name, nickname, gender, birth_year: Number(birthYear),
      university, department,
      height: height ? Number(height) : null, height_public: heightPublic,
      weight: weight ? Number(weight) : null, weight_public: weightPublic,
      body_type: bodyType, face_type: faceType, eye_type: eyeType,
      mbti, religion, smoking, drinking, tattoo,
      contact_frequency: contactFrequency,
      hobbies,
      contact_method: contactMethod,
      contact_value: contactValue,
    };

    const idealData = {
      user_id: user.id,
      height: idealHeight || null,
      weight: idealWeight || null,
      body_type: idealBodyType,
      face_type: idealFaceType,
      eye_type: idealEyeType,
      mbti: idealMbti,
      religion: idealReligion,
      smoking: idealSmoking,
      drinking: idealDrinking,
      tattoo: idealTattoo,
      contact_frequency: idealContactFrequency,
      hobbies: idealHobbies,
    };

    const { error: profileError } = await supabase
      .from('profiles')
      .upsert(profileData, { onConflict: 'user_id' });

    if (profileError) {
      setError('프로필 저장에 실패했습니다: ' + profileError.message);
      setSaving(false);
      return;
    }

    const { error: idealError } = await supabase
      .from('ideal_preferences')
      .upsert(idealData, { onConflict: 'user_id' });

    if (idealError) {
      setError('이상형 정보 저장에 실패했습니다: ' + idealError.message);
      setSaving(false);
      return;
    }

    navigate('/');
    setSaving(false);
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-lg mx-auto">
        {/* Header */}
        <div className="text-center mb-6">
          <Link to="/" className="text-2xl font-bold text-primary">소개퐝</Link>
          <h2 className="mt-2 text-xl font-bold text-gray-900">프로필 설정</h2>
        </div>

        {/* Step Indicator */}
        <div className="flex items-center justify-center gap-2 mb-8">
          {Array.from({ length: TOTAL_STEPS }, (_, i) => (
            <div
              key={i}
              className={`h-2 rounded-full transition-all duration-300 ${
                i + 1 === step ? 'w-8 bg-primary' : i + 1 < step ? 'w-8 bg-primary/40' : 'w-8 bg-gray-200'
              }`}
            />
          ))}
        </div>

        <div className="bg-white p-6 rounded-xl shadow-lg">
          {/* Step 1: Basic Info */}
          {step === 1 && (
            <div className="space-y-5">
              <h3 className="text-lg font-bold text-gray-800 mb-4">기본 정보</h3>
              <TextInput
                label="이름" id="name" value={name} onChange={setName}
                placeholder="홍길동" required
                note="실명이며 상대방에게 공개되지 않습니다"
              />
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
          )}

          {/* Step 2: Physical Info */}
          {step === 2 && (
            <div className="space-y-5">
              <h3 className="text-lg font-bold text-gray-800 mb-4">외형 정보</h3>
              <ToggleField
                label="키 (cm)" id="height" value={height} onChange={setHeight}
                publicValue={heightPublic} onPublicChange={setHeightPublic}
              />
              <ToggleField
                label="몸무게 (kg)" id="weight" value={weight} onChange={setWeight}
                publicValue={weightPublic} onPublicChange={setWeightPublic}
              />
              <RadioGroup
                label="몸매" name="bodyType" value={bodyType} onChange={setBodyType}
                options={BODY_TYPES} required
              />
              <RadioGroup
                label="얼굴상" name="faceType" value={faceType} onChange={setFaceType}
                options={FACE_TYPES} required
              />
              <RadioGroup
                label="눈" name="eyeType" value={eyeType} onChange={setEyeType}
                options={EYE_TYPES} required
              />
            </div>
          )}

          {/* Step 3: Lifestyle */}
          {step === 3 && (
            <div className="space-y-5">
              <h3 className="text-lg font-bold text-gray-800 mb-4">라이프스타일</h3>
              <SelectInput
                label="MBTI" id="mbti" value={mbti} onChange={setMbti}
                options={MBTI_TYPES} required
              />
              <RadioGroup
                label="종교" name="religion" value={religion} onChange={setReligion}
                options={RELIGION_OPTIONS} required
              />
              <RadioGroup
                label="담배" name="smoking" value={smoking} onChange={setSmoking}
                options={SMOKING_OPTIONS} required
              />
              <RadioGroup
                label="음주" name="drinking" value={drinking} onChange={setDrinking}
                options={DRINKING_OPTIONS} required
              />
              <RadioGroup
                label="타투" name="tattoo" value={tattoo} onChange={setTattoo}
                options={TATTOO_OPTIONS} required
              />
              <SelectInput
                label="연락 주기" id="contactFrequency" value={contactFrequency} onChange={setContactFrequency}
                options={CONTACT_FREQUENCY_OPTIONS} required
              />
              <CheckboxGroup
                label="취미 (복수 선택 가능)" name="hobbies" values={hobbies} onChange={setHobbies}
                options={HOBBY_OPTIONS}
              />
            </div>
          )}

          {/* Step 4: Contact Method */}
          {step === 4 && (
            <div className="space-y-5">
              <h3 className="text-lg font-bold text-gray-800 mb-4">연락 수단</h3>
              <p className="text-sm text-gray-500 mb-4">
                매칭 완료 후 상대방에게 전달될 연락 수단입니다.
              </p>
              <RadioGroup
                label="연락 방법" name="contactMethod" value={contactMethod} onChange={setContactMethod}
                options={CONTACT_METHOD_OPTIONS} required
              />
              {contactMethod && (
                <TextInput
                  label={`${contactMethod} 입력`} id="contactValue"
                  value={contactValue} onChange={setContactValue}
                  placeholder={
                    contactMethod === '전화번호' ? '010-0000-0000' :
                    contactMethod === '카카오톡 ID' ? '카카오톡 ID' :
                    '@instagram_id'
                  }
                  required
                />
              )}
            </div>
          )}

          {/* Step 5: Ideal Type Preferences */}
          {step === 5 && (
            <div className="space-y-5">
              <h3 className="text-lg font-bold text-gray-800 mb-4">이상형 정보</h3>
              <p className="text-sm text-gray-500 mb-4">
                원하는 상대의 조건을 선택해주세요. 선택하지 않으면 &quot;상관없음&quot;으로 처리됩니다.
              </p>
              <NumberInput
                label="희망 키 (cm)" id="idealHeight" value={idealHeight} onChange={setIdealHeight}
                placeholder="예: 170" unit="cm 이상"
              />
              <NumberInput
                label="희망 몸무게 (kg)" id="idealWeight" value={idealWeight} onChange={setIdealWeight}
                placeholder="예: 60" unit="kg 이하"
              />
              <RadioGroup
                label="선호 몸매" name="idealBodyType" value={idealBodyType} onChange={setIdealBodyType}
                options={BODY_TYPES}
              />
              <RadioGroup
                label="선호 얼굴상" name="idealFaceType" value={idealFaceType} onChange={setIdealFaceType}
                options={FACE_TYPES}
              />
              <RadioGroup
                label="선호 눈" name="idealEyeType" value={idealEyeType} onChange={setIdealEyeType}
                options={EYE_TYPES}
              />
              <SelectInput
                label="선호 MBTI" id="idealMbti" value={idealMbti} onChange={setIdealMbti}
                options={MBTI_TYPES} placeholder="상관없음"
              />
              <RadioGroup
                label="선호 종교" name="idealReligion" value={idealReligion} onChange={setIdealReligion}
                options={RELIGION_OPTIONS}
              />
              <RadioGroup
                label="선호 담배" name="idealSmoking" value={idealSmoking} onChange={setIdealSmoking}
                options={SMOKING_OPTIONS}
              />
              <RadioGroup
                label="선호 음주" name="idealDrinking" value={idealDrinking} onChange={setIdealDrinking}
                options={DRINKING_OPTIONS}
              />
              <RadioGroup
                label="선호 타투" name="idealTattoo" value={idealTattoo} onChange={setIdealTattoo}
                options={TATTOO_OPTIONS}
              />
              <SelectInput
                label="선호 연락 주기" id="idealContactFrequency" value={idealContactFrequency} onChange={setIdealContactFrequency}
                options={CONTACT_FREQUENCY_OPTIONS} placeholder="상관없음"
              />
              <CheckboxGroup
                label="선호 취미 (복수 선택 가능)" name="idealHobbies" values={idealHobbies} onChange={setIdealHobbies}
                options={HOBBY_OPTIONS}
              />
            </div>
          )}

          {/* Error */}
          {error && <p className="mt-4 text-center text-red-500 text-sm">{error}</p>}

          {/* Navigation Buttons */}
          <div className="flex justify-between mt-8">
            {step > 1 ? (
              <button
                type="button"
                onClick={handleBack}
                className="px-6 py-3 rounded-lg border border-gray-300 text-gray-700 font-medium hover:bg-gray-50 transition-all duration-200"
              >
                이전
              </button>
            ) : (
              <div />
            )}

            {step < TOTAL_STEPS ? (
              <button
                type="button"
                onClick={handleNext}
                className="px-6 py-3 rounded-lg bg-primary text-white font-medium hover:bg-primary-dark transition-all duration-200"
              >
                다음
              </button>
            ) : (
              <button
                type="button"
                onClick={handleSubmit}
                disabled={saving}
                className="px-6 py-3 rounded-lg bg-primary text-white font-medium hover:bg-primary-dark transition-all duration-200 disabled:bg-gray-400"
              >
                {saving ? '저장 중...' : '프로필 저장'}
              </button>
            )}
          </div>
        </div>

        {/* Step Label */}
        <p className="text-center text-sm text-gray-400 mt-4">
          {step} / {TOTAL_STEPS} 단계
        </p>
      </div>
    </div>
  );
}

export default ProfileFormPage;
