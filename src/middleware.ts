export { default } from 'next-auth/middleware';

export const config = {
  matcher: [
    /*
     * Protect all routes EXCEPT:
     * - /login
     * - /api/auth/* (NextAuth's own callbacks/session endpoints)
     * - /_next/* (Next.js static files)
     * - /favicon.ico, /manifest.json, /icons/* (public assets)
     */
    '/((?!login|api/auth|_next/static|_next/image|favicon.ico|manifest.json|icons|public).*)',
  ],
};
