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

export interface FacebookPage {
  id: string;
  name: string;
  access_token: string;
}

// Convert short-lived token to long-lived token (valid for 60 days)
export async function getLongLivedToken(shortLivedToken: string): Promise<string> {
  const response = await fetch(
    `${FB_API_BASE}/oauth/access_token?grant_type=fb_exchange_token&client_id=${process.env.FACEBOOK_APP_ID}&client_secret=${process.env.FACEBOOK_APP_SECRET}&fb_exchange_token=${shortLivedToken}`
  );

  if (!response.ok) {
    throw new Error('Failed to exchange token');
  }

  const data = await response.json();
  return data.access_token;
}

// Refresh long-lived token (extends validity by 60 days)
export async function refreshLongLivedToken(currentToken: string): Promise<string> {
  const response = await fetch(
    `${FB_API_BASE}/oauth/access_token?grant_type=fb_exchange_token&client_id=${process.env.FACEBOOK_APP_ID}&client_secret=${process.env.FACEBOOK_APP_SECRET}&fb_exchange_token=${currentToken}`
  );

  if (!response.ok) {
    throw new Error('Failed to refresh token');
  }

  const data = await response.json();
  return data.access_token;
}

// Get page access tokens that don't expire (for pages you own)
export async function getPageAccessTokens(userAccessToken: string): Promise<FacebookPage[]> {
  const response = await fetch(
    `${FB_API_BASE}/me/accounts?access_token=${userAccessToken}&fields=id,name,access_token`
  );
  
  if (!response.ok) {
    throw new Error('Failed to fetch Facebook pages');
  }

  const data = await response.json();
  return data.data;
}

// Check if token is valid
export async function isTokenValid(accessToken: string): Promise<boolean> {
  try {
    const response = await fetch(
      `${FB_API_BASE}/me?access_token=${accessToken}`
    );
    return response.ok;
  } catch {
    return false;
  }
}

// Get token expiration info
export async function getTokenInfo(accessToken: string): Promise<{ expires_at?: number; is_valid: boolean }> {
  try {
    const response = await fetch(
      `${FB_API_BASE}/debug_token?input_token=${accessToken}&access_token=${process.env.FACEBOOK_APP_ID}|${process.env.FACEBOOK_APP_SECRET}`
    );
    
    if (response.ok) {
      const data = await response.json();
      return {
        expires_at: data.data.expires_at,
        is_valid: data.data.is_valid
      };
    }
  } catch (error) {
    console.error('Error checking token info:', error);
  }
  
  return { is_valid: false };
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