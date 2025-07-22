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

    // Also try to get leads from Business Manager if we have access
    try {
      console.log('Attempting to fetch leads from Business Manager...');
      const businessLeadsResponse = await fetch(
        `https://graph.facebook.com/v19.0/me/leads?access_token=${pages[0]?.accessToken}&limit=100`
      );

      if (businessLeadsResponse.ok) {
        const businessLeadsData = await businessLeadsResponse.json();
        const businessLeads = businessLeadsData.data || [];
        console.log(`Found ${businessLeads.length} leads from Business Manager`);
        
        // Process business manager leads
        for (const leadData of businessLeads) {
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
              pageId: leadData.page_id || 'unknown',
              status: 'new',
              receivedAt: new Date(leadData.created_time),
              rawData: leadData as any,
              tags: [],
              assignedTo: null,
            },
            update: {
              name: name || 'Unknown',
              email: email,
              phone: phone,
              rawData: leadData as any,
            }
          });

          totalLeadsSynced++;
        }
      }
    } catch (error) {
      console.error('Error fetching Business Manager leads:', error);
    }

    // For each page, get all forms and their leads
    for (const page of pages) {
      try {
        console.log(`Processing page: ${page.name} (${page.id})`);
        
        // Get forms for this page from Facebook
        const formsResponse = await fetch(
          `https://graph.facebook.com/v19.0/${page.id}/leadgen_forms?access_token=${page.accessToken}&limit=100`
        );

        if (!formsResponse.ok) {
          console.error(`Failed to fetch forms for page ${page.id}:`, await formsResponse.text());
          continue;
        }

        const formsData = await formsResponse.json();
        const forms = formsData.data || [];

        console.log(`Found ${forms.length} forms for page ${page.name}`);

        // Also get ALL leads directly from the page (not just from forms)
        console.log(`Fetching all leads for page ${page.name}...`);
        let allPageLeads: any[] = [];
        let pageLeadsUrl = `https://graph.facebook.com/v19.0/${page.id}/leads?access_token=${page.accessToken}&limit=100`;

        while (pageLeadsUrl) {
          const pageLeadsResponse = await fetch(pageLeadsUrl);

          if (!pageLeadsResponse.ok) {
            console.error(`Failed to fetch page leads for ${page.id}:`, await pageLeadsResponse.text());
            break;
          }

          const pageLeadsData = await pageLeadsResponse.json();
          const pageLeads = pageLeadsData.data || [];
          allPageLeads = allPageLeads.concat(pageLeads);

          // Check for next page
          pageLeadsUrl = pageLeadsData.paging?.next || null;
        }

        console.log(`Found ${allPageLeads.length} total leads for page ${page.name}`);

        // Also get leads from campaigns and ads
        console.log(`Fetching leads from campaigns for page ${page.name}...`);
        let allCampaignLeads: any[] = [];
        
        try {
          // Get campaigns for this page
          const campaignsResponse = await fetch(
            `https://graph.facebook.com/v19.0/${page.id}/campaigns?access_token=${page.accessToken}&limit=100`
          );

          if (campaignsResponse.ok) {
            const campaignsData = await campaignsResponse.json();
            const campaigns = campaignsData.data || [];

            for (const campaign of campaigns) {
              // Get leads from this campaign
              let campaignLeadsUrl = `https://graph.facebook.com/v19.0/${campaign.id}/leads?access_token=${page.accessToken}&limit=100`;
              
              while (campaignLeadsUrl) {
                const campaignLeadsResponse = await fetch(campaignLeadsUrl);
                
                if (campaignLeadsResponse.ok) {
                  const campaignLeadsData = await campaignLeadsResponse.json();
                  const campaignLeads = campaignLeadsData.data || [];
                  allCampaignLeads = allCampaignLeads.concat(campaignLeads);
                  
                  campaignLeadsUrl = campaignLeadsData.paging?.next || null;
                } else {
                  break;
                }
              }
            }
          }
        } catch (error) {
          console.error(`Error fetching campaign leads for page ${page.id}:`, error);
        }

        console.log(`Found ${allCampaignLeads.length} campaign leads for page ${page.name}`);

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

          // Get and store leads for this form with pagination
          let allLeads: any[] = [];
          let nextUrl = `https://graph.facebook.com/v19.0/${form.id}/leads?access_token=${page.accessToken}&limit=100`;

          while (nextUrl) {
            const leadsResponse = await fetch(nextUrl);

            if (!leadsResponse.ok) {
              console.error(`Failed to fetch leads for form ${form.id}:`, await leadsResponse.text());
              break;
            }

            const leadsData = await leadsResponse.json();
            const leads = leadsData.data || [];
            allLeads = allLeads.concat(leads);

            // Check for next page
            nextUrl = leadsData.paging?.next || null;
          }

          console.log(`Found ${allLeads.length} leads for form ${form.name}`);

          for (const leadData of allLeads) {
            // Extract field data safely
            let name = '';
            let email = null;
            let phone = null;
            let formData: any = {};

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
              },
              update: {
                name: name || 'Unknown',
                email: email,
                phone: phone,
                rawData: leadData as any,
              }
            });

            totalLeadsSynced++;
          }

          results.push({
            pageId: page.id,
            pageName: page.name,
            formId: form.id,
            formName: form.name,
            leadsCount: allLeads.length,
          });
        }

        // Process all leads found (from forms, page, and campaigns)
        const allFoundLeads = [...allPageLeads, ...allCampaignLeads];
        const uniqueLeads = allFoundLeads.filter((lead, index, self) => 
          index === self.findIndex(l => l.id === lead.id)
        );

        console.log(`Processing ${uniqueLeads.length} unique leads for page ${page.name}`);

        for (const leadData of uniqueLeads) {
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
            },
            update: {
              name: name || 'Unknown',
              email: email,
              phone: phone,
              rawData: leadData as any,
            }
          });

          totalLeadsSynced++;
        }
      } catch (error) {
        console.error(`Error processing page ${page.id}:`, error);
      }
    }

    // Get total count after sync
    const totalLeadsInDB = await prisma.lead.count();
    
    console.log(`Sync completed. Total leads in database: ${totalLeadsInDB}`);

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