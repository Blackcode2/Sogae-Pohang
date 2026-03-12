import {
  RadioGroup, CheckboxGroup, SelectInput, TextInput, ToggleField,
} from './FormFields';
import {
  BODY_TYPES, FACE_TYPES, EYE_TYPES, MBTI_TYPES, RELIGION_OPTIONS,
  SMOKING_OPTIONS, DRINKING_OPTIONS, TATTOO_OPTIONS, CONTACT_FREQUENCY_OPTIONS,
  INTEREST_OPTIONS, PERSONALITY_OPTIONS, DATE_STYLE_OPTIONS, DATING_STYLE_OPTIONS,
  CONTACT_METHOD_OPTIONS,
} from '../lib/constants';

function BlindProfileForm({ data, onChange }) {
  const set = (field) => (value) => onChange({ ...data, [field]: value });

  return (
    <div className="space-y-6">
      {/* 외형 정보 */}
      <h3 className="text-lg font-bold text-gray-800">외형 정보</h3>
      <ToggleField
        label="키 (cm)" id="height"
        value={data.height || ''} onChange={set('height')}
        publicValue={data.height_public ?? true} onPublicChange={set('height_public')}
      />
      <RadioGroup
        label="체형" name="bodyType" value={data.body_type || ''} onChange={set('body_type')}
        options={BODY_TYPES} required
      />
      <RadioGroup
        label="얼굴상" name="faceType" value={data.face_type || ''} onChange={set('face_type')}
        options={FACE_TYPES} required
      />
      <RadioGroup
        label="눈" name="eyeType" value={data.eye_type || ''} onChange={set('eye_type')}
        options={EYE_TYPES} required
      />

      {/* 라이프스타일 */}
      <h3 className="text-lg font-bold text-gray-800 pt-4">라이프스타일</h3>
      <SelectInput
        label="MBTI" id="mbti" value={data.mbti || ''} onChange={set('mbti')}
        options={MBTI_TYPES} required
      />
      <RadioGroup
        label="종교" name="religion" value={data.religion || ''} onChange={set('religion')}
        options={RELIGION_OPTIONS} required
      />
      <RadioGroup
        label="담배" name="smoking" value={data.smoking || ''} onChange={set('smoking')}
        options={SMOKING_OPTIONS} required
      />
      <RadioGroup
        label="음주" name="drinking" value={data.drinking || ''} onChange={set('drinking')}
        options={DRINKING_OPTIONS} required
      />
      <RadioGroup
        label="타투" name="tattoo" value={data.tattoo || ''} onChange={set('tattoo')}
        options={TATTOO_OPTIONS} required
      />
      <SelectInput
        label="연락 주기" id="contactFrequency" value={data.contact_frequency || ''} onChange={set('contact_frequency')}
        options={CONTACT_FREQUENCY_OPTIONS} required
      />
      <CheckboxGroup
        label="관심사 (복수 선택 가능)" name="interests" values={data.interests || []} onChange={set('interests')}
        options={INTEREST_OPTIONS}
      />

      {/* 성향 & 스타일 */}
      <h3 className="text-lg font-bold text-gray-800 pt-4">성향 & 스타일</h3>
      <CheckboxGroup
        label="나의 성향 (복수 선택 가능)" name="personality" values={data.personality || []} onChange={set('personality')}
        options={PERSONALITY_OPTIONS}
      />
      <CheckboxGroup
        label="선호 데이트 스타일 (복수 선택 가능)" name="dateStyle" values={data.date_style || []} onChange={set('date_style')}
        options={DATE_STYLE_OPTIONS}
      />
      <RadioGroup
        label="연애 스타일" name="datingStyle" value={data.dating_style || ''} onChange={set('dating_style')}
        options={DATING_STYLE_OPTIONS} required
      />

      {/* 연락 수단 */}
      <h3 className="text-lg font-bold text-gray-800 pt-4">연락 수단</h3>
      <p className="text-sm text-gray-500">매칭 완료 후 상대방에게 전달될 연락 수단입니다.</p>
      <RadioGroup
        label="연락 방법" name="contactMethod" value={data.contact_method || ''} onChange={set('contact_method')}
        options={CONTACT_METHOD_OPTIONS} required
      />
      {data.contact_method && (
        <TextInput
          label={`${data.contact_method} 입력`} id="contactValue"
          value={data.contact_value || ''} onChange={set('contact_value')}
          placeholder={
            data.contact_method === '전화번호' ? '010-0000-0000' :
            data.contact_method === '카카오톡 ID' ? '카카오톡 ID' :
            data.contact_method === '인스타그램' ? '@instagram_id' :
            '연락처를 입력해주세요'
          }
          required
        />
      )}
    </div>
  );
}

export default BlindProfileForm;
