import { useState, useEffect, useRef } from 'react';
import { useAdminChat } from '../hooks/useAdminChat';
import { useChat } from '../hooks/useChat';
import { useAuth } from '../hooks/useAuth';
import { supabase } from '../lib/supabase';

const BROADCAST_MACROS = [
  {
    label: '첫인사',
    text: `안녕하세요, 주선자입니다! 오늘 참여해주셔서 감사합니다 :)\n\n지금부터 약 30분간 소개팅이 진행됩니다. 옆에서 함께할 테니 편하게 대화해주세요!\n\n궁금한 점이 있거나 도움이 필요하시면 @주선자 라고 태그해주시면 바로 확인하겠습니다.\n\n그럼 서로 인사부터 시작해볼까요?`,
  },
  {
    label: '10분 남음',
    text: '채팅 종료 10분 전입니다! 아직 못 나눈 이야기가 있다면 지금 해주세요 :)',
  },
  {
    label: '연락처 교환',
    text: '소개팅을 마무리할 시간이 다가왔습니다!\n서로 대화가 잘 통하셨나요? :)\n\n계속해서 대화를 이어가고 싶으시다면 연락처를 교환하실 수 있습니다.\n연락처 공유 의사가 있으신가요? 편하게 네 / 아니요로 답해주시면 됩니다.\n모두 동의하시면 여러분께서 편한 개인 연락처로 교환을 진행하시면 됩니다!',
  },
  {
    label: '종료 인사',
    text: '오늘 소개팅이 마무리되었습니다. 참여해주셔서 감사합니다!\n좋은 인연이 되셨길 바랍니다 :)',
  },
];

function ChatBubble({ message, isOwn, senderName }) {
  if (message.message_type === 'system') {
    return (
      <div className="flex justify-center my-1">
        <div className="bg-gray-100 text-gray-500 text-xs px-3 py-1 rounded-full">
          {message.content}
        </div>
      </div>
    );
  }

  if (message.message_type === 'contact_share') {
    return (
      <div className="flex justify-center my-1">
        <div className="bg-purple-50 border border-purple-200 text-purple-700 text-xs px-3 py-2 rounded-lg">
          <span className="font-semibold">연락처:</span> {message.content}
        </div>
      </div>
    );
  }

  return (
    <div className={`flex ${isOwn ? 'justify-end' : 'justify-start'} mb-1`}>
      <div className={`max-w-[75%]`}>
        {!isOwn && <p className="text-[10px] text-gray-400 mb-0.5 ml-1">{senderName}</p>}
        <div className={`px-3 py-1.5 rounded-xl text-xs ${
          isOwn ? 'bg-primary text-white' : 'bg-gray-100 text-gray-800'
        }`}>
          {message.content}
        </div>
      </div>
    </div>
  );
}

