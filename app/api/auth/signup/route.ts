/**
 * @file route.ts
 * @module client-dashboard/api/auth/signup
 * @description Register a new user and record an activity log entry.
 * @author BharatERP
 * @created 2026-04-09
 */

import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { prisma } from '@/lib/db'
import { addActivityLog } from '@/lib/activity-log'

export async function POST(request: NextRequest) {
  try {
    const { name, email, company, phone, password } = await request.json()

    const existingUser = await prisma.user.findUnique({
      where: { email }
    })

    if (existingUser) {
      return NextResponse.json(
        { error: 'User already exists with this email' },
        { status: 400 }
      )
    }

    const hashedPassword = await bcrypt.hash(password, 12)

    const user = await prisma.user.create({
      data: {
        name,
        email,
        company,
        phone,
        password: hashedPassword
      }
    })

    await addActivityLog(user.id, 'Account created')

    return NextResponse.json(
      { message: 'User created successfully', userId: user.id },
      { status: 201 }
    )
  } catch (error) {
    console.error('Signup error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
