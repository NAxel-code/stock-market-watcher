'use client'

import React, { useState } from 'react'
import { Bell, Check } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { createAlert } from '@/lib/api'
import { useUIStore } from '@/stores/useUIStore'
import { toast } from 'sonner'
import { formatCurrency } from '@/lib/formatters'

interface PriceAlertDialogProps {
  ticker: string
  currentPrice: number
  currency?: string
}

export function PriceAlertDialog({ ticker, currentPrice, currency = 'USD' }: PriceAlertDialogProps) {
  const [open, setOpen] = useState(false)
  const [targetPrice, setTargetPrice] = useState<string>(currentPrice.toString())
  const [condition, setCondition] = useState<'ABOVE' | 'BELOW'>('ABOVE')
  const [loading, setLoading] = useState(false)
  const { addAlert } = useUIStore()

  const handleCreate = async () => {
    const priceNum = parseFloat(targetPrice)
    if (isNaN(priceNum) || priceNum <= 0) {
      toast.error('Masukkan target harga yang valid')
      return
    }

    setLoading(true)
    try {
      const alert = await createAlert({
        ticker,
        target_price: priceNum,
        condition,
      })
      addAlert(alert)
      toast.success(`Alert disetel: ${ticker} ${condition} ${formatCurrency(priceNum, currency)}`)
      setOpen(false)
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Gagal membuat alert')
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        onClick={() => setOpen(true)}
        className="gap-1.5 border-zinc-700 bg-zinc-900 text-xs hover:bg-zinc-800"
      >
        <Bell className="h-3.5 w-3.5 text-amber-400" />
        <span>Pasang Alert</span>
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-[420px] bg-zinc-900 border-zinc-800 text-zinc-50">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Bell className="h-4 w-4 text-amber-400" />
            Pasang Price Alert untuk {ticker}
          </DialogTitle>
          <DialogDescription className="text-zinc-400 text-xs">
            Dapatkan notifikasi langsung di layar saat harga {ticker} melewati batas target Anda.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="text-xs text-zinc-400">
            Harga Saat Ini: <strong className="text-zinc-100 font-mono text-sm">{formatCurrency(currentPrice, currency)}</strong>
          </div>

          <div>
            <label className="text-xs text-zinc-300 block mb-1">Kondisi Pemicu:</label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setCondition('ABOVE')}
                className={`py-2 px-3 rounded-lg border text-xs font-medium transition-all ${
                  condition === 'ABOVE'
                    ? 'border-green-500 bg-green-950/40 text-green-400'
                    : 'border-zinc-800 bg-zinc-950 text-zinc-400 hover:border-zinc-700'
                }`}
              >
                Naik Di Atas (&gt;=)
              </button>
              <button
                type="button"
                onClick={() => setCondition('BELOW')}
                className={`py-2 px-3 rounded-lg border text-xs font-medium transition-all ${
                  condition === 'BELOW'
                    ? 'border-red-500 bg-red-950/40 text-red-400'
                    : 'border-zinc-800 bg-zinc-950 text-zinc-400 hover:border-zinc-700'
                }`}
              >
                Turun Di Bawah (&lt;=)
              </button>
            </div>
          </div>

          <div>
            <label className="text-xs text-zinc-300 block mb-1">Target Harga ({currency}):</label>
            <input
              type="number"
              step="any"
              value={targetPrice}
              onChange={(e) => setTargetPrice(e.target.value)}
              className="w-full bg-zinc-950 border border-zinc-700 rounded-md px-3 py-2 text-sm font-mono focus:outline-none focus:border-blue-500"
              placeholder={`Contoh: ${currentPrice}`}
            />
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <Button variant="ghost" size="sm" onClick={() => setOpen(false)}>
            Batal
          </Button>
          <Button size="sm" onClick={handleCreate} disabled={loading} className="gap-1 bg-blue-600 hover:bg-blue-500">
            <Check className="h-3.5 w-3.5" />
            {loading ? 'Menyimpan...' : 'Aktifkan Alert'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
    </>
  )
}
