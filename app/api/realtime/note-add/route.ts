import { NextRequest, NextResponse } from 'next/server';
import { pusherServer } from '@/lib/pusher';

export async function POST(request: NextRequest) {
  try {
    const { leadId, note, userId, userName } = await request.json();

    // Broadcast the note addition to all connected clients
    await pusherServer.trigger('leads-channel', 'note_added', {
      leadId,
      note,
      userId,
      userName
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error broadcasting note add:', error);
    return NextResponse.json({ error: 'Failed to broadcast note' }, { status: 500 });
  }
} 