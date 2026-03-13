import { useState, useEffect, useRef } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useChat } from '../hooks/useChat';
import { supabase } from '../lib/supabase';

function ChatBubble({ message, isOwn, isAdmin, senderName }) {
  if (message.message_type === 'system') {
    return (
      <div className="flex justify-center my-2">
        <div className="bg-gray-100 text-gray-500 text-xs px-4 py-2 rounded-full max-w-xs text-center">
          {message.content}
        </div>
      </div>
    );
  }

  if (message.message_type === 'contact_share') {
    return (
      <div className="flex justify-center my-2">
        <div className="bg-purple-50 border border-purple-200 text-purple-700 text-sm px-4 py-3 rounded-xl max-w-sm text-center">
          <p className="font-semibold text-xs mb-1">연락처 공유</p>
          {message.content}
        </div>
      </div>
    );
  }

  const bubbleColor = isOwn
    ? 'bg-primary text-white rounded-tr-sm'
    : isAdmin
      ? 'bg-amber-100 text-amber-900 rounded-tl-sm'
      : 'bg-gray-100 text-gray-800 rounded-tl-sm';

  return (
    <div className={`flex ${isOwn ? 'justify-end' : 'justify-start'} mb-2`}>
      <div className={`max-w-[70%] ${isOwn ? 'order-2' : ''}`}>
        {!isOwn && (
          <p className={`text-xs mb-1 ml-1 ${isAdmin ? 'text-amber-500 font-semibold' : 'text-gray-400'}`}>
            {isAdmin ? '주선자' : senderName}
          </p>
        )}
        <div className={`px-4 py-2 rounded-2xl text-sm ${bubbleColor}`}>
          {message.content}
        </div>
        <p className={`text-[10px] text-gray-300 mt-0.5 ${isOwn ? 'text-right mr-1' : 'ml-1'}`}>
          {new Date(message.created_at).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })}
        </p>
      </div>
    </div>
  );
}

function ChatPage() {
  const { roomId } = useParams();
  const { user } = useAuth();
  const { messages, participants, loading, sendMessage } = useChat(roomId);
  const [input, setInput] = useState('');
  const [roomInfo, setRoomInfo] = useState(null);
  const messagesEndRef = useRef(null);

  // Build sender name and role maps from participants
  const senderNames = {};
  const senderRoles = {};
  participants.forEach((p) => {
    senderNames[p.user_id] = p.profile?.nickname || (p.role === 'admin' ? '주선자' : '참여자');
    senderRoles[p.user_id] = p.role;
  });

  useEffect(() => {
    async function fetchRoom() {
      const { data } = await supabase
        .from('chat_rooms')
        .select('*')
        .eq('id', roomId)
        .single();
      setRoomInfo(data);
    }
    if (roomId) fetchRoom();
  }, [roomId]);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!input.trim()) return;
    const text = input;
    setInput('');
    await sendMessage(text);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <p className="text-gray-500">채팅방 로딩 중...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <Link to="/profile" className="text-gray-400 hover:text-gray-600">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
            </svg>
          </Link>
          <div>
            <h1 className="text-sm font-bold text-gray-800">{roomInfo?.name || '채팅방'}</h1>
            <p className="text-xs text-gray-400">{participants.length}명 참여 중</p>
          </div>
        </div>
      </header>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4">
        {messages.map((msg) => (
          <ChatBubble
            key={msg.id}
            message={msg}
            isOwn={msg.sender_id === user?.id}
            isAdmin={senderRoles[msg.sender_id] === 'admin'}
            senderName={senderNames[msg.sender_id] || '알 수 없음'}
          />
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      {roomInfo?.status === 'closed' ? (
        <div className="bg-gray-100 border-t border-gray-200 px-4 py-4 text-center shrink-0">
          <p className="text-sm text-gray-400">채팅방이 종료되었습니다.</p>
        </div>
      ) : (
        <form onSubmit={handleSend} className="bg-white border-t border-gray-200 px-4 py-3 flex gap-2 shrink-0">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="메시지를 입력하세요..."
            className="flex-1 p-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary"
          />
          <button
            type="submit"
            disabled={!input.trim()}
            className="px-4 py-2.5 bg-primary text-white rounded-xl text-sm font-medium hover:bg-primary-dark disabled:bg-gray-300 transition-all"
          >
            전송
          </button>
        </form>
      )}
    </div>
  );
}

export default ChatPage;
