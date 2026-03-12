import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { EVENT_TYPE_LABELS } from "../lib/constants";
import HeroImage from "../assets/images/landing-photo.png";

// Mock data — will be replaced with Supabase queries later
const MOCK_EVENT = {
  isOpen: true,
  title: "2026 봄 블라인드 소개팅",
  event_type: "blind_online",
  startDate: "2026-02-15",
  endDate: "2026-02-28",
  maxMale: 10,
  maxFemale: 10,
  currentMale: 3,
  currentFemale: 5,
};

const UNIVERSITIES = [
  { name: "POSTECH", domain: "postech.ac.kr", color: "#C8102E" },
  { name: "한동대학교", domain: "handong.ac.kr", color: "#003876" },
];

function LandingPage() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
  };

  const handleStart = () => {
    if (user) {
      navigate("/apply");
    } else {
      navigate("/login");
    }
  };

  const event = MOCK_EVENT;

  return (
    <div className="flex flex-col min-h-screen bg-gray-50 text-gray-800">
      {/* Header */}
      <header className="w-full">
        <nav className="container mx-auto px-6 py-4 flex justify-between items-center">
          <Link to="/" className="text-2xl font-bold text-primary">
            소개퐝
          </Link>
          <div className="flex items-center space-x-4">
            {user ? (
              <>
                <Link
                  to="/profile"
                  className="text-gray-600 hover:text-primary transition-colors duration-300 font-medium"
                >
                  프로필
                </Link>
                <button
                  onClick={handleSignOut}
                  className="text-gray-600 hover:text-red-500 transition-colors duration-300 font-medium"
                >
                  로그아웃
                </button>
              </>
            ) : (
              <>
                <Link
                  to="/login"
                  className="text-gray-600 hover:text-primary transition-colors duration-300 font-medium"
                >
                  로그인
                </Link>
                <Link
                  to="/signup"
                  className="bg-primary text-white px-5 py-2 rounded-lg shadow-md hover:bg-primary-dark transition-colors duration-300 font-medium"
                >
                  회원가입
                </Link>
              </>
            )}
          </div>
        </nav>
      </header>

      {/* Hero Section */}
      <section className="flex-grow container mx-auto px-6 py-12 flex items-center">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
          <div className="text-center md:text-left">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold text-gray-900 leading-tight">
              포항 대학생을 위한
              <br />
              소개팅
            </h1>
            <p className="mt-6 text-lg text-gray-600 max-w-lg mx-auto md:mx-0">
              여러 사람에게 노출되는 부담은 줄이고, 한번에 한 사람과 깊이 있게.
              <br />
              소개퐝은 스마트 매칭 알고리즘으로 1:1 만남을 제공합니다.
            </p>
            <div className="mt-10">
              <button
                onClick={handleStart}
                className="bg-primary text-white px-8 py-4 rounded-lg text-lg font-bold shadow-lg hover:bg-primary-dark transform hover:scale-105 transition-all duration-300"
              >
                소개팅 참여하기
              </button>
            </div>
          </div>

          <div className="flex justify-center md:justify-end items-center">
            <img
              src={HeroImage}
              alt="소개퐝 서비스 이미지"
              className="rounded-2xl shadow-2xl w-full max-w-xl"
              onError={(e) => {
                e.target.onerror = null;
                e.target.src =
                  "https://placehold.co/500x500/e0e0e0/000000?text=Image+Not+Found";
              }}
            />
          </div>
        </div>
      </section>

      {/* Event Status Section */}
      <section className="bg-white py-16">
        <div className="container mx-auto px-6">
          <h2 className="text-2xl md:text-3xl font-bold text-center text-gray-900 mb-10">
            현재 소개팅 현황
          </h2>

          {event.isOpen ? (
            <div className="max-w-2xl mx-auto">
              {/* Period */}
              <div className="text-center mb-8">
                <span className="inline-block bg-green-100 text-green-700 text-sm font-semibold px-4 py-1 rounded-full mb-2">
                  모집 중
                </span>
                <span className="inline-block bg-purple-100 text-purple-700 text-sm font-semibold px-4 py-1 rounded-full mb-2 ml-2">
                  {EVENT_TYPE_LABELS[event.event_type] || event.event_type}
                </span>
                <h3 className="text-xl font-bold text-gray-900 mb-2">{event.title}</h3>
                <p className="text-gray-600">
                  참여 기간:{" "}
                  <span className="font-semibold text-gray-800">
                    {event.startDate}
                  </span>{" "}
                  ~{" "}
                  <span className="font-semibold text-gray-800">
                    {event.endDate}
                  </span>
                </p>
              </div>

              {/* Participant Counts */}
              <div className="grid grid-cols-2 gap-6 mb-8">
                <div className="bg-blue-50 rounded-xl p-6 text-center">
                  <p className="text-sm text-blue-600 font-medium mb-1">남자</p>
                  <p className="text-3xl font-bold text-blue-700">
                    {event.currentMale}
                    <span className="text-lg text-blue-400">
                      /{event.maxMale}
                    </span>
                  </p>
                  <div className="mt-3 w-full bg-blue-200 rounded-full h-2">
                    <div
                      className="bg-blue-500 h-2 rounded-full transition-all duration-500"
                      style={{
                        width: `${(event.currentMale / event.maxMale) * 100}%`,
                      }}
                    ></div>
                  </div>
                </div>
                <div className="bg-pink-50 rounded-xl p-6 text-center">
                  <p className="text-sm text-pink-600 font-medium mb-1">여자</p>
                  <p className="text-3xl font-bold text-pink-700">
                    {event.currentFemale}
                    <span className="text-lg text-pink-400">
                      /{event.maxFemale}
                    </span>
                  </p>
                  <div className="mt-3 w-full bg-pink-200 rounded-full h-2">
                    <div
                      className="bg-pink-500 h-2 rounded-full transition-all duration-500"
                      style={{
                        width: `${(event.currentFemale / event.maxFemale) * 100}%`,
                      }}
                    ></div>
                  </div>
                </div>
              </div>

              <div className="text-center">
                <button
                  onClick={handleStart}
                  className="bg-primary text-white px-8 py-3 rounded-lg font-semibold shadow-md hover:bg-primary-dark transition-all duration-300"
                >
                  참여 신청하기
                </button>
              </div>
            </div>
          ) : (
            <div className="text-center py-8">
              <span className="inline-block bg-gray-100 text-gray-500 text-sm font-semibold px-4 py-1 rounded-full mb-3">
                모집 마감
              </span>
              <p className="text-gray-500">
                현재 진행 중인 소개팅이 없습니다. 다음 시즌을 기다려주세요!
              </p>
            </div>
          )}
        </div>
      </section>

      {/* University Logos Section */}
      <section className="py-12 bg-gray-50">
        <div className="container mx-auto px-6">
          <p className="text-center text-sm text-gray-500 mb-6">
            참여 가능한 대학교
          </p>
          <div className="flex justify-center items-center gap-8 md:gap-16">
            {UNIVERSITIES.map((uni) => (
              <div
                key={uni.domain}
                className="flex items-center justify-center px-6 py-3 bg-white rounded-xl shadow-sm"
              >
                <span
                  className="text-lg font-bold"
                  style={{ color: uni.color }}
                >
                  {uni.name}
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <footer className="py-6 text-center text-sm text-gray-400">
        &copy; 2026 소개퐝. All rights reserved.
      </footer>
    </div>
  );
}

export default LandingPage;
