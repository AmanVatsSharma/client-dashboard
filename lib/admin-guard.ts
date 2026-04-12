import { getServerSession } from 'next-auth/next'
import type { Session } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { NextResponse } from 'next/server'

type GuardResult<T = unknown> =
  | { session: Session; error: null; data?: T }
  | { session: null; error: NextResponse; data?: undefined }

export async function requireAdmin(): Promise<GuardResult> {
  const session = await getServerSession(authOptions)

  if (!session?.user?.id) {
    return {
      session: null,
      error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
  }

  if (session.user.role !== 'ADMIN') {
    return {
      session: null,
      error: NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }
  }

  return { session, error: null }
}

export async function requireClient(): Promise<GuardResult & { companyId?: string }> {
  const session = await getServerSession(authOptions)

  if (!session?.user?.id) {
    return {
      session: null,
      error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
  }

  if (session.user.role !== 'CLIENT') {
    return {
      session: null,
      error: NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }
  }

  if (!session.user.companyId) {
    return {
      session: null,
      error: NextResponse.json({ error: 'No company associated with this account' }, { status: 403 })
    }
  }

  return { session, error: null, companyId: session.user.companyId }
}
