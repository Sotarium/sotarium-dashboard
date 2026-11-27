import { NextResponse } from 'next/server';
import { getSessionCookieOptions } from '@/lib/session';

export async function POST() {
  const res = NextResponse.json({ success: true });
  res.cookies.set({
    ...getSessionCookieOptions(0),
    value: '',
  });
  return res;
}
