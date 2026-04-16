'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { StickyNote, Loader2, Calendar } from 'lucide-react'

interface Note {
  id: string; title: string; content: string; createdAt: string; updatedAt: string
  author: { name?: string }
}

export default function NotesPage() {
  const [notes, setNotes] = useState<Note[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/notes').then(r => r.json()).then(setNotes).finally(() => setLoading(false))
  }, [])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Shared Notes</h1>
        <p className="text-sm text-slate-500 mt-1">
          Important decisions and notes shared with you by the support team
        </p>
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-primary-600" /></div>
      ) : notes.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center py-12 text-slate-400">
            <StickyNote className="h-12 w-12 mb-3" />
            <p className="text-sm">No shared notes yet</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {notes.map(note => (
            <Card key={note.id} className="transition-shadow">
              <CardContent className="p-5">
                <div className="flex items-start justify-between gap-2 mb-3">
                  <h3 className="font-semibold text-slate-800">{note.title}</h3>
                  <Badge variant="outline" className="text-[10px] shrink-0">Shared</Badge>
                </div>
                <p className="text-sm text-slate-600 leading-relaxed whitespace-pre-wrap">{note.content}</p>
                <div className="flex items-center gap-3 mt-4 pt-3 border-t border-slate-100 text-xs text-slate-400">
                  <span className="flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    {new Date(note.updatedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </span>
                  <span>By {note.author.name || 'Support Team'}</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
