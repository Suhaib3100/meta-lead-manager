import { NextResponse } from 'next/server';
import { getFormLeads } from '@/lib/facebook';
import { prisma } from '@/lib/prisma';

export async function POST(request: Request) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json(
        { error: 'Missing authorization header' },
        { status: 401 }
      );
    }

    // Get all Facebook pages
    const pages = await prisma.facebookPage.findMany();
    const results = [];

    // For each page, get all forms and their leads
    for (const page of pages) {
      try {
        // Get forms for this page from Facebook
        const formsResponse = await fetch(
          `https://graph.facebook.com/v19.0/${page.id}/leadgen_forms?access_token=${page.accessToken}`
        );

        if (!formsResponse.ok) {
          console.error(`Failed to fetch forms for page ${page.id}`);
          continue;
        }

        const formsData = await formsResponse.json();
        const forms = formsData.data || [];

        // Store forms in database
        for (const form of forms) {
          await prisma.facebookForm.upsert({
            where: { id: form.id },
            create: {
              id: form.id,
              name: form.name,
              pageId: page.id,
            },
            update: {
              name: form.name,
            },
          });

          // Get and store leads for this form
          const leads = await getFormLeads(form.id, page.accessToken);
          
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
                pageId: page.id,
                receivedAt: new Date(leadData.created_time),
                rawData: leadData as any,
              },
              update: {} // Don't update existing leads
            });
          }

          results.push({
            pageId: page.id,
            formId: form.id,
            leadsCount: leads.length,
          });
        }
      } catch (error) {
        console.error(`Error processing page ${page.id}:`, error);
      }
    }

    return NextResponse.json({
      success: true,
      results,
    });
  } catch (error) {
    console.error('Error syncing leads:', error);
    return NextResponse.json(
      { error: 'Failed to sync leads' },
      { status: 500 }
    );
  }
} 