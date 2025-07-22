import { NextRequest, NextResponse } from 'next/server';
import { pusherServer } from '@/lib/pusher';

export async function POST(request: NextRequest) {
  try {
    const { action, leadId, userId } = await request.json();

    // Broadcast the user action to all connected clients
    await pusherServer.trigger('leads-channel', 'user_activity', {
      action,
      leadId,
      userId
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error broadcasting user action:', error);
    return NextResponse.json({ error: 'Failed to broadcast user action' }, { status: 500 });
  }
} 