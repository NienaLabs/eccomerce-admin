import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export default async function proxy(request: NextRequest) {
  const token = request.cookies.get('admin_token')?.value;
  const pathname = request.nextUrl.pathname;

  // Protect all routes except /login
  if (!token && !pathname.startsWith('/login')) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // If logged in and trying to access /login, redirect to dashboard
  if (token && pathname.startsWith('/login')) {
    return NextResponse.redirect(new URL('/', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Everything except:
     *  - api routes and Next's own static output
     *  - the PWA surface. These must stay publicly reachable: a signed-out
     *    browser fetching /sw.js or /manifest.webmanifest would otherwise get a
     *    307 to /login, so the worker would never install, the manifest would
     *    never parse, and the app would not be installable at all. The offline
     *    page is likewise served *because* the session can't be checked.
     */
    '/((?!api|_next/static|_next/image|favicon.ico|sw\\.js|offline\\.html|manifest\\.webmanifest|firebase-messaging-sw\\.js|icons/).*)',
  ],
};
