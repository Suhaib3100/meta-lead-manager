import { NextResponse } from 'next/server';
import { getFacebookPages } from '@/lib/facebook';
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

    const accessToken = process.env.FACEBOOK_ACCESS_TOKEN;
    if (!accessToken) {
      return NextResponse.json(
        { error: 'Facebook access token not configured' },
        { status: 500 }
      );
    }

    const pages = await getFacebookPages(accessToken);
    
    // Store or update pages in database
    for (const page of pages) {
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

    return NextResponse.json({ pages });
  } catch (error) {
    console.error('Error fetching Facebook pages:', error);
    return NextResponse.json(
      { error: 'Failed to fetch Facebook pages' },
      { status: 500 }
    );
  }
} 