/**
 * @file activity-log.ts
 * @module client-dashboard/lib
 * @description Server-side activity log writes via Prisma (import only from API routes / server).
 * @author BharatERP
 * @created 2026-04-09
 */

import { prisma } from '@/lib/db'

export async function addActivityLog(
  userId: string,
  action: string,
  details?: string,
  companyId?: string
): Promise<void> {
  try {
    await prisma.activityLog.create({
      data: {
        userId,
        action,
        details: details ?? null,
        companyId: companyId ?? null,
      }
    })
  } catch (error) {
    console.error('Failed to add activity log:', error)
  }
}
