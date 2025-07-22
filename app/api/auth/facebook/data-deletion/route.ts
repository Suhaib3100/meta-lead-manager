import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    
    if (body.user_id) {
      // Delete all leads associated with this user's pages
      const userPages = await prisma.facebookPage.findMany({
        where: {
          id: {
            startsWith: body.user_id
          }
        }
      });

      const pageIds = userPages.map(page => page.id);

      await prisma.lead.deleteMany({
        where: {
          pageId: {
            in: pageIds
          }
        }
      });

      // Delete the pages
      await prisma.facebookPage.deleteMany({
        where: {
          id: {
            in: pageIds
          }
        }
      });

      // Delete associated forms
      await prisma.facebookForm.deleteMany({
        where: {
          pageId: {
            in: pageIds
          }
        }
      });
    }

    // Return confirmation URL as required by Facebook
    const confirmationCode = Date.now().toString();
    return NextResponse.json({
      url: `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/facebook/data-deletion/confirm?code=${confirmationCode}`,
      confirmation_code: confirmationCode
    });
  } catch (error) {
    console.error('Data deletion request error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// Confirmation endpoint
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code');

  if (!code) {
    return NextResponse.json({ error: 'No confirmation code provided' }, { status: 400 });
  }

  return NextResponse.json({
    status: 'success',
    message: 'Data deletion completed'
  });
} 