import { NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';
import type { NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  
  // Check if the path starts with /dashboard or /questions
  if (pathname.startsWith('/dashboard') || pathname.startsWith('/questions')) {
    const token = await getToken({ 
      req: request,
      secret: 'secret-askchain' // Must match the secret in your NextAuth config
    });
    
    // If no token exists, redirect to login
    if (!token) {
      const url = new URL('/login', request.url);
      // Add the original URL as a query parameter to redirect after login
      url.searchParams.set('callbackUrl', encodeURI(request.url));
      return NextResponse.redirect(url);
    }
  }
  
  return NextResponse.next();
}

// Specify paths to match
export const config = {
  matcher: [
    '/dashboard/:path*',
    '/questions/:path*'
  ],
};