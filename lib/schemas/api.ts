/**
 * File:        lib/schemas/api.ts
 * Module:      Validation · Zod API Schemas
 * Purpose:     Centralises all Zod request-body schemas used by Next.js Route Handlers.
 *
 * Exports:
 *   - invoicePatchBodySchema          — validates PATCH /api/invoices/[id] body (status transition)
 *   - profilePatchBodySchema          — validates PATCH /api/profile body (name / company / phone)
 *   - passwordChangeBodySchema        — validates POST /api/profile/password body
 *   - createIndividualSchema          — validates POST /api/admin/individuals body (new personal-client user)
 *   - createServiceDataFieldSchema    — validates POST /api/admin/services/[id]/data-fields body
 *   - updateServiceDataFieldSchema    — validates PATCH /api/admin/services/[id]/data-fields/[fid] body
 *   - updateIndividualSchema          — validates PATCH /api/admin/individuals/[userId] body (partial update)
 *
 * Depends on:
 *   - zod — schema validation and inference
 *
 * Side-effects:
 *   - none
 *
 * Key invariants:
 *   - All schemas are pure Zod objects; no Prisma or Next.js runtime imports here.
 *   - updateServiceDataFieldSchema requires at least one field to be present.
 *
 * Read order:
 *   1. invoicePatchBodySchema        — simplest schema, good orientation point
 *   2. createIndividualSchema        — new individual-client creation
 *   3. createServiceDataFieldSchema  — service data field creation
 *   4. updateServiceDataFieldSchema  — partial update with at-least-one-field refinement
 *
 * Author:      AmanVatsSharma
 * Last-updated: 2026-04-19
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

export const createIndividualSchema = z.object({
  name: z.string().min(1).max(120),
  email: z.string().email(),
  password: z.string().min(8).max(128),
  phone: z.string().max(32).optional()
})

export const createServiceDataFieldSchema = z.object({
  label: z.string().min(1).max(200),
  value: z.string().min(1).max(10000),
  isSensitive: z.boolean().optional(),
  order: z.number().int().nonnegative().optional()
})

export const updateServiceDataFieldSchema = z.object({
  label: z.string().min(1).max(200).optional(),
  value: z.string().min(1).max(10000).optional(),
  isSensitive: z.boolean().optional(),
  order: z.number().int().nonnegative().optional()
}).refine(data => Object.values(data).some(v => v !== undefined), {
  message: 'At least one field is required'
})

export const updateIndividualSchema = z.object({
  name: z.string().min(1).max(120).optional(),
  email: z.string().email().optional(),
  phone: z.string().max(32).optional(),
  isActive: z.boolean().optional()
})
