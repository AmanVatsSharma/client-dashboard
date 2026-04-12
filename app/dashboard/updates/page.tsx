'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Bell, Globe, Building2, CheckCircle2, Loader2 } from 'lucide-react'

interface Update {
  id: string; title: string; content: string; authorName?: string
  companyId?: string; createdAt: string; isRead: boolean; readAt?: string
}

export default function UpdatesPage() {
  const [updates, setUpdates] = useState<Update[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/updates').then(r => r.json()).then(setUpdates).finally(() => setLoading(false))
  }, [])

  async function markRead(id: string) {
    await fetch(`/api/updates/${id}/read`, { method: 'POST' })
    setUpdates(prev => prev.map(u => u.id === id ? { ...u, isRead: true, readAt: new Date().toISOString() } : u))
  }

  const unread = updates.filter(u => !u.isRead)
  const read = updates.filter(u => u.isRead)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Updates & Announcements</h1>
        <p className="text-sm text-slate-500 mt-1">
          Updates from the support team — {unread.length} unread
        </p>
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-primary-600" /></div>
      ) : updates.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center py-12 text-slate-400">
            <Bell className="h-12 w-12 mb-3" />
            <p className="text-sm">No updates yet</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {updates.map(update => (
            <Card
              key={update.id}
              className={`cursor-pointer transition-all ${!update.isRead ? 'border-primary-300 shadow-sm bg-primary-50/30' : ''}`}
              onClick={() => !update.isRead && markRead(update.id)}
            >
              <CardContent className="p-5">
                <div className="flex items-start gap-4">
                  <div className={`p-2 rounded-lg shrink-0 ${!update.isRead ? 'bg-primary-100' : 'bg-slate-100'}`}>
                    <Bell className={`h-4 w-4 ${!update.isRead ? 'text-primary-600' : 'text-slate-400'}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2 flex-wrap">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className={`font-semibold ${!update.isRead ? 'text-slate-900' : 'text-slate-700'}`}>
                          {update.title}
                        </p>
                        {!update.isRead && (
                          <Badge className="text-[10px] px-1.5 bg-primary-600 text-white">New</Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        {update.companyId ? (
                          <Badge variant="outline" className="text-[10px] flex items-center gap-0.5">
                            <Building2 className="h-2.5 w-2.5" />For your company
                          </Badge>
                        ) : (
                          <Badge className="text-[10px] bg-blue-100 text-blue-700 flex items-center gap-0.5">
                            <Globe className="h-2.5 w-2.5" />General
                          </Badge>
                        )}
                      </div>
                    </div>

                    <p className="text-sm text-slate-600 mt-2 leading-relaxed">{update.content}</p>

                    <div className="flex items-center gap-3 mt-3 text-xs text-slate-400">
                      <span>From {update.authorName || 'Support Team'}</span>
                      <span>{new Date(update.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                      {update.isRead && (
                        <span className="flex items-center gap-0.5 text-green-600">
                          <CheckCircle2 className="h-3 w-3" />Read
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
