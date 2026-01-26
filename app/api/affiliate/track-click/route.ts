import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  const { partnerId, productId, userId, timestamp } = await request.json();
  
  // Store in database
  // await db.affiliateClicks.create({ ... });
  
  return NextResponse.json({ success: true });
}