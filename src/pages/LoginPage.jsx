import React, { useState } from 'react';
import { supabase } from '../lib/supabase';
import { Link } from 'react-router-dom';

function LoginPage() {
  // 로그인 로직은 추후에 추가합니다.
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center items-center">
      <div className="max-w-md w-full bg-white p-8 rounded-xl shadow-lg">
        <div className="text-center mb-8">
          <Link to="/" className="text-3xl font-bold text-primary">소개퐝</Link>
          <h2 className="mt-2 text-2xl font-bold text-gray-900">로그인</h2>
        </div>
        
        {/* 로그인 폼은 추후에 구현합니다. */}
        <p className="text-center text-gray-700">로그인 폼이 여기에 표시됩니다.</p>

        <p className="mt-8 text-sm text-center text-gray-600">
          아직 계정이 없으신가요?{' '}
          <Link to="/signup" className="font-medium text-primary hover:underline">
            회원가입
          </Link>
        </p>
      </div>
    </div>
  );
}

export default LoginPage;
