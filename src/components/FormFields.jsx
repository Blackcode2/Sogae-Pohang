export function TextInput({ label, id, value, onChange, placeholder, required, note }) {
  return (
    <div>
      <label htmlFor={id} className="block text-sm font-semibold text-gray-700 mb-1">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>
      {note && <p className="text-xs text-gray-400 mb-1">{note}</p>}
      <input
        id={id}
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        required={required}
        className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-sm"
      />
    </div>
  );
}

export function NumberInput({ label, id, value, onChange, placeholder, required, min, max, unit }) {
  return (
    <div>
      <label htmlFor={id} className="block text-sm font-semibold text-gray-700 mb-1">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>
      <div className="flex items-center gap-2">
        <input
          id={id}
          type="number"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          required={required}
          min={min}
          max={max}
          className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-sm"
        />
        {unit && <span className="text-sm text-gray-500 whitespace-nowrap">{unit}</span>}
      </div>
    </div>
  );
}

export function SelectInput({ label, id, value, onChange, options, required, placeholder }) {
  return (
    <div>
      <label htmlFor={id} className="block text-sm font-semibold text-gray-700 mb-1">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>
      <select
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        required={required}
        className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-sm bg-white"
      >
        <option value="">{placeholder || '선택해주세요'}</option>
        {options.map((opt) => (
          <option key={opt} value={opt}>{opt}</option>
        ))}
      </select>
    </div>
  );
}

export function RadioGroup({ label, name, value, onChange, options, required }) {
  return (
    <div>
      <p className="block text-sm font-semibold text-gray-700 mb-2">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </p>
      <div className="flex flex-wrap gap-2">
        {options.map((opt) => (
          <label
            key={opt}
            className={`px-4 py-2 rounded-lg border text-sm cursor-pointer transition-all duration-200 ${
              value === opt
                ? 'bg-primary text-white border-primary'
                : 'bg-white text-gray-700 border-gray-300 hover:border-primary'
            }`}
          >
            <input
              type="radio"
              name={name}
              value={opt}
              checked={value === opt}
              onChange={(e) => onChange(e.target.value)}
              required={required}
              className="hidden"
            />
            {opt}
          </label>
        ))}
      </div>
    </div>
  );
}

export function CheckboxGroup({ label, name, values, onChange, options }) {
  const handleToggle = (opt) => {
    if (values.includes(opt)) {
      onChange(values.filter((v) => v !== opt));
    } else {
      onChange([...values, opt]);
    }
  };

  return (
    <div>
      <p className="block text-sm font-semibold text-gray-700 mb-2">{label}</p>
      <div className="flex flex-wrap gap-2">
        {options.map((opt) => (
          <label
            key={opt}
            className={`px-4 py-2 rounded-lg border text-sm cursor-pointer transition-all duration-200 ${
              values.includes(opt)
                ? 'bg-primary text-white border-primary'
                : 'bg-white text-gray-700 border-gray-300 hover:border-primary'
            }`}
          >
            <input
              type="checkbox"
              name={name}
              value={opt}
              checked={values.includes(opt)}
              onChange={() => handleToggle(opt)}
              className="hidden"
            />
            {opt}
          </label>
        ))}
      </div>
    </div>
  );
}

export function ToggleField({ label, id, value, onChange, publicValue, onPublicChange }) {
  return (
    <div>
      <label htmlFor={id} className="block text-sm font-semibold text-gray-700 mb-1">{label}</label>
      <div className="flex items-center gap-3">
        <input
          id={id}
          type="number"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="flex-1 p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-sm"
        />
        <button
          type="button"
          onClick={() => onPublicChange(!publicValue)}
          className={`px-3 py-2 rounded-lg text-xs font-medium border transition-all duration-200 ${
            publicValue
              ? 'bg-green-50 text-green-700 border-green-300'
              : 'bg-gray-50 text-gray-500 border-gray-300'
          }`}
        >
          {publicValue ? '공개' : '비공개'}
        </button>
      </div>
    </div>
  );
}
