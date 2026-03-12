import { useState, useEffect, useRef } from 'react';
import { useAdminChat } from '../hooks/useAdminChat';
import { useChat } from '../hooks/useChat';
import { useAuth } from '../hooks/useAuth';
import { supabase } from '../lib/supabase';

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
  const messagesEndRef = useRef(null);

  const senderNames = {};
  participants.forEach((p) => {
    senderNames[p.user_id] = p.profile?.nickname || (p.role === 'admin' ? '주선자' : '참여자');
  });

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
    <div className="flex flex-col h-[500px] border border-gray-200 rounded-xl overflow-hidden">
      {/* Header */}
      <div className="bg-white border-b px-4 py-2 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2">
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-sm">← 목록</button>
          <span className="text-sm font-bold text-gray-800">{participants.length}명 참여</span>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleShareContacts}
            disabled={sharing}
            className="text-xs px-2 py-1 rounded border border-purple-300 text-purple-600 hover:bg-purple-50 disabled:opacity-50"
          >
            연락처 교환
          </button>
          <button
            onClick={async () => {
              await sendMessage('진행 의사가 있으신가요? 있으시면 서로 연락처를 교환해드리겠습니다!', 'system');
            }}
            className="text-xs px-2 py-1 rounded border border-blue-300 text-blue-600 hover:bg-blue-50"
          >
            의사 확인
          </button>
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
  );
}

function AdminChatDashboard() {
  const { rooms, loading } = useAdminChat();
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [broadcastMsg, setBroadcastMsg] = useState('');
  const [broadcasting, setBroadcasting] = useState(false);
  const { user } = useAuth();

  const handleBroadcast = async () => {
    if (!broadcastMsg.trim()) return;
    if (!window.confirm(`모든 활성 채팅방에 메시지를 전송하시겠습니까?\n\n"${broadcastMsg}"`)) return;

    setBroadcasting(true);
    const activeRooms = rooms.filter((r) => r.status === 'active');

    for (const room of activeRooms) {
      // Ensure admin is participant
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

  if (selectedRoom) {
    return <AdminChatRoom roomId={selectedRoom} onClose={() => setSelectedRoom(null)} />;
  }

  return (
    <div>
      {/* Broadcast */}
      <div className="bg-white rounded-xl shadow-sm p-4 mb-4">
        <h3 className="text-sm font-bold text-gray-700 mb-2">전체 공지</h3>
        <div className="flex gap-2">
          <input
            type="text"
            value={broadcastMsg}
            onChange={(e) => setBroadcastMsg(e.target.value)}
            placeholder="모든 채팅방에 보낼 메시지..."
            className="flex-1 p-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary"
          />
          <button
            onClick={handleBroadcast}
            disabled={!broadcastMsg.trim() || broadcasting}
            className="px-4 py-2 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary-dark disabled:bg-gray-300"
          >
            {broadcasting ? '전송 중...' : '전체 전송'}
          </button>
        </div>
      </div>

      {/* Room List */}
      {rooms.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm p-8 text-center">
          <p className="text-gray-400 text-sm">채팅방이 없습니다.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {rooms.map((room) => (
            <button
              key={room.id}
              type="button"
              onClick={() => setSelectedRoom(room.id)}
              className="w-full text-left bg-white rounded-xl shadow-sm p-4 hover:shadow-md transition-all border border-transparent hover:border-primary/30"
            >
              <div className="flex items-center justify-between mb-1">
                <h4 className="text-sm font-bold text-gray-800">{room.name}</h4>
                <div className="flex items-center gap-2">
                  {room.messageCount > 0 && (
                    <span className="bg-primary text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                      {room.messageCount}
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
                <p className="text-xs text-gray-400 truncate">
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
