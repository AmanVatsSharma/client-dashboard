/**
 * @file page.tsx
 * @module client-dashboard/dashboard
 * @description Home dashboard with stats and lists from services, invoices, and tickets APIs.
 * @author BharatERP
 * @created 2026-04-09
 */

'use client'

import { useSession } from 'next-auth/react'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import type { InvoiceStatus, ServiceStatus, TicketStatus } from '@prisma/client'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import {
  Package,
  Receipt,
  HelpCircle,
  TrendingUp,
  Calendar,
  AlertCircle,
  CheckCircle,
  Loader2
} from 'lucide-react'
import { formatCurrency, getRelativeTime } from '@/lib/utils'
import { serviceStatusToUi, serviceTypeToUi } from '@/lib/service-display'
import { invoiceStatusToUi } from '@/lib/invoice-display'
import Link from 'next/link'

type ServiceRow = {
  id: string
  name: string
  status: ServiceStatus
  type: string
  price: number
  nextBilling: string | null
}

type InvoiceRow = {
  id: string
  amount: number
  status: InvoiceStatus
  dueDate: string
  service: { name: string } | null
  description: string | null
  paidAt: string | null
  createdAt: string
}

type TicketRow = {
  id: string
  status: TicketStatus
  title: string
  updatedAt: string
}

type ActivityRow = {
  id: string
  action: string
  details: string | null
  createdAt: string
}

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1
    }
  }
}

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 }
}

