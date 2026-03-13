import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { runMatching, createChatRoom } from '../lib/matching';
import {
  EVENT_STATUS_LABELS, EVENT_TYPES, PHOTO_SETTINGS,
  EVENT_TYPE_LABELS, ALLOWED_DOMAINS, DOMAIN_TO_UNIVERSITY,
  APPLICATION_MODES, APPLICATION_MODE_LABELS,
} from '../lib/constants';
import AdminChatDashboard from '../components/AdminChatDashboard';

function AdminPage() {
  const [tab, setTab] = useState('events');
  const [users, setUsers] = useState([]);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [matchResults, setMatchResults] = useState({}); // eventId -> matches[]
  const [matchingInProgress, setMatchingInProgress] = useState(null); // eventId
  const [chatCreating, setChatCreating] = useState(null); // eventId
  const [eventChatStatus, setEventChatStatus] = useState({}); // eventId -> 'active' | 'closed' | null
  const [editingEvent, setEditingEvent] = useState(null); // event object being edited
  const [selectedEventId, setSelectedEventId] = useState(null); // event detail view
  const [applicants, setApplicants] = useState([]); // applicants for selected event
  const [photoModal, setPhotoModal] = useState(null); // photo URL for fullscreen modal

  // New event form
  const [showNewEvent, setShowNewEvent] = useState(false);
  const [newEvent, setNewEvent] = useState({
    title: '',
    event_type: 'blind_online',
    description: '',
    photo_setting: 'none',
    start_date: '',
    end_date: '',
    max_male: 10,
    max_female: 10,
    allow_all_domains: true,
    male_domains: [],
    female_domains: [],
    application_mode: 'first_come',
    chat_start_date: '',
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

    // Fetch chat room status for completed events
    const completedIds = (eventsData || []).filter((e) => e.status === 'completed').map((e) => e.id);
    if (completedIds.length > 0) {
      const { data: rooms } = await supabase
        .from('chat_rooms')
        .select('event_id, status')
        .in('event_id', completedIds);

      const statusMap = {};
      (rooms || []).forEach((r) => {
        // If any room exists for this event, use its status
        statusMap[r.event_id] = r.status;
      });
      setEventChatStatus(statusMap);
    }

    setLoading(false);
  }

  async function handleCreateEvent(e) {
    e.preventDefault();
    setError('');

    const { error: createError } = await supabase
      .from('matching_events')
      .insert({
        title: newEvent.title,
        event_type: newEvent.event_type,
        description: newEvent.description || null,
        photo_setting: newEvent.photo_setting,
        start_date: newEvent.start_date,
        end_date: newEvent.end_date,
        max_male: Number(newEvent.max_male),
        max_female: Number(newEvent.max_female),
        allow_all_domains: newEvent.allow_all_domains,
        male_domains: newEvent.allow_all_domains ? [] : newEvent.male_domains,
        female_domains: newEvent.allow_all_domains ? [] : newEvent.female_domains,
        application_mode: newEvent.application_mode,
        chat_start_date: newEvent.chat_start_date || null,
        status: 'open',
      });

    if (createError) {
      setError('이벤트 생성 실패: ' + createError.message);
      return;
    }

    setMessage('이벤트가 생성되었습니다.');
    setShowNewEvent(false);
    setNewEvent({
      title: '', event_type: 'blind_online', description: '', photo_setting: 'none',
      start_date: '', end_date: '', max_male: 10, max_female: 10,
      allow_all_domains: true, male_domains: [], female_domains: [],
      application_mode: 'first_come', chat_start_date: '',
    });
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

  async function handleRunMatching(eventId) {
    if (!window.confirm('매칭을 실행하시겠습니까? 실행 후 이벤트가 매칭 완료 상태로 변경됩니다.')) return;

    setMatchingInProgress(eventId);
    setError('');

    try {
      const results = await runMatching(eventId);
      setMessage(`매칭 완료! ${results.length}쌍이 매칭되었습니다.`);
      fetchData();
      await fetchMatchResults(eventId);
    } catch (err) {
      setError('매칭 실패: ' + err.message);
    } finally {
      setMatchingInProgress(null);
    }
  }

  async function fetchMatchResults(eventId) {
    const { data: matchData } = await supabase
      .from('matches')
      .select('id, male_user_id, female_user_id, compatibility_score, status')
      .eq('event_id', eventId);

    if (matchData) {
      // Fetch profiles for all matched users
      const userIds = [...new Set(matchData.flatMap((m) => [m.male_user_id, m.female_user_id]))];
      const { data: profilesData } = await supabase
        .from('profiles')
        .select('user_id, nickname, university')
        .in('user_id', userIds);

      const profileMap = {};
      (profilesData || []).forEach((p) => { profileMap[p.user_id] = p; });

      const enriched = matchData.map((m) => ({
        ...m,
        male: profileMap[m.male_user_id] || null,
        female: profileMap[m.female_user_id] || null,
      }));

      setMatchResults((prev) => ({ ...prev, [eventId]: enriched }));
    }
  }

  async function handleOpenChatRooms(eventId) {
    if (!window.confirm('모든 매칭된 커플의 채팅방을 열겠습니까?')) return;

    setChatCreating(eventId);
    setError('');

    try {
      // Check if chat rooms already exist for this event
      const { data: existingRooms } = await supabase
        .from('chat_rooms')
        .select('id')
        .eq('event_id', eventId);

      if (existingRooms && existingRooms.length > 0) {
        setError('이미 채팅방이 생성된 이벤트입니다.');
        return;
      }

      // Fetch matches for this event
      let matches = matchResults[eventId];
      if (!matches) {
        const { data: matchData } = await supabase
          .from('matches')
          .select('id, male_user_id, female_user_id')
          .eq('event_id', eventId);
        matches = matchData || [];
      }

      if (matches.length === 0) {
        setError('매칭 결과가 없습니다.');
        return;
      }

      let created = 0;
      for (let i = 0; i < matches.length; i++) {
        const m = matches[i];
        await createChatRoom(eventId, {
          id: m.id,
          male_user_id: m.male_user_id,
          female_user_id: m.female_user_id,
        }, i + 1);
        created++;
      }

      setEventChatStatus((prev) => ({ ...prev, [eventId]: 'active' }));
      setMessage(`${created}개의 채팅방이 생성되었습니다.`);
    } catch (err) {
      setError('채팅방 생성 실패: ' + err.message);
    } finally {
      setChatCreating(null);
    }
  }

  async function handleCloseChatRooms(eventId) {
    if (!window.confirm('모든 채팅방을 닫으시겠습니까? 참가자들은 더 이상 채팅을 할 수 없게 됩니다.')) return;

    setChatCreating(eventId);
    setError('');

    try {
      const { error: updateError } = await supabase
        .from('chat_rooms')
        .update({ status: 'closed' })
        .eq('event_id', eventId);

      if (updateError) throw updateError;

      setEventChatStatus((prev) => ({ ...prev, [eventId]: 'closed' }));
      setMessage('모든 채팅방이 닫혔습니다.');
    } catch (err) {
      setError('채팅방 닫기 실패: ' + err.message);
    } finally {
      setChatCreating(null);
    }
  }

  async function handleReopenChatRooms(eventId) {
    if (!window.confirm('채팅방을 다시 활성화하시겠습니까?')) return;

    setChatCreating(eventId);
    setError('');

    try {
      const { error: updateError } = await supabase
        .from('chat_rooms')
        .update({ status: 'active' })
        .eq('event_id', eventId);

      if (updateError) throw updateError;

      setEventChatStatus((prev) => ({ ...prev, [eventId]: 'active' }));
      setMessage('채팅방이 다시 활성화되었습니다.');
    } catch (err) {
      setError('채팅방 활성화 실패: ' + err.message);
    } finally {
      setChatCreating(null);
    }
  }

  async function handleEndEvent(eventId) {
    if (!window.confirm('소개팅을 종료하시겠습니까?\n채팅방도 함께 종료되며, 참가자에게 종료 상태로 표시됩니다.')) return;

    setError('');

    try {
      // Close all chat rooms for this event
      await supabase
        .from('chat_rooms')
        .update({ status: 'closed' })
        .eq('event_id', eventId);

      // Update event status to ended
      const { error: updateError } = await supabase
        .from('matching_events')
        .update({ status: 'ended' })
        .eq('id', eventId);

      if (updateError) throw updateError;

      setEventChatStatus((prev) => ({ ...prev, [eventId]: 'closed' }));
      setMessage('소개팅이 종료되었습니다.');
      fetchData();
    } catch (err) {
      setError('소개팅 종료 실패: ' + err.message);
    }
  }

  function startEditEvent(evt) {
    setEditingEvent({
      id: evt.id,
      title: evt.title || '',
      event_type: evt.event_type || 'blind_online',
      description: evt.description || '',
      photo_setting: evt.photo_setting || 'none',
      start_date: evt.start_date || '',
      end_date: evt.end_date || '',
      max_male: evt.max_male || 10,
      max_female: evt.max_female || 10,
      allow_all_domains: evt.allow_all_domains ?? true,
      male_domains: evt.male_domains || [],
      female_domains: evt.female_domains || [],
      application_mode: evt.application_mode || 'first_come',
      chat_start_date: evt.chat_start_date || '',
    });
  }

  async function handleSaveEdit(e) {
    e.preventDefault();
    setError('');

    const { id, ...fields } = editingEvent;
    const { error: updateError } = await supabase
      .from('matching_events')
      .update({
        title: fields.title,
        event_type: fields.event_type,
        description: fields.description || null,
        photo_setting: fields.photo_setting,
        start_date: fields.start_date,
        end_date: fields.end_date,
        max_male: Number(fields.max_male),
        max_female: Number(fields.max_female),
        allow_all_domains: fields.allow_all_domains,
        male_domains: fields.allow_all_domains ? [] : fields.male_domains,
        female_domains: fields.allow_all_domains ? [] : fields.female_domains,
        application_mode: fields.application_mode,
        chat_start_date: fields.chat_start_date || null,
      })
      .eq('id', id);

    if (updateError) {
      setError('수정 실패: ' + updateError.message);
      return;
    }

    setMessage('이벤트가 수정되었습니다.');
    setEditingEvent(null);
    fetchData();
  }

  async function openEventDetail(eventId) {
    setSelectedEventId(eventId);
    setApplicants([]);

    // Fetch applications with profile info
    const { data: appData } = await supabase
      .from('applications')
      .select('user_id, applied_at, profile_snapshot, preferences_snapshot, photo_url')
      .eq('event_id', eventId)
      .order('applied_at', { ascending: true });

    if (appData) {
      const userIds = appData.map((a) => a.user_id);
      const { data: profilesData } = await supabase
        .from('profiles')
        .select('user_id, nickname, university, department, gender, birth_year')
        .in('user_id', userIds);

      const { data: blindData } = await supabase
        .from('blind_profiles')
        .select('user_id, height, body_type, face_type, mbti, smoking, drinking, personality, interests, military_service, photo_url')
        .in('user_id', userIds);

      const profileMap = {};
      (profilesData || []).forEach((p) => { profileMap[p.user_id] = p; });
      const blindMap = {};
      (blindData || []).forEach((b) => { blindMap[b.user_id] = b; });

      const enriched = appData.map((a) => ({
        ...a,
        profile: profileMap[a.user_id] || null,
        blind: blindMap[a.user_id] || null,
      }));
      setApplicants(enriched);
    }

    // Also fetch match results if completed
    await fetchMatchResults(eventId);
  }

  function toggleEditDomain(field, domain) {
    setEditingEvent((prev) => {
      const current = prev[field];
      return {
        ...prev,
        [field]: current.includes(domain)
          ? current.filter((d) => d !== domain)
          : [...current, domain],
      };
    });
  }

  function toggleDomain(field, domain) {
    setNewEvent((prev) => {
      const current = prev[field];
      return {
        ...prev,
        [field]: current.includes(domain)
          ? current.filter((d) => d !== domain)
          : [...current, domain],
      };
    });
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
          <button
            onClick={() => setTab('chat')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              tab === 'chat' ? 'bg-primary text-white' : 'bg-white text-gray-600 border border-gray-300 hover:bg-gray-50'
            }`}
          >
            채팅 관리
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
        {tab === 'events' && selectedEventId ? (
          /* Event Detail View */
          (() => {
            const evt = events.find((e) => e.id === selectedEventId);
            if (!evt) return null;
            const males = applicants.filter((a) => a.profile?.gender === '남자');
            const females = applicants.filter((a) => a.profile?.gender === '여자');
            return (
              <div>
                <button
                  onClick={() => { setSelectedEventId(null); setApplicants([]); setEditingEvent(null); }}
                  className="text-sm text-gray-400 hover:text-gray-600 mb-4"
                >
                  ← 목록으로
                </button>

                {/* Event Info */}
                <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
                  {editingEvent?.id === evt.id ? (
                    <form onSubmit={handleSaveEdit}>
                      <div className="mb-4">
                        <label className="block text-xs text-gray-500 mb-1">제목</label>
                        <input type="text" required value={editingEvent.title}
                          onChange={(e) => setEditingEvent({ ...editingEvent, title: e.target.value })}
                          className="w-full p-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
                      </div>
                      <div className="mb-4">
                        <label className="block text-xs text-gray-500 mb-1">소개팅 종류</label>
                        <select value={editingEvent.event_type}
                          onChange={(e) => setEditingEvent({ ...editingEvent, event_type: e.target.value })}
                          className="w-full p-2 border border-gray-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary">
                          {EVENT_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
                        </select>
                      </div>
                      <div className="mb-4">
                        <label className="block text-xs text-gray-500 mb-1">안내사항 (선택)</label>
                        <textarea value={editingEvent.description}
                          onChange={(e) => setEditingEvent({ ...editingEvent, description: e.target.value })}
                          rows={3} className="w-full p-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary resize-none" />
                      </div>
                      <div className="mb-4">
                        <label className="block text-xs text-gray-500 mb-2">사진 설정</label>
                        <div className="flex flex-wrap gap-2">
                          {PHOTO_SETTINGS.map((ps) => (
                            <button key={ps.value} type="button"
                              onClick={() => setEditingEvent({ ...editingEvent, photo_setting: ps.value })}
                              className={`px-3 py-1.5 rounded-lg border text-sm transition-all ${
                                editingEvent.photo_setting === ps.value ? 'bg-primary text-white border-primary' : 'bg-white text-gray-700 border-gray-300 hover:border-primary'
                              }`}>{ps.label}</button>
                          ))}
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4 mb-4">
                        <div>
                          <label className="block text-xs text-gray-500 mb-1">시작일</label>
                          <input type="date" required value={editingEvent.start_date}
                            onChange={(e) => setEditingEvent({ ...editingEvent, start_date: e.target.value })}
                            className="w-full p-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
                        </div>
                        <div>
                          <label className="block text-xs text-gray-500 mb-1">종료일</label>
                          <input type="date" required value={editingEvent.end_date}
                            onChange={(e) => setEditingEvent({ ...editingEvent, end_date: e.target.value })}
                            className="w-full p-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
                        </div>
                        <div>
                          <label className="block text-xs text-gray-500 mb-1">남자 정원</label>
                          <input type="number" required min="1" value={editingEvent.max_male}
                            onChange={(e) => setEditingEvent({ ...editingEvent, max_male: e.target.value })}
                            className="w-full p-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
                        </div>
                        <div>
                          <label className="block text-xs text-gray-500 mb-1">여자 정원</label>
                          <input type="number" required min="1" value={editingEvent.max_female}
                            onChange={(e) => setEditingEvent({ ...editingEvent, max_female: e.target.value })}
                            className="w-full p-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
                        </div>
                      </div>
                      <div className="mb-4">
                        <label className="block text-xs text-gray-500 mb-2">지원 방식</label>
                        <div className="flex flex-wrap gap-2">
                          {APPLICATION_MODES.map((mode) => (
                            <button key={mode.value} type="button"
                              onClick={() => setEditingEvent({ ...editingEvent, application_mode: mode.value })}
                              className={`px-3 py-1.5 rounded-lg border text-sm transition-all ${
                                editingEvent.application_mode === mode.value ? 'bg-primary text-white border-primary' : 'bg-white text-gray-700 border-gray-300 hover:border-primary'
                              }`}>{mode.label}</button>
                          ))}
                        </div>
                      </div>
                      <div className="mb-4">
                        <label className="block text-xs text-gray-500 mb-1">채팅 시작 예정일 (선택)</label>
                        <input type="date" value={editingEvent.chat_start_date}
                          onChange={(e) => setEditingEvent({ ...editingEvent, chat_start_date: e.target.value })}
                          className="w-full p-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
                      </div>
                      <div className="flex gap-2">
                        <button type="submit" className="flex-1 py-2 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary-dark">저장</button>
                        <button type="button" onClick={() => setEditingEvent(null)}
                          className="flex-1 py-2 border border-gray-300 text-gray-600 rounded-lg text-sm font-medium hover:bg-gray-50">취소</button>
                      </div>
                    </form>
                  ) : (
                  <>
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <span className={`inline-block text-xs font-semibold px-2 py-1 rounded-full mr-2 ${
                        evt.status === 'open' ? 'bg-green-100 text-green-700' :
                        evt.status === 'closed' ? 'bg-yellow-100 text-yellow-700' :
                        evt.status === 'completed' ? 'bg-blue-100 text-blue-700' :
                        evt.status === 'ended' ? 'bg-gray-200 text-gray-500' :
                        'bg-gray-100 text-gray-500'
                      }`}>
                        {EVENT_STATUS_LABELS[evt.status] || evt.status}
                      </span>
                      <span className={`inline-block text-xs font-semibold px-2 py-1 rounded-full ${
                        evt.event_type === 'blind_online' ? 'bg-purple-100 text-purple-700' :
                        evt.event_type === 'blind_offline' ? 'bg-orange-100 text-orange-700' :
                        'bg-gray-100 text-gray-600'
                      }`}>
                        {EVENT_TYPE_LABELS[evt.event_type] || evt.event_type}
                      </span>
                    </div>
                    <button onClick={() => startEditEvent(evt)} className="text-xs text-gray-400 hover:text-primary font-medium">수정</button>
                  </div>
                  <h3 className="text-lg font-bold text-gray-800 mb-1">{evt.title}</h3>
                  {evt.description && <p className="text-sm text-gray-500 mb-1">{evt.description}</p>}
                  <p className="text-sm text-gray-500 mb-1">{evt.start_date} ~ {evt.end_date}</p>
                  <div className="flex flex-wrap gap-2 mb-3 text-xs text-gray-500">
                    <span>{APPLICATION_MODE_LABELS[evt.application_mode] || '선착순'}</span>
                    {evt.chat_start_date && <span>| 채팅 시작: {evt.chat_start_date}</span>}
                  </div>
                  <div className="grid grid-cols-2 gap-4 mb-4 text-sm">
                    <div className="text-gray-600">남자: <span className="font-semibold text-gray-800">{evt.current_male}/{evt.max_male}</span></div>
                    <div className="text-gray-600">여자: <span className="font-semibold text-gray-800">{evt.current_female}/{evt.max_female}</span></div>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {evt.status === 'open' && (
                      <button onClick={() => handleUpdateEventStatus(evt.id, 'closed')}
                        className="px-3 py-1 text-xs rounded-lg border border-gray-300 text-gray-600 hover:bg-gray-50">모집 마감</button>
                    )}
                    {evt.status === 'closed' && (
                      <>
                        <button onClick={() => handleUpdateEventStatus(evt.id, 'open')}
                          className="px-3 py-1 text-xs rounded-lg border border-green-300 text-green-600 hover:bg-green-50">다시 열기</button>
                        <button onClick={() => handleRunMatching(evt.id)} disabled={matchingInProgress === evt.id}
                          className="px-3 py-1 text-xs rounded-lg border border-purple-300 text-purple-600 hover:bg-purple-50 disabled:opacity-50">
                          {matchingInProgress === evt.id ? '매칭 중...' : '매칭 실행'}</button>
                      </>
                    )}
                    {evt.status === 'completed' && (
                      <>
                        {eventChatStatus[evt.id] === 'active' ? (
                          <button onClick={() => handleCloseChatRooms(evt.id)} disabled={chatCreating === evt.id}
                            className="px-3 py-1 text-xs rounded-lg border border-red-300 text-red-600 hover:bg-red-50 disabled:opacity-50">
                            {chatCreating === evt.id ? '처리 중...' : '채팅방 닫기'}</button>
                        ) : eventChatStatus[evt.id] === 'closed' ? (
                          <button onClick={() => handleReopenChatRooms(evt.id)} disabled={chatCreating === evt.id}
                            className="px-3 py-1 text-xs rounded-lg border border-green-300 text-green-600 hover:bg-green-50 disabled:opacity-50">
                            {chatCreating === evt.id ? '처리 중...' : '채팅 다시 열기'}</button>
                        ) : (
                          <button onClick={() => handleOpenChatRooms(evt.id)} disabled={chatCreating === evt.id}
                            className="px-3 py-1 text-xs rounded-lg border border-pink-300 text-pink-600 hover:bg-pink-50 disabled:opacity-50">
                            {chatCreating === evt.id ? '생성 중...' : '채팅방 열기'}</button>
                        )}
                        <button onClick={() => handleEndEvent(evt.id)}
                          className="px-3 py-1 text-xs rounded-lg border border-gray-400 text-gray-500 hover:bg-gray-100">소개팅 종료</button>
                      </>
                    )}
                  </div>
                  </>
                  )}
                </div>

                {/* Applicants */}
                <div className="mb-6">
                  <h3 className="text-sm font-bold text-gray-700 mb-3">지원자 ({applicants.length}명)</h3>

                  {applicants.length === 0 ? (
                    <div className="bg-white rounded-xl shadow-sm p-8 text-center">
                      <p className="text-gray-400 text-sm">아직 지원자가 없습니다.</p>
                    </div>
                  ) : (
                    <>
                      {/* Males */}
                      <h4 className="text-xs font-semibold text-blue-600 mb-2">남자 ({males.length}명)</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
                        {males.map((a) => (
                          <div key={a.user_id} className="bg-blue-50 rounded-xl p-3 text-xs">
                            {a.photo_url && (
                              <img src={a.photo_url} alt="사진" onClick={() => setPhotoModal(a.photo_url)}
                                className="w-full h-32 object-cover rounded-lg mb-2 cursor-pointer hover:opacity-80 transition-opacity" />
                            )}
                            <p className="font-bold text-blue-700 mb-1">
                              {a.profile?.nickname} <span className="font-normal text-gray-400">{a.profile?.birth_year}년생</span>
                            </p>
                            <p className="text-gray-500">{a.profile?.university} · {a.profile?.department}</p>
                            {a.blind && (
                              <div className="mt-1.5 text-gray-500 space-y-0.5">
                                {a.blind.height && <p>키 {a.blind.height}cm</p>}
                                <p>{[a.blind.body_type, a.blind.face_type, a.blind.mbti].filter(Boolean).join(' · ')}</p>
                                <p>{[a.blind.smoking && `흡연: ${a.blind.smoking}`, a.blind.drinking && `음주: ${a.blind.drinking}`].filter(Boolean).join(' · ')}</p>
                                {a.blind.military_service && <p>군복무: {a.blind.military_service}</p>}
                                {a.blind.personality?.length > 0 && <p>성격: {a.blind.personality.join(', ')}</p>}
                                {a.blind.interests?.length > 0 && <p>관심사: {a.blind.interests.join(', ')}</p>}
                              </div>
                            )}
                            <p className="text-gray-400 mt-1">신청: {new Date(a.applied_at).toLocaleDateString('ko-KR')}</p>
                          </div>
                        ))}
                      </div>

                      {/* Females */}
                      <h4 className="text-xs font-semibold text-pink-600 mb-2">여자 ({females.length}명)</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
                        {females.map((a) => (
                          <div key={a.user_id} className="bg-pink-50 rounded-xl p-3 text-xs">
                            {a.photo_url && (
                              <img src={a.photo_url} alt="사진" onClick={() => setPhotoModal(a.photo_url)}
                                className="w-full h-32 object-cover rounded-lg mb-2 cursor-pointer hover:opacity-80 transition-opacity" />
                            )}
                            <p className="font-bold text-pink-700 mb-1">
                              {a.profile?.nickname} <span className="font-normal text-gray-400">{a.profile?.birth_year}년생</span>
                            </p>
                            <p className="text-gray-500">{a.profile?.university} · {a.profile?.department}</p>
                            {a.blind && (
                              <div className="mt-1.5 text-gray-500 space-y-0.5">
                                {a.blind.height && <p>키 {a.blind.height}cm</p>}
                                <p>{[a.blind.body_type, a.blind.face_type, a.blind.mbti].filter(Boolean).join(' · ')}</p>
                                <p>{[a.blind.smoking && `흡연: ${a.blind.smoking}`, a.blind.drinking && `음주: ${a.blind.drinking}`].filter(Boolean).join(' · ')}</p>
                                {a.blind.personality?.length > 0 && <p>성격: {a.blind.personality.join(', ')}</p>}
                                {a.blind.interests?.length > 0 && <p>관심사: {a.blind.interests.join(', ')}</p>}
                              </div>
                            )}
                            <p className="text-gray-400 mt-1">신청: {new Date(a.applied_at).toLocaleDateString('ko-KR')}</p>
                          </div>
                        ))}
                      </div>
                    </>
                  )}
                </div>

                {/* Match Results */}
                {matchResults[evt.id] && matchResults[evt.id].length > 0 && (
                  <div className="bg-white rounded-xl shadow-sm p-6">
                    <h3 className="text-sm font-bold text-gray-700 mb-3">매칭 결과 ({matchResults[evt.id].length}쌍)</h3>
                    <div className="space-y-2">
                      {matchResults[evt.id].map((m, i) => (
                        <div key={m.id || i} className="flex items-center justify-between bg-gray-50 rounded-lg px-3 py-2 text-sm">
                          <span className="text-gray-700">
                            {m.male?.nickname || m.male_user_id?.slice(0, 8)} <span className="text-gray-400">↔</span> {m.female?.nickname || m.female_user_id?.slice(0, 8)}
                          </span>
                          <span className="text-xs text-gray-500">
                            {m.compatibility_score != null ? `${Math.round(m.compatibility_score)}점` : ''}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })()
        ) : tab === 'events' && (
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

                {/* Title */}
                <div className="mb-4">
                  <label className="block text-xs text-gray-500 mb-1">제목</label>
                  <input
                    type="text" required
                    value={newEvent.title}
                    onChange={(e) => setNewEvent({ ...newEvent, title: e.target.value })}
                    placeholder="예: 2026 봄 블라인드 소개팅"
                    className="w-full p-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>

                {/* Event Type */}
                <div className="mb-4">
                  <label className="block text-xs text-gray-500 mb-1">소개팅 종류</label>
                  <select
                    value={newEvent.event_type}
                    onChange={(e) => setNewEvent({ ...newEvent, event_type: e.target.value })}
                    className="w-full p-2 border border-gray-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary"
                  >
                    {EVENT_TYPES.map((t) => (
                      <option key={t.value} value={t.value}>{t.label}</option>
                    ))}
                  </select>
                </div>

                {/* Description */}
                <div className="mb-4">
                  <label className="block text-xs text-gray-500 mb-1">안내사항 (선택)</label>
                  <textarea
                    value={newEvent.description}
                    onChange={(e) => setNewEvent({ ...newEvent, description: e.target.value })}
                    placeholder="참가자에게 안내할 내용을 입력하세요"
                    rows={3}
                    className="w-full p-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary resize-none"
                  />
                </div>

                {/* Photo Setting */}
                <div className="mb-4">
                  <label className="block text-xs text-gray-500 mb-2">사진 설정</label>
                  <div className="flex flex-wrap gap-2">
                    {PHOTO_SETTINGS.map((ps) => (
                      <button
                        key={ps.value}
                        type="button"
                        onClick={() => setNewEvent({ ...newEvent, photo_setting: ps.value })}
                        className={`px-3 py-1.5 rounded-lg border text-sm transition-all ${
                          newEvent.photo_setting === ps.value
                            ? 'bg-primary text-white border-primary'
                            : 'bg-white text-gray-700 border-gray-300 hover:border-primary'
                        }`}
                      >
                        {ps.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Dates & Capacity */}
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

                {/* Domain Restrictions */}
                <div className="mb-4">
                  <label className="block text-xs text-gray-500 mb-2">도메인 제한</label>
                  <label className="flex items-center gap-2 mb-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={newEvent.allow_all_domains}
                      onChange={(e) => setNewEvent({ ...newEvent, allow_all_domains: e.target.checked })}
                      className="rounded border-gray-300"
                    />
                    <span className="text-sm text-gray-700">모든 대학교 허용</span>
                  </label>

                  {!newEvent.allow_all_domains && (
                    <div className="grid grid-cols-2 gap-4 p-3 bg-gray-50 rounded-lg">
                      <div>
                        <p className="text-xs text-gray-500 mb-2">남자 허용 도메인</p>
                        {ALLOWED_DOMAINS.map((domain) => (
                          <label key={`male-${domain}`} className="flex items-center gap-2 mb-1 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={newEvent.male_domains.includes(domain)}
                              onChange={() => toggleDomain('male_domains', domain)}
                              className="rounded border-gray-300"
                            />
                            <span className="text-sm text-gray-700">{DOMAIN_TO_UNIVERSITY[domain]}</span>
                          </label>
                        ))}
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 mb-2">여자 허용 도메인</p>
                        {ALLOWED_DOMAINS.map((domain) => (
                          <label key={`female-${domain}`} className="flex items-center gap-2 mb-1 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={newEvent.female_domains.includes(domain)}
                              onChange={() => toggleDomain('female_domains', domain)}
                              className="rounded border-gray-300"
                            />
                            <span className="text-sm text-gray-700">{DOMAIN_TO_UNIVERSITY[domain]}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Application Mode */}
                <div className="mb-4">
                  <label className="block text-xs text-gray-500 mb-2">지원 방식</label>
                  <div className="flex flex-wrap gap-2">
                    {APPLICATION_MODES.map((mode) => (
                      <button
                        key={mode.value}
                        type="button"
                        onClick={() => setNewEvent({ ...newEvent, application_mode: mode.value })}
                        className={`px-3 py-1.5 rounded-lg border text-sm transition-all ${
                          newEvent.application_mode === mode.value
                            ? 'bg-primary text-white border-primary'
                            : 'bg-white text-gray-700 border-gray-300 hover:border-primary'
                        }`}
                      >
                        {mode.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Chat Start Date */}
                <div className="mb-4">
                  <label className="block text-xs text-gray-500 mb-1">채팅 시작 예정일 (선택)</label>
                  <input
                    type="date"
                    value={newEvent.chat_start_date}
                    onChange={(e) => setNewEvent({ ...newEvent, chat_start_date: e.target.value })}
                    className="w-full p-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                  <p className="text-xs text-gray-400 mt-1">매칭 완료 후 채팅방을 열 예정 날짜입니다.</p>
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
                    {/* Edit Form */}
                    {editingEvent?.id === evt.id ? (
                      <form onSubmit={handleSaveEdit}>
                        <div className="mb-4">
                          <label className="block text-xs text-gray-500 mb-1">제목</label>
                          <input type="text" required value={editingEvent.title}
                            onChange={(e) => setEditingEvent({ ...editingEvent, title: e.target.value })}
                            className="w-full p-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
                        </div>
                        <div className="mb-4">
                          <label className="block text-xs text-gray-500 mb-1">소개팅 종류</label>
                          <select value={editingEvent.event_type}
                            onChange={(e) => setEditingEvent({ ...editingEvent, event_type: e.target.value })}
                            className="w-full p-2 border border-gray-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary">
                            {EVENT_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
                          </select>
                        </div>
                        <div className="mb-4">
                          <label className="block text-xs text-gray-500 mb-1">안내사항 (선택)</label>
                          <textarea value={editingEvent.description}
                            onChange={(e) => setEditingEvent({ ...editingEvent, description: e.target.value })}
                            rows={3} className="w-full p-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary resize-none" />
                        </div>
                        <div className="mb-4">
                          <label className="block text-xs text-gray-500 mb-2">사진 설정</label>
                          <div className="flex flex-wrap gap-2">
                            {PHOTO_SETTINGS.map((ps) => (
                              <button key={ps.value} type="button"
                                onClick={() => setEditingEvent({ ...editingEvent, photo_setting: ps.value })}
                                className={`px-3 py-1.5 rounded-lg border text-sm transition-all ${
                                  editingEvent.photo_setting === ps.value ? 'bg-primary text-white border-primary' : 'bg-white text-gray-700 border-gray-300 hover:border-primary'
                                }`}>{ps.label}</button>
                            ))}
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4 mb-4">
                          <div>
                            <label className="block text-xs text-gray-500 mb-1">시작일</label>
                            <input type="date" required value={editingEvent.start_date}
                              onChange={(e) => setEditingEvent({ ...editingEvent, start_date: e.target.value })}
                              className="w-full p-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
                          </div>
                          <div>
                            <label className="block text-xs text-gray-500 mb-1">종료일</label>
                            <input type="date" required value={editingEvent.end_date}
                              onChange={(e) => setEditingEvent({ ...editingEvent, end_date: e.target.value })}
                              className="w-full p-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
                          </div>
                          <div>
                            <label className="block text-xs text-gray-500 mb-1">남자 정원</label>
                            <input type="number" required min="1" value={editingEvent.max_male}
                              onChange={(e) => setEditingEvent({ ...editingEvent, max_male: e.target.value })}
                              className="w-full p-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
                          </div>
                          <div>
                            <label className="block text-xs text-gray-500 mb-1">여자 정원</label>
                            <input type="number" required min="1" value={editingEvent.max_female}
                              onChange={(e) => setEditingEvent({ ...editingEvent, max_female: e.target.value })}
                              className="w-full p-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
                          </div>
                        </div>
                        <div className="mb-4">
                          <label className="block text-xs text-gray-500 mb-2">도메인 제한</label>
                          <label className="flex items-center gap-2 mb-3 cursor-pointer">
                            <input type="checkbox" checked={editingEvent.allow_all_domains}
                              onChange={(e) => setEditingEvent({ ...editingEvent, allow_all_domains: e.target.checked })}
                              className="rounded border-gray-300" />
                            <span className="text-sm text-gray-700">모든 대학교 허용</span>
                          </label>
                          {!editingEvent.allow_all_domains && (
                            <div className="grid grid-cols-2 gap-4 p-3 bg-gray-50 rounded-lg">
                              <div>
                                <p className="text-xs text-gray-500 mb-2">남자 허용 도메인</p>
                                {ALLOWED_DOMAINS.map((domain) => (
                                  <label key={`edit-male-${domain}`} className="flex items-center gap-2 mb-1 cursor-pointer">
                                    <input type="checkbox" checked={editingEvent.male_domains.includes(domain)}
                                      onChange={() => toggleEditDomain('male_domains', domain)} className="rounded border-gray-300" />
                                    <span className="text-sm text-gray-700">{DOMAIN_TO_UNIVERSITY[domain]}</span>
                                  </label>
                                ))}
                              </div>
                              <div>
                                <p className="text-xs text-gray-500 mb-2">여자 허용 도메인</p>
                                {ALLOWED_DOMAINS.map((domain) => (
                                  <label key={`edit-female-${domain}`} className="flex items-center gap-2 mb-1 cursor-pointer">
                                    <input type="checkbox" checked={editingEvent.female_domains.includes(domain)}
                                      onChange={() => toggleEditDomain('female_domains', domain)} className="rounded border-gray-300" />
                                    <span className="text-sm text-gray-700">{DOMAIN_TO_UNIVERSITY[domain]}</span>
                                  </label>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                        <div className="mb-4">
                          <label className="block text-xs text-gray-500 mb-2">지원 방식</label>
                          <div className="flex flex-wrap gap-2">
                            {APPLICATION_MODES.map((mode) => (
                              <button key={mode.value} type="button"
                                onClick={() => setEditingEvent({ ...editingEvent, application_mode: mode.value })}
                                className={`px-3 py-1.5 rounded-lg border text-sm transition-all ${
                                  editingEvent.application_mode === mode.value ? 'bg-primary text-white border-primary' : 'bg-white text-gray-700 border-gray-300 hover:border-primary'
                                }`}>{mode.label}</button>
                            ))}
                          </div>
                        </div>
                        <div className="mb-4">
                          <label className="block text-xs text-gray-500 mb-1">채팅 시작 예정일 (선택)</label>
                          <input type="date" value={editingEvent.chat_start_date}
                            onChange={(e) => setEditingEvent({ ...editingEvent, chat_start_date: e.target.value })}
                            className="w-full p-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
                        </div>
                        <div className="flex gap-2">
                          <button type="submit" className="flex-1 py-2 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary-dark">
                            저장
                          </button>
                          <button type="button" onClick={() => setEditingEvent(null)}
                            className="flex-1 py-2 border border-gray-300 text-gray-600 rounded-lg text-sm font-medium hover:bg-gray-50">
                            취소
                          </button>
                        </div>
                      </form>
                    ) : (
                    <>
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <span className={`inline-block text-xs font-semibold px-2 py-1 rounded-full mr-2 ${
                          evt.status === 'open' ? 'bg-green-100 text-green-700' :
                          evt.status === 'closed' ? 'bg-yellow-100 text-yellow-700' :
                          evt.status === 'completed' ? 'bg-blue-100 text-blue-700' :
                          evt.status === 'ended' ? 'bg-gray-200 text-gray-500' :
                          'bg-gray-100 text-gray-500'
                        }`}>
                          {EVENT_STATUS_LABELS[evt.status] || evt.status}
                        </span>
                        <span className={`inline-block text-xs font-semibold px-2 py-1 rounded-full mr-2 ${
                          evt.event_type === 'blind_online' ? 'bg-purple-100 text-purple-700' :
                          evt.event_type === 'blind_offline' ? 'bg-orange-100 text-orange-700' :
                          evt.event_type === 'rotation' ? 'bg-teal-100 text-teal-700' :
                          'bg-gray-100 text-gray-600'
                        }`}>
                          {EVENT_TYPE_LABELS[evt.event_type] || evt.event_type}
                        </span>
                      </div>
                      <div className="flex gap-3">
                        <button onClick={() => openEventDetail(evt.id)}
                          className="text-xs text-primary hover:text-primary-dark font-medium">상세</button>
                        <button onClick={() => startEditEvent(evt)}
                          className="text-xs text-gray-400 hover:text-primary font-medium">수정</button>
                      </div>
                    </div>
                    <h4 className="text-base font-bold text-gray-800 mb-1">{evt.title}</h4>
                    {evt.description && <p className="text-sm text-gray-500 mb-1">{evt.description}</p>}
                    <p className="text-sm text-gray-500 mb-1">{evt.start_date} ~ {evt.end_date}</p>
                    <div className="flex flex-wrap gap-2 mb-3 text-xs text-gray-500">
                      <span>{APPLICATION_MODE_LABELS[evt.application_mode] || '선착순'}</span>
                      {evt.chat_start_date && <span>| 채팅 시작: {evt.chat_start_date}</span>}
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
                            onClick={() => handleRunMatching(evt.id)}
                            disabled={matchingInProgress === evt.id}
                            className="px-3 py-1 text-xs rounded-lg border border-purple-300 text-purple-600 hover:bg-purple-50 disabled:opacity-50"
                          >
                            {matchingInProgress === evt.id ? '매칭 중...' : '매칭 실행'}
                          </button>
                        </>
                      )}
                      {evt.status === 'completed' && (
                        <>
                          {!matchResults[evt.id] && (
                            <button
                              onClick={() => fetchMatchResults(evt.id)}
                              className="px-3 py-1 text-xs rounded-lg border border-blue-300 text-blue-600 hover:bg-blue-50"
                            >
                              매칭 결과 보기
                            </button>
                          )}
                          {eventChatStatus[evt.id] === 'active' ? (
                            <button
                              onClick={() => handleCloseChatRooms(evt.id)}
                              disabled={chatCreating === evt.id}
                              className="px-3 py-1 text-xs rounded-lg border border-red-300 text-red-600 hover:bg-red-50 disabled:opacity-50"
                            >
                              {chatCreating === evt.id ? '처리 중...' : '채팅방 닫기'}
                            </button>
                          ) : eventChatStatus[evt.id] === 'closed' ? (
                            <button
                              onClick={() => handleReopenChatRooms(evt.id)}
                              disabled={chatCreating === evt.id}
                              className="px-3 py-1 text-xs rounded-lg border border-green-300 text-green-600 hover:bg-green-50 disabled:opacity-50"
                            >
                              {chatCreating === evt.id ? '처리 중...' : '채팅 다시 열기'}
                            </button>
                          ) : (
                            <button
                              onClick={() => handleOpenChatRooms(evt.id)}
                              disabled={chatCreating === evt.id}
                              className="px-3 py-1 text-xs rounded-lg border border-pink-300 text-pink-600 hover:bg-pink-50 disabled:opacity-50"
                            >
                              {chatCreating === evt.id ? '생성 중...' : '채팅방 열기'}
                            </button>
                          )}
                          <button
                            onClick={() => handleEndEvent(evt.id)}
                            className="px-3 py-1 text-xs rounded-lg border border-gray-400 text-gray-500 hover:bg-gray-100"
                          >
                            소개팅 종료
                          </button>
                        </>
                      )}
                      {evt.status === 'ended' && (
                        <>
                          {!matchResults[evt.id] && (
                            <button
                              onClick={() => fetchMatchResults(evt.id)}
                              className="px-3 py-1 text-xs rounded-lg border border-blue-300 text-blue-600 hover:bg-blue-50"
                            >
                              매칭 결과 보기
                            </button>
                          )}
                          <span className="px-3 py-1 text-xs rounded-lg bg-gray-100 text-gray-400">
                            종료된 소개팅
                          </span>
                        </>
                      )}
                    </div>

                    {/* Match Results */}
                    {matchResults[evt.id] && matchResults[evt.id].length > 0 && (
                      <div className="mt-4 border-t border-gray-100 pt-4">
                        <h4 className="text-xs font-bold text-gray-600 mb-2">매칭 결과 ({matchResults[evt.id].length}쌍)</h4>
                        <div className="space-y-2">
                          {matchResults[evt.id].map((m, i) => (
                            <div key={m.id || i} className="flex items-center justify-between bg-gray-50 rounded-lg px-3 py-2 text-sm">
                              <span className="text-gray-700">
                                {m.male?.nickname || m.male_user_id?.slice(0, 8)} <span className="text-gray-400">↔</span> {m.female?.nickname || m.female_user_id?.slice(0, 8)}
                              </span>
                              <span className="text-xs text-gray-500">
                                {m.compatibility_score != null ? `${Math.round(m.compatibility_score)}점` : ''}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    </>
                    )}
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

        {/* Chat Tab */}
        {tab === 'chat' && (
          <div>
            <h2 className="text-lg font-bold text-gray-900 mb-4">채팅 관리</h2>
            <AdminChatDashboard />
          </div>
        )}
      </div>

      {/* Photo Modal */}
      {photoModal && (
        <div
          className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4"
          onClick={() => setPhotoModal(null)}
        >
          <img
            src={photoModal}
            alt="전체 사진"
            className="max-w-full max-h-full object-contain rounded-lg"
            onClick={(e) => e.stopPropagation()}
          />
          <button
            onClick={() => setPhotoModal(null)}
            className="absolute top-4 right-4 text-white text-2xl font-bold hover:text-gray-300"
          >
            ✕
          </button>
        </div>
      )}
    </div>
  );
}

export default AdminPage;
