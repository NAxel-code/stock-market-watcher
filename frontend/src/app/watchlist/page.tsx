import { WatchlistGrid } from '@/components/features/WatchlistGrid'

export default function WatchlistPage() {
  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">My Watchlist</h1>
      <WatchlistGrid showRemove />
    </div>
  )
}