export default function DashboardPage() {
  const { data: session } = useSession()
  const [services, setServices] = useState<ServiceRow[]>([])
  const [invoices, setInvoices] = useState<InvoiceRow[]>([])
  const [tickets, setTickets] = useState<TicketRow[]>([])
  const [activityLog, setActivityLog] = useState<ActivityRow[]>([])
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const [sRes, iRes, tRes, aRes] = await Promise.all([
        fetch('/api/services'),
        fetch('/api/invoices'),
        fetch('/api/tickets'),
        fetch('/api/activity?take=8')
      ])
      if (sRes.ok) {
        const s = await sRes.json()
        setServices(
          (s as { id: string; name: string; status: ServiceStatus; type: string; price: number; nextBilling: string | null }[]).map(
            (x) => ({
              id: x.id,
              name: x.name,
              status: x.status,
              type: x.type,
              price: x.price,
              nextBilling: x.nextBilling
            })
          )
        )
      }
      if (iRes.ok) {
        setInvoices(await iRes.json())
      }
      if (tRes.ok) {
        setTickets(await tRes.json())
      }
      if (aRes.ok) {
        const payload = (await aRes.json()) as { items: ActivityRow[] }
        setActivityLog(payload.items ?? [])
      }
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  const activeServicesCount = useMemo(
    () => services.filter((s) => serviceStatusToUi(s.status) === 'active').length,
    [services]
  )

  const totalSpent = useMemo(
    () => invoices.filter((i) => i.status === 'PAID').reduce((sum, i) => sum + i.amount, 0),
    [invoices]
  )

  const openTicketsCount = useMemo(
    () => tickets.filter((t) => t.status === 'OPEN' || t.status === 'IN_PROGRESS').length,
    [tickets]
  )

  const urgentTickets = useMemo(
    () => tickets.filter((t) => t.status === 'OPEN' || t.status === 'IN_PROGRESS').length,
    [tickets]
  )

  const now = new Date()
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
  const paidThisMonth = useMemo(
    () =>
      invoices
        .filter((i) => i.paidAt && new Date(i.paidAt) >= startOfMonth)
        .reduce((s, i) => s + i.amount, 0),
    [invoices, startOfMonth]
  )

  const stats = [
    {
      title: 'Active Services',
      value: String(activeServicesCount),
      change: `${services.length} total`,
      icon: Package,
      color: 'text-indigo-600',
      bgColor: 'bg-indigo-50'
    },
    {
      title: 'Total Spent',
      value: formatCurrency(totalSpent),
      change: 'All paid invoices',
      icon: Receipt,
      color: 'text-green-600',
      bgColor: 'bg-green-50'
    },
    {
      title: 'Open Tickets',
      value: String(openTicketsCount),
      change: urgentTickets ? `${urgentTickets} need attention` : 'All clear',
      icon: HelpCircle,
      color: 'text-amber-600',
      bgColor: 'bg-amber-50'
    },
    {
      title: 'Paid This Month',
      value: formatCurrency(paidThisMonth),
      change: 'Recorded payments',
      icon: TrendingUp,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50'
    }
  ]

  const recentServices = useMemo(() => services.slice(0, 3), [services])

  const upcomingPayments = useMemo(() => {
    return invoices
      .filter((i) => {
        const u = invoiceStatusToUi(i.status)
        return u === 'pending' || u === 'overdue'
      })
      .map((i) => ({
        service: i.service?.name ?? i.description ?? 'Invoice',
        amount: i.amount,
        dueDate: i.dueDate
      }))
      .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())
      .slice(0, 5)
  }, [invoices])

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-8"
    >
      <motion.div variants={itemVariants}>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Welcome back, {session?.user?.name}!</h1>
            <p className="text-muted-foreground mt-1">Here&apos;s what&apos;s happening with your services today.</p>
          </div>
          <Avatar className="h-16 w-16">
            <AvatarFallback className="bg-indigo-600 text-white text-xl font-bold">
              {session?.user?.name?.charAt(0) || 'U'}
            </AvatarFallback>
          </Avatar>
        </div>
      </motion.div>

      {loading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="h-10 w-10 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <>
          <motion.div variants={itemVariants} className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {stats.map((stat) => (
              <motion.div
                key={stat.title}
                whileHover={{ scale: 1.02 }}
                transition={{ type: 'spring', stiffness: 300, damping: 20 }}
              >
                <Card className="hover:shadow-lg transition-shadow duration-300">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
                    <div className={`p-2 rounded-lg ${stat.bgColor}`}>
                      <stat.icon className={`h-4 w-4 ${stat.color}`} />
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{stat.value}</div>
                    <p className="text-xs text-muted-foreground">{stat.change}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </motion.div>

          <div className="grid gap-6 lg:grid-cols-3">
            <motion.div variants={itemVariants} className="lg:col-span-2">
              <Card>
                <CardHeader>
                  <CardTitle>Recent Services</CardTitle>
                  <CardDescription>Your latest service activities</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {recentServices.length === 0 ? (
                      <p className="text-sm text-muted-foreground">No services yet.</p>
                    ) : (
                      recentServices.map((service) => {
                        const uiStatus = serviceStatusToUi(service.status)
                        const uiType = serviceTypeToUi(service.type as 'ONE_TIME' | 'SUBSCRIPTION')
                        return (
                          <div
                            key={service.id}
                            className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                          >
                            <div className="flex items-center space-x-4">
                              <div
                                className={`p-2 rounded-lg ${uiStatus === 'active' ? 'bg-green-50' : 'bg-indigo-50'}`}
                              >
                                <Package
                                  className={`h-4 w-4 ${uiStatus === 'active' ? 'text-green-600' : 'text-indigo-600'}`}
                                />
                              </div>
                              <div>
                                <p className="font-medium">{service.name}</p>
                                <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                                  <Badge variant={uiStatus === 'active' ? 'default' : 'secondary'}>{uiStatus}</Badge>
                                  <span>•</span>
                                  <span>{uiType}</span>
                                  {service.nextBilling && (
                                    <>
                                      <span>•</span>
                                      <span>Next: {new Date(service.nextBilling).toLocaleDateString()}</span>
                                    </>
                                  )}
                                </div>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="font-medium">{formatCurrency(service.price)}</p>
                              <Button size="sm" variant="ghost" asChild>
                                <Link href="/dashboard/services">View</Link>
                              </Button>
                            </div>
                          </div>
                        )
                      })
                    )}
                  </div>
                  <div className="mt-6">
                    <Button asChild className="w-full">
                      <Link href="/dashboard/services">View All Services</Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div variants={itemVariants}>
              <Card>
                <CardHeader>
                  <CardTitle>Upcoming Payments</CardTitle>
                  <CardDescription>Next open invoices by due date</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {upcomingPayments.length === 0 ? (
                      <p className="text-sm text-muted-foreground">No upcoming payments.</p>
                    ) : (
                      upcomingPayments.map((payment, index) => (
                        <div
                          key={`${payment.service}-${index}`}
                          className="flex items-center justify-between p-3 border rounded-lg"
                        >
                          <div>
                            <p className="font-medium text-sm">{payment.service}</p>
                            <p className="text-xs text-muted-foreground">
                              Due: {new Date(payment.dueDate).toLocaleDateString()}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="font-medium text-sm">{formatCurrency(payment.amount)}</p>
                            <Badge variant="outline" className="text-xs">
                              <Calendar className="mr-1 h-3 w-3" />
                              {Math.max(
                                0,
                                Math.ceil(
                                  (new Date(payment.dueDate).getTime() - new Date().getTime()) /
                                    (1000 * 60 * 60 * 24)
                                )
                              )}{' '}
                              days
                            </Badge>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                  <Button asChild size="sm" className="w-full mt-4" variant="outline">
                    <Link href="/dashboard/invoices">Manage Payments</Link>
                  </Button>
                </CardContent>
              </Card>

              <Card className="mt-6">
                <CardHeader>
                  <CardTitle>Recent Activity</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {activityLog.length === 0 ? (
                      <p className="text-sm text-muted-foreground">No recent activity.</p>
                    ) : (
                      activityLog.map((activity) => (
                        <div key={activity.id} className="flex space-x-3">
                          <div className="flex-shrink-0">
                            {activity.action.includes('Invoice') || activity.action.includes('Payment') ? (
                              <div className="p-1 bg-green-50 rounded-full">
                                <CheckCircle className="h-3 w-3 text-green-600" />
                              </div>
                            ) : activity.action.includes('Ticket') ? (
                              <div className="p-1 bg-indigo-50 rounded-full">
                                <HelpCircle className="h-3 w-3 text-indigo-600" />
                              </div>
                            ) : (
                              <div className="p-1 bg-muted rounded-full">
                                <Receipt className="h-3 w-3 text-muted-foreground" />
                              </div>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium">{activity.action}</p>
                            {activity.details ? (
                              <p className="text-xs text-muted-foreground">{activity.details}</p>
                            ) : null}
                            <p className="text-xs text-muted-foreground mt-1">
                              {getRelativeTime(activity.createdAt)}
                            </p>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </div>

          <motion.div variants={itemVariants}>
            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
                <CardDescription>Common tasks and shortcuts</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {[
                    { label: 'Create Ticket', href: '/dashboard/support', icon: HelpCircle, color: 'bg-amber-50 text-amber-700 hover:bg-amber-100' },
                    { label: 'View Invoices', href: '/dashboard/invoices', icon: Receipt, color: 'bg-indigo-50 text-indigo-700 hover:bg-indigo-100' },
                    { label: 'Manage Services', href: '/dashboard/services', icon: Package, color: 'bg-purple-50 text-purple-700 hover:bg-purple-100' },
                    { label: 'Update Profile', href: '/dashboard/profile', icon: AlertCircle, color: 'bg-slate-100 text-slate-700 hover:bg-slate-200' },
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
          </motion.div>
        </>
      )}
    </motion.div>
  )
}
