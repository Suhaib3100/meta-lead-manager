import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// Get all follow-ups for a lead
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    console.log('Fetching follow-ups for lead:', params.id);

    // Validate that the lead exists
    const lead = await prisma.lead.findUnique({
      where: { id: params.id }
    });

    if (!lead) {
      return NextResponse.json(
        { error: 'Lead not found' },
        { status: 404 }
      );
    }

    const followUps = await prisma.followUp.findMany({
      where: { leadId: params.id },
      orderBy: { scheduledAt: 'asc' }
    });

    console.log(`Found ${followUps.length} follow-ups for lead ${params.id}`);

    return NextResponse.json({ followUps });
  } catch (error) {
    console.error('Error fetching follow-ups:', error);
    return NextResponse.json(
      { error: 'Failed to fetch follow-ups', details: error instanceof Error ? error.message : 'Unknown error' },
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

    console.log('Follow-up POST request:', { leadId: params.id, scheduledAt, notes });

    if (!scheduledAt) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Validate that the lead exists
    const lead = await prisma.lead.findUnique({
      where: { id: params.id }
    });

    if (!lead) {
      return NextResponse.json(
        { error: 'Lead not found' },
        { status: 404 }
      );
    }

    const followUp = await prisma.followUp.create({
      data: {
        leadId: params.id,
        scheduledAt: new Date(scheduledAt),
        notes: notes || null
      }
    });

    console.log('Follow-up created successfully:', followUp);

    return NextResponse.json({ followUp });
  } catch (error) {
    console.error('Error creating follow-up:', error);
    return NextResponse.json(
      { error: 'Failed to create follow-up', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
} 