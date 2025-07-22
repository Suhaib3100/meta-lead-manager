import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// Get all follow-ups for a lead
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const followUps = await prisma.followUp.findMany({
      where: { leadId: params.id },
      orderBy: { scheduledAt: 'asc' }
    });

    return NextResponse.json({ followUps });
  } catch (error) {
    console.error('Error fetching follow-ups:', error);
    return NextResponse.json(
      { error: 'Failed to fetch follow-ups' },
      { status: 500 }
    );
  }
}

// Add a new follow-up
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const { scheduledAt, notes } = body;

    if (!scheduledAt) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const followUp = await prisma.followUp.create({
      data: {
        leadId: params.id,
        scheduledAt: new Date(scheduledAt),
        notes: notes || null
      }
    });

    return NextResponse.json({ followUp });
  } catch (error) {
    console.error('Error creating follow-up:', error);
    return NextResponse.json(
      { error: 'Failed to create follow-up' },
      { status: 500 }
    );
  }
} 