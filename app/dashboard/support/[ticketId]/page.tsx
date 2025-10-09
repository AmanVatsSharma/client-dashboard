'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { useParams, useRouter } from 'next/navigation'

import {
  ArrowLeft,
  Send,
  User,
  UserCheck,
  Clock,
  CheckCircle,
  AlertTriangle
} from 'lucide-react'
import { formatDate } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'

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

export default function TicketDetailPage() {
  const params = useParams()
  const router = useRouter()
  const [newMessage, setNewMessage] = useState('')
  const [messages, setMessages] = useState([
    {
      id: '1',
      message: 'The website takes too long to load on mobile devices, especially on the homepage. Users are experiencing delays of 5-10 seconds.',
      isAdmin: false,
      sender: 'You',
      createdAt: new Date('2025-09-25T10:00:00')
    },
    {
      id: '2',
      message: 'Thank you for reporting this issue. We have received your ticket and our technical team is investigating the loading speed problems. We will update you within 24 hours with our findings.',
      isAdmin: true,
      sender: 'Support Team',
      createdAt: new Date('2025-09-25T11:30:00')
    },
    {
      id: '3',
      message: 'We have identified that some images on your homepage are not optimized. We are currently compressing them and implementing lazy loading. The fixes should be deployed within 48 hours.',
      isAdmin: true,
      sender: 'Technical Team',
      createdAt: new Date('2025-09-26T09:15:00')
    },
    {
      id: '4',
      message: 'Thanks for the quick response! Is there anything I can do from my end to help with the optimization?',
      isAdmin: false,
      sender: 'You',
      createdAt: new Date('2025-09-26T14:20:00')
    }
  ])

  // Mock data - replace with real API call based on params.ticketId
  const ticket = {
    id: params.ticketId,
    title: 'Website loading speed issue',
    description: 'The website takes too long to load on mobile devices, especially on the homepage. Users are experiencing delays of 5-10 seconds.',
    status: 'in-progress',
    priority: 'high',
    createdAt: new Date('2025-09-25'),
    updatedAt: new Date('2025-09-26'),
    service: 'Web Development Package',
    assignedTo: 'Technical Support Team'
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'open':
        return <AlertTriangle className="h-5 w-5 text-red-600" />
      case 'in-progress':
        return <Clock className="h-5 w-5 text-blue-600" />
      case 'resolved':
        return <CheckCircle className="h-5 w-5 text-green-600" />
      case 'closed':
        return <CheckCircle className="h-5 w-5 text-gray-600" />
      default:
        return <Clock className="h-5 w-5 text-gray-600" />
    }
  }

  const getStatusBadge = (status: string) => {
    const variants = {
      open: 'destructive',
      'in-progress': 'default',
      resolved: 'secondary',
      closed: 'outline'
    }
    return variants[status as keyof typeof variants] || 'secondary'
  }

  const getPriorityBadge = (priority: string) => {
    const variants = {
      urgent: 'destructive',
      high: 'destructive',
      medium: 'default',
      low: 'secondary'
    }
    return variants[priority as keyof typeof variants] || 'secondary'
  }

  const handleSendMessage = async () => {
    if (!newMessage.trim()) return
    // In real implementation, send to API
    console.log('Sending message:', newMessage)
    setMessages([
      ...messages,
      {
        id: (messages.length + 1).toString(),
        message: newMessage,
        isAdmin: false,
        sender: 'You',
        createdAt: new Date()
      }
    ])
    setNewMessage('')
  }

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-8"
    >
      {/* Header */}
      <motion.div variants={itemVariants} className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.back()}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Tickets
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-primary-700">{ticket.title}</h1>
            <p className="text-muted-foreground">Ticket #{ticket.id}</p>
          </div>
        </div>
      </motion.div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Ticket Details */}
        <motion.div variants={itemVariants} className="lg:col-span-2 space-y-6">
          {/* Ticket Info */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center space-x-3">
                  {getStatusIcon(ticket.status)}
                  <span>{ticket.title}</span>
                </CardTitle>
                <div className="flex space-x-2">
                  <Badge variant={getStatusBadge(ticket.status) as any}>
                    {ticket.status.replace('-', ' ')}
                  </Badge>
                  <Badge variant={getPriorityBadge(ticket.priority) as any}>
                    {ticket.priority} priority
                  </Badge>
                </div>
              </div>
              <CardDescription>
                Created on {formatDate(ticket.createdAt)} • Last updated {formatDate(ticket.updatedAt)}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <h4 className="font-medium mb-2">Description</h4>
                  <p className="text-muted-foreground">{ticket.description}</p>
                </div>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-medium">Service:</span>
                    <p className="text-muted-foreground">{ticket.service}</p>
                  </div>
                  <div>
                    <span className="font-medium">Assigned to:</span>
                    <p className="text-muted-foreground">{ticket.assignedTo}</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Messages */}
          <Card>
            <CardHeader>
              <CardTitle>Conversation</CardTitle>
              <CardDescription>
                All messages related to this ticket
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {messages.map((message, index) => (
                  <motion.div
                    key={message.id}
                    initial={{ opacity: 0, x: message.isAdmin ? 20 : -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className={`flex space-x-3 ${message.isAdmin ? 'flex-row-reverse space-x-reverse' : ''}`}
                  >
                    <Avatar className="h-8 w-8">
                      <AvatarFallback className={message.isAdmin ? 'bg-blue-100 text-blue-600' : 'gold-gradient text-primary-900'}>
                        {message.isAdmin ? <UserCheck className="h-4 w-4" /> : <User className="h-4 w-4" />}
                      </AvatarFallback>
                    </Avatar>
                    <div className={`flex-1 ${message.isAdmin ? 'text-right' : ''}`}>
                      <div className="flex items-center space-x-2 mb-1">
                        {message.isAdmin ? (
                          <>
                            <span className="text-xs text-muted-foreground">
                              {formatDate(message.createdAt)} at {message.createdAt.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                            </span>
                            <span className="text-sm font-medium text-blue-600">{message.sender}</span>
                          </>
                        ) : (
                          <>
                            <span className="text-sm font-medium">{message.sender}</span>
                            <span className="text-xs text-muted-foreground">
                              {formatDate(message.createdAt)} at {message.createdAt.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </>
                        )}
                      </div>
                      <div className={`p-3 rounded-lg max-w-md ${
                        message.isAdmin 
                          ? 'bg-blue-50 border border-blue-200 ml-auto' 
                          : 'bg-muted'
                      }`}>
                        <p className="text-sm">{message.message}</p>
                      </div>
                    </div>
                  </motion.div>
                ))}
                {/* Message input area */}
                <div className="flex items-end space-x-2 mt-6">
                  <Textarea
                    placeholder="Type your message..."
                    value={newMessage}
                    onChange={e => setNewMessage(e.target.value)}
                    rows={2}
                    className="flex-1 resize-none"
                  />
                  <Button
                    variant="default"
                    size="icon"
                    onClick={handleSendMessage}
                    disabled={!newMessage.trim()}
                    aria-label="Send message"
                  >
                    <Send className="h-5 w-5" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
        {/* Sidebar */}
        <motion.div variants={itemVariants} className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Status</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center space-x-2">
                {getStatusIcon(ticket.status)}
                <span className="capitalize">{ticket.status.replace('-', ' ')}</span>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Priority</CardTitle>
            </CardHeader>
            <CardContent>
              <Badge variant={getPriorityBadge(ticket.priority) as any}>
                {ticket.priority}
              </Badge>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Service</CardTitle>
            </CardHeader>
            <CardContent>
              <span>{ticket.service}</span>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Assigned To</CardTitle>
            </CardHeader>
            <CardContent>
              <span>{ticket.assignedTo}</span>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </motion.div>
  )
}