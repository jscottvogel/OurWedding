import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { slug, password } = body;

    // In a real implementation:
    // 1. Fetch WebsiteConfig for slug
    // 2. Compare bcrypt hash of password
    
    if (password === 'testpassword') { // MVP Placeholder
      const response = NextResponse.json({ success: true });
      response.cookies.set('site_auth', slug, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 7 // 1 week
      });
      return response;
    }

    return NextResponse.json({ success: false, error: 'Invalid password' }, { status: 401 });
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Server error' }, { status: 500 });
  }
}
