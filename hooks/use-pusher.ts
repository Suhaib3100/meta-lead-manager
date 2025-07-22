"use client"

import { useEffect, useRef, useState, useCallback } from 'react';
import { pusherClient } from '@/lib/pusher';
import { Channel } from 'pusher-js';

interface UsePusherOptions {
  userId: string;
  userName: string;
  userColor: string;
  onLeadUpdated?: (data: { leadId: string; updates: any; userId: string }) => void;
  onLeadMoved?: (data: { leadId: string; fromStatus: string; toStatus: string; userId: string }) => void;
  onNoteAdded?: (data: { leadId: string; note: string; userId: string; userName: string }) => void;
  onNoteUpdated?: (data: { leadId: string; noteId: string; note: string; userId: string }) => void;
  onNoteDeleted?: (data: { leadId: string; noteId: string; userId: string }) => void;
  onLabelAdded?: (data: { leadId: string; label: string; userId: string }) => void;
  onLabelRemoved?: (data: { leadId: string; label: string; userId: string }) => void;
  onFollowUpScheduled?: (data: { leadId: string; date: string; userId: string }) => void;
  onFollowUpUpdated?: (data: { leadId: string; date: string; userId: string }) => void;
  onFollowUpCancelled?: (data: { leadId: string; userId: string }) => void;
  onUserJoined?: (data: { userId: string; userName: string; userColor: string }) => void;
  onUserLeft?: (data: { userId: string }) => void;
  onUserActivity?: (data: { userId: string; action: string; leadId?: string }) => void;
  onCursorMoved?: (data: { userId: string; x: number; y: number; userName: string; userColor: string }) => void;
  onLeadsSynced?: (data: { count: number; userId: string }) => void;
  onColumnAdded?: (data: { column: any; userId: string }) => void;
  onColumnUpdated?: (data: { columnId: string; updates: any; userId: string }) => void;
  onColumnDeleted?: (data: { columnId: string; userId: string }) => void;
}

