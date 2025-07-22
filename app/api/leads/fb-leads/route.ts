import { NextResponse } from 'next/server';
import { getFormLeads } from '@/lib/facebook';
import { prisma } from '@/lib/prisma';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const pageId = searchParams.get('page_id');
    const formId = searchParams.get('form_id');

    if (!pageId || !formId) {
      return NextResponse.json(
        { error: 'Missing page_id or form_id parameter' },
        { status: 400 }
      );
    }

    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json(
        { error: 'Missing authorization header' },
        { status: 401 }
      );
    }

    // Get the page's access token
    const page = await prisma.facebookPage.findUnique({
      where: { id: pageId }
    });

    if (!page?.accessToken) {
      return NextResponse.json(
        { error: 'Page not found or no access token available' },
        { status: 404 }
      );
    }

    const leads = await getFormLeads(formId, page.accessToken);

    // Store new leads in database
    for (const leadData of leads) {
      await prisma.lead.upsert({
        where: { id: leadData.id },
        create: {
          id: leadData.id,
          name: leadData.field_data.find(f => f.name === 'full_name')?.values[0] || '',
          email: leadData.field_data.find(f => f.name === 'email')?.values[0] || null,
          phone: leadData.field_data.find(f => f.name === 'phone_number')?.values[0] || null,
          campaignId: leadData.ad_id,
          formId: leadData.form_id,
          pageId: pageId,
          receivedAt: new Date(leadData.created_time),
          rawData: leadData as any,
        },
        update: {} // Don't update existing leads
      });
    }

    return NextResponse.json({ leads });
  } catch (error) {
    console.error('Error fetching Facebook leads:', error);
    return NextResponse.json(
      { error: 'Failed to fetch leads' },
      { status: 500 }
    );
  }
} 