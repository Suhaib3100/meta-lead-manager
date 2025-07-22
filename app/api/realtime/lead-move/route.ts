import { NextRequest, NextResponse } from 'next/server';
import { pusherServer } from '@/lib/pusher';

export async function POST(request: NextRequest) {
  try {
    const { leadId, fromStatus, toStatus, userId } = await request.json();

    // Broadcast the move to all connected clients
    await pusherServer.trigger('leads-channel', 'lead_moved', {
      leadId,
      fromStatus,
      toStatus,
      userId
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error broadcasting lead move:', error);
    return NextResponse.json({ error: 'Failed to broadcast move' }, { status: 500 });
  }
} 