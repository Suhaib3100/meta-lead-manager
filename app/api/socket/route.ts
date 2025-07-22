import { NextRequest, NextResponse } from 'next/server';
import { Server as NetServer } from 'http';
import { NextApiRequest, NextApiResponse } from 'next';
import { initSocketServer, SocketServer } from '@/lib/socket-server';

let io: SocketServer | null = null;

export async function GET(req: NextRequest) {
  if (!io) {
    // Initialize Socket.IO server if not already done
    const httpServer = (req as any).socket?.server;
    if (httpServer) {
      io = initSocketServer(httpServer);
    }
  }

  return NextResponse.json({ message: 'Socket.IO server is running' });
}

export async function POST(req: NextRequest) {
  // Handle any POST requests if needed
  return NextResponse.json({ message: 'POST not supported for socket endpoint' });
} 