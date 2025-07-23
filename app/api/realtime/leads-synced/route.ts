import { NextRequest, NextResponse } from 'next/server';
import { pusherServer } from '@/lib/pusher';

export async function POST(request: NextRequest) {
  try {
    const { count, userId } = await request.json();

    // Broadcast the sync event to all connected clients
    await pusherServer.trigger('leads-channel', 'leads_synced', {
      count,
      userId
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error broadcasting leads sync:', error);
    return NextResponse.json({ error: 'Failed to broadcast sync' }, { status: 500 });
  }
} 