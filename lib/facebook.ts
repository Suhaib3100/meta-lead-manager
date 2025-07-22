import { prisma } from '@/lib/prisma';

const FB_API_VERSION = 'v19.0';
const FB_API_BASE = `https://graph.facebook.com/${FB_API_VERSION}`;

export interface FacebookLead {
  id: string;
  created_time: string;
  ad_id: string;
  form_id: string;
  field_data: Array<{
    name: string;
    values: string[];
  }>;
}

export async function getFacebookPages(accessToken: string) {
  const response = await fetch(
    `${FB_API_BASE}/me/accounts?access_token=${accessToken}`
  );
  
  if (!response.ok) {
    throw new Error('Failed to fetch Facebook pages');
  }

  const data = await response.json();
  return data.data;
}

export async function getFormLeads(formId: string, accessToken: string) {
  const response = await fetch(
    `${FB_API_BASE}/${formId}/leads?access_token=${accessToken}`
  );

  if (!response.ok) {
    throw new Error(`Failed to fetch leads for form ${formId}`);
  }

  const data = await response.json();
  return data.data as FacebookLead[];
}

export async function processLeadData(leadData: FacebookLead, pageId: string) {
  const fieldMap = new Map(
    leadData.field_data.map(field => [field.name, field.values[0]])
  );

  const lead = await prisma.lead.create({
    data: {
      id: leadData.id,
      name: fieldMap.get('full_name') || '',
      email: fieldMap.get('email') || null,
      phone: fieldMap.get('phone_number') || null,
      campaignId: leadData.ad_id,
      formId: leadData.form_id,
      pageId: pageId,
      receivedAt: new Date(leadData.created_time),
      rawData: leadData as any,
    },
  });

  return lead;
}

export function verifyWebhook(
  mode: string | null,
  token: string | null,
  challenge: string | null
) {
  const VERIFY_TOKEN = process.env.FACEBOOK_WEBHOOK_VERIFY_TOKEN;

  if (mode === 'subscribe' && token === VERIFY_TOKEN) {
    return challenge;
  }

  return false;
} 