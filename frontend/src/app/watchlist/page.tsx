import { WatchlistGrid } from '@/components/features/WatchlistGrid'

export default function WatchlistPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-zinc-100">Daftar Pantauan Pribadi</h1>
        <p className="text-xs text-zinc-400 mt-1">Kelola dan pantau pergerakan saham US & IDX pilihan Anda</p>
      </div>
      <WatchlistGrid showRemove />
    </div>
  )
}
