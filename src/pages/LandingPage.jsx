import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { supabase } from "../lib/supabase";
import { EVENT_TYPE_LABELS, ADMIN_EMAILS } from "../lib/constants";
import HeroImage from "../assets/images/landing-photo.png";

const UNIVERSITIES = [
  { name: "POSTECH", domain: "postech.ac.kr", color: "#C8102E" },
  { name: "한동대학교", domain: "handong.ac.kr", color: "#003876" },
];

function LandingPage() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchEvents() {
      const { data } = await supabase
        .from('matching_events')
        .select('*')
        .order('created_at', { ascending: false });

      // Auto-close expired open events
      const today = new Date().toISOString().split('T')[0];
      const updated = [];
      for (const evt of (data || [])) {
        if (evt.status === 'open' && evt.end_date && evt.end_date < today) {
          await supabase
            .from('matching_events')
            .update({ status: 'closed' })
            .eq('id', evt.id);
          updated.push({ ...evt, status: 'closed' });
        } else {
          updated.push(evt);
        }
      }
      // Use current_male/current_female from matching_events (readable by all users)
      const enriched = updated.map((evt) => ({
        ...evt,
        applicant_male: evt.current_male,
        applicant_female: evt.current_female,
      }));
      setEvents(enriched);
      setLoading(false);
    }
    fetchEvents();
  }, []);

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

  // Show the most recent open event, or the most recent event
  const openEvent = events.find((e) => e.status === 'open');

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
                {ADMIN_EMAILS.includes(user.email) && (
                  <Link
                    to="/admin"
                    className="text-gray-600 hover:text-primary transition-colors duration-300 font-medium"
                  >
                    관리자
                  </Link>
                )}
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

          {loading ? (
            <p className="text-center text-gray-400">로딩 중...</p>
          ) : openEvent ? (
            <div className="max-w-2xl mx-auto">
              {/* Period */}
              <div className="text-center mb-8">
                <span className="inline-block bg-green-100 text-green-700 text-sm font-semibold px-4 py-1 rounded-full mb-2">
                  모집 중
                </span>
                <span className="inline-block bg-purple-100 text-purple-700 text-sm font-semibold px-4 py-1 rounded-full mb-2 ml-2">
                  {EVENT_TYPE_LABELS[openEvent.event_type] || openEvent.event_type}
                </span>
                <h3 className="text-xl font-bold text-gray-900 mb-2">{openEvent.title}</h3>
                <p className="text-gray-600">
                  참여 기간:{" "}
                  <span className="font-semibold text-gray-800">
                    {openEvent.start_date}
                  </span>{" "}
                  ~{" "}
                  <span className="font-semibold text-gray-800">
                    {openEvent.end_date}
                  </span>
                </p>
              </div>

              {/* Participant Counts */}
              {openEvent.application_mode === 'selection' ? (
                <div className="mb-8">
                  <div className="grid grid-cols-2 gap-6 mb-4">
                    <div className="bg-blue-50 rounded-xl p-6 text-center">
                      <p className="text-sm text-blue-600 font-medium mb-1">남자 모집</p>
                      <p className="text-3xl font-bold text-blue-700">
                        {openEvent.max_male}<span className="text-lg text-blue-400">명</span>
                      </p>
                    </div>
                    <div className="bg-pink-50 rounded-xl p-6 text-center">
                      <p className="text-sm text-pink-600 font-medium mb-1">여자 모집</p>
                      <p className="text-3xl font-bold text-pink-700">
                        {openEvent.max_female}<span className="text-lg text-pink-400">명</span>
                      </p>
                    </div>
                  </div>
                  <p className="text-center text-gray-600">
                    현재 지원자: 남자 <span className="font-bold text-blue-700">{openEvent.applicant_male ?? 0}</span>명 · 여자 <span className="font-bold text-pink-700">{openEvent.applicant_female ?? 0}</span>명
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-6 mb-8">
                  <div className="bg-blue-50 rounded-xl p-6 text-center">
                    <p className="text-sm text-blue-600 font-medium mb-1">남자</p>
                    <p className="text-3xl font-bold text-blue-700">
                      {openEvent.current_male}
                      <span className="text-lg text-blue-400">
                        /{openEvent.max_male}
                      </span>
                    </p>
                    <div className="mt-3 w-full bg-blue-200 rounded-full h-2">
                      <div
                        className="bg-blue-500 h-2 rounded-full transition-all duration-500"
                        style={{
                          width: `${(openEvent.current_male / openEvent.max_male) * 100}%`,
                        }}
                      ></div>
                    </div>
                  </div>
                  <div className="bg-pink-50 rounded-xl p-6 text-center">
                    <p className="text-sm text-pink-600 font-medium mb-1">여자</p>
                    <p className="text-3xl font-bold text-pink-700">
                      {openEvent.current_female}
                      <span className="text-lg text-pink-400">
                        /{openEvent.max_female}
                      </span>
                    </p>
                    <div className="mt-3 w-full bg-pink-200 rounded-full h-2">
                      <div
                        className="bg-pink-500 h-2 rounded-full transition-all duration-500"
                        style={{
                          width: `${(openEvent.current_female / openEvent.max_female) * 100}%`,
                        }}
                      ></div>
                    </div>
                  </div>
                </div>
              )}

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
