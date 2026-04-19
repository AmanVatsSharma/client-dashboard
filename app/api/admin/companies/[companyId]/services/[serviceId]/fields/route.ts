/**
 * File:        app/api/admin/companies/[companyId]/services/[serviceId]/fields/route.ts
 * Module:      Admin API · Services · Data Fields · Collection
 * Purpose:     List and create ServiceDataField records scoped to a specific service that belongs to a specific company.
 *
 * Exports:
 *   - GET(_req, { params }) → NextResponse   — returns all data fields for the service ordered by order ASC, createdAt ASC
 *   - POST(request, { params }) → NextResponse — creates a new data field for the service; returns the created field with status 201
 *
 * Depends on:
 *   - @/lib/admin-guard  — requireAdmin() enforces admin-only access
 *   - @/lib/db           — singleton PrismaClient
 *   - @/lib/schemas/api  — createServiceDataFieldSchema for POST body validation
 *
 * Side-effects:
 *   - GET: DB read (no writes)
 *   - POST: DB write — creates a ServiceDataField row
 *
 * Key invariants:
 *   - Both handlers verify the service exists AND belongs to the companyId path param before proceeding.
 *   - A mismatched or missing service always returns 404 (not 403) to avoid leaking service existence.
 *   - isSensitive and order default to false/0 via Prisma schema defaults; not duplicated in code.
 *
 * Read order:
 *   1. GET  — simple list with security check
 *   2. POST — validate body → security check → create → 201
 *
 * Author:      AmanVatsSharma
 * Last-updated: 2026-04-19
 */

import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/admin-guard'
import { prisma } from '@/lib/db'
import { createServiceDataFieldSchema } from '@/lib/schemas/api'

export async function GET(
  _req: NextRequest,
  { params }: { params: { companyId: string; serviceId: string } }
) {
  try {
    const { error } = await requireAdmin()
    if (error) return error

    const { companyId, serviceId } = params

    const service = await prisma.service.findFirst({
      where: { id: serviceId, companyId },
    })

    if (!service) {
      return NextResponse.json({ error: 'Service not found' }, { status: 404 })
    }

    const fields = await prisma.serviceDataField.findMany({
      where: { serviceId },
      orderBy: [{ order: 'asc' }, { createdAt: 'asc' }],
    })

    return NextResponse.json(fields)
  } catch (err) {
    console.error('GET /api/admin/companies/[companyId]/services/[serviceId]/fields:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { companyId: string; serviceId: string } }
) {
  try {
    const { error } = await requireAdmin()
    if (error) return error

    const { companyId, serviceId } = params

    const json = await request.json()
    const parsed = createServiceDataFieldSchema.safeParse(json)
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid data', details: parsed.error.flatten() },
        { status: 400 }
      )
    }

    const service = await prisma.service.findFirst({
      where: { id: serviceId, companyId },
    })

    if (!service) {
      return NextResponse.json({ error: 'Service not found' }, { status: 404 })
    }

    const field = await prisma.serviceDataField.create({
      data: {
        ...parsed.data,
        serviceId,
      },
    })

    return NextResponse.json(field, { status: 201 })
  } catch (err) {
    console.error('POST /api/admin/companies/[companyId]/services/[serviceId]/fields:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
