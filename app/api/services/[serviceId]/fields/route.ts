/**
 * File:        app/api/services/[serviceId]/fields/route.ts
 * Module:      Client API · Services · Data Fields
 * Purpose:     Return all data fields for a service that belongs to the authenticated client's company.
 *
 * Exports:
 *   - GET(_req, { params }) → NextResponse — returns all ServiceDataField records for the service ordered by order ASC, createdAt ASC
 *
 * Depends on:
 *   - @/lib/admin-guard  — requireClient() enforces client-only access and extracts companyId
 *   - @/lib/db           — singleton PrismaClient
 *
 * Side-effects:
 *   - DB read (no writes)
 *
 * Key invariants:
 *   - The service must exist AND service.companyId must match the session companyId; any mismatch returns 404 (not 403) to avoid leaking service existence.
 *   - All fields including sensitive ones are returned; masking isSensitive values is a UI concern only.
 *   - companyId is guaranteed non-null by requireClient() before the Prisma query runs.
 *
 * Read order:
 *   1. GET — auth guard → service ownership check → field list query → return
 *
 * Author:      AmanVatsSharma
 * Last-updated: 2026-04-19
 */

import { NextRequest, NextResponse } from 'next/server'
import { requireClient } from '@/lib/admin-guard'
import { prisma } from '@/lib/db'

export async function GET(
  _req: NextRequest,
  { params }: { params: { serviceId: string } }
) {
  try {
    const { companyId, error } = await requireClient()
    if (error) return error

    const { serviceId } = params

    const service = await prisma.service.findFirst({
      where: { id: serviceId, companyId: companyId! },
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
    console.error('GET /api/services/[serviceId]/fields:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
