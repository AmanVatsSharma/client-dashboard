/**
 * File:        app/api/admin/services/fields/[fieldId]/route.ts
 * Module:      Admin API · Services · Data Fields · Single Record
 * Purpose:     Update or delete a single ServiceDataField by its fieldId.
 *
 * Exports:
 *   - PATCH(request, { params }) → NextResponse  — update provided fields on a ServiceDataField; returns the updated record
 *   - DELETE(_req, { params }) → NextResponse    — delete a ServiceDataField by fieldId; returns { success: true }
 *
 * Depends on:
 *   - @/lib/admin-guard  — requireAdmin() enforces admin-only access
 *   - @/lib/db           — singleton PrismaClient
 *   - @/lib/schemas/api  — updateServiceDataFieldSchema for PATCH body validation
 *
 * Side-effects:
 *   - PATCH: DB write — updates a ServiceDataField row
 *   - DELETE: DB write — deletes a ServiceDataField row
 *
 * Key invariants:
 *   - Both handlers perform an explicit findUnique before mutating so a missing fieldId returns 404, not a 500 from Prisma P2025.
 *   - No company-scoping on this route — requireAdmin() is the only guard; field ownership is implied by admin role.
 *   - updateServiceDataFieldSchema requires at least one field; a body of {} is rejected with 400.
 *
 * Read order:
 *   1. PATCH  — validate → findUnique guard → update → return
 *   2. DELETE — findUnique guard → delete → { success: true }
 *
 * Author:      AmanVatsSharma
 * Last-updated: 2026-04-19
 */

import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/admin-guard'
import { prisma } from '@/lib/db'
import { updateServiceDataFieldSchema } from '@/lib/schemas/api'

export async function PATCH(
  request: NextRequest,
  { params }: { params: { fieldId: string } }
) {
  try {
    const { error } = await requireAdmin()
    if (error) return error

    const { fieldId } = params

    const json = await request.json()
    const parsed = updateServiceDataFieldSchema.safeParse(json)
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid data', details: parsed.error.flatten() },
        { status: 400 }
      )
    }

    const existing = await prisma.serviceDataField.findUnique({
      where: { id: fieldId },
    })

    if (!existing) {
      return NextResponse.json({ error: 'Field not found' }, { status: 404 })
    }

    const field = await prisma.serviceDataField.update({
      where: { id: fieldId },
      data: parsed.data,
    })

    return NextResponse.json(field)
  } catch (err) {
    console.error('PATCH /api/admin/services/fields/[fieldId]:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { fieldId: string } }
) {
  try {
    const { error } = await requireAdmin()
    if (error) return error

    const { fieldId } = params

    const existing = await prisma.serviceDataField.findUnique({
      where: { id: fieldId },
    })

    if (!existing) {
      return NextResponse.json({ error: 'Field not found' }, { status: 404 })
    }

    await prisma.serviceDataField.delete({ where: { id: fieldId } })

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('DELETE /api/admin/services/fields/[fieldId]:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
