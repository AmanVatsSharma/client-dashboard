/**
 * File:        components/dashboard/service-data-fields.tsx
 * Module:      Client Dashboard · Services · Data Fields Display
 * Purpose:     Fetch and render service-specific data fields for a given service, masking sensitive values behind a per-field toggle.
 *
 * Exports:
 *   - ServiceDataFields({ serviceId }) — client component; fetches GET /api/services/${serviceId}/fields and renders a "Service Details" panel; returns null when there are no fields or on error
 *   - ServiceDataFieldsProps — prop interface for the component
 *
 * Depends on:
 *   - lucide-react Eye / EyeOff — toggle icon for sensitive field reveal
 *
 * Side-effects:
 *   - HTTP GET on mount to /api/services/${serviceId}/fields
 *   - AbortController tied to component lifetime prevents setState-after-unmount
 *
 * Key invariants:
 *   - Returns null (renders nothing) when: fetch is in error, or resolved fields array is empty
 *   - Skeleton of exactly 3 rows is shown only during the in-flight fetch
 *   - Sensitive field masking is purely presentational — the raw value string is never rendered into the DOM when masked; conditional rendering is used, not CSS visibility/opacity
 *   - Each field has independent reveal state keyed by field id (not index)
 *   - isSensitive is a display hint from the API; all field values are returned verbatim by the server
 *
 * Read order:
 *   1. ServiceDataField — the data shape returned by the API
 *   2. ServiceDataFields — top-level component: fetch → skeleton → render → null paths
 *
 * Author:      AmanVatsSharma
 * Last-updated: 2026-04-19
 */

'use client'

import { useEffect, useState } from 'react'
import { Eye, EyeOff } from 'lucide-react'
import { Button } from '@/components/ui/button'

type ServiceDataField = {
  id: string
  label: string
  value: string
  isSensitive: boolean
  order: number
  createdAt: string
}

export interface ServiceDataFieldsProps {
  serviceId: string
}

function FieldSkeleton() {
  return (
    <div className="flex items-center justify-between py-2.5">
      <div className="h-3.5 w-28 rounded bg-slate-200 animate-pulse" />
      <div className="h-3.5 w-36 rounded bg-slate-200 animate-pulse" />
    </div>
  )
}

export function ServiceDataFields({ serviceId }: ServiceDataFieldsProps) {
  const [fields, setFields] = useState<ServiceDataField[] | null>(null)
  const [loading, setLoading] = useState(true)
  // revealed: Record<fieldId, boolean> — each field independently toggled
  const [revealed, setRevealed] = useState<Record<string, boolean>>({})

  useEffect(() => {
    const controller = new AbortController()
    setLoading(true)
    setFields(null)

    fetch(`/api/services/${serviceId}/fields`, { signal: controller.signal })
      .then(async (res) => {
        if (!res.ok) {
          setFields([])
          return
        }
        const data = (await res.json()) as ServiceDataField[]
        setFields(data)
      })
      .catch((err) => {
        // AbortError is expected on unmount — swallow silently
        if (err instanceof Error && err.name !== 'AbortError') {
          setFields([])
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false)
      })

    return () => controller.abort()
  }, [serviceId])

  function toggleReveal(fieldId: string) {
    setRevealed((prev) => ({ ...prev, [fieldId]: !prev[fieldId] }))
  }

  // --- Render: loading skeleton ---
  if (loading) {
    return (
      <div className="pt-3 border-t border-slate-100">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">
          Service Details
        </p>
        <div className="divide-y divide-slate-100">
          <FieldSkeleton />
          <FieldSkeleton />
          <FieldSkeleton />
        </div>
      </div>
    )
  }

  // --- Render: no fields or error → nothing ---
  if (!fields || fields.length === 0) return null

  return (
    <div className="pt-3 border-t border-slate-100">
      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">
        Service Details
      </p>
      <dl className="divide-y divide-slate-100">
        {fields.map((field) => {
          const isRevealed = !!revealed[field.id]
          return (
            <div key={field.id} className="flex items-center justify-between py-2.5 gap-4">
              <dt className="text-sm text-muted-foreground shrink-0">{field.label}</dt>
              <dd className="flex items-center gap-1.5 min-w-0">
                {field.isSensitive ? (
                  <>
                    <span className="text-sm font-medium text-slate-800 font-mono select-none">
                      {isRevealed ? field.value : '••••••'}
                    </span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-6 w-6 p-0 shrink-0 text-muted-foreground hover:text-slate-700"
                      onClick={() => toggleReveal(field.id)}
                      aria-label={isRevealed ? 'Hide value' : 'Reveal value'}
                    >
                      {isRevealed ? (
                        <EyeOff className="h-3.5 w-3.5" />
                      ) : (
                        <Eye className="h-3.5 w-3.5" />
                      )}
                    </Button>
                  </>
                ) : (
                  <span className="text-sm font-medium text-slate-800 text-right break-all">
                    {field.value}
                  </span>
                )}
              </dd>
            </div>
          )
        })}
      </dl>
    </div>
  )
}
