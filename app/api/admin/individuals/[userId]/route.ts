/**
 * File:        app/api/admin/individuals/[userId]/route.ts
 * Module:      Admin API · Individual Clients · Single Record
 * Purpose:     Update or soft-delete a single individual client by userId.
 *
 * Exports:
 *   - PATCH(request, { params }) — update user fields and/or CompanyUser.isActive; syncs Company.name when name changes
 *   - DELETE(_request, { params }) — soft-delete: sets CompanyUser.isActive=false and Company.isActive=false
 *
 * Depends on:
 *   - @/lib/admin-guard  — requireAdmin() enforces admin-only access
 *   - @/lib/db           — singleton PrismaClient
 *
 * Side-effects:
 *   - DB write (PATCH): updates User and optionally Company.name and/or CompanyUser.isActive in a transaction
 *   - DB write (DELETE): sets CompanyUser.isActive=false and Company.isActive=false in a transaction
 *
 * Key invariants:
 *   - Both handlers 404 when the userId has no personal company record.
 *   - Email collision check skips the current user so a no-op email update is allowed.
 *   - Company.name stays in sync with User.name whenever name is updated.
 *   - DELETE is a soft delete only — no rows are removed from the database.
 *
 * Read order:
 *   1. PATCH  — validate → lookup → collision-check → transaction with conditional updates
 *   2. DELETE — lookup → transaction deactivating CompanyUser + Company
 *
 * Author:      AmanVatsSharma
 * Last-updated: 2026-04-19
 */

import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/admin-guard'
import { prisma } from '@/lib/db'
import { Prisma } from '@prisma/client'

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
    const { name, email, phone, isActive } = json as {
      name?: string
      email?: string
      phone?: string
      isActive?: boolean
    }

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

    const updatedUser = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      // Build User update payload with only provided fields
      const userUpdateData: Prisma.UserUpdateInput = {}
      if (name !== undefined) userUpdateData.name = name
      if (email !== undefined) userUpdateData.email = email
      if (phone !== undefined) userUpdateData.phone = phone

      const user =
        Object.keys(userUpdateData).length > 0
          ? await tx.user.update({ where: { id: userId }, data: userUpdateData })
          : companyUser.user

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

      return user
    })

    return NextResponse.json(updatedUser)
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
