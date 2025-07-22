import { NextRequest, NextResponse } from 'next/server';
import { pusherServer } from '@/lib/pusher';

export async function POST(request: NextRequest) {
  try {
    const { leadId, label, userId } = await request.json();

    // Broadcast the label addition to all connected clients
    await pusherServer.trigger('leads-channel', 'label_added', {
      leadId,
      label,
      userId
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error broadcasting label add:', error);
    return NextResponse.json({ error: 'Failed to broadcast label' }, { status: 500 });
  }
} 