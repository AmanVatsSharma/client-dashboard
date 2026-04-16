/**
 * @file page.tsx
 * @module client-dashboard/dashboard/services
 * @description Services grid/list loaded from /api/services with search and status filter.
 * @author BharatERP
 * @created 2026-04-09
 */

'use client'

import { useCallback, useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import type { ServiceStatus, ServiceType } from '@prisma/client'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'
import {
  Package,
  Search,
  Filter,
  Download,
  Calendar,
  CreditCard,
  CheckCircle,
  Clock,
  AlertCircle,
  Loader2
} from 'lucide-react'
import { formatCurrency, formatDate } from '@/lib/utils'
import { serviceStatusToUi, serviceTypeToUi, type UiServiceStatus } from '@/lib/service-display'

type ServiceApi = {
  id: string
  name: string
  description: string | null
  type: ServiceType
  status: ServiceStatus
  price: number
  nextBilling: string | null
  createdAt: string
  _count: { invoices: number; tickets: number }
}

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1 }
  }
}

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 }
}

function getStatusIcon(status: UiServiceStatus) {
  switch (status) {
    case 'active':
      return <CheckCircle className="h-4 w-4 text-green-600" />
    case 'pending':
      return <Clock className="h-4 w-4 text-blue-600" />
    case 'completed':
      return <CheckCircle className="h-4 w-4 text-gray-600" />
    case 'inactive':
      return <AlertCircle className="h-4 w-4 text-amber-600" />
    default:
      return <AlertCircle className="h-4 w-4 text-yellow-600" />
  }
}

function getStatusBadge(status: UiServiceStatus) {
  const variants = {
    active: 'default',
    pending: 'secondary',
    completed: 'outline',
    inactive: 'secondary'
  }
  return variants[status] || 'secondary'
}

