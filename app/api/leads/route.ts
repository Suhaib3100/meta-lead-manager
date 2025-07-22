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
    const transformedLeads = leads.map(lead => {
      // Extract form data from rawData
      let formData: { [key: string]: string } = {};
      let formId = lead.formId;
      let submittedAt = lead.receivedAt.toISOString();
      
      // Debug: Log raw data for troubleshooting
      console.log(`Processing lead ${lead.name} (${lead.id}):`, {
        hasRawData: !!lead.rawData,
        rawDataType: typeof lead.rawData,
        rawDataKeys: lead.rawData ? Object.keys(lead.rawData) : []
      });
      
      if (lead.rawData && typeof lead.rawData === 'object') {
        const rawData = lead.rawData as any;
        
        // Extract form responses from Facebook lead data
        if (rawData.field_data && Array.isArray(rawData.field_data)) {
          // Extract form ID
          if (rawData.form_id) {
            formId = rawData.form_id;
          }
          
          // Extract submission time
          if (rawData.created_time) {
            submittedAt = new Date(rawData.created_time).toISOString();
          }
          
          // Extract form responses from field_data
          rawData.field_data.forEach((field: any) => {
            if (field.name && field.values && field.values[0]) {
              formData[field.name] = field.values[0];
            }
          });
          
          // Debug: Log extracted form data
          console.log(`Extracted form data for ${lead.name}:`, formData);
        }
      }
      
      return {
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
        timeline: [],
        form_id: formId,
        submitted_at: submittedAt,
        form_data: formData
      };
    });

    return NextResponse.json({ leads: transformedLeads });
  } catch (error) {
    console.error('Error fetching leads:', error);
    return NextResponse.json(
      { error: 'Failed to fetch leads' },
      { status: 500 }
    );
  }
} 