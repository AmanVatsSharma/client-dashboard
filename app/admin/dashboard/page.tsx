import { prisma } from '@/lib/db'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Building2,
  Ticket,
  Receipt,
  Upload,
  TrendingUp,
  AlertCircle,
  CheckCircle2,
  Bell,
} from 'lucide-react'
import Link from 'next/link'

export default async function AdminDashboardPage() {
  const [
    totalCompanies,
    openTickets,
    pendingProofs,
    pendingInvoices,
    overdueInvoices,
    recentTickets,
    recentCompanies,
  ] = await Promise.all([
    prisma.company.count({ where: { isActive: true } }),
    prisma.ticket.count({ where: { status: { in: ['OPEN', 'IN_PROGRESS'] } } }),
    prisma.paymentProof.count({ where: { status: 'PENDING' } }),
    prisma.invoice.count({ where: { status: 'PENDING' } }),
    prisma.invoice.count({ where: { status: 'OVERDUE' } }),
    prisma.ticket.findMany({
      where: { status: { in: ['OPEN', 'IN_PROGRESS'] } },
      include: { company: { select: { name: true } }, openedBy: { select: { name: true } } },
      orderBy: { createdAt: 'desc' },
      take: 5,
    }),
    prisma.company.findMany({
      where: { isActive: true },
      include: { _count: { select: { users: true, tickets: true, invoices: true } } },
      orderBy: { createdAt: 'desc' },
      take: 5,
    }),
  ])

  const stats = [
    {
      title: 'Active Companies',
      value: totalCompanies,
      icon: Building2,
      color: 'text-indigo-600',
      bg: 'bg-indigo-50',
      href: '/admin/companies',
    },
    {
      title: 'Open Tickets',
      value: openTickets,
      icon: Ticket,
      color: 'text-amber-600',
      bg: 'bg-amber-50',
      href: '/admin/tickets',
      alert: openTickets > 0,
    },
    {
      title: 'Pending Proofs',
      value: pendingProofs,
      icon: Upload,
      color: 'text-purple-600',
      bg: 'bg-purple-50',
      href: '/admin/invoices',
      alert: pendingProofs > 0,
    },
    {
      title: 'Pending Invoices',
      value: pendingInvoices + overdueInvoices,
      icon: Receipt,
      color: 'text-rose-600',
      bg: 'bg-rose-50',
      href: '/admin/invoices',
      alert: overdueInvoices > 0,
      sub: overdueInvoices > 0 ? `${overdueInvoices} overdue` : undefined,
    },
  ]

  const ticketStatusColors: Record<string, string> = {
    OPEN: 'bg-yellow-100 text-yellow-700',
    IN_PROGRESS: 'bg-blue-100 text-blue-700',
    RESOLVED: 'bg-green-100 text-green-700',
    CLOSED: 'bg-gray-100 text-gray-700',
  }

  const priorityColors: Record<string, string> = {
    URGENT: 'bg-red-100 text-red-700',
    HIGH: 'bg-orange-100 text-orange-700',
    MEDIUM: 'bg-yellow-100 text-yellow-700',
    LOW: 'bg-slate-100 text-slate-600',
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Dashboard</h1>
        <p className="text-sm text-slate-500 mt-1">Overview of all client activity</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <Link key={stat.title} href={stat.href}>
            <Card className="hover:shadow-md transition-shadow cursor-pointer group">
              <CardContent className="p-5">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">
                      {stat.title}
                    </p>
                    <p className="text-3xl font-bold text-slate-900 mt-1">{stat.value}</p>
                    {stat.sub && (
                      <p className="text-xs text-rose-600 font-medium mt-1 flex items-center gap-1">
                        <AlertCircle className="h-3 w-3" />
                        {stat.sub}
                      </p>
                    )}
                  </div>
                  <div className={`p-2.5 rounded-lg ${stat.bg}`}>
                    <stat.icon className={`h-5 w-5 ${stat.color}`} />
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Open Tickets */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                <Ticket className="h-4 w-4 text-amber-500" />
                Open Tickets
              </CardTitle>
              <Link href="/admin/tickets" className="text-xs text-indigo-600 hover:underline">
                View all
              </Link>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {recentTickets.length === 0 ? (
              <div className="flex flex-col items-center py-6 text-slate-400">
                <CheckCircle2 className="h-8 w-8 mb-2" />
                <p className="text-sm">All caught up!</p>
              </div>
            ) : (
              recentTickets.map((ticket) => (
                <Link key={ticket.id} href={`/admin/tickets/${ticket.id}`}>
                  <div className="flex items-start gap-3 p-3 rounded-lg hover:bg-slate-50 transition-colors cursor-pointer">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-slate-800 truncate">{ticket.title}</p>
                      <p className="text-xs text-slate-500 mt-0.5">
                        {ticket.company.name}
                        {ticket.openedBy && ` · ${ticket.openedBy.name}`}
                      </p>
                    </div>
                    <div className="flex flex-col items-end gap-1 shrink-0">
                      <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${ticketStatusColors[ticket.status]}`}>
                        {ticket.status.replace('_', ' ')}
                      </span>
                      <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${priorityColors[ticket.priority]}`}>
                        {ticket.priority}
                      </span>
                    </div>
                  </div>
                </Link>
              ))
            )}
          </CardContent>
        </Card>

        {/* Recent Companies */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                <Building2 className="h-4 w-4 text-indigo-500" />
                Recent Companies
              </CardTitle>
              <Link href="/admin/companies" className="text-xs text-indigo-600 hover:underline">
                View all
              </Link>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {recentCompanies.length === 0 ? (
              <div className="flex flex-col items-center py-6 text-slate-400">
                <Building2 className="h-8 w-8 mb-2" />
                <p className="text-sm">No companies yet</p>
              </div>
            ) : (
              recentCompanies.map((company) => (
                <Link key={company.id} href={`/admin/companies/${company.id}`}>
                  <div className="flex items-center gap-3 p-3 rounded-lg hover:bg-slate-50 transition-colors cursor-pointer">
                    <div className="h-9 w-9 rounded-lg bg-indigo-100 flex items-center justify-center shrink-0">
                      <Building2 className="h-4 w-4 text-indigo-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-slate-800 truncate">{company.name}</p>
                      <p className="text-xs text-slate-500">
                        {company._count.users} user{company._count.users !== 1 ? 's' : ''} · {company._count.tickets} ticket{company._count.tickets !== 1 ? 's' : ''}
                      </p>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      {company._count.invoices > 0 && (
                        <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                          <Receipt className="h-2.5 w-2.5 mr-1" />
                          {company._count.invoices}
                        </Badge>
                      )}
                    </div>
                  </div>
                </Link>
              ))
            )}
          </CardContent>
        </Card>
      </div>

      {/* Quick actions */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold text-slate-700 flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-indigo-500" />
            Quick Actions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { label: 'Add Company', href: '/admin/companies', icon: Building2, color: 'bg-indigo-50 text-indigo-700 hover:bg-indigo-100' },
              { label: 'Review Proofs', href: '/admin/invoices', icon: Upload, color: 'bg-purple-50 text-purple-700 hover:bg-purple-100' },
              { label: 'Open Tickets', href: '/admin/tickets', icon: Ticket, color: 'bg-amber-50 text-amber-700 hover:bg-amber-100' },
              { label: 'Send Update', href: '/admin/updates', icon: Bell, color: 'bg-blue-50 text-blue-700 hover:bg-blue-100' },
            ].map((action) => (
              <Link key={action.label} href={action.href}>
                <div className={`flex flex-col items-center gap-2 p-4 rounded-lg cursor-pointer transition-colors ${action.color}`}>
                  <action.icon className="h-5 w-5" />
                  <span className="text-xs font-medium text-center">{action.label}</span>
                </div>
              </Link>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

