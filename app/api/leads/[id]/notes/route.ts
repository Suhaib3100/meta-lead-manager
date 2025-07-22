import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// Get all notes for a lead
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const notes = await prisma.note.findMany({
      where: { leadId: params.id },
      orderBy: { createdAt: 'desc' }
    });

    return NextResponse.json({ notes });
  } catch (error) {
    console.error('Error fetching notes:', error);
    return NextResponse.json(
      { error: 'Failed to fetch notes' },
      { status: 500 }
    );
  }
}

// Add a new note
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const { content, userId, userName } = body;

    if (!content || !userId || !userName) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const note = await prisma.note.create({
      data: {
        content,
        leadId: params.id,
        userId,
        userName
      }
    });

    return NextResponse.json({ note });
  } catch (error) {
    console.error('Error creating note:', error);
    return NextResponse.json(
      { error: 'Failed to create note' },
      { status: 500 }
    );
  }
} 