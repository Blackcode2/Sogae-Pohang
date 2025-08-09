import React from 'react';
import HeroImage from '../assets/images/landing-photo.png';

function LandingPage() {
  return (
    <div className="flex flex-col min-h-screen bg-gray-50 text-gray-800">
      {/* Header Section */}
      <header className="w-full">
        <nav className="container mx-auto px-6 py-4 flex justify-between items-center">
          <Link to="/" className="text-2xl font-bold text-primary">소개퐝</Link>
          <div className="flex items-center space-x-4">
            {/* 버튼을 Link로 수정 */}
            <Link to="/login" className="text-gray-600 hover:text-primary transition-colors duration-300 font-medium">
              로그인
            </Link>
            <Link to="/signup" className="bg-primary text-white px-5 py-2 rounded-lg shadow-md hover:bg-primary-dark transition-colors duration-300 font-medium">
              회원가입
            </Link>
          </div>
        </nav>
      </header>

      {/* Main Content Section */}
      <main className="flex-grow container mx-auto px-6 flex items-center">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
          {/* Left Column: Text Content */}
          <div className="text-center md:text-left">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold text-gray-900 leading-tight">
              포항 대학생을 위한<br />무제한 소개팅
            </h1>
            <p className="mt-6 text-lg text-gray-600 max-w-lg mx-auto md:mx-0">
              여러 사람에게 동시에 노출되는 부담은 줄이고, 한 번에 한 사람과만 깊이 있게. 소개퐝은 스마트 매칭 알고리즘으로 1:1 만남을 제공합니다.
            </p>
            <div className="mt-10">
              <button className="bg-primary text-white px-8 py-4 rounded-lg text-lg font-bold shadow-lg hover:bg-primary-dark transform hover:scale-105 transition-all duration-300">
                시작하기
              </button>
            </div>
          </div>

          {/* Right Column: Image */}
          <div className="flex justify-center items-center">
            <img
              src={HeroImage}
              alt="소개퐝 서비스 이미지"
              className="rounded-2xl shadow-2xl w-full max-w-xl"
              onError={(e) => {
                e.target.onerror = null;
                e.target.src = 'https://placehold.co/500x500/e0e0e0/000000?text=Image+Not+Found';
              }}
            />
          </div>
        </div>
      </main>

      {/* Footer for spacing */}
      <footer className="py-8"></footer>
    </div>
  );
}

export default LandingPage;
