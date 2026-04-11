/**
 * @file middleware.ts
 * @module client-dashboard
 * @description Require auth for dashboard and private API routes (NextAuth JWT).
 * @author BharatERP
 * @created 2026-04-09
 */

import { withAuth } from 'next-auth/middleware'

export default withAuth({
  callbacks: {
    authorized: ({ token }) => !!token
  }
})

/** Dashboard only: API routes already enforce session via getServerSession and return JSON 401. */
export const config = {
  matcher: ['/dashboard/:path*']
}
