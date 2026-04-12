/**
 * @file profile-settings-form.tsx
 * @module client-dashboard/components/dashboard
 * @description Client form: profile PATCH + password change.
 */

'use client'

import { useState } from 'react'
import { useSession } from 'next-auth/react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { toast } from '@/components/ui/toaster'
import { Loader2 } from 'lucide-react'

type Props = {
  initialName: string
  initialPhone: string
}

export function ProfileSettingsForm({ initialName, initialPhone }: Props) {
  const { update } = useSession()
  const [name, setName] = useState(initialName)
  const [phone, setPhone] = useState(initialPhone)
  const [saving, setSaving] = useState(false)

  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [passwordSaving, setPasswordSaving] = useState(false)

  async function saveProfile(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    try {
      const res = await fetch('/api/user/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim() || undefined,
          phone: phone.trim() || null
        })
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        throw new Error(data.error || 'Update failed')
      }
      await update({ name: data.name ?? name })
      toast({ title: 'Profile saved', description: 'Your details were updated.' })
    } catch (err) {
      toast({
        variant: 'destructive',
        title: 'Could not save',
        description: err instanceof Error ? err.message : 'Try again.'
      })
    } finally {
      setSaving(false)
    }
  }

  async function changePassword(e: React.FormEvent) {
    e.preventDefault()
    if (newPassword.length < 8) {
      toast({
        variant: 'destructive',
        title: 'Password too short',
        description: 'Use at least 8 characters.'
      })
      return
    }
    setPasswordSaving(true)
    try {
      const res = await fetch('/api/user/password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPassword, newPassword })
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        throw new Error(data.error || 'Password change failed')
      }
      setCurrentPassword('')
      setNewPassword('')
      toast({ title: 'Password updated', description: 'Use your new password next sign-in.' })
    } catch (err) {
      toast({
        variant: 'destructive',
        title: 'Password change failed',
        description: err instanceof Error ? err.message : 'Try again.'
      })
    } finally {
      setPasswordSaving(false)
    }
  }

  return (
    <div className="space-y-8">
      <Card>
        <CardHeader>
          <CardTitle>Account details</CardTitle>
          <CardDescription>Update your display name and contact info.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={(e) => void saveProfile(e)} className="space-y-4 max-w-md">
            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input id="name" value={name} onChange={(e) => setName(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Phone</Label>
              <Input id="phone" value={phone} onChange={(e) => setPhone(e.target.value)} />
            </div>
            <Button type="submit" disabled={saving}>
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Save changes'}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Password</CardTitle>
          <CardDescription>Change the password for your account login.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={(e) => void changePassword(e)} className="space-y-4 max-w-md">
            <div className="space-y-2">
              <Label htmlFor="current">Current password</Label>
              <Input
                id="current"
                type="password"
                autoComplete="current-password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="newpw">New password</Label>
              <Input
                id="newpw"
                type="password"
                autoComplete="new-password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
              />
            </div>
            <Button type="submit" variant="secondary" disabled={passwordSaving}>
              {passwordSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Update password'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
