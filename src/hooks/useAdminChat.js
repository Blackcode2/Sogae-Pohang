import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from './useAuth';

export function useAdminChat() {
  const { user } = useAuth();
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);

  async function fetchRooms() {
    if (!user) return;

    const { data } = await supabase
      .from('chat_rooms')
      .select(`
        *,
        participants:chat_participants(user_id, role, last_read_at),
        messages:chat_messages(id, content, message_type, created_at, sender_id)
      `)
      .order('created_at', { ascending: false });

    if (data) {
      // Collect all participant user IDs to fetch profiles separately
      const allUserIds = [...new Set(
        data.flatMap((room) => (room.participants || []).map((p) => p.user_id))
      )];

      let profileMap = {};
      if (allUserIds.length > 0) {
        const { data: profilesData } = await supabase
          .from('profiles')
          .select('user_id, nickname')
          .in('user_id', allUserIds);
        (profilesData || []).forEach((p) => { profileMap[p.user_id] = p; });
      }

      // Fetch event info for all rooms
      const eventIds = [...new Set(data.map((r) => r.event_id).filter(Boolean))];
      let eventMap = {};
      if (eventIds.length > 0) {
        const { data: eventsData } = await supabase
          .from('matching_events')
          .select('id, title')
          .in('id', eventIds);
        (eventsData || []).forEach((e) => { eventMap[e.id] = e; });
      }

      // Enrich with unread count, mentions, and member names
      const enriched = data.map((room) => {
        const sortedMessages = (room.messages || []).sort(
          (a, b) => new Date(b.created_at) - new Date(a.created_at)
        );

        // Find admin's last_read_at
        const adminParticipant = (room.participants || []).find(
          (p) => p.user_id === user.id
        );
        const lastReadAt = adminParticipant?.last_read_at
          ? new Date(adminParticipant.last_read_at)
          : new Date(0);

        // Count unread messages (exclude own messages)
        const unreadCount = (room.messages || []).filter(
          (m) => new Date(m.created_at) > lastReadAt && m.sender_id !== user.id
        ).length;

        // Check for @주선자 mentions in unread messages
        const hasMention = (room.messages || []).some(
          (m) => new Date(m.created_at) > lastReadAt && m.sender_id !== user.id && m.content?.includes('@주선자')
        );

        return {
          ...room,
          eventTitle: eventMap[room.event_id]?.title || '알 수 없는 이벤트',
          latestMessage: sortedMessages[0] || null,
          messageCount: sortedMessages.length,
          unreadCount,
          hasMention,
          memberNames: (room.participants || [])
            .filter((p) => p.role === 'member')
            .map((p) => profileMap[p.user_id]?.nickname || '참여자'),
        };
      });
      setRooms(enriched);
    }
    setLoading(false);
  }

  // Mark a room as read
  async function markAsRead(roomId) {
    if (!user) return;
    await supabase
      .from('chat_participants')
      .update({ last_read_at: new Date().toISOString() })
      .eq('room_id', roomId)
      .eq('user_id', user.id);
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
          fetchRooms();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  return { rooms, loading, refetch: fetchRooms, markAsRead };
}
