import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { 
  getLongLivedToken, 
  refreshLongLivedToken, 
  getPageAccessTokens, 
  isTokenValid, 
  getTokenInfo 
} from '@/lib/facebook';

export async function POST(request: Request) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json(
        { error: 'Missing authorization header' },
        { status: 401 }
      );
    }

    const { action, token } = await request.json();

    switch (action) {
      case 'exchange':
        // Convert short-lived token to long-lived token
        try {
          const longLivedToken = await getLongLivedToken(token);
          
          // Store the long-lived token
          await prisma.facebookToken.upsert({
            where: { id: 'main' },
            create: {
              id: 'main',
              accessToken: longLivedToken,
              tokenType: 'long_lived',
              createdAt: new Date(),
              expiresAt: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000), // 60 days
            },
            update: {
              accessToken: longLivedToken,
              tokenType: 'long_lived',
              createdAt: new Date(),
              expiresAt: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000), // 60 days
            },
          });

          // Get page access tokens
          const pages = await getPageAccessTokens(longLivedToken);
          
          // Store page tokens
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

          return NextResponse.json({
            success: true,
            message: 'Token exchanged successfully',
            pagesConnected: pages.length,
            expiresAt: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000),
          });
        } catch (error) {
          return NextResponse.json(
            { error: 'Failed to exchange token', details: error instanceof Error ? error.message : 'Unknown error' },
            { status: 500 }
          );
        }

      case 'refresh':
        // Refresh existing long-lived token
        try {
          const currentToken = await prisma.facebookToken.findUnique({
            where: { id: 'main' }
          });

          if (!currentToken) {
            return NextResponse.json(
              { error: 'No token found to refresh' },
              { status: 404 }
            );
          }

          const refreshedToken = await refreshLongLivedToken(currentToken.accessToken);
          
          // Update the token
          await prisma.facebookToken.update({
            where: { id: 'main' },
            data: {
              accessToken: refreshedToken,
              createdAt: new Date(),
              expiresAt: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000), // 60 days
            },
          });

          return NextResponse.json({
            success: true,
            message: 'Token refreshed successfully',
            expiresAt: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000),
          });
        } catch (error) {
          return NextResponse.json(
            { error: 'Failed to refresh token', details: error instanceof Error ? error.message : 'Unknown error' },
            { status: 500 }
          );
        }

      case 'check':
        // Check token validity
        try {
          const currentToken = await prisma.facebookToken.findUnique({
            where: { id: 'main' }
          });

          if (!currentToken) {
            return NextResponse.json({
              hasToken: false,
              isValid: false,
              message: 'No token found'
            });
          }

          const isValid = await isTokenValid(currentToken.accessToken);
          const tokenInfo = await getTokenInfo(currentToken.accessToken);

          return NextResponse.json({
            hasToken: true,
            isValid,
            expiresAt: currentToken.expiresAt,
            tokenInfo,
            message: isValid ? 'Token is valid' : 'Token is invalid or expired'
          });
        } catch (error) {
          return NextResponse.json(
            { error: 'Failed to check token', details: error instanceof Error ? error.message : 'Unknown error' },
            { status: 500 }
          );
        }

      default:
        return NextResponse.json(
          { error: 'Invalid action' },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('Token management error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 