import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

import { ALLOWED_DOMAINS } from '../lib/constants';


const GoogleIcon = () => (
  <svg className="w-5 h-5 mr-3" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48">
    <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"></path>
    <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"></path>
    <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"></path>
    <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"></path>
    <path fill="none" d="M0 0h48v48H0z"></path>
  </svg>
);

function SignUpPage() {
  const { signInWithGoogle } = useAuth();
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleGoogleSignUp = async () => {
    setError('');
    setLoading(true);
    const { error } = await signInWithGoogle();
    if (error) {
      setError('Google 회원가입에 실패했습니다: ' + error.message);
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center items-center p-4">
      <div className="max-w-md w-full bg-white p-8 rounded-xl shadow-lg">
        <div className="text-center mb-8">
          <Link to="/" className="text-3xl font-bold text-primary">소개퐝</Link>
          <h2 className="mt-2 text-2xl font-bold text-gray-900">회원가입</h2>
          <p className="mt-2 text-sm text-gray-500">
            포항 지역 대학교 Google 계정으로 가입하세요
          </p>
        </div>

        <div className="mb-6 p-4 bg-blue-50 rounded-lg">
          <h3 className="text-sm font-semibold text-blue-800 mb-2">가입 가능한 대학교</h3>
          <ul className="text-sm text-blue-700 space-y-1">
            <li>POSTECH (postech.ac.kr)</li>
            <li>한동대학교 (handong.ac.kr)</li>
          </ul>
        </div>

        <button
          onClick={handleGoogleSignUp}
          disabled={loading}
          className="w-full flex items-center justify-center bg-white border border-gray-300 text-gray-700 p-3 rounded-lg tracking-wide font-semibold cursor-pointer hover:bg-gray-100 transition-all duration-300 disabled:bg-gray-100 disabled:cursor-not-allowed"
        >
          <GoogleIcon />
          {loading ? '가입 중...' : 'Google 계정으로 시작하기'}
        </button>

        {error && <p className="mt-4 text-center text-red-500 text-sm">{error}</p>}

        <p className="mt-8 text-sm text-center text-gray-600">
          이미 계정이 있으신가요?{' '}
          <Link to="/login" className="font-medium text-primary hover:underline">
            로그인
          </Link>
        </p>
      </div>
    </div>
  );
}

export default SignUpPage;
