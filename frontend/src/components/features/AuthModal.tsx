'use client'

import React, { useState, useEffect } from 'react'
import { User, LogIn, LogOut, Check, Cloud, Lock } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { useUIStore } from '@/stores/useUIStore'
import {
  ensureClientWorkspaceId,
  loginAccount,
  registerAccount,
} from '@/lib/api'
import { isSupabaseConfigured, supabase } from '@/lib/supabase'
import { toast } from 'sonner'

export function AuthModal() {
  const [open, setOpen] = useState(false)
  const [mode, setMode] = useState<'login' | 'register'>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [displayName, setDisplayName] = useState('')
  const [loading, setLoading] = useState(false)
  const { user, setAuthSession, language } = useUIStore()

  useEffect(() => {
    const openHandler = () => setOpen(true)
    window.addEventListener('stockpulse:open-auth', openHandler)
    return () => window.removeEventListener('stockpulse:open-auth', openHandler)
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email || !password) return

    setLoading(true)
    try {
      const workspaceId = ensureClientWorkspaceId()
      const authRes =
        mode === 'register'
          ? await registerAccount({
              email,
              password,
              display_name: displayName || undefined,
              workspace_id: workspaceId,
            })
          : await loginAccount({
              email,
              password,
              workspace_id: workspaceId,
            })

      await setAuthSession(authRes.access_token, {
        id: authRes.user.id,
        email: authRes.user.email,
        display_name: authRes.user.display_name,
      })

      toast.success(
        mode === 'register'
          ? `Account created & synced (${authRes.user.email})`
          : `Signed in & synced across devices (${authRes.user.email})`
      )
      setOpen(false)
      setEmail('')
      setPassword('')
      setDisplayName('')
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Authentication failed')
    } finally {
      setLoading(false)
    }
  }

  const handleGoogleSignIn = async () => {
    setLoading(true)
    try {
      if (isSupabaseConfigured) {
        const { error } = await supabase.auth.signInWithOAuth({
          provider: 'google',
          options: { redirectTo: window.location.origin },
        })
        if (error) throw error
      } else {
        toast.info('Use Email & Password above for instant Cloud Sync across devices.')
      }
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Google Sign-In failed')
    } finally {
      setLoading(false)
    }
  }

  const handleSignOut = async () => {
    if (isSupabaseConfigured) {
      await supabase.auth.signOut()
    }
    await setAuthSession(null, null)
    toast.success('Signed out. Local workspace remains cached.')
  }

  if (user) {
    return (
      <div className="flex items-center gap-1">
        <div
          className="hidden sm:flex items-center gap-1.5 text-[11px] text-[#f4f4f5] bg-[#141418] border border-[#222226] py-1 px-2 rounded font-mono"
          title="Cloud Sync Active across devices"
        >
          <Cloud className="h-3 w-3 text-emerald-400" />
          <span className="truncate max-w-[90px]">{user.display_name || user.email || 'Account'}</span>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleSignOut}
          className="text-xs text-[#71717a] hover:text-red-400 px-1.5"
          title="Sign Out"
        >
          <LogOut className="h-3.5 w-3.5" />
        </Button>
      </div>
    )
  }

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        onClick={() => setOpen(true)}
        className="gap-1.5 border-[#222226] bg-[#141418] text-[11px] hover:bg-[#18181b] text-[#e4e4e7] font-mono px-2 h-7"
      >
        <LogIn className="h-3 w-3 text-[#a1a1aa]" />
        <span className="hidden sm:inline">{language === 'id' ? 'Masuk' : 'Sign In'}</span>
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-[400px] bg-[#0f0f12] border-[#27272a] text-[#f4f4f5]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 font-mono text-sm">
              <Cloud className="h-4 w-4 text-[#f4f4f5]" />
              StockPulse Cloud Sync
            </DialogTitle>
            <DialogDescription className="text-[#a1a1aa] text-xs">
              Sync your portfolio holdings, watchlists, paper trades, and 24/7 server-side alerts across devices.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-1">
            <div className="grid grid-cols-2 gap-1 bg-[#09090b] p-1 rounded border border-[#222226] font-mono text-xs">
              <button
                type="button"
                onClick={() => setMode('login')}
                className={`py-1.5 rounded font-semibold transition-colors ${
                  mode === 'login' ? 'bg-[#f4f4f5] text-[#09090b]' : 'text-[#71717a] hover:text-[#f4f4f5]'
                }`}
              >
                Sign In
              </button>
              <button
                type="button"
                onClick={() => setMode('register')}
                className={`py-1.5 rounded font-semibold transition-colors ${
                  mode === 'register' ? 'bg-[#f4f4f5] text-[#09090b]' : 'text-[#71717a] hover:text-[#f4f4f5]'
                }`}
              >
                Create Account
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3">
              {mode === 'register' && (
                <div>
                  <label className="text-[10px] font-mono uppercase text-[#71717a] block mb-1">
                    Display Name (optional)
                  </label>
                  <input
                    type="text"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    placeholder="Trader / Desk Name"
                    className="w-full bg-[#09090b] border border-[#222226] rounded px-3 py-2 text-xs focus:outline-none focus:border-zinc-400 text-[#f4f4f5] placeholder:text-[#52525b]"
                  />
                </div>
              )}

              <div>
                <label className="text-[10px] font-mono uppercase text-[#71717a] block mb-1">
                  Email Address
                </label>
                <div className="relative">
                  <User className="h-3.5 w-3.5 text-[#52525b] absolute left-3 top-2.5" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="trader@domain.com"
                    className="w-full bg-[#09090b] border border-[#222226] rounded pl-8 pr-3 py-2 text-xs focus:outline-none focus:border-zinc-400 text-[#f4f4f5] placeholder:text-[#52525b]"
                  />
                </div>
              </div>

              <div>
                <label className="text-[10px] font-mono uppercase text-[#71717a] block mb-1">
                  Password {mode === 'register' && '(min 6 chars)'}
                </label>
                <div className="relative">
                  <Lock className="h-3.5 w-3.5 text-[#52525b] absolute left-3 top-2.5" />
                  <input
                    type="password"
                    required
                    minLength={mode === 'register' ? 6 : 1}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full bg-[#09090b] border border-[#222226] rounded pl-8 pr-3 py-2 text-xs focus:outline-none focus:border-zinc-400 text-[#f4f4f5] placeholder:text-[#52525b]"
                  />
                </div>
              </div>

              <Button
                type="submit"
                disabled={loading}
                className="w-full gap-1.5 bg-[#f4f4f5] hover:bg-white text-[#09090b] font-mono font-bold text-xs"
              >
                <Check className="h-3.5 w-3.5" />
                {loading
                  ? 'Syncing...'
                  : mode === 'register'
                  ? 'Create Account & Sync'
                  : 'Sign In & Sync'}
              </Button>
            </form>

            {isSupabaseConfigured && (
              <Button
                type="button"
                variant="outline"
                onClick={handleGoogleSignIn}
                disabled={loading}
                className="w-full gap-2 border-[#222226] bg-[#09090b] hover:bg-[#141418] text-xs py-2"
              >
                Continue with Google OAuth
              </Button>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
