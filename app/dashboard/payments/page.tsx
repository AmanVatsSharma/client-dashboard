'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Landmark, Copy, Check, Loader2, CreditCard } from 'lucide-react'
import { toast } from '@/components/ui/toaster'
import Link from 'next/link'

interface BankAccount {
  id: string; name: string; bankName: string; accountHolder: string
  accountNumber: string; iban?: string; swiftCode?: string; routingNumber?: string
  country: string; currency: string; currencySymbol: string
}

const COUNTRY_FLAGS: Record<string, string> = {
  India: '🇮🇳', USA: '🇺🇸', 'United States': '🇺🇸', UK: '🇬🇧', 'United Kingdom': '🇬🇧',
  UAE: '🇦🇪', 'United Arab Emirates': '🇦🇪', Canada: '🇨🇦', Australia: '🇦🇺',
  Germany: '🇩🇪', France: '🇫🇷', Singapore: '🇸🇬', Netherlands: '🇳🇱', Japan: '🇯🇵',
  China: '🇨🇳', 'Hong Kong': '🇭🇰', Switzerland: '🇨🇭',
}

function CopyField({ label, value }: { label: string; value: string }) {
  const [copied, setCopied] = useState(false)

  async function copy() {
    await navigator.clipboard.writeText(value)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
    toast({ title: 'Copied!', description: `${label} copied to clipboard` })
  }

  return (
    <div className="flex items-center justify-between py-2 border-b border-slate-100 last:border-0">
      <div>
        <p className="text-xs text-slate-400 font-medium">{label}</p>
        <p className="text-sm font-mono text-slate-700 mt-0.5">{value}</p>
      </div>
      <Button
        size="sm"
        variant="ghost"
        className="h-7 w-7 p-0 text-slate-400 hover:text-indigo-600 shrink-0"
        onClick={copy}
      >
        {copied ? <Check className="h-3.5 w-3.5 text-green-500" /> : <Copy className="h-3.5 w-3.5" />}
      </Button>
    </div>
  )
}

export default function PaymentsPage() {
  const [accounts, setAccounts] = useState<BankAccount[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/bank-accounts').then(r => r.json()).then(setAccounts).finally(() => setLoading(false))
  }, [])

  // Group by country
  const grouped = accounts.reduce<Record<string, BankAccount[]>>((acc, a) => {
    if (!acc[a.country]) acc[a.country] = []
    acc[a.country].push(a)
    return acc
  }, {})

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Payments & Bank Details</h1>
        <p className="text-sm text-slate-500 mt-1">
          Transfer payment to one of our bank accounts and upload your proof of payment on the invoice.
        </p>
      </div>

      {/* CTA */}
      <Card className="bg-gradient-to-r from-primary-600 to-primary-700 border-0 text-white">
        <CardContent className="p-5 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <CreditCard className="h-6 w-6 opacity-80" />
            <div>
              <p className="font-semibold">Ready to pay an invoice?</p>
              <p className="text-sm opacity-80">After transfer, go to Invoices and upload your proof of payment.</p>
            </div>
          </div>
          <Link href="/dashboard/invoices">
            <Button variant="secondary" size="sm" className="shrink-0">View Invoices</Button>
          </Link>
        </CardContent>
      </Card>

      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary-600" />
        </div>
      ) : accounts.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center py-12 text-slate-400">
            <Landmark className="h-12 w-12 mb-3" />
            <p className="text-sm">Bank account details not yet available.</p>
            <p className="text-xs mt-1">Please contact your account manager.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-8">
          {Object.entries(grouped).map(([country, accts]) => (
            <div key={country}>
              <div className="flex items-center gap-2 mb-4">
                <span className="text-2xl">{COUNTRY_FLAGS[country] || '🏦'}</span>
                <h2 className="text-base font-semibold text-slate-700">{country}</h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {accts.map(account => (
                  <Card key={account.id} className="overflow-hidden border-slate-200 hover:shadow-md transition-shadow">
                    {/* Card Header */}
                    <div className="bg-gradient-to-r from-slate-800 to-slate-700 p-4 text-white">
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="text-xs text-slate-400 uppercase tracking-wide">{account.bankName}</p>
                          <p className="font-semibold mt-0.5">{account.name}</p>
                          <p className="text-sm text-slate-300 mt-1">{account.accountHolder}</p>
                        </div>
                        <Badge className="bg-white/20 text-white border-0 font-mono text-xs">
                          {account.currencySymbol} {account.currency}
                        </Badge>
                      </div>
                    </div>

                    {/* Account Details */}
                    <CardContent className="p-4">
                      <CopyField label="Account Number" value={account.accountNumber} />
                      {account.routingNumber && <CopyField label="IFSC / Routing Number" value={account.routingNumber} />}
                      {account.iban && <CopyField label="IBAN" value={account.iban} />}
                      {account.swiftCode && <CopyField label="SWIFT / BIC" value={account.swiftCode} />}
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Instructions */}
      <Card className="bg-amber-50 border-amber-200">
        <CardContent className="p-4">
          <p className="text-sm font-semibold text-amber-800 mb-2">Payment Instructions</p>
          <ol className="text-sm text-amber-700 space-y-1 list-decimal list-inside">
            <li>Transfer the exact invoice amount to one of our bank accounts above</li>
            <li>Include your invoice number in the payment reference/narration</li>
            <li>Take a screenshot or download the transaction receipt</li>
            <li>Go to <Link href="/dashboard/invoices" className="underline font-medium">Invoices</Link> and click "Upload Proof" on the relevant invoice</li>
            <li>Our team will verify and mark your invoice as paid within 1–2 business days</li>
          </ol>
        </CardContent>
      </Card>
    </div>
  )
}
