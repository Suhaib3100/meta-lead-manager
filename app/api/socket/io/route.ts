import { NextRequest, NextResponse } from 'next/server';
import { Server as SocketIOServer } from 'socket.io';
import { NextApiResponse } from 'next';

// Store the Socket.IO server instance
let io: SocketIOServer | null = null;

// Initialize Socket.IO server
function initSocketServer() {
  if (!io) {
    io = new SocketIOServer({
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
    const connectedUsers = new Map();

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
  }
  return io;
}

export async function GET(req: NextRequest) {
  // Initialize Socket.IO server
  const socketServer = initSocketServer();
  
  return NextResponse.json({ 
    message: 'Socket.IO server is running',
    connected: socketServer.engine.clientsCount
  });
}

export async function POST(req: NextRequest) {
  return NextResponse.json({ message: 'POST not supported for socket endpoint' });
}