import { Server as SocketIOServer } from 'socket.io';
import { Server as NetServer } from 'http';
import { NextApiRequest, NextApiResponse } from 'next';

export interface ServerToClientEvents {
  // Lead updates
  lead_updated: (data: { leadId: string; updates: any; userId: string }) => void;
  lead_moved: (data: { leadId: string; fromStatus: string; toStatus: string; userId: string }) => void;
  lead_created: (data: { lead: any; userId: string }) => void;
  lead_deleted: (data: { leadId: string; userId: string }) => void;
  
  // Notes and comments
  note_added: (data: { leadId: string; note: string; userId: string; userName: string }) => void;
  note_updated: (data: { leadId: string; noteId: string; note: string; userId: string }) => void;
  note_deleted: (data: { leadId: string; noteId: string; userId: string }) => void;
  
  // Labels and tags
  label_added: (data: { leadId: string; label: string; userId: string }) => void;
  label_removed: (data: { leadId: string; label: string; userId: string }) => void;
  
  // Scheduling
  follow_up_scheduled: (data: { leadId: string; date: string; userId: string }) => void;
  follow_up_updated: (data: { leadId: string; date: string; userId: string }) => void;
  follow_up_cancelled: (data: { leadId: string; userId: string }) => void;
  
  // User presence
  user_joined: (data: { userId: string; userName: string; userColor: string }) => void;
  user_left: (data: { userId: string }) => void;
  user_activity: (data: { userId: string; action: string; leadId?: string }) => void;
  
  // Cursor positions
  cursor_moved: (data: { userId: string; x: number; y: number; userName: string; userColor: string }) => void;
  
  // General updates
  leads_synced: (data: { count: number; userId: string }) => void;
  column_added: (data: { column: any; userId: string }) => void;
  column_updated: (data: { columnId: string; updates: any; userId: string }) => void;
  column_deleted: (data: { columnId: string; userId: string }) => void;
}

export interface ClientToServerEvents {
  // Lead operations
  update_lead: (data: { leadId: string; updates: any }) => void;
  move_lead: (data: { leadId: string; fromStatus: string; toStatus: string }) => void;
  create_lead: (data: { lead: any }) => void;
  delete_lead: (data: { leadId: string }) => void;
  
  // Notes operations
  add_note: (data: { leadId: string; note: string }) => void;
  update_note: (data: { leadId: string; noteId: string; note: string }) => void;
  delete_note: (data: { leadId: string; noteId: string }) => void;
  
  // Label operations
  add_label: (data: { leadId: string; label: string }) => void;
  remove_label: (data: { leadId: string; label: string }) => void;
  
  // Scheduling operations
  schedule_follow_up: (data: { leadId: string; date: string }) => void;
  update_follow_up: (data: { leadId: string; date: string }) => void;
  cancel_follow_up: (data: { leadId: string }) => void;
  
  // User presence
  join_room: (data: { userId: string; userName: string; userColor: string }) => void;
  leave_room: () => void;
  user_action: (data: { action: string; leadId?: string }) => void;
  
  // Cursor tracking
  cursor_move: (data: { x: number; y: number }) => void;
  
  // General operations
  sync_leads: () => void;
  add_column: (data: { column: any }) => void;
  update_column: (data: { columnId: string; updates: any }) => void;
  delete_column: (data: { columnId: string }) => void;
}

export interface InterServerEvents {
  ping: () => void;
}

export interface SocketData {
  userId: string;
  userName: string;
  userColor: string;
}

export type SocketServer = SocketIOServer<
  ClientToServerEvents,
  ServerToClientEvents,
  InterServerEvents,
  SocketData
>;

