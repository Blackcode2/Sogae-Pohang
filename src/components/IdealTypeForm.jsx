import { RadioGroup, CheckboxGroup, SelectInput, RangeInput } from './FormFields';
import {
  BODY_TYPES, FACE_TYPES, EYE_TYPES, MBTI_TYPES, RELIGION_OPTIONS,
  SMOKING_OPTIONS, DRINKING_OPTIONS, TATTOO_OPTIONS, CONTACT_FREQUENCY_OPTIONS,
  INTEREST_OPTIONS, PERSONALITY_OPTIONS, DATE_STYLE_OPTIONS, DATING_STYLE_OPTIONS,
} from '../lib/constants';

function NocareButton({ active, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`mt-2 px-4 py-2 rounded-lg border text-sm cursor-pointer transition-all duration-200 ${
        active
          ? 'bg-primary text-white border-primary'
          : 'bg-white text-gray-700 border-gray-300 hover:border-primary'
      }`}
    >
      상관없음
    </button>
  );
}

function IdealTypeForm({ data, onChange }) {
  const set = (field) => (value) => onChange({ ...data, [field]: value });

  return (
    <div className="space-y-5">
      <h3 className="text-lg font-bold text-gray-800">이상형 정보</h3>
      <p className="text-sm text-gray-500">
        원하는 상대의 조건을 선택해주세요. 선택하지 않으면 &quot;상관없음&quot;으로 처리됩니다.
      </p>

      {/* Height Range */}
      <div>
        <RangeInput
          label="희망 키 (cm)" id="idealHeight"
          minValue={data.height_min || ''} maxValue={data.height_max || ''}
          onMinChange={set('height_min')} onMaxChange={set('height_max')}
          unit="cm" minPlaceholder="예: 160" maxPlaceholder="예: 180"
        />
        <NocareButton
          active={!data.height_min && !data.height_max}
          onClick={() => onChange({ ...data, height_min: '', height_max: '' })}
        />
      </div>

      <RadioGroup
        label="선호 체형" name="idealBodyType" value={data.body_type || ''} onChange={set('body_type')}
        options={['상관없음', ...BODY_TYPES]}
      />
      <RadioGroup
        label="선호 얼굴상" name="idealFaceType" value={data.face_type || ''} onChange={set('face_type')}
        options={['상관없음', ...FACE_TYPES]}
      />
      <RadioGroup
        label="선호 눈" name="idealEyeType" value={data.eye_type || ''} onChange={set('eye_type')}
        options={['상관없음', ...EYE_TYPES]}
      />
      <SelectInput
        label="선호 MBTI" id="idealMbti" value={data.mbti || ''} onChange={set('mbti')}
        options={MBTI_TYPES} placeholder="상관없음"
      />
      <RadioGroup
        label="선호 종교" name="idealReligion" value={data.religion || ''} onChange={set('religion')}
        options={['상관없음', ...RELIGION_OPTIONS]}
      />
      <RadioGroup
        label="선호 담배" name="idealSmoking" value={data.smoking || ''} onChange={set('smoking')}
        options={['상관없음', ...SMOKING_OPTIONS]}
      />
      <RadioGroup
        label="선호 음주" name="idealDrinking" value={data.drinking || ''} onChange={set('drinking')}
        options={['상관없음', ...DRINKING_OPTIONS]}
      />
      <RadioGroup
        label="선호 타투" name="idealTattoo" value={data.tattoo || ''} onChange={set('tattoo')}
        options={['상관없음', ...TATTOO_OPTIONS]}
      />
      <SelectInput
        label="선호 연락 주기" id="idealContactFrequency" value={data.contact_frequency || ''} onChange={set('contact_frequency')}
        options={CONTACT_FREQUENCY_OPTIONS} placeholder="상관없음"
      />

      <div>
        <CheckboxGroup
          label="선호 관심사 (복수 선택 가능)" name="idealInterests" values={data.interests || []} onChange={set('interests')}
          options={INTEREST_OPTIONS}
        />
        <NocareButton active={(data.interests || []).length === 0} onClick={() => set('interests')([])} />
      </div>
      <div>
        <CheckboxGroup
          label="선호 성향 (복수 선택 가능)" name="idealPersonality" values={data.personality || []} onChange={set('personality')}
          options={PERSONALITY_OPTIONS}
        />
        <NocareButton active={(data.personality || []).length === 0} onClick={() => set('personality')([])} />
      </div>
      <div>
        <CheckboxGroup
          label="선호 데이트 스타일 (복수 선택 가능)" name="idealDateStyle" values={data.date_style || []} onChange={set('date_style')}
          options={DATE_STYLE_OPTIONS}
        />
        <NocareButton active={(data.date_style || []).length === 0} onClick={() => set('date_style')([])} />
      </div>
      <RadioGroup
        label="선호 연애 스타일" name="idealDatingStyle" value={data.dating_style || ''} onChange={set('dating_style')}
        options={['상관없음', ...DATING_STYLE_OPTIONS]}
      />
    </div>
  );
}

export default IdealTypeForm;
