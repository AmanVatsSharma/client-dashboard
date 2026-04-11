/**
 * @file service-display.ts
 * @module client-dashboard/lib
 * @description Map Prisma service enums to UI labels (client-safe).
 * @author BharatERP
 * @created 2026-04-09
 */

import type { ServiceStatus, ServiceType } from '@prisma/client'

export type UiServiceStatus = 'active' | 'inactive' | 'pending' | 'completed'

export function serviceStatusToUi(status: ServiceStatus): UiServiceStatus {
  switch (status) {
    case 'ACTIVE':
      return 'active'
    case 'INACTIVE':
      return 'inactive'
    case 'PENDING':
      return 'pending'
    case 'COMPLETED':
      return 'completed'
    default:
      return 'pending'
  }
}

export function serviceTypeToUi(type: ServiceType): 'subscription' | 'one-time' {
  return type === 'SUBSCRIPTION' ? 'subscription' : 'one-time'
}
