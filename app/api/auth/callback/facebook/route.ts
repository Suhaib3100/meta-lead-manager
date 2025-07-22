import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get('code');
    
    if (!code) {
      return NextResponse.json({ error: 'No code provided' }, { status: 400 });
    }

    // Exchange code for access token
    const tokenResponse = await fetch(
      `https://graph.facebook.com/v19.0/oauth/access_token?` +
      `client_id=${process.env.FACEBOOK_APP_ID}&` +
      `client_secret=${process.env.FACEBOOK_APP_SECRET}&` +
      `code=${code}&` +
      `redirect_uri=${encodeURIComponent(process.env.FACEBOOK_REDIRECT_URI || '')}`
    );

    const tokenData = await tokenResponse.json();

    if (!tokenResponse.ok) {
      console.error('Token exchange failed:', tokenData);
      return NextResponse.json(
        { error: 'Failed to exchange code for token' },
        { status: 500 }
      );
    }

    // Get long-lived access token
    const longLivedTokenResponse = await fetch(
      `https://graph.facebook.com/v19.0/oauth/access_token?` +
      `grant_type=fb_exchange_token&` +
      `client_id=${process.env.FACEBOOK_APP_ID}&` +
      `client_secret=${process.env.FACEBOOK_APP_SECRET}&` +
      `fb_exchange_token=${tokenData.access_token}`
    );

    const longLivedTokenData = await longLivedTokenResponse.json();

    if (!longLivedTokenResponse.ok) {
      console.error('Long-lived token exchange failed:', longLivedTokenData);
      return NextResponse.json(
        { error: 'Failed to get long-lived token' },
        { status: 500 }
      );
    }

    // Get user's Facebook pages
    const pagesResponse = await fetch(
      `https://graph.facebook.com/v19.0/me/accounts?access_token=${longLivedTokenData.access_token}`
    );

    const pagesData = await pagesResponse.json();

    if (!pagesResponse.ok) {
      console.error('Failed to fetch pages:', pagesData);
      return NextResponse.json(
        { error: 'Failed to fetch Facebook pages' },
        { status: 500 }
      );
    }

    // Store pages in database
    for (const page of pagesData.data) {
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

    // Redirect to success page
    return NextResponse.redirect(new URL('/dashboard', request.url));
  } catch (error) {
    console.error('OAuth callback error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 