/**
 * @file invoice-transitions.test.ts
 * @module client-dashboard/tests
 * @description Unit tests for invoice status transition rules.
 * @author BharatERP
 * @created 2026-04-09
 */

import { describe, expect, it } from 'vitest'
import { resolveInvoicePatch } from '@/lib/invoice-transitions'

describe('resolveInvoicePatch', () => {
  it('allows PAID from PENDING', () => {
    const r = resolveInvoicePatch('PENDING', 'PAID')
    expect(r.ok).toBe(true)
    if (r.ok) {
      expect(r.nextStatus).toBe('PAID')
      expect(r.paidAt).toBeInstanceOf(Date)
    }
  })

  it('allows PAID from OVERDUE', () => {
    const r = resolveInvoicePatch('OVERDUE', 'PAID')
    expect(r.ok).toBe(true)
  })

  it('rejects PAID from PAID', () => {
    const r = resolveInvoicePatch('PAID', 'PAID')
    expect(r.ok).toBe(false)
  })

  it('allows CANCELLED from PENDING', () => {
    const r = resolveInvoicePatch('PENDING', 'CANCELLED')
    expect(r.ok).toBe(true)
    if (r.ok) expect(r.paidAt).toBeNull()
  })

  it('rejects CANCELLED from PAID', () => {
    const r = resolveInvoicePatch('PAID', 'CANCELLED')
    expect(r.ok).toBe(false)
  })
})
