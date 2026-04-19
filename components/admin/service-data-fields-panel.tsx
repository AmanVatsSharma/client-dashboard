/**
 * File:        components/admin/service-data-fields-panel.tsx
 * Module:      Admin · Services · Data Fields Panel
 * Purpose:     Sheet (slide-in) panel for viewing, adding, editing, and deleting key-value
 *              data fields attached to a specific service belonging to a company.
 *
 * Exports:
 *   - ServiceDataFieldsPanel(props: ServiceDataFieldsPanelProps) — Sheet panel component
 *   - ServiceDataFieldsPanelProps — prop shape for the panel
 *
 * Depends on:
 *   - @/components/ui/sheet    — Sheet, SheetContent, SheetHeader, SheetTitle
 *   - @/components/ui/button   — Button
 *   - @/components/ui/input    — Input
 *   - @/components/ui/label    — Label
 *   - @/components/ui/badge    — Badge
 *   - @/components/ui/textarea — Textarea
 *   - @/components/ui/toaster  — toast
 *
 * Side-effects:
 *   - GET  /api/admin/companies/${companyId}/services/${serviceId}/fields  — on panel open
 *   - POST /api/admin/companies/${companyId}/services/${serviceId}/fields  — add new field
 *   - PATCH /api/admin/services/fields/${fieldId}                          — inline edit field
 *   - DELETE /api/admin/services/fields/${fieldId}                         — delete field
 *
 * Key invariants:
 *   - Fetch only fires when open === true (guarded in useEffect dependency on [open, serviceId]).
 *   - editingId === null means no row is in edit mode; only one row edits at a time.
 *   - Delete uses window.confirm() to match the admin's lightweight confirmation pattern.
 *   - The add form value field is required (min 1 char) matching createServiceDataFieldSchema.
 *
 * Read order:
 *   1. ServiceDataField      — data shape
 *   2. ServiceDataFieldsPanel — component and all handlers
 *
 * Author:      AmanVatsSharma
 * Last-updated: 2026-04-19
 */

'use client'

import { useEffect, useState } from 'react'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import { toast } from '@/components/ui/toaster'
import { Lock, Pencil, Trash2, Plus, Loader2, KeyRound } from 'lucide-react'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type ServiceDataField = {
  id: string
  label: string
  value: string
  isSensitive: boolean
  order: number
  createdAt: string
}

export interface ServiceDataFieldsPanelProps {
  serviceId: string
  serviceName: string
  companyId: string
  open: boolean
  onOpenChange: (open: boolean) => void
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function ServiceDataFieldsPanel({
  serviceId,
  serviceName,
  companyId,
  open,
  onOpenChange,
}: ServiceDataFieldsPanelProps) {
  const [fields, setFields] = useState<ServiceDataField[]>([])
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState<string | null>(null)

  // Add-field form state
  const [addLabel, setAddLabel] = useState('')
  const [addValue, setAddValue] = useState('')
  const [addSensitive, setAddSensitive] = useState(false)

  // Inline-edit state
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editLabel, setEditLabel] = useState('')
  const [editValue, setEditValue] = useState('')
  const [editSensitive, setEditSensitive] = useState(false)
  const [editSaving, setEditSaving] = useState(false)

  // -------------------------------------------------------------------------
  // Fetch fields when panel opens
  // -------------------------------------------------------------------------

  useEffect(() => {
    if (!open) return
    fetchFields()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, serviceId])

  async function fetchFields() {
    setLoading(true)
    try {
      const res = await fetch(
        `/api/admin/companies/${companyId}/services/${serviceId}/fields`
      )
      if (res.ok) {
        setFields(await res.json())
      } else {
        toast({ title: 'Error', description: 'Failed to load data fields', variant: 'destructive' })
      }
    } finally {
      setLoading(false)
    }
  }

