/**
 * @file route.ts
 * @module client-dashboard/api/user/profile
 * @description Update profile fields for the session user.
 * @author BharatERP
 * @created 2026-04-09
 */

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { addActivityLog } from '@/lib/activity-log'
import { profilePatchBodySchema } from '@/lib/schemas/api'

export async function PATCH(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const json = await request.json()
    const parsed = profilePatchBodySchema.safeParse(json)
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid body', details: parsed.error.flatten() },
        { status: 400 }
      )
    }

    const data: { name?: string; company?: string | null; phone?: string | null } = {}
    if (parsed.data.name !== undefined) data.name = parsed.data.name
    if (parsed.data.company !== undefined) data.company = parsed.data.company
    if (parsed.data.phone !== undefined) data.phone = parsed.data.phone

    const user = await prisma.user.update({
      where: { id: session.user.id },
      data,
      select: {
        id: true,
        name: true,
        email: true,
        company: true,
        phone: true
      }
    })

    await addActivityLog(session.user.id, 'Profile updated')

    return NextResponse.json(user)
  } catch (error) {
    console.error('Profile patch error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
