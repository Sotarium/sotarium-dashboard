import { NextResponse } from 'next/server';
import { checkIpReputation } from '@/lib/vpn-detector';

export async function POST(req: Request) {
  try {
    const forwardedHeader = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip');
    const clientIp = forwardedHeader ? forwardedHeader.split(',')[0].trim() : '';

    if (!clientIp) {
      return NextResponse.json({ isVpnOrProxy: false });
    }

    const result = await checkIpReputation(clientIp);
    return NextResponse.json(result);
  } catch (err) {
    console.error('Error checking IP reputation:', err);
    return NextResponse.json({ isVpnOrProxy: false });
  }
}
