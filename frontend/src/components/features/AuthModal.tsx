'use client'

import React, { useState } from 'react'
import { User, LogIn, LogOut, Check } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { useUIStore } from '@/stores/useUIStore'
import { isSupabaseConfigured, supabase } from '@/lib/supabase'
import { toast } from 'sonner'

export function AuthModal() {
  const [open, setOpen] = useState(false)
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const { user, setUser } = useUIStore()

  const handleMagicLink = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email) return

    setLoading(true)
    try {
      if (isSupabaseConfigured) {
        const { error } = await supabase.auth.signInWithOtp({ email })
        if (error) throw error
        toast.success('Magic link login telah dikirim ke email Anda!')
      } else {
        // Local mock sign-in when Supabase project is not yet connected
        setUser({ id: `user-${Date.now()}`, email })
        toast.success(`Berhasil login sebagai ${email} (Demo Mode)`)
      }
      setOpen(false)
      setEmail('')
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Gagal mengirim magic link')
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
        setUser({ id: `google-${Date.now()}`, email: 'google.user@example.com' })
        toast.success('Berhasil login dengan akun Google (Demo Mode)')
        setOpen(false)
      }
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Gagal login Google')
    } finally {
      setLoading(false)
    }
  }

  const handleSignOut = async () => {
    if (isSupabaseConfigured) {
      await supabase.auth.signOut()
    }
    setUser(null)
    toast.success('Berhasil logout. Watchlist tetap tersimpan di browser.')
  }

  if (user) {
    return (
      <div className="flex items-center gap-2">
        <div className="hidden sm:flex items-center gap-1.5 text-xs text-zinc-300 bg-zinc-900 border border-zinc-800 py-1 px-2.5 rounded-full">
          <User className="h-3 w-3 text-blue-400" />
          <span className="truncate max-w-[120px] font-mono">{user.email ?? 'Akun Saya'}</span>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleSignOut}
          className="text-xs text-zinc-400 hover:text-red-400"
          title="Keluar / Sign Out"
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
        className="gap-1.5 border-zinc-700 bg-zinc-900 text-xs hover:bg-zinc-800"
      >
        <LogIn className="h-3.5 w-3.5 text-blue-400" />
        <span className="hidden sm:inline">Masuk</span>
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-[380px] bg-zinc-900 border-zinc-800 text-zinc-50">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <User className="h-4 w-4 text-blue-400" />
            Sinkronisasi Akun StockPulse
          </DialogTitle>
          <DialogDescription className="text-zinc-400 text-xs">
            Masuk untuk menyinkronkan watchlist dan alert harga Anda di semua perangkat secara real-time.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <Button
            type="button"
            variant="outline"
            onClick={handleGoogleSignIn}
            disabled={loading}
            className="w-full gap-2 border-zinc-700 bg-zinc-950 hover:bg-zinc-800 text-xs py-2"
          >
            <svg className="h-4 w-4" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.8-2.4 3.65v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.14z"
              />
              <path
                fill="#34A853"
                d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.13C3.27 21.36 7.35 24 12 24z"
              />
              <path
                fill="#FBBC05"
                d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.6H1.25C.45 8.18 0 9.99 0 12s.45 3.82 1.25 5.4l4.03-3.13z"
              />
              <path
                fill="#EA4335"
                d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.35 0 3.27 2.64 1.25 6.6l4.03 3.13c.95-2.83 3.6-4.98 6.72-4.98z"
              />
            </svg>
            Lanjutkan dengan Google
          </Button>

          <div className="relative flex items-center justify-center text-[11px] text-zinc-500 uppercase">
            <span className="bg-zinc-900 px-2 z-10">atau dengan email</span>
            <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-zinc-800" /></div>
          </div>

          <form onSubmit={handleMagicLink} className="space-y-3">
            <div>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="nama@email.com"
                className="w-full bg-zinc-950 border border-zinc-700 rounded-md px-3 py-2 text-xs focus:outline-none focus:border-blue-500 text-zinc-100 placeholder:text-zinc-500"
              />
            </div>
            <Button type="submit" disabled={loading} className="w-full gap-1.5 bg-blue-600 hover:bg-blue-500 text-xs">
              <Check className="h-3.5 w-3.5" />
              {loading ? 'Mengirim...' : 'Kirim Magic Link'}
            </Button>
          </form>
        </div>
      </DialogContent>
    </Dialog>
    </>
  )
}