export function usePusher(options: UsePusherOptions) {
  const channelRef = useRef<Channel | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Connect to Pusher
  const connect = useCallback(() => {
    if (channelRef.current) return;

    setIsConnecting(true);
    setError(null);

    try {
      // Subscribe to the leads channel
      const channel = pusherClient.subscribe('leads-channel');
      channelRef.current = channel;

      // Connection events
      pusherClient.connection.bind('connected', () => {
        console.log('Connected to Pusher');
        setIsConnected(true);
        setIsConnecting(false);
        setError(null);
      });

      pusherClient.connection.bind('disconnected', () => {
        console.log('Disconnected from Pusher');
        setIsConnected(false);
      });

      pusherClient.connection.bind('error', (err: any) => {
        console.error('Pusher connection error:', err);
        setError(err.message);
        setIsConnecting(false);
      });

      // Real-time events
      channel.bind('lead_updated', (data: any) => {
        console.log('Lead updated:', data);
        options.onLeadUpdated?.(data);
      });

      channel.bind('lead_moved', (data: any) => {
        console.log('Lead moved:', data);
        options.onLeadMoved?.(data);
      });

      channel.bind('note_added', (data: any) => {
        console.log('Note added:', data);
        options.onNoteAdded?.(data);
      });

      channel.bind('note_updated', (data: any) => {
        console.log('Note updated:', data);
        options.onNoteUpdated?.(data);
      });

      channel.bind('note_deleted', (data: any) => {
        console.log('Note deleted:', data);
        options.onNoteDeleted?.(data);
      });

      channel.bind('label_added', (data: any) => {
        console.log('Label added:', data);
        options.onLabelAdded?.(data);
      });

      channel.bind('label_removed', (data: any) => {
        console.log('Label removed:', data);
        options.onLabelRemoved?.(data);
      });

      channel.bind('follow_up_scheduled', (data: any) => {
        console.log('Follow-up scheduled:', data);
        options.onFollowUpScheduled?.(data);
      });

      channel.bind('follow_up_updated', (data: any) => {
        console.log('Follow-up updated:', data);
        options.onFollowUpUpdated?.(data);
      });

      channel.bind('follow_up_cancelled', (data: any) => {
        console.log('Follow-up cancelled:', data);
        options.onFollowUpCancelled?.(data);
      });

      channel.bind('user_joined', (data: any) => {
        console.log('User joined:', data);
        options.onUserJoined?.(data);
      });

      channel.bind('user_left', (data: any) => {
        console.log('User left:', data);
        options.onUserLeft?.(data);
      });

      channel.bind('user_activity', (data: any) => {
        console.log('User activity:', data);
        options.onUserActivity?.(data);
      });

      channel.bind('cursor_moved', (data: any) => {
        options.onCursorMoved?.(data);
      });

      channel.bind('leads_synced', (data: any) => {
        console.log('Leads synced:', data);
        options.onLeadsSynced?.(data);
      });

      channel.bind('column_added', (data: any) => {
        console.log('Column added:', data);
        options.onColumnAdded?.(data);
      });

      channel.bind('column_updated', (data: any) => {
        console.log('Column updated:', data);
        options.onColumnUpdated?.(data);
      });

      channel.bind('column_deleted', (data: any) => {
        console.log('Column deleted:', data);
        options.onColumnDeleted?.(data);
      });

    } catch (error) {
      console.error('Error connecting to Pusher:', error);
      setError('Failed to connect to real-time service');
      setIsConnecting(false);
    }
  }, [options]);

  // Disconnect function
  const disconnect = useCallback(() => {
    if (channelRef.current) {
      pusherClient.unsubscribe('leads-channel');
      channelRef.current = null;
      setIsConnected(false);
      setIsConnecting(false);
    }
  }, []);

  // Emit functions (these will be handled by API routes)
  const emitLeadUpdate = useCallback(async (leadId: string, updates: any) => {
    try {
      await fetch('/api/realtime/lead-update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ leadId, updates, userId: options.userId })
      });
    } catch (error) {
      console.error('Error emitting lead update:', error);
    }
  }, [options.userId]);

  const emitLeadMove = useCallback(async (leadId: string, fromStatus: string, toStatus: string) => {
    try {
      await fetch('/api/realtime/lead-move', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ leadId, fromStatus, toStatus, userId: options.userId })
      });
    } catch (error) {
      console.error('Error emitting lead move:', error);
    }
  }, [options.userId]);

  const emitAddNote = useCallback(async (leadId: string, note: string) => {
    try {
      await fetch('/api/realtime/note-add', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ leadId, note, userId: options.userId, userName: options.userName })
      });
    } catch (error) {
      console.error('Error emitting note add:', error);
    }
  }, [options.userId, options.userName]);

  const emitAddLabel = useCallback(async (leadId: string, label: string) => {
    try {
      await fetch('/api/realtime/label-add', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ leadId, label, userId: options.userId })
      });
    } catch (error) {
      console.error('Error emitting label add:', error);
    }
  }, [options.userId]);

  const emitRemoveLabel = useCallback(async (leadId: string, label: string) => {
    try {
      await fetch('/api/realtime/label-remove', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ leadId, label, userId: options.userId })
      });
    } catch (error) {
      console.error('Error emitting label remove:', error);
    }
  }, [options.userId]);

  const emitScheduleFollowUp = useCallback(async (leadId: string, date: string) => {
    try {
      await fetch('/api/realtime/follow-up-schedule', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ leadId, date, userId: options.userId })
      });
    } catch (error) {
      console.error('Error emitting follow-up schedule:', error);
    }
  }, [options.userId]);

  const emitUserAction = useCallback(async (action: string, leadId?: string) => {
    try {
      await fetch('/api/realtime/user-action', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, leadId, userId: options.userId })
      });
    } catch (error) {
      console.error('Error emitting user action:', error);
    }
  }, [options.userId]);

  // Connect on mount
  useEffect(() => {
    connect();
    return () => {
      disconnect();
    };
  }, [connect, disconnect]);

  return {
    channel: channelRef.current,
    isConnected,
    isConnecting,
    error,
    connect,
    disconnect,
    emitLeadUpdate,
    emitLeadMove,
    emitAddNote,
    emitAddLabel,
    emitRemoveLabel,
    emitScheduleFollowUp,
    emitUserAction,
  };
} 