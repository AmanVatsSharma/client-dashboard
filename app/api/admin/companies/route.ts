/**
 * File:        app/api/admin/companies/route.ts
 * Module:      Admin API · Companies
 * Purpose:     List active non-personal companies and create new company accounts with an owner user.
 *
 * Exports:
 *   - GET()                        — list all active, non-personal companies with user/invoice/ticket counts
 *   - POST(request: NextRequest)   — create a company and its first owner user in a transaction
 *
 * Depends on:
 *   - @/lib/admin-guard  — requireAdmin() enforces admin-only access
 *   - @/lib/db           — singleton PrismaClient
 *   - bcryptjs           — password hashing for the owner user (12 rounds)
 *
 * Side-effects:
 *   - DB write (POST): creates Company, User, and CompanyUser in a transaction
 *
 * Key invariants:
 *   - GET excludes isPersonal companies (those belong to individual clients, not the company list).
 *   - GET filters to isActive:true so deleted/deactivated companies are hidden from the admin list.
 *   - POST checks for duplicate email before starting the transaction.
 *
 * Read order:
 *   1. createCompanySchema — understand the expected request body shape
 *   2. GET                 — simple query with aggregate counts
 *   3. POST                — validation → duplicate-check → transaction
 *
 * Author:      AmanVatsSharma
 * Last-updated: 2026-04-19
 */

import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/admin-guard'
import { prisma } from '@/lib/db'
import { Prisma } from '@prisma/client'
import { z } from 'zod'
import bcrypt from 'bcryptjs'

const createCompanySchema = z.object({
  companyName: z.string().min(1),
  domain: z.string().optional(),
  industry: z.string().optional(),
  address: z.string().optional(),
  country: z.string().optional(),
  phone: z.string().optional(),
  // First user (owner)
  ownerName: z.string().min(1),
  ownerEmail: z.string().email(),
  ownerPassword: z.string().min(6),
  ownerPhone: z.string().optional(),
  ownerJobTitle: z.string().optional(),
})

export async function GET() {
  try {
    const { error } = await requireAdmin()
    if (error) return error

    const companies = await prisma.company.findMany({
      where: { isActive: true, isPersonal: false },
      include: {
        _count: {
          select: {
            users: { where: { isActive: true } },
            invoices: true,
            tickets: true,
          }
        },
        invoices: {
          where: { status: { in: ['PENDING', 'OVERDUE'] } },
          select: { amount: true, status: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    })

    return NextResponse.json(companies)
  } catch (err) {
    console.error('GET /api/admin/companies:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const { session, error } = await requireAdmin()
    if (error) return error

    const json = await request.json()
    const parsed = createCompanySchema.safeParse(json)
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid data', details: parsed.error.flatten() }, { status: 400 })
    }

    const { companyName, domain, industry, address, country, phone, ownerName, ownerEmail, ownerPassword, ownerPhone, ownerJobTitle } = parsed.data

    const existingUser = await prisma.user.findUnique({ where: { email: ownerEmail } })
    if (existingUser) {
      return NextResponse.json({ error: 'A user with this email already exists' }, { status: 400 })
    }

    const hashedPassword = await bcrypt.hash(ownerPassword, 12)

    const result = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      const company = await tx.company.create({
        data: { name: companyName, domain, industry, address, country, phone }
      })

      const user = await tx.user.create({
        data: {
          name: ownerName,
          email: ownerEmail,
          password: hashedPassword,
          phone: ownerPhone,
          role: 'CLIENT',
        }
      })

      await tx.companyUser.create({
        data: {
          userId: user.id,
          companyId: company.id,
          role: 'OWNER',
          jobTitle: ownerJobTitle,
        }
      })

      return { company, user }
    })

    return NextResponse.json(result, { status: 201 })
  } catch (err) {
    console.error('POST /api/admin/companies:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