  // -------------------------------------------------------------------------
  // Add field
  // -------------------------------------------------------------------------

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    try {
      const res = await fetch(
        `/api/admin/companies/${companyId}/services/${serviceId}/fields`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ label: addLabel, value: addValue, isSensitive: addSensitive }),
        }
      )
      if (res.ok) {
        toast({ title: 'Field added' })
        setAddLabel('')
        setAddValue('')
        setAddSensitive(false)
        fetchFields()
      } else {
        const d = await res.json()
        toast({ title: 'Error', description: d.error ?? 'Failed to add field', variant: 'destructive' })
      }
    } finally {
      setSaving(false)
    }
  }

  // -------------------------------------------------------------------------
  // Delete field
  // -------------------------------------------------------------------------

  async function handleDelete(fieldId: string, label: string) {
    if (!window.confirm(`Delete field "${label}"? This cannot be undone.`)) return
    setDeleting(fieldId)
    try {
      const res = await fetch(`/api/admin/services/fields/${fieldId}`, {
        method: 'DELETE',
      })
      if (res.ok) {
        toast({ title: 'Field deleted' })
        fetchFields()
      } else {
        const d = await res.json()
        toast({ title: 'Error', description: d.error ?? 'Failed to delete field', variant: 'destructive' })
      }
    } finally {
      setDeleting(null)
    }
  }

  // -------------------------------------------------------------------------
  // Inline edit helpers
  // -------------------------------------------------------------------------

  function startEdit(field: ServiceDataField) {
    setEditingId(field.id)
    setEditLabel(field.label)
    setEditValue(field.value)
    setEditSensitive(field.isSensitive)
  }

  function cancelEdit() {
    setEditingId(null)
    setEditLabel('')
    setEditValue('')
    setEditSensitive(false)
  }

  async function handleEditSave(fieldId: string) {
    if (!editLabel.trim() || !editValue.trim()) {
      toast({ title: 'Validation', description: 'Label and value are required', variant: 'destructive' })
      return
    }
    setEditSaving(true)
    try {
      const res = await fetch(`/api/admin/services/fields/${fieldId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ label: editLabel, value: editValue, isSensitive: editSensitive }),
      })
      if (res.ok) {
        toast({ title: 'Field updated' })
        cancelEdit()
        fetchFields()
      } else {
        const d = await res.json()
        toast({ title: 'Error', description: d.error ?? 'Failed to update field', variant: 'destructive' })
      }
    } finally {
      setEditSaving(false)
    }
  }

  // -------------------------------------------------------------------------
  // Render
  // -------------------------------------------------------------------------

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="w-full sm:max-w-lg flex flex-col gap-0 p-0 overflow-hidden"
      >
        {/* Header */}
        <SheetHeader className="px-6 py-5 border-b border-slate-100 shrink-0">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-indigo-100 flex items-center justify-center shrink-0">
              <KeyRound className="h-4 w-4 text-indigo-600" />
            </div>
            <div>
              <SheetTitle className="text-base font-semibold text-slate-900 leading-none">
                Data Fields
              </SheetTitle>
              <p className="text-xs text-slate-500 mt-0.5">{serviceName}</p>
            </div>
          </div>
        </SheetHeader>

        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-3">
          {loading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-indigo-500" />
            </div>
          ) : fields.length === 0 ? (
            <p className="text-center py-10 text-sm text-slate-400">
              No data fields yet. Add the first one below.
            </p>
          ) : (
            fields.map((field) =>
              editingId === field.id ? (
                /* ---- Inline Edit Row ---- */
                <div
                  key={field.id}
                  className="rounded-lg border border-indigo-200 bg-indigo-50/50 p-3 space-y-2"
                >
                  <div className="space-y-1">
                    <Label className="text-xs text-slate-600">Label</Label>
                    <Input
                      value={editLabel}
                      onChange={(e) => setEditLabel(e.target.value)}
                      className="h-8 text-sm"
                      required
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs text-slate-600">Value</Label>
                    <Textarea
                      value={editValue}
                      onChange={(e) => setEditValue(e.target.value)}
                      className="text-sm min-h-[72px] resize-y"
                      required
                    />
                  </div>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={editSensitive}
                      onChange={(e) => setEditSensitive(e.target.checked)}
                      className="h-3.5 w-3.5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                    />
                    <span className="text-xs text-slate-600">Sensitive</span>
                  </label>
                  <div className="flex gap-2 pt-1">
                    <Button
                      size="sm"
                      className="bg-indigo-600 hover:bg-indigo-700 text-white h-7 text-xs px-3"
                      onClick={() => handleEditSave(field.id)}
                      disabled={editSaving}
                    >
                      {editSaving ? (
                        <><Loader2 className="h-3 w-3 mr-1 animate-spin" />Saving...</>
                      ) : (
                        'Save'
                      )}
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-7 text-xs px-3"
                      onClick={cancelEdit}
                      disabled={editSaving}
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              ) : (
                /* ---- Display Row ---- */
                <div
                  key={field.id}
                  className="rounded-lg border border-slate-200 bg-white p-3 flex items-start gap-3 group"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="text-xs font-semibold text-slate-700 uppercase tracking-wide">
                        {field.label}
                      </span>
                      {field.isSensitive && (
                        <Badge className="text-[10px] px-1.5 py-0 bg-amber-50 text-amber-700 border border-amber-200 gap-0.5">
                          <Lock className="h-2.5 w-2.5" />
                          Sensitive
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-slate-600 mt-1 break-words line-clamp-3">
                      {field.value}
                    </p>
                  </div>
                  <div className="flex gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-7 w-7 p-0"
                      title="Edit field"
                      onClick={() => startEdit(field)}
                    >
                      <Pencil className="h-3 w-3" />
                      <span className="sr-only">Edit</span>
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-7 w-7 p-0 text-red-500 hover:text-red-600 hover:border-red-300"
                      title="Delete field"
                      disabled={deleting === field.id}
                      onClick={() => handleDelete(field.id, field.label)}
                    >
                      {deleting === field.id ? (
                        <Loader2 className="h-3 w-3 animate-spin" />
                      ) : (
                        <Trash2 className="h-3 w-3" />
                      )}
                      <span className="sr-only">Delete</span>
                    </Button>
                  </div>
                </div>
              )
            )
          )}
        </div>

        {/* Add Field Form — sticky footer */}
        <div className="shrink-0 border-t border-slate-100 bg-slate-50 px-6 py-4">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">
            Add Field
          </p>
          <form onSubmit={handleAdd} className="space-y-2">
            <div className="space-y-1">
              <Label className="text-xs text-slate-600">Label *</Label>
              <Input
                value={addLabel}
                onChange={(e) => setAddLabel(e.target.value)}
                placeholder="e.g. API Key"
                className="h-8 text-sm"
                required
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs text-slate-600">Value *</Label>
              <Textarea
                value={addValue}
                onChange={(e) => setAddValue(e.target.value)}
                placeholder="Enter value…"
                className="text-sm min-h-[64px] resize-y"
                required
              />
            </div>
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={addSensitive}
                  onChange={(e) => setAddSensitive(e.target.checked)}
                  className="h-3.5 w-3.5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                />
                <span className="text-xs text-slate-600">Mark as sensitive</span>
              </label>
              <Button
                type="submit"
                size="sm"
                className="bg-indigo-600 hover:bg-indigo-700 text-white h-8 text-xs gap-1"
                disabled={saving}
              >
                {saving ? (
                  <><Loader2 className="h-3 w-3 animate-spin" />Adding...</>
                ) : (
                  <><Plus className="h-3 w-3" />Add Field</>
                )}
              </Button>
            </div>
          </form>
        </div>
      </SheetContent>
    </Sheet>
  )
}
