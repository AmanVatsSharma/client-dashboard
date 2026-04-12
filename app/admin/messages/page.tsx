'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { MessageSquare, Loader2, Building2 } from 'lucide-react'
import Link from 'next/link'

interface Conversation {
  userId: string
  user: {
    id: string; name?: string; email: string
    companyUsers: { company: { name: string } }[]
  }
  lastMessage: {
    id: string; message: string; fromUserId: string; isRead: boolean; createdAt: string
  }
}

export default function AdminMessagesPage() {
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/admin/messages').then(r => r.json()).then(setConversations).finally(() => setLoading(false))
  }, [])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Direct Messages</h1>
        <p className="text-sm text-slate-500 mt-1">Private conversations with company users</p>
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-indigo-600" /></div>
      ) : conversations.length === 0 ? (
        <Card><CardContent className="flex flex-col items-center py-12 text-slate-400"><MessageSquare className="h-12 w-12 mb-3" /><p className="text-sm">No conversations yet</p><p className="text-xs mt-1">Start a conversation from a company's user list</p></CardContent></Card>
      ) : (
        <div className="space-y-2">
          {conversations.map(conv => (
            <Link key={conv.userId} href={`/admin/messages/${conv.userId}`}>
              <Card className="hover:shadow-sm transition-shadow cursor-pointer">
                <CardContent className="p-4 flex items-center gap-4">
                  <div className="h-10 w-10 rounded-full bg-indigo-100 flex items-center justify-center shrink-0 font-semibold text-indigo-700 text-sm">
                    {conv.user.name?.charAt(0).toUpperCase() || '?'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-slate-800">{conv.user.name || conv.user.email}</p>
                      {!conv.lastMessage.isRead && conv.lastMessage.fromUserId === conv.userId && (
                        <Badge className="text-[10px] px-1.5 bg-indigo-600 text-white">New</Badge>
                      )}
                    </div>
                    {conv.user.companyUsers[0] && (
                      <p className="text-xs text-indigo-600 flex items-center gap-1">
                        <Building2 className="h-3 w-3" />{conv.user.companyUsers[0].company.name}
                      </p>
                    )}
                    <p className="text-xs text-slate-500 truncate mt-0.5">{conv.lastMessage.message}</p>
                  </div>
                  <p className="text-xs text-slate-400 shrink-0">{new Date(conv.lastMessage.createdAt).toLocaleDateString()}</p>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
