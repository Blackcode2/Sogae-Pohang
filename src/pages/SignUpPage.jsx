import React, { useState } from 'react';
import { supabase } from '../lib/supabase'; // Supabase 클라이언트 import
import { Link } from 'react-router-dom';

// 허용할 대학교 이메일 도메인 목록
const ALLOWED_DOMAINS = ['postech.ac.kr', 'handong.ac.kr']; 

function SignUpPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const handleSignUp = async (e) => {
    e.preventDefault();
    setMessage('');
    setError('');

    // 이메일 도메인 검증
    const domain = email.split('@')[1];
    if (!ALLOWED_DOMAINS.includes(domain)) {
      setError('포항 지역 대학교 이메일로만 가입할 수 있습니다.');
      return;
    }

    setLoading(true);
    const { error } = await supabase.auth.signUp({
      email: email,
      password: password,
    });

    if (error) {
      setError(error.message);
    } else {
      setMessage('가입 확인을 위해 이메일을 확인해주세요!');
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center items-center">
      <div className="max-w-md w-full bg-white p-8 rounded-xl shadow-lg">
        <div className="text-center mb-8">
          <Link to="/" className="text-3xl font-bold text-primary">소개퐝</Link>
          <h2 className="mt-2 text-2xl font-bold text-gray-900">회원가입</h2>
          <p className="mt-2 text-sm text-gray-600">대학교 이메일로 시작하세요.</p>
        </div>
        
        <form onSubmit={handleSignUp}>
          <div className="space-y-6">
            <div>
              <label htmlFor="email" className="text-sm font-bold text-gray-700 tracking-wide">Email Address</label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full mt-2 p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="student@postech.ac.kr"
              />
            </div>
            <div>
              <label htmlFor="password" className="text-sm font-bold text-gray-700 tracking-wide">Password</label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength="6"
                className="w-full mt-2 p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="6자 이상 입력해주세요"
              />
            </div>
            <div>
              <button
                type="submit"
                disabled={loading}
                className="w-full flex justify-center bg-primary text-white p-3 rounded-lg tracking-wide font-semibold cursor-pointer hover:bg-primary-dark transition-all duration-300 disabled:bg-gray-400"
              >
                {loading ? '가입 중...' : '동의하고 가입하기'}
              </button>
            </div>
          </div>
        </form>

        {message && <p className="mt-4 text-center text-green-500">{message}</p>}
        {error && <p className="mt-4 text-center text-red-500">{error}</p>}

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
