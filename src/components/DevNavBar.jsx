import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

const DEV_LINKS = [
  { path: '/', label: '홈' },
  { path: '/login', label: '로그인' },
  { path: '/signup', label: '회원가입' },
  { path: '/profile', label: '프로필' },
  { path: '/profile/setup', label: '프로필설정' },
  { path: '/apply', label: '신청' },
  { path: '/admin', label: '어드민' },
];

function DevNavBar() {
  const location = useLocation();
  const { user, devLogin, signOut } = useAuth();

  if (!import.meta.env.DEV) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-gray-900 text-white px-3 py-2 z-50 flex items-center gap-2 overflow-x-auto text-xs">
      <span className="text-orange-400 font-bold shrink-0">DEV</span>
      <span className="text-gray-500">|</span>
      {DEV_LINKS.map((link) => (
        <Link
          key={link.path}
          to={link.path}
          className={`px-2 py-1 rounded shrink-0 transition-all ${
            location.pathname === link.path
              ? 'bg-primary text-white'
              : 'text-gray-300 hover:bg-gray-700'
          }`}
        >
          {link.label}
        </Link>
      ))}
      <span className="text-gray-500">|</span>
      {user ? (
        <>
          <span className="text-green-400 shrink-0">{user.email}</span>
          <button
            onClick={() => signOut()}
            className="px-2 py-1 rounded bg-red-800 text-red-200 hover:bg-red-700 shrink-0"
          >
            로그아웃
          </button>
        </>
      ) : (
        <button
          onClick={() => devLogin('doky03115@gmail.com')}
          className="px-2 py-1 rounded bg-orange-700 text-orange-200 hover:bg-orange-600 shrink-0"
        >
          Dev 로그인
        </button>
      )}
    </div>
  );
}

export default DevNavBar;
