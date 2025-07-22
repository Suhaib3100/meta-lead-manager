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

    // Fetch all leads from the database
    const leads = await prisma.lead.findMany({
      orderBy: {
        receivedAt: 'desc'
      }
    });

    // Transform leads to match frontend interface
    const transformedLeads = leads.map(lead => ({
      id: lead.id,
      name: lead.name,
      email: lead.email || '',
      phone: lead.phone || '',
      source: lead.source,
      status: lead.status,
      labels: lead.tags || [],
      notes: lead.notes || [],
      created_at: lead.receivedAt.toISOString(),
      form_name: lead.formId,
      page: lead.pageId,
      timeline: []
    }));

    return NextResponse.json({ leads: transformedLeads });
  } catch (error) {
    console.error('Error fetching leads:', error);
    return NextResponse.json(
      { error: 'Failed to fetch leads' },
      { status: 500 }
    );
  }
} 