export function initSocketServer(httpServer: NetServer): SocketServer {
  const io = new SocketIOServer<
    ClientToServerEvents,
    ServerToClientEvents,
    InterServerEvents,
    SocketData
  >(httpServer, {
    cors: {
      origin: process.env.NODE_ENV === 'production' 
        ? ['https://your-domain.com'] 
        : ['http://localhost:3000'],
      methods: ['GET', 'POST'],
      credentials: true
    },
    transports: ['websocket', 'polling']
  });

  // Store connected users
  const connectedUsers = new Map<string, { name: string; color: string; socketId: string }>();

  io.on('connection', (socket) => {
    console.log(`User connected: ${socket.id}`);

    // Handle user joining
    socket.on('join_room', (data) => {
      socket.data.userId = data.userId;
      socket.data.userName = data.userName;
      socket.data.userColor = data.userColor;
      
      connectedUsers.set(data.userId, {
        name: data.userName,
        color: data.userColor,
        socketId: socket.id
      });

      // Join the main room
      socket.join('leads-room');
      
      // Notify others about the new user
      socket.to('leads-room').emit('user_joined', {
        userId: data.userId,
        userName: data.userName,
        userColor: data.userColor
      });

      console.log(`User ${data.userName} joined the room`);
    });

    // Handle lead updates
    socket.on('update_lead', (data) => {
      socket.to('leads-room').emit('lead_updated', {
        leadId: data.leadId,
        updates: data.updates,
        userId: socket.data.userId
      });
    });

    // Handle lead movement
    socket.on('move_lead', (data) => {
      socket.to('leads-room').emit('lead_moved', {
        leadId: data.leadId,
        fromStatus: data.fromStatus,
        toStatus: data.toStatus,
        userId: socket.data.userId
      });
    });

    // Handle note operations
    socket.on('add_note', (data) => {
      socket.to('leads-room').emit('note_added', {
        leadId: data.leadId,
        note: data.note,
        userId: socket.data.userId,
        userName: socket.data.userName
      });
    });

    socket.on('update_note', (data) => {
      socket.to('leads-room').emit('note_updated', {
        leadId: data.leadId,
        noteId: data.noteId,
        note: data.note,
        userId: socket.data.userId
      });
    });

    socket.on('delete_note', (data) => {
      socket.to('leads-room').emit('note_deleted', {
        leadId: data.leadId,
        noteId: data.noteId,
        userId: socket.data.userId
      });
    });

    // Handle label operations
    socket.on('add_label', (data) => {
      socket.to('leads-room').emit('label_added', {
        leadId: data.leadId,
        label: data.label,
        userId: socket.data.userId
      });
    });

    socket.on('remove_label', (data) => {
      socket.to('leads-room').emit('label_removed', {
        leadId: data.leadId,
        label: data.label,
        userId: socket.data.userId
      });
    });

    // Handle scheduling operations
    socket.on('schedule_follow_up', (data) => {
      socket.to('leads-room').emit('follow_up_scheduled', {
        leadId: data.leadId,
        date: data.date,
        userId: socket.data.userId
      });
    });

    socket.on('update_follow_up', (data) => {
      socket.to('leads-room').emit('follow_up_updated', {
        leadId: data.leadId,
        date: data.date,
        userId: socket.data.userId
      });
    });

    socket.on('cancel_follow_up', (data) => {
      socket.to('leads-room').emit('follow_up_cancelled', {
        leadId: data.leadId,
        userId: socket.data.userId
      });
    });

    // Handle cursor movement
    socket.on('cursor_move', (data) => {
      socket.to('leads-room').emit('cursor_moved', {
        userId: socket.data.userId,
        x: data.x,
        y: data.y,
        userName: socket.data.userName,
        userColor: socket.data.userColor
      });
    });

    // Handle user activity
    socket.on('user_action', (data) => {
      socket.to('leads-room').emit('user_activity', {
        userId: socket.data.userId,
        action: data.action,
        leadId: data.leadId
      });
    });

    // Handle column operations
    socket.on('add_column', (data) => {
      socket.to('leads-room').emit('column_added', {
        column: data.column,
        userId: socket.data.userId
      });
    });

    socket.on('update_column', (data) => {
      socket.to('leads-room').emit('column_updated', {
        columnId: data.columnId,
        updates: data.updates,
        userId: socket.data.userId
      });
    });

    socket.on('delete_column', (data) => {
      socket.to('leads-room').emit('column_deleted', {
        columnId: data.columnId,
        userId: socket.data.userId
      });
    });

    // Handle lead sync
    socket.on('sync_leads', () => {
      socket.to('leads-room').emit('leads_synced', {
        count: 0, // This will be updated with actual count
        userId: socket.data.userId
      });
    });

    // Handle disconnection
    socket.on('disconnect', () => {
      console.log(`User disconnected: ${socket.id}`);
      
      if (socket.data.userId) {
        connectedUsers.delete(socket.data.userId);
        
        // Notify others about the user leaving
        socket.to('leads-room').emit('user_left', {
          userId: socket.data.userId
        });
      }
    });
  });

  return io;
} 