import { NextRequest, NextResponse } from 'next/server';
import { pusherServer } from '@/lib/pusher';

export async function POST(request: NextRequest) {
  try {
    const { leadId, date, userId } = await request.json();

    // Broadcast the follow-up scheduling to all connected clients
    await pusherServer.trigger('leads-channel', 'follow_up_scheduled', {
      leadId,
      date,
      userId
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error broadcasting follow-up schedule:', error);
    return NextResponse.json({ error: 'Failed to broadcast follow-up' }, { status: 500 });
  }
} 