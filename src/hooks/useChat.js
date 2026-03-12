import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from './useAuth';

export function useChat(roomId) {
  const { user } = useAuth();
  const [messages, setMessages] = useState([]);
  const [participants, setParticipants] = useState([]);
  const [loading, setLoading] = useState(true);

  // Fetch initial messages and participants
  useEffect(() => {
    if (!roomId) return;

    async function fetchData() {
      const [msgResult, partResult] = await Promise.all([
        supabase
          .from('chat_messages')
          .select('*')
          .eq('room_id', roomId)
          .order('created_at', { ascending: true }),
        supabase
          .from('chat_participants')
          .select('*, profile:profiles!chat_participants_user_id_fkey(nickname)')
          .eq('room_id', roomId),
      ]);

      setMessages(msgResult.data || []);
      setParticipants(partResult.data || []);
      setLoading(false);
    }

    fetchData();
  }, [roomId]);

  // Subscribe to realtime messages
  useEffect(() => {
    if (!roomId) return;

    const channel = supabase
      .channel(`room:${roomId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'chat_messages',
          filter: `room_id=eq.${roomId}`,
        },
        (payload) => {
          setMessages((prev) => [...prev, payload.new]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [roomId]);

  const sendMessage = useCallback(async (content, messageType = 'text') => {
    if (!content.trim() || !user) return;

    const { error } = await supabase
      .from('chat_messages')
      .insert({
        room_id: roomId,
        sender_id: user.id,
        content,
        message_type: messageType,
      });

    return error;
  }, [roomId, user]);

  return { messages, participants, loading, sendMessage };
}
