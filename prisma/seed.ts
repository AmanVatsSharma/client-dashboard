/**
 * @file seed.ts
 * @module client-dashboard/prisma
 * @description Dev seed: admin user + demo company with two users, sample service/invoice/ticket.
 *              Idempotent — safe to run multiple times.
 */

import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  // ── 1. Admin user ──────────────────────────────────────────────────────────
  const adminEmail = process.env.SEED_ADMIN_EMAIL ?? 'admin@vedpragya.local'
  const adminPassword = process.env.SEED_ADMIN_PASSWORD ?? 'Admin123!'

  const admin = await prisma.user.upsert({
    where: { email: adminEmail },
    create: {
      email: adminEmail,
      name: 'Admin Support',
      phone: '+91-9000000001',
      password: await bcrypt.hash(adminPassword, 12),
      role: 'ADMIN'
    },
    update: {
      name: 'Admin Support',
      role: 'ADMIN',
      password: await bcrypt.hash(adminPassword, 12)
    }
  })
  console.log('Admin:', adminEmail, '/', adminPassword)

  // ── 2. Demo company ────────────────────────────────────────────────────────
  let company = await prisma.company.findFirst({ where: { name: 'Acme Corp' } })
  if (!company) {
    company = await prisma.company.create({
      data: {
        name: 'Acme Corp',
        domain: 'acme.local',
        industry: 'Technology',
        country: 'India',
        phone: '+91-9800000000',
        isActive: true
      }
    })
  }

  // ── 3. Demo client users ───────────────────────────────────────────────────
  const clientEmail = process.env.SEED_USER_EMAIL ?? 'ceo@acme.local'
  const clientPassword = process.env.SEED_USER_PASSWORD ?? 'Client123!'

  const ceoUser = await prisma.user.upsert({
    where: { email: clientEmail },
    create: {
      email: clientEmail,
      name: 'Demo CEO',
      phone: '+91-9100000000',
      password: await bcrypt.hash(clientPassword, 12),
      role: 'CLIENT'
    },
    update: {
      name: 'Demo CEO',
      role: 'CLIENT',
      password: await bcrypt.hash(clientPassword, 12)
    }
  })
  console.log('Client (CEO):', clientEmail, '/', clientPassword)

  // Ensure CompanyUser link exists for CEO
  await prisma.companyUser.upsert({
    where: { userId_companyId: { userId: ceoUser.id, companyId: company.id } },
    create: {
      userId: ceoUser.id,
      companyId: company.id,
      role: 'OWNER',
      jobTitle: 'CEO',
      isActive: true
    },
    update: { role: 'OWNER', jobTitle: 'CEO', isActive: true }
  })

  const managerEmail = 'manager@acme.local'
  const managerUser = await prisma.user.upsert({
    where: { email: managerEmail },
    create: {
      email: managerEmail,
      name: 'Demo Manager',
      phone: '+91-9200000000',
      password: await bcrypt.hash('Manager123!', 12),
      role: 'CLIENT'
    },
    update: { name: 'Demo Manager', role: 'CLIENT' }
  })
  console.log('Client (Manager):', managerEmail, '/ Manager123!')

  await prisma.companyUser.upsert({
    where: { userId_companyId: { userId: managerUser.id, companyId: company.id } },
    create: {
      userId: managerUser.id,
      companyId: company.id,
      role: 'MANAGER',
      jobTitle: 'IT Manager',
      isActive: true
    },
    update: { role: 'MANAGER', jobTitle: 'IT Manager', isActive: true }
  })

  // ── 4. Service ─────────────────────────────────────────────────────────────
  let service = await prisma.service.findFirst({
    where: { companyId: company.id, name: 'Managed IT Support' }
  })
  if (!service) {
    service = await prisma.service.create({
      data: {
        name: 'Managed IT Support',
        description: 'Monthly managed IT support package',
        type: 'SUBSCRIPTION',
        status: 'ACTIVE',
        price: 9999,
        companyId: company.id,
        createdById: admin.id,
        nextBilling: new Date(Date.now() + 30 * 86400000)
      }
    })
  }

  // ── 5. Invoices ────────────────────────────────────────────────────────────
  await prisma.invoice.deleteMany({
    where: { companyId: company.id, invoiceNumber: { startsWith: 'SEED-' } }
  })

  await prisma.invoice.createMany({
    data: [
      {
        invoiceNumber: `SEED-${Date.now()}-A`,
        amount: 9999,
        status: 'PENDING',
        dueDate: new Date(Date.now() + 14 * 86400000),
        companyId: company.id,
        createdById: admin.id,
        serviceId: service.id,
        description: 'Monthly subscription'
      },
      {
        invoiceNumber: `SEED-${Date.now()}-B`,
        amount: 2500,
        status: 'PAID',
        dueDate: new Date(Date.now() - 7 * 86400000),
        paidAt: new Date(),
        companyId: company.id,
        createdById: admin.id,
        serviceId: service.id,
        description: 'Add-on configuration'
      }
    ]
  })

  // ── 6. Ticket ──────────────────────────────────────────────────────────────
  await prisma.ticket.deleteMany({
    where: { companyId: company.id, title: 'Welcome — sample ticket' }
  })

  const ticket = await prisma.ticket.create({
    data: {
      title: 'Welcome — sample ticket',
      description: 'This is seeded demo data. Safe to delete in production.',
      status: 'OPEN',
      priority: 'MEDIUM',
      companyId: company.id,
      openedById: ceoUser.id,
      serviceId: service.id
    }
  })

  await prisma.ticketMessage.create({
    data: {
      ticketId: ticket.id,
      message: 'Welcome to Vedpragya support. This is a seeded thread.',
      isAdmin: true,
      authorId: admin.id
    }
  })

  // ── 7. Bank account (demo) ─────────────────────────────────────────────────
  const existingBank = await prisma.bankAccount.findFirst({ where: { bankName: 'HDFC Bank (Seed)' } })
  if (!existingBank) {
    await prisma.bankAccount.create({
      data: {
        name: 'Vedpragya India Operations',
        bankName: 'HDFC Bank (Seed)',
        accountHolder: 'Vedpragya Bharat Pvt Ltd',
        accountNumber: '1234567890',
        routingNumber: 'HDFC0001234',
        country: 'India',
        currency: 'INR',
        currencySymbol: '₹',
        isActive: true,
        sortOrder: 1
      }
    })
  }

  // ── 8. Sample update ───────────────────────────────────────────────────────
  const existingUpdate = await prisma.clientUpdate.findFirst({ where: { title: 'Welcome to the portal!' } })
  if (!existingUpdate) {
    await prisma.clientUpdate.create({
      data: {
        title: 'Welcome to the portal!',
        content: 'We\'re excited to launch your client portal. You can now view invoices, raise support tickets, and message our team directly here.',
        authorId: admin.id,
        companyId: null // broadcast to all
      }
    })
  }

  // ── 9. Sample shared note ──────────────────────────────────────────────────
  const existingNote = await prisma.note.findFirst({ where: { title: 'Onboarding checklist' } })
  if (!existingNote) {
    await prisma.note.create({
      data: {
        title: 'Onboarding checklist',
        content: '1. Verify domain settings\n2. Configure DNS records\n3. Set up monitoring alerts\n4. Schedule first review call',
        authorId: admin.id,
        companyId: company.id,
        isPrivate: false
      }
    })
  }

  // ── 10. Activity log ───────────────────────────────────────────────────────
  await prisma.activityLog.create({
    data: {
      userId: admin.id,
      action: 'Seed completed',
      details: `Admin: ${adminEmail} · Company: ${company.name}`,
      companyId: company.id
    }
  })

  console.log('\nSeed complete!')
  console.log('─────────────────────────────────────')
  console.log('Admin login:   ', adminEmail, '/', adminPassword)
  console.log('CEO login:     ', clientEmail, '/', clientPassword)
  console.log('Manager login: ', managerEmail, '/ Manager123!')
  console.log('─────────────────────────────────────')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
