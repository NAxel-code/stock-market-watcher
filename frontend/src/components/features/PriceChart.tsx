'use client'

import { useState } from 'react'
import {
  ComposedChart,
  Area,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts'
import { useStockHistory } from '@/hooks/useStockHistory'
import { formatCurrency, formatVolume } from '@/lib/formatters'
import { cn } from '@/lib/utils'
import { Skeleton } from '@/components/ui/skeleton'
import type { Period } from '@/types/stock'
import { BarChart3, LineChart } from 'lucide-react'

const PERIODS: { label: string; value: Period }[] = [
  { label: '1D', value: '1d' },
  { label: '1W', value: '1w' },
  { label: '1M', value: '1m' },
  { label: '3M', value: '3m' },
  { label: '1Y', value: '1y' },
]

interface PriceChartProps {
  ticker: string
  currency?: string
  previousClose?: number
}

interface CustomTooltipProps {
  active?: boolean
  payload?: Array<{ payload: {
    time: string
    open: number
    high: number
    low: number
    close: number
    volume: number
  } }>
  currency: string
}

function CustomChartTooltip({ active, payload, currency }: CustomTooltipProps) {
  if (!active || !payload || !payload.length) return null
  const data = payload[0].payload

  return (
    <div className="rounded-lg border border-zinc-800 bg-zinc-950/95 p-3 text-xs shadow-xl backdrop-blur-sm space-y-1">
      <div className="font-semibold text-zinc-300 border-b border-zinc-800 pb-1">{data.time}</div>
      <div className="grid grid-cols-2 gap-x-4 gap-y-0.5 text-zinc-400">
        <span>Open: <strong className="font-mono text-zinc-200">{formatCurrency(data.open, currency)}</strong></span>
        <span>High: <strong className="font-mono text-zinc-200">{formatCurrency(data.high, currency)}</strong></span>
        <span>Low: <strong className="font-mono text-zinc-200">{formatCurrency(data.low, currency)}</strong></span>
        <span>Close: <strong className="font-mono text-zinc-200">{formatCurrency(data.close, currency)}</strong></span>
      </div>
      <div className="text-[11px] text-zinc-500 pt-0.5">
        Vol: <span className="font-mono text-zinc-400">{formatVolume(data.volume)}</span>
      </div>
    </div>
  )
}

export function PriceChart({ ticker, currency = 'USD', previousClose }: PriceChartProps) {
  const [period, setPeriod] = useState<Period>('1m')
  const [chartType, setChartType] = useState<'area' | 'bar'>('area')
  const { data, isLoading, error } = useStockHistory(ticker, period)

  if (isLoading) {
    return (
      <div className="space-y-3">
        <div className="flex justify-between items-center">
          <div className="flex gap-2">
            {PERIODS.map((p) => (
              <Skeleton key={p.value} className="h-7 w-10 rounded-md bg-zinc-800" />
            ))}
          </div>
          <Skeleton className="h-7 w-20 rounded-md bg-zinc-800" />
        </div>
        <Skeleton className="h-72 w-full rounded-xl bg-zinc-800" />
      </div>
    )
  }

  if (error || !data) {
    return (
      <div className="h-72 flex items-center justify-center text-sm text-red-400 border border-red-900/50 rounded-xl">
        Failed to load chart data.
      </div>
    )
  }

  const chartData = data.data.map((point) => ({
    time: new Date(point.timestamp).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: period === '1d' ? '2-digit' : undefined,
      minute: period === '1d' ? '2-digit' : undefined,
    }),
    open: point.open,
    high: point.high,
    low: point.low,
    close: point.close,
    price: point.close,
    volume: point.volume,
    isUp: point.close >= point.open,
  }))

  const firstPrice = chartData[0]?.price ?? 0
  const lastPrice = chartData[chartData.length - 1]?.price ?? 0
  const isPositive = lastPrice >= firstPrice
  const strokeColor = isPositive ? '#22c55e' : '#ef4444'
  const gradientId = `gradient-${ticker}`

  return (
    <div className="space-y-3">
      {/* Controls header */}
      <div className="flex flex-wrap justify-between items-center gap-2">
        {/* Period selector */}
        <div className="flex gap-1 bg-zinc-950 p-1 rounded-lg border border-zinc-800/80">
          {PERIODS.map((p) => (
            <button
              key={p.value}
              onClick={() => setPeriod(p.value)}
              className={cn(
                'px-2.5 py-1 text-xs font-medium rounded-md transition-colors',
                period === p.value
                  ? 'bg-zinc-800 text-zinc-50 shadow-sm'
                  : 'text-zinc-400 hover:bg-zinc-900 hover:text-zinc-200'
              )}
              aria-pressed={period === p.value}
              aria-label={`Show ${p.label} chart`}
            >
              {p.label}
            </button>
          ))}
        </div>

        {/* Chart type toggle */}
        <div className="flex gap-1 bg-zinc-950 p-1 rounded-lg border border-zinc-800/80">
          <button
            onClick={() => setChartType('area')}
            className={cn(
              'flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-md transition-colors',
              chartType === 'area'
                ? 'bg-zinc-800 text-zinc-50'
                : 'text-zinc-400 hover:bg-zinc-900 hover:text-zinc-200'
            )}
            title="Area Trend Chart"
          >
            <LineChart className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Area</span>
          </button>
          <button
            onClick={() => setChartType('bar')}
            className={cn(
              'flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-md transition-colors',
              chartType === 'bar'
                ? 'bg-zinc-800 text-zinc-50'
                : 'text-zinc-400 hover:bg-zinc-900 hover:text-zinc-200'
            )}
            title="TradingView High/Low Bars"
          >
            <BarChart3 className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Volume + Bars</span>
          </button>
        </div>
      </div>

      {/* Responsive Composed Chart */}
      <ResponsiveContainer width="100%" height={280}>
        <ComposedChart data={chartData} margin={{ top: 8, right: 8, bottom: 0, left: 8 }}>
          <defs>
            <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={strokeColor} stopOpacity={0.25} />
              <stop offset="95%" stopColor={strokeColor} stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
          <XAxis
            dataKey="time"
            tick={{ fill: '#71717a', fontSize: 11 }}
            tickLine={false}
            axisLine={false}
            interval="preserveStartEnd"
          />
          {/* Price Y Axis */}
          <YAxis
            yAxisId="price"
            tick={{ fill: '#71717a', fontSize: 11 }}
            tickLine={false}
            axisLine={false}
            domain={['auto', 'auto']}
            tickFormatter={(v: number) => formatCurrency(v, currency).replace('$', '')}
            width={65}
          />
          {/* Volume Y Axis (Hidden, used for relative height) */}
          <YAxis
            yAxisId="volume"
            orientation="right"
            hide
            domain={[0, (dataMax: number) => dataMax * 4]}
          />

          <Tooltip content={<CustomChartTooltip currency={currency} />} />

          {/* Previous Close Reference Baseline */}
          {previousClose && (
            <ReferenceLine
              yAxisId="price"
              y={previousClose}
              stroke="#71717a"
              strokeDasharray="3 3"
              strokeWidth={1}
            />
          )}

          {/* Volume histogram bars */}
          <Bar
            yAxisId="volume"
            dataKey="volume"
            fill="#52525b"
            opacity={0.35}
            radius={[2, 2, 0, 0]}
          />

          {/* Price Area / Curve */}
          <Area
            yAxisId="price"
            type="monotone"
            dataKey="price"
            stroke={strokeColor}
            strokeWidth={2}
            fill={`url(#${gradientId})`}
            dot={false}
            animationDuration={400}
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  )
}
