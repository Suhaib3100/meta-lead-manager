import { NextRequest, NextResponse } from 'next/server';
import { pusherServer } from '@/lib/pusher';

export async function POST(request: NextRequest) {
  try {
    const { leadId, updates, userId } = await request.json();

    // Broadcast the update to all connected clients
    await pusherServer.trigger('leads-channel', 'lead_updated', {
      leadId,
      updates,
      userId
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error broadcasting lead update:', error);
    return NextResponse.json({ error: 'Failed to broadcast update' }, { status: 500 });
  }
} 