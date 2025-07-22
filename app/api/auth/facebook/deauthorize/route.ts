import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    
    // Handle user deauthorization
    if (body.user_id) {
      // Remove user's pages from database
      await prisma.facebookPage.deleteMany({
        where: {
          id: {
            startsWith: body.user_id
          }
        }
      });
    }

    return NextResponse.json({ status: 'success' });
  } catch (error) {
    console.error('Deauthorization error:', error);
    return NextResponse.json({ status: 'success' }); // Always return success to Facebook
  }
} 