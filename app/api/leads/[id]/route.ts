import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json(
        { error: 'Missing authorization header' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { status, tags, name, email, phone, labels, next_follow_up, timeline } = body;

    // Build update object dynamically - exclude notes since they're handled separately
    const updateData: any = {};
    
    if (status !== undefined) updateData.status = status;
    if (tags !== undefined) updateData.tags = tags;
    if (name !== undefined) updateData.name = name;
    if (email !== undefined) updateData.email = email;
    if (phone !== undefined) updateData.phone = phone;
    if (labels !== undefined) updateData.tags = labels; // Map labels to tags in DB
    if (next_follow_up !== undefined) {
      // Handle follow-up scheduling
      if (next_follow_up === null) {
        // Clear existing follow-ups
        await prisma.followUp.deleteMany({
          where: { leadId: params.id }
        });
      } else {
        // Create or update follow-up
        await prisma.followUp.upsert({
          where: { leadId: params.id },
          create: {
            leadId: params.id,
            scheduledAt: new Date(next_follow_up),
            notes: timeline ? JSON.stringify(timeline) : null,
          },
          update: {
            scheduledAt: new Date(next_follow_up),
            notes: timeline ? JSON.stringify(timeline) : null,
          },
        });
      }
    }

    const lead = await prisma.lead.update({
      where: { id: params.id },
      data: updateData,
      include: {
        notes: true,
        followUps: true,
      },
    });

    return NextResponse.json(lead);
  } catch (error) {
    console.error('Error updating lead:', error);
    return NextResponse.json(
      { error: 'Failed to update lead' },
      { status: 500 }
    );
  }
} 