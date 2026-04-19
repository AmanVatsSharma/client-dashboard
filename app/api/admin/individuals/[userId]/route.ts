/**
 * File:        app/api/admin/individuals/[userId]/route.ts
 * Module:      Admin API · Individual Clients · Single Record
 * Purpose:     Fetch, update, or soft-delete a single individual client by userId.
 *
 * Exports:
 *   - GET(_req, { params }) — fetch a single individual client; returns flat {id, name, email, phone, createdAt, isActive, companyId, companyName}; 404 when not found
 *   - PATCH(request, { params }) — update user fields and/or CompanyUser.isActive; returns flat {id, name, email, phone, createdAt, isActive, companyId, companyName}; syncs Company.name when name changes
 *   - DELETE(_request, { params }) — soft-delete: sets CompanyUser.isActive=false and Company.isActive=false
 *
 * Depends on:
 *   - @/lib/admin-guard  — requireAdmin() enforces admin-only access
 *   - @/lib/db           — singleton PrismaClient
 *
 * Side-effects:
 *   - DB read (GET): queries CompanyUser + User for personal company membership
 *   - DB write (PATCH): updates User and optionally Company.name and/or CompanyUser.isActive in a transaction; response omits password hash
 *   - DB write (DELETE): sets CompanyUser.isActive=false and Company.isActive=false in a transaction
 *
 * Key invariants:
 *   - All handlers 404 when the userId has no personal company record.
 *   - Email collision check skips the current user so a no-op email update is allowed.
 *   - Company.name stays in sync with User.name whenever name is updated.
 *   - DELETE is a soft delete only — no rows are removed from the database.
 *
 * Read order:
 *   1. GET    — lookup → return flat shape
 *   2. PATCH  — validate → lookup → collision-check → transaction with conditional updates
 *   3. DELETE — lookup → transaction deactivating CompanyUser + Company
 *
 * Author:      AmanVatsSharma
 * Last-updated: 2026-04-19
 */

import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/admin-guard'
import { prisma } from '@/lib/db'
import { updateIndividualSchema } from '@/lib/schemas/api'
import { Prisma } from '@prisma/client'

export async function GET(
  _req: NextRequest,
  { params }: { params: { userId: string } }
) {
  try {
    const { error } = await requireAdmin()
    if (error) return error

    const { userId } = params
    const companyUser = await prisma.companyUser.findFirst({
      where: { userId, company: { isPersonal: true } },
      include: {
        company: true,
        user: { select: { id: true, name: true, email: true, phone: true, createdAt: true } }
      }
    })

    if (!companyUser) {
      return NextResponse.json({ error: 'Individual client not found' }, { status: 404 })
    }

    return NextResponse.json({
      id: companyUser.user.id,
      name: companyUser.user.name,
      email: companyUser.user.email,
      phone: companyUser.user.phone,
      createdAt: companyUser.user.createdAt,
      isActive: companyUser.isActive,
      companyId: companyUser.companyId,
      companyName: companyUser.company.name,
    })
  } catch (err) {
    console.error('GET /api/admin/individuals/[userId]:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { userId: string } }
) {
  try {
    const { error } = await requireAdmin()
    if (error) return error

    const { userId } = params

    // Find the user and their personal company membership
    const companyUser = await prisma.companyUser.findFirst({
      where: {
        userId,
        company: { isPersonal: true },
      },
      include: { company: true, user: true },
    })

    if (!companyUser) {
      return NextResponse.json(
        { error: 'Individual client not found' },
        { status: 404 }
      )
    }

    const json = await request.json()
    const parsed = updateIndividualSchema.safeParse(json)
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid data', details: parsed.error.flatten() }, { status: 400 })
    }
    const { name, email, phone, isActive } = parsed.data

    // Email collision check — allow no-op updates for the same user
    if (email !== undefined) {
      const existing = await prisma.user.findUnique({ where: { email } })
      if (existing && existing.id !== userId) {
        return NextResponse.json(
          { error: 'A user with this email already exists' },
          { status: 400 }
        )
      }
    }

    const result = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      // Build User update payload with only provided fields
      const userUpdateData: Prisma.UserUpdateInput = {}
      if (name !== undefined) userUpdateData.name = name
      if (email !== undefined) userUpdateData.email = email
      if (phone !== undefined) userUpdateData.phone = phone

      const updatedUser =
        Object.keys(userUpdateData).length > 0
          ? await tx.user.update({
              where: { id: userId },
              data: userUpdateData,
              select: {
                id: true,
                name: true,
                email: true,
                phone: true,
                createdAt: true,
              }
            })
          : {
              id: companyUser.user.id,
              name: companyUser.user.name,
              email: companyUser.user.email,
              phone: companyUser.user.phone,
              createdAt: companyUser.user.createdAt,
            }

      // Sync Company.name when the person's name changes
      if (name !== undefined) {
        await tx.company.update({
          where: { id: companyUser.companyId },
          data: { name },
        })
      }

      // Update CompanyUser.isActive if provided
      if (isActive !== undefined) {
        await tx.companyUser.update({
          where: { id: companyUser.id },
          data: { isActive },
        })
      }

      return {
        ...updatedUser,
        isActive: isActive !== undefined ? isActive : companyUser.isActive,
        companyId: companyUser.companyId,
        companyName: isActive !== undefined || name !== undefined ? (name ?? companyUser.company.name) : companyUser.company.name,
      }
    })

    return NextResponse.json(result)
  } catch (err) {
    console.error('PATCH /api/admin/individuals/[userId]:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: { userId: string } }
) {
  try {
    const { error } = await requireAdmin()
    if (error) return error

    const { userId } = params

    // Find the personal company membership
    const companyUser = await prisma.companyUser.findFirst({
      where: {
        userId,
        company: { isPersonal: true },
      },
      include: { company: true },
    })

    if (!companyUser) {
      return NextResponse.json(
        { error: 'Individual client not found' },
        { status: 404 }
      )
    }

    await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      await tx.companyUser.update({
        where: { id: companyUser.id },
        data: { isActive: false },
      })

      await tx.company.update({
        where: { id: companyUser.companyId },
        data: { isActive: false },
      })
    })

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('DELETE /api/admin/individuals/[userId]:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
