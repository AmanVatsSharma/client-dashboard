/**
 * @file api.ts
 * @module client-dashboard/lib/schemas
 * @description Zod schemas shared by Route Handlers.
 * @author BharatERP
 * @created 2026-04-09
 */

import { z } from 'zod'

export const invoicePatchBodySchema = z.object({
  status: z.enum(['PAID', 'CANCELLED'])
})

export const profilePatchBodySchema = z
  .object({
    name: z.string().min(1).max(120).optional(),
    company: z.union([z.string().max(200), z.null()]).optional(),
    phone: z.union([z.string().max(32), z.null()]).optional()
  })
  .refine((data) => data.name !== undefined || data.company !== undefined || data.phone !== undefined, {
    message: 'At least one field is required'
  })

export const passwordChangeBodySchema = z.object({
  currentPassword: z.string().min(1).max(200),
  newPassword: z.string().min(8).max(128)
})
