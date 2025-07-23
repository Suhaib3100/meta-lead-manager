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

    const accessToken = process.env.FACEBOOK_ACCESS_TOKEN;
    if (!accessToken) {
      return NextResponse.json(
        { error: 'Facebook access token not configured' },
        { status: 500 }
      );
    }

    console.log('Connecting Facebook pages...');

    // Fetch pages from Facebook
    const response = await fetch(
      `https://graph.facebook.com/v19.0/me/accounts?access_token=${accessToken}`
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Failed to fetch Facebook pages:', errorText);
      
      // Check if it's an access token error
      try {
        const errorData = JSON.parse(errorText);
        if (errorData.error?.code === 190) {
          return NextResponse.json(
            { 
              error: 'Facebook access token has expired. Please update your FACEBOOK_ACCESS_TOKEN environment variable.',
              details: errorData.error.message
            },
            { status: 401 }
          );
        }
      } catch (e) {
        // If we can't parse the error, just return the raw error
      }
      
      return NextResponse.json(
        { error: 'Failed to fetch Facebook pages', details: errorText },
        { status: 500 }
      );
    }

    const data = await response.json();
    const pages = data.data || [];

    console.log(`Found ${pages.length} Facebook pages`);

    // Store or update pages in database
    for (const page of pages) {
      console.log(`Processing page: ${page.name} (${page.id})`);
      
      await prisma.facebookPage.upsert({
        where: { id: page.id },
        create: {
          id: page.id,
          name: page.name,
          accessToken: page.access_token,
        },
        update: {
          name: page.name,
          accessToken: page.access_token,
        },
      });
    }

    return NextResponse.json({ 
      success: true,
      pagesConnected: pages.length,
      pages: pages.map((p: any) => ({ id: p.id, name: p.name }))
    });
  } catch (error) {
    console.error('Error connecting Facebook pages:', error);
    return NextResponse.json(
      { error: 'Failed to connect Facebook pages' },
      { status: 500 }
    );
  }
} 