function AdminChatRoom({ roomId, onClose }) {
  const { user } = useAuth();
  const { messages, participants, loading, sendMessage } = useChat(roomId);
  const [input, setInput] = useState('');
  const [sharing, setSharing] = useState(false);
  const [memberProfiles, setMemberProfiles] = useState([]);
  const messagesEndRef = useRef(null);

  const senderNames = {};
  participants.forEach((p) => {
    senderNames[p.user_id] = p.profile?.nickname || (p.role === 'admin' ? '주선자' : '참여자');
  });

  // Fetch blind profiles for members
  useEffect(() => {
    const members = participants.filter((p) => p.role === 'member');
    if (members.length === 0) return;

    async function fetchMemberProfiles() {
      const userIds = members.map((m) => m.user_id);
      const { data: blindData } = await supabase
        .from('blind_profiles')
        .select('user_id, body_type, face_type, mbti, smoking, drinking, personality, interests, height, military_service')
        .in('user_id', userIds);

      const { data: profileData } = await supabase
        .from('profiles')
        .select('user_id, nickname, university, department, gender, birth_year')
        .in('user_id', userIds);

      // Fetch photo from applications
      const { data: appData } = await supabase
        .from('applications')
        .select('user_id, photo_url')
        .in('user_id', userIds);
      const photoMap = {};
      (appData || []).forEach((a) => { if (a.photo_url) photoMap[a.user_id] = a.photo_url; });

      const profiles = (profileData || []).map((p) => {
        const blind = (blindData || []).find((b) => b.user_id === p.user_id);
        return { ...p, blind, photo_url: photoMap[p.user_id] || null };
      });
      setMemberProfiles(profiles);
    }
    fetchMemberProfiles();
  }, [participants]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Ensure admin is a participant
  useEffect(() => {
    if (!user || !roomId) return;
    async function ensureParticipant() {
      const { data } = await supabase
        .from('chat_participants')
        .select('id')
        .eq('room_id', roomId)
        .eq('user_id', user.id)
        .single();

      if (!data) {
        await supabase.from('chat_participants').insert({
          room_id: roomId,
          user_id: user.id,
          role: 'admin',
        });
      }
    }
    ensureParticipant();
  }, [user, roomId]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!input.trim()) return;
    const text = input;
    setInput('');
    await sendMessage(text);
  };

  const handleShareContacts = async () => {
    if (!window.confirm('양쪽 참여자의 연락처를 공유하시겠습니까?')) return;
    setSharing(true);

    const members = participants.filter((p) => p.role === 'member');
    for (const member of members) {
      // Fetch their blind profile for contact info
      const { data: blindProfile } = await supabase
        .from('blind_profiles')
        .select('contact_method, contact_value')
        .eq('user_id', member.user_id)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (blindProfile) {
        const name = member.profile?.nickname || '참여자';
        await sendMessage(
          `${name}님의 연락처: ${blindProfile.contact_method} - ${blindProfile.contact_value}`,
          'contact_share'
        );
      }
    }
    setSharing(false);
  };

  if (loading) return <p className="text-gray-400 text-sm p-4">로딩 중...</p>;

  return (
    <div>
    {/* Member Profiles */}
    {memberProfiles.length > 0 && (
      <div className="mb-4">
        <h4 className="text-xs font-bold text-gray-600 mb-2">참가자 프로필</h4>
        <div className="grid grid-cols-2 gap-3">
          {memberProfiles.map((p) => (
            <div key={p.user_id} className={`rounded-xl p-3 text-xs ${
              p.gender === '남자' ? 'bg-blue-50' : 'bg-pink-50'
            }`}>
              {p.photo_url && (
                <img
                  src={p.photo_url}
                  alt={`${p.nickname} 사진`}
                  className="w-full h-32 object-cover rounded-lg mb-2"
                />
              )}
              <p className={`font-bold mb-1 ${p.gender === '남자' ? 'text-blue-700' : 'text-pink-700'}`}>
                {p.nickname} <span className="font-normal text-gray-400">({p.gender})</span>
              </p>
              <p className="text-gray-500">{p.university} · {p.department}</p>
              <p className="text-gray-500">{p.birth_year}년생</p>
              {p.blind && (
                <div className="mt-1.5 text-gray-500 space-y-0.5">
                  {p.blind.height && <p>키 {p.blind.height}cm</p>}
                  <p>{[p.blind.body_type, p.blind.face_type, p.blind.mbti].filter(Boolean).join(' · ')}</p>
                  <p>{[p.blind.smoking && `흡연: ${p.blind.smoking}`, p.blind.drinking && `음주: ${p.blind.drinking}`].filter(Boolean).join(' · ')}</p>
                  {p.blind.military_service && <p>군복무: {p.blind.military_service}</p>}
                  {p.blind.personality?.length > 0 && <p>성격: {p.blind.personality.join(', ')}</p>}
                  {p.blind.interests?.length > 0 && <p>관심사: {p.blind.interests.join(', ')}</p>}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    )}

    <div className="flex flex-col h-[500px] border border-gray-200 rounded-xl overflow-hidden">
      {/* Header */}
      <div className="bg-white border-b px-4 py-2 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2">
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-sm">← 목록</button>
          <span className="text-sm font-bold text-gray-800">{participants.length}명 참여</span>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-3 py-2 bg-gray-50">
        {messages.map((msg) => (
          <ChatBubble
            key={msg.id}
            message={msg}
            isOwn={msg.sender_id === user?.id}
            senderName={senderNames[msg.sender_id] || '알 수 없음'}
          />
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <form onSubmit={handleSend} className="bg-white border-t px-3 py-2 flex gap-2 shrink-0">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="메시지 입력..."
          className="flex-1 p-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary"
        />
        <button type="submit" disabled={!input.trim()}
          className="px-3 py-2 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary-dark disabled:bg-gray-300">
          전송
        </button>
      </form>
    </div>

    </div>
  );
}

function AdminChatDashboard() {
  const { rooms, loading, markAsRead, refetch } = useAdminChat();
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [broadcastMsg, setBroadcastMsg] = useState('');
  const [broadcasting, setBroadcasting] = useState(false);
  const { user } = useAuth();

  // Group rooms by event
  const eventGroups = {};
  rooms.forEach((room) => {
    const eid = room.event_id || 'unknown';
    if (!eventGroups[eid]) {
      eventGroups[eid] = { title: room.eventTitle, rooms: [], unreadTotal: 0, hasMention: false };
    }
    eventGroups[eid].rooms.push(room);
    eventGroups[eid].unreadTotal += room.unreadCount;
    if (room.hasMention) eventGroups[eid].hasMention = true;
  });

  const eventList = Object.entries(eventGroups);
  const filteredRooms = selectedEvent ? (eventGroups[selectedEvent]?.rooms || []) : rooms;

  const handleBroadcast = async () => {
    if (!broadcastMsg.trim()) return;
    const targetRooms = filteredRooms.filter((r) => r.status === 'active');
    const scope = selectedEvent ? `"${eventGroups[selectedEvent]?.title}"의 활성 채팅방` : '모든 활성 채팅방';
    if (!window.confirm(`${scope}에 메시지를 전송하시겠습니까?\n\n"${broadcastMsg}"`)) return;

    setBroadcasting(true);

    for (const room of targetRooms) {
      const { data: existing } = await supabase
        .from('chat_participants')
        .select('id')
        .eq('room_id', room.id)
        .eq('user_id', user.id)
        .single();

      if (!existing) {
        await supabase.from('chat_participants').insert({
          room_id: room.id, user_id: user.id, role: 'admin',
        });
      }

      await supabase.from('chat_messages').insert({
        room_id: room.id,
        sender_id: null,
        content: broadcastMsg,
        message_type: 'system',
      });
    }

    setBroadcastMsg('');
    setBroadcasting(false);
  };

  if (loading) return <p className="text-gray-400 text-sm">채팅방 로딩 중...</p>;

  const handleOpenRoom = async (roomId) => {
    setSelectedRoom(roomId);
    await markAsRead(roomId);
  };

  const handleCloseRoom = async () => {
    if (selectedRoom) await markAsRead(selectedRoom);
    setSelectedRoom(null);
    refetch();
  };

  if (selectedRoom) {
    return <AdminChatRoom roomId={selectedRoom} onClose={handleCloseRoom} />;
  }

  return (
    <div>
      {/* Event Filter */}
      {eventList.length > 1 && (
        <div className="flex flex-wrap gap-2 mb-4">
          <button
            onClick={() => setSelectedEvent(null)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              !selectedEvent ? 'bg-primary text-white' : 'bg-white text-gray-600 border border-gray-300 hover:bg-gray-50'
            }`}
          >
            전체
          </button>
          {eventList.map(([eid, group]) => (
            <button
              key={eid}
              onClick={() => setSelectedEvent(eid)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 ${
                selectedEvent === eid ? 'bg-primary text-white' : 'bg-white text-gray-600 border border-gray-300 hover:bg-gray-50'
              }`}
            >
              {group.title}
              {group.unreadTotal > 0 && (
                <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[16px] text-center ${
                  selectedEvent === eid ? 'bg-white/30 text-white' : 'bg-red-500 text-white'
                }`}>
                  {group.unreadTotal}
                </span>
              )}
              {group.hasMention && (
                <span className={`text-[10px] font-bold px-1 py-0.5 rounded-full ${
                  selectedEvent === eid ? 'bg-white/30 text-white' : 'bg-amber-500 text-white'
                }`}>
                  @
                </span>
              )}
            </button>
          ))}
        </div>
      )}

      {/* Broadcast */}
      <div className="bg-white rounded-xl shadow-sm p-4 mb-4">
        <h3 className="text-sm font-bold text-gray-700 mb-2">
          {selectedEvent ? `"${eventGroups[selectedEvent]?.title}" 공지` : '전체 공지'}
        </h3>
        {/* Macro buttons */}
        <div className="flex flex-wrap gap-1.5 mb-3">
          {BROADCAST_MACROS.map((macro, i) => (
            <button
              key={i}
              type="button"
              onClick={() => setBroadcastMsg(macro.text)}
              className="px-2.5 py-1 text-xs rounded-lg border border-gray-300 text-gray-600 hover:bg-primary hover:text-white hover:border-primary transition-all"
            >
              {macro.label}
            </button>
          ))}
        </div>
        <div className="flex gap-2">
          <textarea
            value={broadcastMsg}
            onChange={(e) => setBroadcastMsg(e.target.value)}
            rows={broadcastMsg.includes('\n') ? 3 : 1}
            placeholder={selectedEvent ? '이 소개팅 채팅방에 보낼 메시지...' : '모든 채팅방에 보낼 메시지...'}
            className="flex-1 p-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary resize-none"
          />
          <button
            onClick={handleBroadcast}
            disabled={!broadcastMsg.trim() || broadcasting}
            className="px-4 py-2 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary-dark disabled:bg-gray-300 self-end"
          >
            {broadcasting ? '전송 중...' : '전송'}
          </button>
        </div>
      </div>

      {/* Room List */}
      {filteredRooms.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm p-8 text-center">
          <p className="text-gray-400 text-sm">채팅방이 없습니다.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredRooms.map((room) => (
            <button
              key={room.id}
              type="button"
              onClick={() => handleOpenRoom(room.id)}
              className={`w-full text-left bg-white rounded-xl shadow-sm p-4 hover:shadow-md transition-all border ${
                room.hasMention ? 'border-amber-300 bg-amber-50/30' : 'border-transparent hover:border-primary/30'
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <h4 className="text-sm font-bold text-gray-800">{room.name}</h4>
                <div className="flex items-center gap-2">
                  {room.hasMention && (
                    <span className="bg-amber-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                      @태그
                    </span>
                  )}
                  {room.unreadCount > 0 && (
                    <span className="bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[18px] text-center">
                      {room.unreadCount}
                    </span>
                  )}
                  <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                    room.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
                  }`}>
                    {room.status === 'active' ? '활성' : '종료'}
                  </span>
                </div>
              </div>
              <p className="text-xs text-gray-500 mb-1">
                {room.memberNames.join(' & ')}
              </p>
              {room.latestMessage && (
                <p className={`text-xs truncate ${room.unreadCount > 0 ? 'text-gray-700 font-medium' : 'text-gray-400'}`}>
                  {room.latestMessage.message_type === 'system' ? '[시스템] ' : ''}
                  {room.latestMessage.content}
                </p>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export default AdminChatDashboard;
