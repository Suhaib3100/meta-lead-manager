import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    // Get a few leads with their raw data
    const leads = await prisma.lead.findMany({
      take: 5,
      orderBy: {
        receivedAt: 'desc'
      }
    });

    const debugData = leads.map(lead => ({
      id: lead.id,
      name: lead.name,
      email: lead.email,
      phone: lead.phone,
      hasRawData: !!lead.rawData,
      rawDataKeys: lead.rawData ? Object.keys(lead.rawData) : [],
      rawData: lead.rawData,
      created_at: lead.receivedAt
    }));

    return NextResponse.json({ 
      message: 'Debug data retrieved',
      leads: debugData 
    });
  } catch (error) {
    console.error('Error fetching debug data:', error);
    return NextResponse.json(
      { error: 'Failed to fetch debug data' },
      { status: 500 }
    );
  }
} 