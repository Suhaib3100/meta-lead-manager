import { NextResponse } from 'next/server';
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
          const leadsResponse = await fetch(
            `https://graph.facebook.com/v19.0/${form.id}/leads?access_token=${page.accessToken}`
          );

          if (!leadsResponse.ok) {
            console.error(`Failed to fetch leads for form ${form.id}`);
            continue;
          }

          const leadsData = await leadsResponse.json();
          const leads = leadsData.data || [];

          for (const leadData of leads) {
            // Extract field data safely
            let name = '';
            let email = null;
            let phone = null;

            for (const field of leadData.field_data) {
              const fieldName = field.name.toLowerCase();
              const fieldValue = field.values[0] || '';

              if (fieldName === 'full name' || fieldName === 'name') {
                name = fieldValue;
              } else if (fieldName === 'email') {
                email = fieldValue;
              } else if (fieldName === 'phone' || fieldName === 'phone_number') {
                phone = fieldValue;
              }
            }

            await prisma.lead.upsert({
              where: { id: leadData.id },
              create: {
                id: leadData.id,
                name: name || 'Unknown',
                email: email,
                phone: phone,
                campaignId: leadData.ad_id || 'unknown',
                formId: form.id,
                pageId: page.id,
                status: 'new',
                receivedAt: new Date(leadData.created_time),
                rawData: leadData as any,
              },
              update: {
                name: name || 'Unknown',
                email: email,
                phone: phone,
              }
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