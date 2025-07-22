import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

interface FacebookLeadField {
  name: string;
  values: string[];
}

interface FacebookLead {
  id: string;
  created_time: string;
  ad_id: string;
  form_id: string;
  field_data: FacebookLeadField[];
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const pageId = searchParams.get('page_id');

    if (!pageId) {
      return NextResponse.json(
        { error: 'Missing page_id parameter' },
        { status: 400 }
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

    // First, get all forms for this page
    const formsResponse = await fetch(
      `https://graph.facebook.com/v19.0/${pageId}/leadgen_forms?access_token=${page.accessToken}`
    );

    if (!formsResponse.ok) {
      console.error('Failed to fetch forms:', await formsResponse.text());
      return NextResponse.json(
        { error: 'Failed to fetch forms' },
        { status: 500 }
      );
    }

    const formsData = await formsResponse.json();
    const forms = formsData.data || [];

    // For each form, get its leads
    const allLeads = [];
    for (const form of forms) {
      const leadsResponse = await fetch(
        `https://graph.facebook.com/v19.0/${form.id}/leads?access_token=${page.accessToken}`
      );

      if (!leadsResponse.ok) {
        console.error(`Failed to fetch leads for form ${form.id}:`, await leadsResponse.text());
        continue;
      }

      const leadsData = await leadsResponse.json();
      const leads = (leadsData.data || []) as FacebookLead[];

      // Process and store each lead
      for (const leadData of leads) {
        const fieldMap = new Map(
          leadData.field_data.map(field => [field.name, field.values[0]])
        );

        const lead = await prisma.lead.upsert({
          where: { id: leadData.id },
          create: {
            id: leadData.id,
            name: fieldMap.get('full_name') || '',
            email: fieldMap.get('email') || null,
            phone: fieldMap.get('phone_number') || null,
            campaignId: leadData.ad_id || 'unknown', // Default to 'unknown' if missing
            formId: form.id,
            pageId: pageId,
            status: 'new',
            notes: [],
            tags: [],
            receivedAt: new Date(leadData.created_time),
            rawData: leadData as any,
          },
          update: {} // Don't update existing leads
        });

        allLeads.push(lead);
      }
    }

    // Sort leads by receivedAt in descending order (newest first)
    allLeads.sort((a, b) => 
      new Date(b.receivedAt).getTime() - new Date(a.receivedAt).getTime()
    );

    return NextResponse.json({ leads: allLeads });
  } catch (error) {
    console.error('Error fetching leads:', error);
    return NextResponse.json(
      { error: 'Failed to fetch leads' },
      { status: 500 }
    );
  }
}   