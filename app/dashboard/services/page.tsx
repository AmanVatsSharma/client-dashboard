'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
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
  SelectValue,
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
  AlertCircle
} from 'lucide-react'
import { formatCurrency, formatDate } from '@/lib/utils'

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

export default function ServicesPage() {
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')

  // Mock data - replace with real API calls
  const services = [
    {
      id: '1',
      name: 'Premium Web Development Package',
      description: 'Full-stack web application with modern UI/UX design',
      type: 'subscription',
      status: 'active',
      price: 15000,
      nextBilling: new Date('2025-10-15'),
      features: ['Custom Design', 'Responsive Layout', 'SEO Optimized', '24/7 Support'],
      startDate: new Date('2025-01-15'),
      invoices: 8
    },
    {
      id: '2',
      name: 'SEO Optimization Suite',
      description: 'Complete search engine optimization for better rankings',
      type: 'subscription',
      status: 'active',
      price: 8000,
      nextBilling: new Date('2025-10-20'),
      features: ['Keyword Research', 'On-page SEO', 'Link Building', 'Analytics'],
      startDate: new Date('2025-02-01'),
      invoices: 7
    },
    {
      id: '3',
      name: 'Brand Identity Design',
      description: 'Logo, business cards, and complete brand guidelines',
      type: 'one-time',
      status: 'completed',
      price: 12000,
      nextBilling: null,
      features: ['Logo Design', 'Brand Guidelines', 'Business Cards', 'Letterhead'],
      startDate: new Date('2024-12-01'),
      invoices: 1
    },
    {
      id: '4',
      name: 'Cloud Hosting & Maintenance',
      description: 'Reliable cloud hosting with regular maintenance',
      type: 'subscription',
      status: 'active',
      price: 3500,
      nextBilling: new Date('2025-10-25'),
      features: ['99.9% Uptime', 'Daily Backups', 'SSL Certificate', 'CDN'],
      startDate: new Date('2025-03-01'),
      invoices: 6
    },
    {
      id: '5',
      name: 'Mobile App Development',
      description: 'Cross-platform mobile application development',
      type: 'one-time',
      status: 'in-progress',
      price: 45000,
      nextBilling: null,
      features: ['iOS & Android', 'API Integration', 'Push Notifications', 'App Store Submission'],
      startDate: new Date('2025-08-01'),
      invoices: 2
    }
  ]

  const filteredServices = services.filter(service => {
    const matchesSearch = service.name.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesStatus = statusFilter === 'all' || service.status === statusFilter
    return matchesSearch && matchesStatus
  })

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active':
        return <CheckCircle className="h-4 w-4 text-green-600" />
      case 'in-progress':
        return <Clock className="h-4 w-4 text-blue-600" />
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-gray-600" />
      default:
        return <AlertCircle className="h-4 w-4 text-yellow-600" />
    }
  }

  const getStatusBadge = (status: string) => {
    const variants = {
      active: 'default',
      'in-progress': 'secondary',
      completed: 'outline',
      pending: 'destructive'
    }
    return variants[status as keyof typeof variants] || 'secondary'
  }

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-8"
    >
      {/* Header */}
      <motion.div variants={itemVariants} className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-primary-700">Services</h1>
          <p className="text-muted-foreground">Manage all your services and subscriptions</p>
        </div>
        <Button className="gold-gradient text-primary-900">
          <Package className="mr-2 h-4 w-4" />
          Request New Service
        </Button>
      </motion.div>

      {/* Filters */}
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
                  <SelectItem value="in-progress">In Progress</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Services Grid */}
      <motion.div variants={itemVariants}>
        <Tabs defaultValue="grid" className="space-y-6">
          <TabsList>
            <TabsTrigger value="grid">Grid View</TabsTrigger>
            <TabsTrigger value="list">List View</TabsTrigger>
          </TabsList>

          <TabsContent value="grid" className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {filteredServices.map((service, index) => (
              <motion.div
                key={service.id}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.1 }}
                whileHover={{ scale: 1.02 }}
                className="h-full"
              >
                <Card className="h-full hover:shadow-lg transition-all duration-300">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex items-center space-x-2">
                        {getStatusIcon(service.status)}
                        <Badge variant={getStatusBadge(service.status) as any}>
                          {service.status}
                        </Badge>
                      </div>
                      <Badge variant="outline">
                        {service.type === 'subscription' ? 'Subscription' : 'One-time'}
                      </Badge>
                    </div>
                    <CardTitle className="text-lg">{service.name}</CardTitle>
                    <CardDescription>{service.description}</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-2xl font-bold gradient-text">
                        {formatCurrency(service.price)}
                      </span>
                      {service.type === 'subscription' && (
                        <span className="text-sm text-muted-foreground">/month</span>
                      )}
                    </div>

                    {service.nextBilling && (
                      <div className="flex items-center text-sm text-muted-foreground">
                        <Calendar className="mr-2 h-4 w-4" />
                        Next billing: {formatDate(service.nextBilling)}
                      </div>
                    )}

                    <div className="space-y-2">
                      <p className="text-sm font-medium">Features:</p>
                      <ul className="text-sm space-y-1">
                        {service.features.slice(0, 3).map((feature, idx) => (
                          <li key={idx} className="flex items-center">
                            <CheckCircle className="mr-2 h-3 w-3 text-green-600" />
                            {feature}
                          </li>
                        ))}
                        {service.features.length > 3 && (
                          <li className="text-muted-foreground">
                            +{service.features.length - 3} more features
                          </li>
                        )}
                      </ul>
                    </div>

                    <div className="flex gap-2 pt-4">
                      <Button size="sm" className="flex-1">
                        <Download className="mr-2 h-4 w-4" />
                        View Invoice
                      </Button>
                      <Button size="sm" variant="outline" className="flex-1">
                        <CreditCard className="mr-2 h-4 w-4" />
                        Pay Now
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </TabsContent>

          <TabsContent value="list">
            <Card>
              <CardContent className="pt-6">
                <div className="space-y-4">
                  {filteredServices.map((service, index) => (
                    <motion.div
                      key={service.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex items-center space-x-4">
                        <div className="flex items-center space-x-2">
                          {getStatusIcon(service.status)}
                          <Badge variant={getStatusBadge(service.status) as any} className="text-xs">
                            {service.status}
                          </Badge>
                        </div>
                        <div>
                          <h3 className="font-medium">{service.name}</h3>
                          <p className="text-sm text-muted-foreground">{service.description}</p>
                          <div className="flex items-center space-x-4 mt-1">
                            <Badge variant="outline" className="text-xs">
                              {service.type}
                            </Badge>
                            <span className="text-xs text-muted-foreground">
                              Started: {formatDate(service.startDate)}
                            </span>
                            <span className="text-xs text-muted-foreground">
                              {service.invoices} invoices
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="text-right space-y-2">
                        <p className="font-bold text-lg gradient-text">
                          {formatCurrency(service.price)}
                          {service.type === 'subscription' && <span className="text-sm">/mo</span>}
                        </p>
                        {service.nextBilling && (
                          <p className="text-xs text-muted-foreground">
                            Next: {formatDate(service.nextBilling)}
                          </p>
                        )}
                        <div className="flex space-x-2">
                          <Button size="sm" variant="outline">
                            View Details
                          </Button>
                          <Button size="sm">
                            Manage
                          </Button>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </motion.div>
    </motion.div>
  )
}