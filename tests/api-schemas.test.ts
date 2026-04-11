/**
 * @file api-schemas.test.ts
 * @module client-dashboard/tests
 * @description Zod schema smoke tests for API bodies.
 * @author BharatERP
 * @created 2026-04-09
 */

import { describe, expect, it } from 'vitest'
import { invoicePatchBodySchema, profilePatchBodySchema } from '@/lib/schemas/api'

describe('invoicePatchBodySchema', () => {
  it('accepts PAID', () => {
    expect(invoicePatchBodySchema.safeParse({ status: 'PAID' }).success).toBe(true)
  })
  it('rejects invalid status', () => {
    expect(invoicePatchBodySchema.safeParse({ status: 'OPEN' }).success).toBe(false)
  })
})

describe('profilePatchBodySchema', () => {
  it('requires at least one field', () => {
    expect(profilePatchBodySchema.safeParse({}).success).toBe(false)
  })
  it('accepts name only', () => {
    expect(profilePatchBodySchema.safeParse({ name: 'A' }).success).toBe(true)
  })
})
