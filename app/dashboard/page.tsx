'use client'

import { useSession } from 'next-auth/react'
import { motion } from 'framer-motion'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import {
  Package,
  Receipt,
  HelpCircle,
  TrendingUp,
  Calendar,
  AlertCircle,
  CheckCircle,
  Clock
} from 'lucide-react'
import { formatCurrency } from '@/lib/utils'
import Link from 'next/link'

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

  // Mock data - replace with real API calls
  const stats = [
    {
      title: 'Active Services',
      value: '5',
      change: '+2 from last month',
      icon: Package,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100'
    },
    {
      title: 'Total Spent',
      value: formatCurrency(45000),
      change: '+15% from last month',
      icon: Receipt,
      color: 'text-green-600',
      bgColor: 'bg-green-100'
    },
    {
      title: 'Open Tickets',
      value: '2',
      change: '1 urgent',
      icon: HelpCircle,
      color: 'text-orange-600',
      bgColor: 'bg-orange-100'
    },
    {
      title: 'Saved This Month',
      value: formatCurrency(8500),
      change: '+22% efficiency',
      icon: TrendingUp,
      color: 'text-purple-600',
      bgColor: 'bg-purple-100'
    }
  ]

  const recentServices = [
    {
      id: '1',
      name: 'Web Development Package',
      status: 'active',
      type: 'subscription',
      nextBilling: '2025-10-15',
      amount: 15000
    },
    {
      id: '2',
      name: 'SEO Optimization',
      status: 'active',
      type: 'subscription',
      nextBilling: '2025-10-20',
      amount: 8000
    },
    {
      id: '3',
      name: 'Logo Design',
      status: 'completed',
      type: 'one-time',
      nextBilling: null,
      amount: 12000
    }
  ]

  const upcomingPayments = [
    { service: 'Web Development', amount: 15000, dueDate: '2025-10-15' },
    { service: 'SEO Optimization', amount: 8000, dueDate: '2025-10-20' },
    { service: 'Cloud Hosting', amount: 3500, dueDate: '2025-10-25' }
  ]

  const recentActivity = [
    { action: 'Payment processed', details: 'Web Development Package - ₹15,000', time: '2 hours ago' },
    { action: 'Ticket resolved', details: 'Technical support query #1234', time: '1 day ago' },
    { action: 'Service activated', details: 'SEO Optimization Package', time: '3 days ago' }
  ]

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-8"
    >
      {/* Welcome Section */}
      <motion.div variants={itemVariants}>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-primary-700">
              Welcome back, {session?.user?.name}!
            </h1>
            <p className="text-muted-foreground mt-1">
              Here's what's happening with your services today.
            </p>
          </div>
          <Avatar className="h-16 w-16">
            <AvatarFallback className="gold-gradient text-primary-900 text-xl font-bold">
              {session?.user?.name?.charAt(0) || 'U'}
            </AvatarFallback>
          </Avatar>
        </div>
      </motion.div>

      {/* Stats Grid */}
      <motion.div variants={itemVariants} className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat, index) => (
          <motion.div
            key={stat.title}
            whileHover={{ scale: 1.02 }}
            transition={{ type: "spring", stiffness: 300, damping: 20 }}
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
        {/* Recent Services */}
        <motion.div variants={itemVariants} className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Recent Services</CardTitle>
              <CardDescription>Your latest service activities</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentServices.map((service) => (
                  <motion.div
                    key={service.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-center space-x-4">
                      <div className={`p-2 rounded-lg ${service.status === 'active' ? 'bg-green-100' : 'bg-blue-100'}`}>
                        <Package className={`h-4 w-4 ${service.status === 'active' ? 'text-green-600' : 'text-blue-600'}`} />
                      </div>
                      <div>
                        <p className="font-medium">{service.name}</p>
                        <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                          <Badge variant={service.status === 'active' ? 'default' : 'secondary'}>
                            {service.status}
                          </Badge>
                          <span>•</span>
                          <span>{service.type}</span>
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
                      <p className="font-medium">{formatCurrency(service.amount)}</p>
                      <Button size="sm" variant="ghost">View Details</Button>
                    </div>
                  </motion.div>
                ))}
              </div>
              <div className="mt-6">
                <Button asChild className="w-full">
                  <Link href="/dashboard/services">View All Services</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Upcoming Payments */}
        <motion.div variants={itemVariants}>
          <Card>
            <CardHeader>
              <CardTitle>Upcoming Payments</CardTitle>
              <CardDescription>Due in the next 30 days</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {upcomingPayments.map((payment, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: index * 0.1 }}
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
                        {Math.ceil((new Date(payment.dueDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))} days
                      </Badge>
                    </div>
                  </motion.div>
                ))}
              </div>
              <Button asChild size="sm" className="w-full mt-4" variant="outline">
                <Link href="/dashboard/invoices">Manage Payments</Link>
              </Button>
            </CardContent>
          </Card>

          {/* Recent Activity */}
          <Card className="mt-6">
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentActivity.map((activity, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="flex space-x-3"
                  >
                    <div className="flex-shrink-0">
                      {activity.action.includes('Payment') && (
                        <div className="p-1 bg-green-100 rounded-full">
                          <CheckCircle className="h-3 w-3 text-green-600" />
                        </div>
                      )}
                      {activity.action.includes('Ticket') && (
                        <div className="p-1 bg-blue-100 rounded-full">
                          <HelpCircle className="h-3 w-3 text-blue-600" />
                        </div>
                      )}
                      {activity.action.includes('Service') && (
                        <div className="p-1 bg-purple-100 rounded-full">
                          <Package className="h-3 w-3 text-purple-600" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium">{activity.action}</p>
                      <p className="text-xs text-muted-foreground">{activity.details}</p>
                      <p className="text-xs text-muted-foreground mt-1">{activity.time}</p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Quick Actions */}
      <motion.div variants={itemVariants}>
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Common tasks and shortcuts</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-4">
              <Button asChild variant="outline" className="h-20 flex-col space-y-2">
                <Link href="/dashboard/support">
                  <HelpCircle className="h-6 w-6" />
                  <span>Create Ticket</span>
                </Link>
              </Button>
              <Button asChild variant="outline" className="h-20 flex-col space-y-2">
                <Link href="/dashboard/invoices">
                  <Receipt className="h-6 w-6" />
                  <span>View Invoices</span>
                </Link>
              </Button>
              <Button asChild variant="outline" className="h-20 flex-col space-y-2">
                <Link href="/dashboard/services">
                  <Package className="h-6 w-6" />
                  <span>Manage Services</span>
                </Link>
              </Button>
              <Button asChild variant="outline" className="h-20 flex-col space-y-2">
                <Link href="/dashboard/profile">
                  <AlertCircle className="h-6 w-6" />
                  <span>Update Profile</span>
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  )
}
