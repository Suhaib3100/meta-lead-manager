import { NextRequest } from 'next/server';
import { Server as NetServer } from 'http';
import { NextApiResponse } from 'next';
import { Server as SocketIOServer } from 'socket.io';

let io: SocketIOServer | null = null;

export async function GET(req: NextRequest) {
  if (!io) {
    // Initialize Socket.IO server
    const httpServer = (req as any).socket?.server;
    if (httpServer) {
      io = new SocketIOServer(httpServer, {
        cors: {
          origin: "*",
          methods: ["GET", "POST"]
        },
        transports: ['websocket', 'polling']
      });

      // Socket event handlers
      io.on('connection', (socket) => {
        console.log('Client connected:', socket.id);

        // Join room
        socket.on('join_room', (data) => {
          socket.join('leads-room');
          socket.broadcast.to('leads-room').emit('user_joined', data);
          console.log('User joined room:', data);
        });

        // Lead updates
        socket.on('update_lead', (data) => {
          socket.broadcast.to('leads-room').emit('lead_updated', {
            ...data,
            userId: socket.data?.userId || 'unknown'
          });
        });

        // Note operations
        socket.on('add_note', (data) => {
          socket.broadcast.to('leads-room').emit('note_added', {
            ...data,
            userId: socket.data?.userId || 'unknown',
            userName: socket.data?.userName || 'Unknown User'
          });
        });

        socket.on('update_note', (data) => {
          socket.broadcast.to('leads-room').emit('note_updated', {
            ...data,
            userId: socket.data?.userId || 'unknown'
          });
        });

        socket.on('delete_note', (data) => {
          socket.broadcast.to('leads-room').emit('note_deleted', {
            ...data,
            userId: socket.data?.userId || 'unknown'
          });
        });

        // Label operations
        socket.on('add_label', (data) => {
          socket.broadcast.to('leads-room').emit('label_added', {
            ...data,
            userId: socket.data?.userId || 'unknown'
          });
        });

        socket.on('remove_label', (data) => {
          socket.broadcast.to('leads-room').emit('label_removed', {
            ...data,
            userId: socket.data?.userId || 'unknown'
          });
        });

        // Follow-up operations
        socket.on('schedule_follow_up', (data) => {
          socket.broadcast.to('leads-room').emit('follow_up_scheduled', {
            ...data,
            userId: socket.data?.userId || 'unknown'
          });
        });

        socket.on('update_follow_up', (data) => {
          socket.broadcast.to('leads-room').emit('follow_up_updated', {
            ...data,
            userId: socket.data?.userId || 'unknown'
          });
        });

        socket.on('cancel_follow_up', (data) => {
          socket.broadcast.to('leads-room').emit('follow_up_cancelled', {
            ...data,
            userId: socket.data?.userId || 'unknown'
          });
        });

        // User actions
        socket.on('user_action', (data) => {
          socket.broadcast.to('leads-room').emit('user_activity', {
            ...data,
            userId: socket.data?.userId || 'unknown'
          });
        });

        // Cursor movement
        socket.on('cursor_move', (data) => {
          socket.broadcast.to('leads-room').emit('cursor_moved', {
            ...data,
            userId: socket.data?.userId || 'unknown',
            userName: socket.data?.userName || 'Unknown User',
            userColor: socket.data?.userColor || '#000000'
          });
        });

        // Disconnect
        socket.on('disconnect', () => {
          console.log('Client disconnected:', socket.id);
          socket.broadcast.to('leads-room').emit('user_left', {
            userId: socket.data?.userId || 'unknown'
          });
        });
      });
    }
  }

  return new Response('Socket.IO server is running', { status: 200 });
}

export async function POST(req: NextRequest) {
  return new Response('POST not supported for socket endpoint', { status: 405 });
}