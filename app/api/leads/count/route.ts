import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: Request) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json(
        { error: 'Missing authorization header' },
        { status: 401 }
      );
    }

    // Get total count from database
    const count = await prisma.lead.count();
    
    // Also get some sample lead names for debugging
    const sampleLeads = await prisma.lead.findMany({
      take: 5,
      select: { name: true, id: true },
      orderBy: { receivedAt: 'desc' }
    });

    return NextResponse.json({ 
      count,
      sampleLeads: sampleLeads.map(l => ({ name: l.name, id: l.id }))
    });
  } catch (error) {
    console.error('Error fetching lead count:', error);
    return NextResponse.json(
      { error: 'Failed to fetch lead count' },
      { status: 500 }
    );
  }
} 