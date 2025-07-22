import { NextResponse } from 'next/server';
import { verifyWebhook, processLeadData } from '@/lib/facebook';
import { prisma } from '@/lib/prisma';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const mode = searchParams.get('hub.mode');
  const token = searchParams.get('hub.verify_token');
  const challenge = searchParams.get('hub.challenge');

  const result = verifyWebhook(mode, token, challenge);
  
  if (result) {
    return new NextResponse(result);
  }
  
  return NextResponse.json({ error: 'Invalid verification token' }, { status: 403 });
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    
    // Verify the request is from Facebook
    const signature = request.headers.get('x-hub-signature');
    if (!signature) {
      return NextResponse.json({ error: 'Missing signature' }, { status: 401 });
    }

    // Process each lead in the webhook
    const entries = body.entry || [];
    for (const entry of entries) {
      const changes = entry.changes || [];
      for (const change of changes) {
        if (change.value && change.value.form_id && change.value.leadgen_id) {
          const pageId = entry.id;
          const formId = change.value.form_id;
          
          // Get the page's access token
          const page = await prisma.facebookPage.findUnique({
            where: { id: pageId }
          });

          if (!page?.accessToken) {
            console.error(`No access token found for page ${pageId}`);
            continue;
          }

          // Fetch lead details from Facebook
          const response = await fetch(
            `https://graph.facebook.com/v19.0/${change.value.leadgen_id}?access_token=${page.accessToken}`
          );

          if (!response.ok) {
            console.error(`Failed to fetch lead ${change.value.leadgen_id}`);
            continue;
          }

          const leadData = await response.json();
          await processLeadData(leadData, pageId);
        }
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error processing webhook:', error);
    return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 });
  }
} 