export default function ServicesPage() {
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [services, setServices] = useState<ServiceApi[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/services')
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error || 'Failed to load services')
      }
      const data = (await res.json()) as ServiceApi[]
      setServices(data)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  const filteredServices = services.filter((service) => {
    const uiStatus = serviceStatusToUi(service.status)
    const matchesSearch =
      service.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (service.description ?? '').toLowerCase().includes(searchQuery.toLowerCase())
    const matchesStatus = statusFilter === 'all' || uiStatus === statusFilter
    return matchesSearch && matchesStatus
  })

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-8"
    >
      <motion.div variants={itemVariants} className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Services</h1>
          <p className="text-muted-foreground">Manage all your services and subscriptions</p>
        </div>
        <Button type="button">
          <Package className="mr-2 h-4 w-4" />
          Request New Service
        </Button>
      </motion.div>

      {error && (
        <motion.div variants={itemVariants} className="rounded-md border border-destructive/40 bg-destructive/10 px-4 py-2 text-sm text-destructive">
          {error}
        </motion.div>
      )}

      <motion.div variants={itemVariants}>
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search services..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full sm:w-48">
                  <Filter className="mr-2 h-4 w-4" />
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Services</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {loading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="h-10 w-10 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <motion.div variants={itemVariants}>
          <Tabs defaultValue="grid" className="space-y-6">
            <TabsList>
              <TabsTrigger value="grid">Grid View</TabsTrigger>
              <TabsTrigger value="list">List View</TabsTrigger>
            </TabsList>

            <TabsContent value="grid" className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {filteredServices.length === 0 ? (
                <p className="col-span-full text-center text-muted-foreground py-12">No services match your filters.</p>
              ) : (
                filteredServices.map((service, index) => {
                  const uiStatus = serviceStatusToUi(service.status)
                  const uiType = serviceTypeToUi(service.type)
                  const nextBilling = service.nextBilling ? new Date(service.nextBilling) : null
                  return (
                    <motion.div
                      key={service.id}
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: index * 0.05 }}
                      whileHover={{ scale: 1.02 }}
                      className="h-full"
                    >
                      <Card className="h-full hover:shadow-lg transition-all duration-300">
                        <CardHeader>
                          <div className="flex items-start justify-between">
                            <div className="flex items-center space-x-2">
                              {getStatusIcon(uiStatus)}
                              <Badge variant={getStatusBadge(uiStatus) as 'default' | 'secondary' | 'destructive' | 'outline'}>
                                {uiStatus}
                              </Badge>
                            </div>
                            <Badge variant="outline">{uiType === 'subscription' ? 'Subscription' : 'One-time'}</Badge>
                          </div>
                          <CardTitle className="text-lg">{service.name}</CardTitle>
                          <CardDescription>{service.description ?? 'No description'}</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          <div className="flex justify-between items-center">
                            <span className="text-2xl font-bold text-slate-900">{formatCurrency(service.price)}</span>
                            {uiType === 'subscription' && (
                              <span className="text-sm text-muted-foreground">/month</span>
                            )}
                          </div>

                          {nextBilling && (
                            <div className="flex items-center text-sm text-muted-foreground">
                              <Calendar className="mr-2 h-4 w-4" />
                              Next billing: {formatDate(nextBilling)}
                            </div>
                          )}

                          <p className="text-sm text-muted-foreground">
                            {service._count.invoices} invoice{service._count.invoices !== 1 ? 's' : ''} ·{' '}
                            {service._count.tickets} open ticket{service._count.tickets !== 1 ? 's' : ''}
                          </p>

                          <div className="flex gap-2 pt-4">
                            <Button size="sm" className="flex-1" type="button" variant="secondary">
                              <Download className="mr-2 h-4 w-4" />
                              View Invoice
                            </Button>
                            <Button size="sm" variant="outline" className="flex-1" type="button">
                              <CreditCard className="mr-2 h-4 w-4" />
                              Pay Now
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  )
                })
              )}
            </TabsContent>

            <TabsContent value="list">
              <Card>
                <CardContent className="pt-6">
                  <div className="space-y-4">
                    {filteredServices.length === 0 ? (
                      <p className="text-center text-muted-foreground py-8">No services match your filters.</p>
                    ) : (
                      filteredServices.map((service, index) => {
                        const uiStatus = serviceStatusToUi(service.status)
                        const uiType = serviceTypeToUi(service.type)
                        const nextBilling = service.nextBilling ? new Date(service.nextBilling) : null
                        return (
                          <motion.div
                            key={service.id}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: index * 0.03 }}
                            className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                          >
                            <div className="flex items-center space-x-4">
                              <div className="flex items-center space-x-2">
                                {getStatusIcon(uiStatus)}
                                <Badge variant={getStatusBadge(uiStatus) as 'default' | 'secondary' | 'destructive' | 'outline'} className="text-xs">
                                  {uiStatus}
                                </Badge>
                              </div>
                              <div>
                                <h3 className="font-medium">{service.name}</h3>
                                <p className="text-sm text-muted-foreground">{service.description ?? '—'}</p>
                                <div className="flex items-center space-x-4 mt-1">
                                  <Badge variant="outline" className="text-xs">
                                    {uiType}
                                  </Badge>
                                  <span className="text-xs text-muted-foreground">
                                    Started: {formatDate(service.createdAt)}
                                  </span>
                                  <span className="text-xs text-muted-foreground">
                                    {service._count.invoices} invoices
                                  </span>
                                </div>
                              </div>
                            </div>
                            <div className="text-right space-y-2">
                              <p className="font-bold text-lg text-slate-900">
                                {formatCurrency(service.price)}
                                {uiType === 'subscription' && <span className="text-sm">/mo</span>}
                              </p>
                              {nextBilling && (
                                <p className="text-xs text-muted-foreground">Next: {formatDate(nextBilling)}</p>
                              )}
                              <div className="flex space-x-2">
                                <Button size="sm" variant="outline" type="button">
                                  View Details
                                </Button>
                                <Button size="sm" type="button">
                                  Manage
                                </Button>
                              </div>
                            </div>
                          </motion.div>
                        )
                      })
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </motion.div>
      )}
    </motion.div>
  )
}
