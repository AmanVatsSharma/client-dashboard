/**
 * File:        app/api/admin/individuals/route.ts
 * Module:      Admin API · Individual Clients
 * Purpose:     List and create individual clients — users linked to isPersonal companies.
 *
 * Exports:
 *   - GET()                        — list all individual clients as a flat array
 *   - POST(request: NextRequest)   — create an individual client (user + personal company + membership) in one transaction
 *
 * Depends on:
 *   - @/lib/admin-guard            — requireAdmin() enforces admin-only access
 *   - @/lib/db                     — singleton PrismaClient
 *   - @/lib/schemas/api            — createIndividualSchema for POST body validation
 *   - bcryptjs                     — password hashing (12 rounds)
 *
 * Side-effects:
 *   - DB write (POST): creates User, Company (isPersonal:true), CompanyUser in a transaction
 *
 * Key invariants:
 *   - A personal company always has exactly one CompanyUser with role OWNER.
 *   - isActive in the response reflects CompanyUser.isActive, not any User field.
 *   - GET returns a flat shape: {id, name, email, phone, createdAt, isActive, companyId, companyName} — no nested arrays.
 *   - GET returns all individuals regardless of isActive status (admins need to see deactivated records to reactivate them).
 *   - POST rejects if a user with the given email already exists.
 *   - POST response omits password hash — select excludes the password field.
 *
 * Read order:
 *   1. GET  — read path; understand the query → flatten pattern
 *   2. POST — write path; validation → duplicate-check → transaction
 *
 * Author:      AmanVatsSharma
 * Last-updated: 2026-04-19
 */

import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/admin-guard'
import { prisma } from '@/lib/db'
import { Prisma } from '@prisma/client'
import bcrypt from 'bcryptjs'
import { createIndividualSchema } from '@/lib/schemas/api'

export async function GET() {
  try {
    const { error } = await requireAdmin()
    if (error) return error

    const users = await prisma.user.findMany({
      where: {
        companyUsers: {
          some: { company: { isPersonal: true } }
        }
      },
      include: {
        companyUsers: {
          where: { company: { isPersonal: true } },
          include: { company: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    })

    const individuals = users.map((user) => {
      const cu = user.companyUsers[0]
      return {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        createdAt: user.createdAt,
        isActive: cu?.isActive ?? false,
        companyId: cu?.companyId ?? null,
        companyName: cu?.company?.name ?? null,
      }
    })

    return NextResponse.json(individuals)
  } catch (err) {
    console.error('GET /api/admin/individuals:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const { error } = await requireAdmin()
    if (error) return error

    const json = await request.json()
    const parsed = createIndividualSchema.safeParse(json)
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid data', details: parsed.error.flatten() },
        { status: 400 }
      )
    }

    const { name, email, password, phone } = parsed.data

    const existingUser = await prisma.user.findUnique({ where: { email } })
    if (existingUser) {
      return NextResponse.json(
        { error: 'A user with this email already exists' },
        { status: 400 }
      )
    }

    const hashedPassword = await bcrypt.hash(password, 12)

    const result = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      const user = await tx.user.create({
        data: {
          name,
          email,
          password: hashedPassword,
          phone,
          role: 'CLIENT',
        },
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
          role: true,
          createdAt: true,
          updatedAt: true,
        }
      })

      const company = await tx.company.create({
        data: {
          name,
          isPersonal: true,
          isActive: true,
        }
      })

      await tx.companyUser.create({
        data: {
          userId: user.id,
          companyId: company.id,
          role: 'OWNER',
        }
      })

      return { user, company }
    })

    return NextResponse.json(result, { status: 201 })
  } catch (err) {
    console.error('POST /api/admin/individuals:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
