import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

export function useAdminChat() {
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);

  async function fetchRooms() {
    const { data } = await supabase
      .from('chat_rooms')
      .select(`
        *,
        participants:chat_participants(user_id, role, profile:profiles!chat_participants_user_id_fkey(nickname)),
        messages:chat_messages(id, content, message_type, created_at, sender_id)
      `)
      .order('created_at', { ascending: false });

    if (data) {
      // Enrich with latest message and unread count
      const enriched = data.map((room) => {
        const sortedMessages = (room.messages || []).sort(
          (a, b) => new Date(b.created_at) - new Date(a.created_at)
        );
        return {
          ...room,
          latestMessage: sortedMessages[0] || null,
          messageCount: sortedMessages.length,
          memberNames: (room.participants || [])
            .filter((p) => p.role === 'member')
            .map((p) => p.profile?.nickname || '참여자'),
        };
      });
      setRooms(enriched);
    }
    setLoading(false);
  }

  useEffect(() => {
    fetchRooms();

    // Subscribe to all new messages for realtime updates
    const channel = supabase
      .channel('admin-all-messages')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'chat_messages' },
        () => {
          // Refetch rooms on any new message
          fetchRooms();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return { rooms, loading, refetch: fetchRooms };
}
