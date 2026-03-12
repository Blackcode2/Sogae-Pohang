import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import SignUpPage from './pages/SignUpPage';
import ProfileFormPage from './pages/ProfileFormPage';
import ProfilePage from './pages/ProfilePage';
import MatchApplyPage from './pages/MatchApplyPage';
import AdminPage from './pages/AdminPage';
import ChatPage from './pages/ChatPage';
import AdminRoute from './components/AdminRoute';
import DevNavBar from './components/DevNavBar';
import './index.css';

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <div className="pb-10">
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/signup" element={<SignUpPage />} />
            <Route path="/profile" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
            <Route path="/profile/setup" element={<ProtectedRoute><ProfileFormPage /></ProtectedRoute>} />
            <Route path="/apply" element={<ProtectedRoute><MatchApplyPage /></ProtectedRoute>} />
            <Route path="/chat/:roomId" element={<ProtectedRoute><ChatPage /></ProtectedRoute>} />
            <Route path="/admin" element={<AdminRoute><AdminPage /></AdminRoute>} />
          </Routes>
          <DevNavBar />
        </div>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
