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
    let totalLeadsSynced = 0;

    console.log(`Starting sync for ${pages.length} Facebook pages`);
    console.log('Available pages:', pages.map(p => ({ id: p.id, name: p.name })));

    if (pages.length === 0) {
      console.log('No Facebook pages found. Please connect Facebook pages first.');
      return NextResponse.json({
        success: false,
        error: 'No Facebook pages found. Please connect Facebook pages first.',
        totalLeadsSynced: 0,
        totalLeadsInDB: await prisma.lead.count(),
        results: [],
      });
    }

    // Try to get leads from Business Manager using all available access tokens
    for (const page of pages) {
      try {
        console.log(`Processing page: ${page.name} (${page.id})`);
        
        // FIRST: Get leads directly from the page (most important for new leads)
        console.log(`Fetching leads directly from page: ${page.name}...`);
        let allPageLeads: any[] = [];
        let pageLeadsUrl = `https://graph.facebook.com/v19.0/${page.id}/leads?access_token=${page.accessToken}&limit=100`;

        while (pageLeadsUrl) {
          const pageLeadsResponse = await fetch(pageLeadsUrl);

          if (!pageLeadsResponse.ok) {
            const errorText = await pageLeadsResponse.text();
            console.error(`Failed to fetch page leads for ${page.id}:`, errorText);
            
            // Check if it's an access token error
            try {
              const errorData = JSON.parse(errorText);
              if (errorData.error?.code === 190) {
                console.error(`Access token expired for page ${page.name}. Skipping this page.`);
                break;
              }
            } catch (e) {
              // If we can't parse the error, continue with the error
            }
            break;
          }

          const pageLeadsData = await pageLeadsResponse.json();
          const pageLeads = pageLeadsData.data || [];
          allPageLeads = allPageLeads.concat(pageLeads);

          // Check for next page
          pageLeadsUrl = pageLeadsData.paging?.next || null;
        }

        console.log(`Found ${allPageLeads.length} leads directly from page ${page.name}`);

        // Process page leads first (these are usually the newest)
        for (const leadData of allPageLeads) {
          // Extract field data safely
          let name = '';
          let email = null;
          let phone = null;
          let formData: any = {};

          if (leadData.field_data) {
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
              
              // Store all form data
              formData[field.name] = fieldValue;
            }
          }

          console.log(`Processing page lead: ${name} (${leadData.id})`);

          // Create or update lead
          await prisma.lead.upsert({
            where: { id: leadData.id },
            create: {
              id: leadData.id,
              name: name || 'Unknown',
              email: email,
              phone: phone,
              campaignId: leadData.ad_id || 'unknown',
              formId: leadData.form_id || 'unknown',
              pageId: page.id,
              status: 'new',
              receivedAt: new Date(leadData.created_time),
              rawData: leadData as any,
              tags: [],
              assignedTo: null,
              source: 'Facebook Page Direct',
            },
            update: {
              name: name || 'Unknown',
              email: email,
              phone: phone,
              rawData: leadData as any,
              source: 'Facebook Page Direct',
            }
          });

          totalLeadsSynced++;
        }

        // SECOND: Try to get leads from Business Manager
        console.log(`Attempting to fetch leads from Business Manager using page: ${page.name}...`);
        const businessLeadsResponse = await fetch(
          `https://graph.facebook.com/v19.0/me/leads?access_token=${page.accessToken}&limit=100`
        );

        if (businessLeadsResponse.ok) {
          const businessLeadsData = await businessLeadsResponse.json();
          const businessLeads = businessLeadsData.data || [];
          console.log(`Found ${businessLeads.length} leads from Business Manager using page ${page.name}`);
          
          // Process business manager leads with pagination
          let allBusinessLeads = [...businessLeads];
          let nextUrl = businessLeadsData.paging?.next;
          
          // Fetch all pages of business leads
          while (nextUrl) {
            console.log('Fetching next page of business leads...');
            const nextResponse = await fetch(nextUrl);
            if (nextResponse.ok) {
              const nextData = await nextResponse.json();
              const nextLeads = nextData.data || [];
              allBusinessLeads = allBusinessLeads.concat(nextLeads);
              nextUrl = nextData.paging?.next;
              console.log(`Fetched ${nextLeads.length} more business leads`);
            } else {
              break;
            }
          }
          
          console.log(`Total business leads found: ${allBusinessLeads.length}`);
          
          // Process all business manager leads
          for (const leadData of allBusinessLeads) {
            // Extract field data safely
            let name = '';
            let email = null;
            let phone = null;
            let formData: any = {};

            if (leadData.field_data) {
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
                
                // Store all form data
                formData[field.name] = fieldValue;
              }
            }

            // Create or update lead
            await prisma.lead.upsert({
              where: { id: leadData.id },
              create: {
                id: leadData.id,
                name: name || 'Unknown',
                email: email,
                phone: phone,
                campaignId: leadData.ad_id || 'unknown',
                formId: leadData.form_id || 'unknown',
                pageId: page.id,
                status: 'new',
                receivedAt: new Date(leadData.created_time),
                rawData: leadData as any,
                tags: [],
                assignedTo: null,
                source: 'Facebook Business Manager',
              },
              update: {
                name: name || 'Unknown',
                email: email,
                phone: phone,
                rawData: leadData as any,
                source: 'Facebook Business Manager',
              }
            });

            totalLeadsSynced++;
          }
        }
      } catch (error) {
        console.error(`Error fetching Business Manager leads for page ${page.name}:`, error);
      }
    }

    // THIRD: Get forms for this page and their leads
    for (const page of pages) {
      try {
        console.log(`Processing page: ${page.name} (${page.id})`);
        
        // Get forms for this page from Facebook
        const formsResponse = await fetch(
          `https://graph.facebook.com/v19.0/${page.id}/leadgen_forms?access_token=${page.accessToken}&limit=100`
        );

        if (formsResponse.ok) {
          const formsData = await formsResponse.json();
          const forms = formsData.data || [];
          console.log(`Found ${forms.length} forms for page ${page.name}`);

          // Store forms in database and get their leads
          for (const form of forms) {
            console.log(`Processing form: ${form.name} (${form.id})`);
            
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

            // Get leads from this specific form
            let allFormLeads: any[] = [];
            let formLeadsUrl = `https://graph.facebook.com/v19.0/${form.id}/leads?access_token=${page.accessToken}&limit=100`;

            while (formLeadsUrl) {
              const formLeadsResponse = await fetch(formLeadsUrl);

              if (!formLeadsResponse.ok) {
                console.error(`Failed to fetch leads for form ${form.id}:`, await formLeadsResponse.text());
                break;
              }

              const formLeadsData = await formLeadsResponse.json();
              const formLeads = formLeadsData.data || [];
              allFormLeads = allFormLeads.concat(formLeads);

              // Check for next page
              formLeadsUrl = formLeadsData.paging?.next || null;
            }

            console.log(`Found ${allFormLeads.length} leads for form ${form.name}`);

            // Process form leads
            for (const leadData of allFormLeads) {
              // Extract field data safely
              let name = '';
              let email = null;
              let phone = null;
              let formData: any = {};

              if (leadData.field_data) {
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
                  
                  // Store all form data
                  formData[field.name] = fieldValue;
                }
              }

              console.log(`Processing form lead: ${name} (${leadData.id}) from form ${form.name}`);

              // Create or update lead
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
                  tags: [],
                  assignedTo: null,
                  source: 'Facebook Lead Form',
                },
                update: {
                  name: name || 'Unknown',
                  email: email,
                  phone: phone,
                  rawData: leadData as any,
                  source: 'Facebook Lead Form',
                }
              });

              totalLeadsSynced++;
            }

            results.push({
              pageId: page.id,
              pageName: page.name,
              formId: form.id,
              formName: form.name,
              leadsCount: allFormLeads.length,
            });
          }
        } else {
          console.error(`Failed to fetch forms for page ${page.id}:`, await formsResponse.text());
        }
      } catch (error) {
        console.error(`Error processing page ${page.id}:`, error);
      }
    }

    // Get total count after sync
    const totalLeadsInDB = await prisma.lead.count();
    
    console.log(`Sync completed. Total leads in database: ${totalLeadsInDB}`);

    // Trigger real-time sync notification
    try {
      await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/realtime/leads-synced`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          count: totalLeadsInDB,
          userId: 'system'
        })
      });
    } catch (error) {
      console.error('Error triggering real-time sync notification:', error);
    }

    return NextResponse.json({
      success: true,
      totalLeadsSynced,
      totalLeadsInDB,
      results,
    });
  } catch (error) {
    console.error('Error syncing leads:', error);
    return NextResponse.json(
      { error: 'Failed to sync leads', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
} 