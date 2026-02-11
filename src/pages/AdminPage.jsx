import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { EVENT_STATUS_LABELS } from '../lib/constants';

function AdminPage() {
  const [tab, setTab] = useState('events');
  const [users, setUsers] = useState([]);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  // New event form
  const [showNewEvent, setShowNewEvent] = useState(false);
  const [newEvent, setNewEvent] = useState({
    start_date: '', end_date: '', max_male: 10, max_female: 10,
  });

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    setLoading(true);
    const { data: profilesData } = await supabase.from('profiles').select('*');
    const { data: eventsData } = await supabase.from('matching_events').select('*').order('created_at', { ascending: false });

    setUsers(profilesData || []);
    setEvents(eventsData || []);
    setLoading(false);
  }

  async function handleCreateEvent(e) {
    e.preventDefault();
    setError('');

    const { error: createError } = await supabase
      .from('matching_events')
      .insert({
        start_date: newEvent.start_date,
        end_date: newEvent.end_date,
        max_male: Number(newEvent.max_male),
        max_female: Number(newEvent.max_female),
        status: 'open',
      });

    if (createError) {
      setError('이벤트 생성 실패: ' + createError.message);
      return;
    }

    setMessage('이벤트가 생성되었습니다.');
    setShowNewEvent(false);
    setNewEvent({ start_date: '', end_date: '', max_male: 10, max_female: 10 });
    fetchData();
  }

  async function handleUpdateEventStatus(eventId, newStatus) {
    const { error: updateError } = await supabase
      .from('matching_events')
      .update({ status: newStatus })
      .eq('id', eventId);

    if (updateError) {
      setError('상태 변경 실패: ' + updateError.message);
      return;
    }

    setMessage('이벤트 상태가 변경되었습니다.');
    fetchData();
  }

  async function handleDeleteUser(userId) {
    const { error: delError } = await supabase
      .from('profiles')
      .delete()
      .eq('user_id', userId);

    if (delError) {
      setError('유저 삭제 실패: ' + delError.message);
      return;
    }

    setMessage('유저가 삭제되었습니다.');
    fetchData();
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <p className="text-gray-500">로딩 중...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <Link to="/" className="text-2xl font-bold text-primary">소개퐝</Link>
          <span className="text-sm text-gray-500 font-medium">관리자 페이지</span>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6">
          <button
            onClick={() => setTab('events')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              tab === 'events' ? 'bg-primary text-white' : 'bg-white text-gray-600 border border-gray-300 hover:bg-gray-50'
            }`}
          >
            소개팅 관리
          </button>
          <button
            onClick={() => setTab('users')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              tab === 'users' ? 'bg-primary text-white' : 'bg-white text-gray-600 border border-gray-300 hover:bg-gray-50'
            }`}
          >
            회원 관리 ({users.length})
          </button>
        </div>

        {/* Messages */}
        {message && (
          <div className="mb-4 p-3 bg-green-50 text-green-700 text-sm rounded-lg flex justify-between items-center">
            {message}
            <button onClick={() => setMessage('')} className="text-green-500 hover:text-green-700 font-bold">x</button>
          </div>
        )}
        {error && (
          <div className="mb-4 p-3 bg-red-50 text-red-700 text-sm rounded-lg flex justify-between items-center">
            {error}
            <button onClick={() => setError('')} className="text-red-500 hover:text-red-700 font-bold">x</button>
          </div>
        )}

        {/* Events Tab */}
        {tab === 'events' && (
          <div>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-bold text-gray-900">소개팅 이벤트</h2>
              <button
                onClick={() => setShowNewEvent(!showNewEvent)}
                className="px-4 py-2 bg-primary text-white text-sm rounded-lg font-medium hover:bg-primary-dark"
              >
                {showNewEvent ? '취소' : '새 이벤트'}
              </button>
            </div>

            {/* New Event Form */}
            {showNewEvent && (
              <form onSubmit={handleCreateEvent} className="bg-white rounded-xl shadow-sm p-6 mb-6">
                <h3 className="text-sm font-bold text-gray-700 mb-4">새 이벤트 생성</h3>
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">시작일</label>
                    <input
                      type="date" required
                      value={newEvent.start_date}
                      onChange={(e) => setNewEvent({ ...newEvent, start_date: e.target.value })}
                      className="w-full p-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">종료일</label>
                    <input
                      type="date" required
                      value={newEvent.end_date}
                      onChange={(e) => setNewEvent({ ...newEvent, end_date: e.target.value })}
                      className="w-full p-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">남자 정원</label>
                    <input
                      type="number" required min="1"
                      value={newEvent.max_male}
                      onChange={(e) => setNewEvent({ ...newEvent, max_male: e.target.value })}
                      className="w-full p-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">여자 정원</label>
                    <input
                      type="number" required min="1"
                      value={newEvent.max_female}
                      onChange={(e) => setNewEvent({ ...newEvent, max_female: e.target.value })}
                      className="w-full p-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>
                </div>
                <button
                  type="submit"
                  className="w-full py-2 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary-dark"
                >
                  생성하기
                </button>
              </form>
            )}

            {/* Events List */}
            {events.length === 0 ? (
              <div className="bg-white rounded-xl shadow-sm p-8 text-center">
                <p className="text-gray-400 text-sm">아직 이벤트가 없습니다.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {events.map((evt) => (
                  <div key={evt.id} className="bg-white rounded-xl shadow-sm p-6">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <span className={`inline-block text-xs font-semibold px-2 py-1 rounded-full mr-2 ${
                          evt.status === 'open' ? 'bg-green-100 text-green-700' :
                          evt.status === 'closed' ? 'bg-gray-100 text-gray-500' :
                          'bg-blue-100 text-blue-700'
                        }`}>
                          {EVENT_STATUS_LABELS[evt.status] || evt.status}
                        </span>
                        <span className="text-sm text-gray-600">
                          {evt.start_date} ~ {evt.end_date}
                        </span>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4 mb-4 text-sm">
                      <div className="text-gray-600">
                        남자: <span className="font-semibold text-gray-800">{evt.current_male}/{evt.max_male}</span>
                      </div>
                      <div className="text-gray-600">
                        여자: <span className="font-semibold text-gray-800">{evt.current_female}/{evt.max_female}</span>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      {evt.status === 'open' && (
                        <button
                          onClick={() => handleUpdateEventStatus(evt.id, 'closed')}
                          className="px-3 py-1 text-xs rounded-lg border border-gray-300 text-gray-600 hover:bg-gray-50"
                        >
                          모집 마감
                        </button>
                      )}
                      {evt.status === 'closed' && (
                        <>
                          <button
                            onClick={() => handleUpdateEventStatus(evt.id, 'open')}
                            className="px-3 py-1 text-xs rounded-lg border border-green-300 text-green-600 hover:bg-green-50"
                          >
                            다시 열기
                          </button>
                          <button
                            onClick={() => handleUpdateEventStatus(evt.id, 'completed')}
                            className="px-3 py-1 text-xs rounded-lg border border-blue-300 text-blue-600 hover:bg-blue-50"
                          >
                            매칭 완료 처리
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Users Tab */}
        {tab === 'users' && (
          <div>
            <h2 className="text-lg font-bold text-gray-900 mb-4">등록된 회원</h2>
            {users.length === 0 ? (
              <div className="bg-white rounded-xl shadow-sm p-8 text-center">
                <p className="text-gray-400 text-sm">등록된 회원이 없습니다.</p>
              </div>
            ) : (
              <div className="bg-white rounded-xl shadow-sm overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500">닉네임</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500">학교</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500">학과</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500">성별</th>
                      <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500">관리</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map((u) => (
                      <tr key={u.user_id} className="border-t border-gray-100 hover:bg-gray-50">
                        <td className="px-4 py-3 font-medium text-gray-800">{u.nickname}</td>
                        <td className="px-4 py-3 text-gray-600">{u.university}</td>
                        <td className="px-4 py-3 text-gray-600">{u.department}</td>
                        <td className="px-4 py-3 text-gray-600">{u.gender}</td>
                        <td className="px-4 py-3 text-right">
                          <button
                            onClick={() => {
                              if (window.confirm(`${u.nickname} 회원을 삭제하시겠습니까?`)) {
                                handleDeleteUser(u.user_id);
                              }
                            }}
                            className="text-xs text-red-500 hover:text-red-700 font-medium"
                          >
                            삭제
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default AdminPage;
