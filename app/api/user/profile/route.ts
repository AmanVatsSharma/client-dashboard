/**
 * @file route.ts
 * @module client-dashboard/api/user/profile
 * @description Update profile fields for the session user.
 */

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { addActivityLog } from '@/lib/activity-log'
import { z } from 'zod'

const profilePatchSchema = z
  .object({
    name: z.string().min(1).max(120).optional(),
    phone: z.union([z.string().max(32), z.null()]).optional()
  })
  .refine((data) => data.name !== undefined || data.phone !== undefined, {
    message: 'At least one field is required'
  })

export async function PATCH(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const json = await request.json()
    const parsed = profilePatchSchema.safeParse(json)
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid body', details: parsed.error.flatten() },
        { status: 400 }
      )
    }

    const data: { name?: string; phone?: string | null } = {}
    if (parsed.data.name !== undefined) data.name = parsed.data.name
    if (parsed.data.phone !== undefined) data.phone = parsed.data.phone

    const user = await prisma.user.update({
      where: { id: session.user.id },
      data,
      select: {
        id: true,
        name: true,
        email: true,
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
