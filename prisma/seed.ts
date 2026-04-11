/**
 * @file seed.ts
 * @module client-dashboard/prisma
 * @description Dev seed: demo user, service, invoices, ticket (idempotent-ish for local DB).
 * @author BharatERP
 * @created 2026-04-09
 */

import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  const email = process.env.SEED_USER_EMAIL ?? 'demo@vedpragya.local'
  const password = process.env.SEED_USER_PASSWORD ?? 'DemoPass123!'

  const hashed = await bcrypt.hash(password, 12)

  const user = await prisma.user.upsert({
    where: { email },
    create: {
      email,
      name: 'Demo Client',
      company: 'Demo Company',
      phone: '+91-9000000000',
      password: hashed
    },
    update: {
      name: 'Demo Client',
      company: 'Demo Company',
      phone: '+91-9000000000',
      password: hashed
    }
  })

  let service = await prisma.service.findFirst({
    where: { userId: user.id, name: 'Managed IT Support' }
  })
  if (!service) {
    service = await prisma.service.create({
      data: {
        name: 'Managed IT Support',
        description: 'Monthly support package',
        type: 'SUBSCRIPTION',
        status: 'ACTIVE',
        price: 9999,
        userId: user.id,
        nextBilling: new Date(Date.now() + 30 * 86400000)
      }
    })
  }

  await prisma.invoice.deleteMany({
    where: { userId: user.id, invoiceNumber: { startsWith: 'SEED-' } }
  })

  await prisma.invoice.createMany({
    data: [
      {
        invoiceNumber: `SEED-${Date.now()}-A`,
        amount: 9999,
        status: 'PENDING',
        dueDate: new Date(Date.now() + 14 * 86400000),
        userId: user.id,
        serviceId: service.id,
        description: 'Monthly subscription'
      },
      {
        invoiceNumber: `SEED-${Date.now()}-B`,
        amount: 2500,
        status: 'PAID',
        dueDate: new Date(Date.now() - 7 * 86400000),
        paidAt: new Date(),
        userId: user.id,
        serviceId: service.id,
        description: 'Add-on'
      }
    ]
  })

  await prisma.ticket.deleteMany({
    where: { userId: user.id, title: 'Welcome — sample ticket' }
  })

  const ticket = await prisma.ticket.create({
    data: {
      title: 'Welcome — sample ticket',
      description: 'This is seeded data. Safe to delete in production.',
      status: 'OPEN',
      priority: 'MEDIUM',
      userId: user.id,
      serviceId: service.id
    }
  })

  await prisma.ticketMessage.create({
    data: {
      ticketId: ticket.id,
      message: 'Thanks for choosing Vedpragya. This is a seeded support thread.',
      isAdmin: true
    }
  })

  await prisma.activityLog.create({
    data: {
      userId: user.id,
      action: 'Seed completed',
      details: email
    }
  })

  console.log('Seed OK. Login:', email, '/', password)
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
