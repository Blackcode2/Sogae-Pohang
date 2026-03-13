import { useState } from 'react';

const MAX_SIZE_MB = 10;
const MAX_SIZE_BYTES = MAX_SIZE_MB * 1024 * 1024;
const MAX_DIMENSION = 1920;
const JPEG_QUALITY = 0.85;

function resizeImage(file) {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      let { width, height } = img;

      // No resize needed if already within limits
      if (width <= MAX_DIMENSION && height <= MAX_DIMENSION) {
        resolve(file);
        return;
      }

      // Scale down preserving aspect ratio
      if (width > height) {
        height = Math.round((height * MAX_DIMENSION) / width);
        width = MAX_DIMENSION;
      } else {
        width = Math.round((width * MAX_DIMENSION) / height);
        height = MAX_DIMENSION;
      }

      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0, width, height);

      canvas.toBlob(
        (blob) => {
          const resized = new File([blob], file.name, { type: 'image/jpeg', lastModified: Date.now() });
          resolve(resized);
        },
        'image/jpeg',
        JPEG_QUALITY
      );
    };
    img.src = URL.createObjectURL(file);
  });
}

function PhotoUpload({ file, onFileChange, required }) {
  const [preview, setPreview] = useState(null);
  const [error, setError] = useState('');
  const [processing, setProcessing] = useState(false);

  const handleChange = async (e) => {
    const selected = e.target.files[0];
    setError('');

    if (!selected) {
      setPreview(null);
      onFileChange(null);
      return;
    }

    if (selected.size > MAX_SIZE_BYTES) {
      setError(`파일 크기가 ${MAX_SIZE_MB}MB를 초과합니다.`);
      return;
    }

    if (!selected.type.startsWith('image/')) {
      setError('이미지 파일만 업로드 가능합니다.');
      return;
    }

    setProcessing(true);
    const resized = await resizeImage(selected);
    setProcessing(false);

    const reader = new FileReader();
    reader.onloadend = () => setPreview(reader.result);
    reader.readAsDataURL(resized);
    onFileChange(resized);
  };

  const handleRemove = () => {
    setPreview(null);
    onFileChange(null);
  };

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-bold text-gray-800">사진 첨부</h3>

      <div className="bg-blue-50 rounded-xl p-4">
        <p className="text-sm text-blue-700">
          사진 제출은 {required ? '필수입니다.' : '필수가 아닙니다.'} 제출된 사진은 주선자만 확인하며,
          작성하신 프로필과 실제 모습이 어느 정도 일치하는지 참고용으로 활용됩니다.
          이를 바탕으로 최종 매칭에 조정이 있을 수 있습니다.
        </p>
      </div>

      <div>
        <input
          type="file"
          accept="image/*"
          onChange={handleChange}
          className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-primary/10 file:text-primary hover:file:bg-primary/20 cursor-pointer"
        />
        <p className="text-xs text-gray-400 mt-1">최대 {MAX_SIZE_MB}MB, 이미지 파일만 가능 (자동 리사이징)</p>
      </div>

      {processing && <p className="text-sm text-blue-500">이미지 처리 중...</p>}
      {error && <p className="text-sm text-red-500">{error}</p>}

      {preview && (
        <div className="relative">
          <img
            src={preview}
            alt="미리보기"
            className="w-full max-w-xs rounded-xl shadow-sm border border-gray-200"
          />
          <button
            type="button"
            onClick={handleRemove}
            className="mt-2 text-sm text-red-500 hover:text-red-700"
          >
            사진 삭제
          </button>
        </div>
      )}

      {required && !file && (
        <p className="text-sm text-amber-600">이 소개팅은 사진 제출이 필수입니다.</p>
      )}
    </div>
  );
}

export default PhotoUpload;
