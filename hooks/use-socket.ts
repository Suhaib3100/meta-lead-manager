"use client"

import { useEffect, useRef, useState, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import type { 
  ServerToClientEvents, 
  ClientToServerEvents 
} from '@/lib/socket-server';

interface UseSocketOptions {
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

export function useSocket(options: UseSocketOptions) {
  const socketRef = useRef<Socket<ServerToClientEvents, ClientToServerEvents> | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Initialize socket connection
  const connect = useCallback(() => {
    if (socketRef.current?.connected) return;

    setIsConnecting(true);
    setError(null);

    const socket = io(process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:3000', {
      transports: ['websocket', 'polling'],
      autoConnect: true,
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: 5,
    });

    socketRef.current = socket;

    // Connection events
    socket.on('connect', () => {
      console.log('Connected to Socket.IO server');
      setIsConnected(true);
      setIsConnecting(false);
      setError(null);

      // Join the room with user info
      socket.emit('join_room', {
        userId: options.userId,
        userName: options.userName,
        userColor: options.userColor,
      });
    });

    socket.on('disconnect', () => {
      console.log('Disconnected from Socket.IO server');
      setIsConnected(false);
    });

    socket.on('connect_error', (err) => {
      console.error('Socket connection error:', err);
      setError(err.message);
      setIsConnecting(false);
    });

    // Real-time events
    socket.on('lead_updated', (data) => {
      console.log('Lead updated:', data);
      options.onLeadUpdated?.(data);
    });

    socket.on('lead_moved', (data) => {
      console.log('Lead moved:', data);
      options.onLeadMoved?.(data);
    });

    socket.on('note_added', (data) => {
      console.log('Note added:', data);
      options.onNoteAdded?.(data);
    });

    socket.on('note_updated', (data) => {
      console.log('Note updated:', data);
      options.onNoteUpdated?.(data);
    });

    socket.on('note_deleted', (data) => {
      console.log('Note deleted:', data);
      options.onNoteDeleted?.(data);
    });

    socket.on('label_added', (data) => {
      console.log('Label added:', data);
      options.onLabelAdded?.(data);
    });

    socket.on('label_removed', (data) => {
      console.log('Label removed:', data);
      options.onLabelRemoved?.(data);
    });

    socket.on('follow_up_scheduled', (data) => {
      console.log('Follow-up scheduled:', data);
      options.onFollowUpScheduled?.(data);
    });

    socket.on('follow_up_updated', (data) => {
      console.log('Follow-up updated:', data);
      options.onFollowUpUpdated?.(data);
    });

    socket.on('follow_up_cancelled', (data) => {
      console.log('Follow-up cancelled:', data);
      options.onFollowUpCancelled?.(data);
    });

    socket.on('user_joined', (data) => {
      console.log('User joined:', data);
      options.onUserJoined?.(data);
    });

    socket.on('user_left', (data) => {
      console.log('User left:', data);
      options.onUserLeft?.(data);
    });

    socket.on('user_activity', (data) => {
      console.log('User activity:', data);
      options.onUserActivity?.(data);
    });

    socket.on('cursor_moved', (data) => {
      options.onCursorMoved?.(data);
    });

    socket.on('leads_synced', (data) => {
      console.log('Leads synced:', data);
      options.onLeadsSynced?.(data);
    });

    socket.on('column_added', (data) => {
      console.log('Column added:', data);
      options.onColumnAdded?.(data);
    });

    socket.on('column_updated', (data) => {
      console.log('Column updated:', data);
      options.onColumnUpdated?.(data);
    });

    socket.on('column_deleted', (data) => {
      console.log('Column deleted:', data);
      options.onColumnDeleted?.(data);
    });
  }, [options]);

  // Disconnect function
  const disconnect = useCallback(() => {
    if (socketRef.current) {
      socketRef.current.disconnect();
      socketRef.current = null;
      setIsConnected(false);
      setIsConnecting(false);
    }
  }, []);

  // Emit functions
  const emitLeadUpdate = useCallback((leadId: string, updates: any) => {
    socketRef.current?.emit('update_lead', { leadId, updates });
  }, []);

  const emitLeadMove = useCallback((leadId: string, fromStatus: string, toStatus: string) => {
    socketRef.current?.emit('move_lead', { leadId, fromStatus, toStatus });
  }, []);

  const emitAddNote = useCallback((leadId: string, note: string) => {
    socketRef.current?.emit('add_note', { leadId, note });
  }, []);

  const emitUpdateNote = useCallback((leadId: string, noteId: string, note: string) => {
    socketRef.current?.emit('update_note', { leadId, noteId, note });
  }, []);

  const emitDeleteNote = useCallback((leadId: string, noteId: string) => {
    socketRef.current?.emit('delete_note', { leadId, noteId });
  }, []);

  const emitAddLabel = useCallback((leadId: string, label: string) => {
    socketRef.current?.emit('add_label', { leadId, label });
  }, []);

  const emitRemoveLabel = useCallback((leadId: string, label: string) => {
    socketRef.current?.emit('remove_label', { leadId, label });
  }, []);

  const emitScheduleFollowUp = useCallback((leadId: string, date: string) => {
    socketRef.current?.emit('schedule_follow_up', { leadId, date });
  }, []);

  const emitUpdateFollowUp = useCallback((leadId: string, date: string) => {
    socketRef.current?.emit('update_follow_up', { leadId, date });
  }, []);

  const emitCancelFollowUp = useCallback((leadId: string) => {
    socketRef.current?.emit('cancel_follow_up', { leadId });
  }, []);

  const emitUserAction = useCallback((action: string, leadId?: string) => {
    socketRef.current?.emit('user_action', { action, leadId });
  }, []);

  const emitCursorMove = useCallback((x: number, y: number) => {
    socketRef.current?.emit('cursor_move', { x, y });
  }, []);

  const emitSyncLeads = useCallback(() => {
    socketRef.current?.emit('sync_leads');
  }, []);

  const emitAddColumn = useCallback((column: any) => {
    socketRef.current?.emit('add_column', { column });
  }, []);

  const emitUpdateColumn = useCallback((columnId: string, updates: any) => {
    socketRef.current?.emit('update_column', { columnId, updates });
  }, []);

  const emitDeleteColumn = useCallback((columnId: string) => {
    socketRef.current?.emit('delete_column', { columnId });
  }, []);

  // Connect on mount
  useEffect(() => {
    connect();

    return () => {
      disconnect();
    };
  }, [connect, disconnect]);

  return {
    socket: socketRef.current,
    isConnected,
    isConnecting,
    error,
    connect,
    disconnect,
    emitLeadUpdate,
    emitLeadMove,
    emitAddNote,
    emitUpdateNote,
    emitDeleteNote,
    emitAddLabel,
    emitRemoveLabel,
    emitScheduleFollowUp,
    emitUpdateFollowUp,
    emitCancelFollowUp,
    emitUserAction,
    emitCursorMove,
    emitSyncLeads,
    emitAddColumn,
    emitUpdateColumn,
    emitDeleteColumn,
  };
} 