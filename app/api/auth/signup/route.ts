import { NextResponse } from 'next/server'

export async function POST() {
  return NextResponse.json(
    { error: 'Self-registration is not available. Please contact support for access.' },
    { status: 410 }
  )
}
