'use client'

import React, { useState, useEffect, useRef, useMemo } from 'react'
import {
  createChart,
  ColorType,
  CrosshairMode,
  CandlestickSeries,
  BarSeries,
  AreaSeries,
  LineSeries,
  HistogramSeries,
  type IChartApi,
  type UTCTimestamp,
} from 'lightweight-charts'
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip as RechartsTooltip,
  ReferenceLine,
  CartesianGrid,
} from 'recharts'
import { useStockHistory } from '@/hooks/useStockHistory'
import { formatCurrency, formatVolume, formatPercent } from '@/lib/formatters'
import { cn } from '@/lib/utils'
import { Skeleton } from '@/components/ui/skeleton'
import type { Period, ChartType } from '@/types/stock'
import {
  LineChart,
  CandlestickChart,
  BarChart3,
  ShieldAlert,
  Volume2,
  SlidersHorizontal,
} from 'lucide-react'

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

interface HoverLegendData {
  timeStr: string
  open: number
  high: number
  low: number
  close: number
  volume: number
  change: number
  changePercent: number
}

// Helper to compute Simple Moving Average (SMA)
function computeSMA(
  points: { time: number; close: number }[],
  windowSize: number
): { time: UTCTimestamp; value: number }[] {
  const result: { time: UTCTimestamp; value: number }[] = []
  if (points.length < windowSize) return result

  for (let i = windowSize - 1; i < points.length; i++) {
    let sum = 0
    for (let j = 0; j < windowSize; j++) {
      sum += points[i - j].close
    }
    result.push({
      time: points[i].time as UTCTimestamp,
      value: parseFloat((sum / windowSize).toFixed(2)),
    })
  }
  return result
}

export function PriceChart({ ticker, currency = 'USD', previousClose }: PriceChartProps) {
  const [period, setPeriod] = useState<Period>('1m')
  const [chartType, setChartType] = useState<ChartType>('candle')
  const [showVolume, setShowVolume] = useState(true)
  const [showSMA20, setShowSMA20] = useState(false)
  const [showSMA50, setShowSMA50] = useState(false)
  const [hoveredPoint, setHoveredPoint] = useState<HoverLegendData | null>(null)

  const chartContainerRef = useRef<HTMLDivElement>(null)
  const chartInstanceRef = useRef<IChartApi | null>(null)

  const { data, isLoading, error } = useStockHistory(ticker, period)

  // Transform and sort data points strictly ascending in time
  const processedData = useMemo(() => {
    if (!data?.data || data.data.length === 0) return []

    const mapped = data.data
      .map((p) => ({
        time: Math.floor(new Date(p.timestamp).getTime() / 1000),
        rawTime: p.timestamp,
        open: p.open,
        high: p.high,
        low: p.low,
        close: p.close,
        volume: p.volume,
      }))
      .filter((p) => !isNaN(p.time) && p.open != null && p.close != null)
      .sort((a, b) => a.time - b.time)

    // Deduplicate duplicate seconds timestamps for lightweight-charts
    return mapped.filter((item, index, arr) => index === 0 || item.time > arr[index - 1].time)
  }, [data])

  // Compute VaR (Value at Risk) statistics when in VaR mode
  const varAnalysis = useMemo(() => {
    if (processedData.length < 2) return null

    // Daily percentage returns: r_t = (close_t - close_{t-1}) / close_{t-1} * 100
    const returns: number[] = []
    for (let i = 1; i < processedData.length; i++) {
      const prev = processedData[i - 1].close
      const curr = processedData[i].close
      if (prev > 0) {
        returns.push(((curr - prev) / prev) * 100)
      }
    }

    if (returns.length === 0) return null

    const sorted = [...returns].sort((a, b) => a - b)
    const n = sorted.length
    const mean = returns.reduce((a, b) => a + b, 0) / n
    const variance =
      returns.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / (n > 1 ? n - 1 : 1)
    const std = Math.sqrt(variance)

    // Historical VaR
    const idx95 = Math.max(0, Math.floor(n * 0.05))
    const idx99 = Math.max(0, Math.floor(n * 0.01))
    const var95Historical = sorted[idx95]
    const var99Historical = sorted[idx99]

    // Parametric VaR (assuming normal distribution)
    const var95Parametric = mean - 1.645 * std
    const var99Parametric = mean - 2.326 * std

    // Conditional VaR (Expected Shortfall / CVaR 95%)
    const tail95 = sorted.filter((r) => r <= var95Historical)
    const cvar95 = tail95.length
      ? tail95.reduce((a, b) => a + b, 0) / tail95.length
      : var95Historical

    // Annualized Volatility (~252 trading days)
    const annualizedVol = std * Math.sqrt(252)

    // Build return frequency histogram bins (15 bins)
    const minRet = Math.min(-5, Math.floor(sorted[0]))
    const maxRet = Math.max(5, Math.ceil(sorted[sorted.length - 1]))
    const binCount = 18
    const binSize = (maxRet - minRet) / binCount
    const bins = Array.from({ length: binCount }, (_, i) => {
      const binStart = minRet + i * binSize
      const binEnd = binStart + binSize
      const count = returns.filter((r) => r >= binStart && r < binEnd).length
      const isExtremeTail = binEnd <= var95Historical
      const isPositive = binStart >= 0

      return {
        range: `${binStart >= 0 ? '+' : ''}${binStart.toFixed(1)}%`,
        binStart,
        binEnd,
        count,
        isExtremeTail,
        isPositive,
      }
    })

    return {
      mean,
      std,
      var95Historical,
      var99Historical,
      var95Parametric,
      var99Parametric,
      cvar95,
      annualizedVol,
      bins,
      sampleSize: n,
    }
  }, [processedData])

  // Mount and manage TradingView Lightweight Charts
  useEffect(() => {
    if (chartType === 'var' || !chartContainerRef.current || processedData.length === 0) return

    const container = chartContainerRef.current
    container.innerHTML = '' // Clear existing canvas

    const chart = createChart(container, {
      width: container.clientWidth,
      height: 320,
      layout: {
        background: { type: ColorType.Solid, color: '#09090b' },
        textColor: '#a1a1aa',
        fontFamily: 'inherit',
      },
      grid: {
        vertLines: { color: '#18181b' },
        horzLines: { color: '#18181b' },
      },
      crosshair: {
        mode: CrosshairMode.Normal,
      },
      timeScale: {
        borderColor: '#27272a',
        timeVisible: period === '1d',
        secondsVisible: false,
      },
      rightPriceScale: {
        borderColor: '#27272a',
        scaleMargins: {
          top: 0.1,
          bottom: showVolume ? 0.22 : 0.08,
        },
      },
      handleScale: {
        mouseWheel: true,
        pinch: true,
        axisPressedMouseMove: true,
      },
      handleScroll: {
        mouseWheel: true,
        pressedMouseMove: true,
        horzTouchDrag: true,
        vertTouchDrag: false,
      },
    })

    chartInstanceRef.current = chart

    // 1. Add Price Series according to selected chartType
    if (chartType === 'candle') {
      const candleSeries = chart.addSeries(CandlestickSeries, {
        upColor: '#22c55e',
        downColor: '#ef4444',
        borderVisible: false,
        wickUpColor: '#22c55e',
        wickDownColor: '#ef4444',
      })
      candleSeries.setData(
        processedData.map((d) => ({
          time: d.time as UTCTimestamp,
          open: d.open,
          high: d.high,
          low: d.low,
          close: d.close,
        }))
      )
    } else if (chartType === 'bar') {
      const barSeries = chart.addSeries(BarSeries, {
        upColor: '#22c55e',
        downColor: '#ef4444',
        thinBars: false,
      })
      barSeries.setData(
        processedData.map((d) => ({
          time: d.time as UTCTimestamp,
          open: d.open,
          high: d.high,
          low: d.low,
          close: d.close,
        }))
      )
    } else {
      // Area / Line Trend
      const isUp =
        (processedData[processedData.length - 1]?.close ?? 0) >=
        (processedData[0]?.open ?? 0)
      const color = isUp ? '#22c55e' : '#ef4444'
      const areaSeries = chart.addSeries(AreaSeries, {
        topColor: isUp ? 'rgba(34, 197, 94, 0.35)' : 'rgba(239, 68, 68, 0.35)',
        bottomColor: 'rgba(9, 9, 11, 0.0)',
        lineColor: color,
        lineWidth: 2,
      })
      areaSeries.setData(
        processedData.map((d) => ({
          time: d.time as UTCTimestamp,
          value: d.close,
        }))
      )
    }

    // 2. Add Volume Histogram (Optional overlay)
    if (showVolume) {
      const volumeSeries = chart.addSeries(HistogramSeries, {
        color: '#52525b',
        priceFormat: {
          type: 'volume',
        },
        priceScaleId: '', // Overlay onto bottom margin
      })
      volumeSeries.priceScale().applyOptions({
        scaleMargins: {
          top: 0.78,
          bottom: 0,
        },
      })
      volumeSeries.setData(
        processedData.map((d) => ({
          time: d.time as UTCTimestamp,
          value: d.volume,
          color: d.close >= d.open ? 'rgba(34, 197, 94, 0.35)' : 'rgba(239, 68, 68, 0.35)',
        }))
      )
    }

    // 3. Technical Indicators (SMA 20 & SMA 50)
    if (showSMA20) {
      const sma20Data = computeSMA(processedData, 20)
      if (sma20Data.length > 0) {
        const sma20 = chart.addSeries(LineSeries, {
          color: '#3b82f6',
          lineWidth: 2,
          title: 'SMA 20',
        })
        sma20.setData(sma20Data)
      }
    }

    if (showSMA50) {
      const sma50Data = computeSMA(processedData, 50)
      if (sma50Data.length > 0) {
        const sma50 = chart.addSeries(LineSeries, {
          color: '#f59e0b',
          lineWidth: 2,
          title: 'SMA 50',
        })
        sma50.setData(sma50Data)
      }
    }

    // 4. Crosshair tracking to update top legend
    chart.subscribeCrosshairMove((param) => {
      if (
        param.point === undefined ||
        !param.time ||
        param.point.x < 0 ||
        param.point.x > container.clientWidth ||
        param.point.y < 0 ||
        param.point.y > container.clientHeight
      ) {
        setHoveredPoint(null)
      } else {
        const match = processedData.find((d) => d.time === param.time)
        if (match) {
          const change = match.close - match.open
          const changePercent = match.open > 0 ? (change / match.open) * 100 : 0
          setHoveredPoint({
            timeStr: new Date(match.rawTime).toLocaleDateString('en-US', {
              month: 'short',
              day: 'numeric',
              year: 'numeric',
              hour: period === '1d' ? '2-digit' : undefined,
              minute: period === '1d' ? '2-digit' : undefined,
            }),
            open: match.open,
            high: match.high,
            low: match.low,
            close: match.close,
            volume: match.volume,
            change,
            changePercent,
          })
        }
      }
    })

    // ResizeObserver for fluid responsiveness
    const resizeObserver = new ResizeObserver((entries) => {
      if (!entries || entries.length === 0) return
      const { width } = entries[0].contentRect
      if (width > 0 && chart) {
        chart.applyOptions({ width })
      }
    })
    resizeObserver.observe(container)

    return () => {
      resizeObserver.disconnect()
      chart.remove()
      chartInstanceRef.current = null
    }
  }, [chartType, period, processedData, showVolume, showSMA20, showSMA50])

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
        <Skeleton className="h-80 w-full rounded-xl bg-zinc-800" />
      </div>
    )
  }

  if (error || !data || processedData.length === 0) {
    return (
      <div className="h-72 flex items-center justify-center text-sm text-red-400 border border-red-900/50 rounded-xl">
        Failed to load chart data for {ticker}.
      </div>
    )
  }

  // Active or latest point for legend
  const latestData = processedData[processedData.length - 1]
  const firstData = processedData[0]
  const defaultChange = latestData.close - (previousClose ?? firstData.open)
  const defaultChangePercent =
    (previousClose ?? firstData.open) > 0
      ? (defaultChange / (previousClose ?? firstData.open)) * 100
      : 0

  const activeLegend: HoverLegendData = hoveredPoint ?? {
    timeStr: new Date(latestData.rawTime).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: period === '1d' ? '2-digit' : undefined,
      minute: period === '1d' ? '2-digit' : undefined,
    }),
    open: latestData.open,
    high: latestData.high,
    low: latestData.low,
    close: latestData.close,
    volume: latestData.volume,
    change: defaultChange,
    changePercent: defaultChangePercent,
  }

  return (
    <div className="space-y-3">
      {/* Chart Top Controls Bar */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-zinc-800/80 pb-3">
        {/* Timeframe Selector */}
        <div className="flex gap-1 bg-zinc-950 p-1 rounded-lg border border-zinc-800/80">
          {PERIODS.map((p) => (
            <button
              key={p.value}
              type="button"
              onClick={() => setPeriod(p.value)}
              className={cn(
                'px-2.5 py-1 text-xs font-medium rounded-md transition-colors cursor-pointer',
                period === p.value
                  ? 'bg-zinc-800 text-zinc-50 shadow-sm font-semibold'
                  : 'text-zinc-400 hover:bg-zinc-900 hover:text-zinc-200'
              )}
              aria-pressed={period === p.value}
              aria-label={`Timeframe ${p.label}`}
            >
              {p.label}
            </button>
          ))}
        </div>

        {/* Chart View Mode Selectors: Area, Candle, Bar, VaR */}
        <div className="flex items-center gap-1 bg-zinc-950 p-1 rounded-lg border border-zinc-800/80">
          <button
            type="button"
            onClick={() => setChartType('area')}
            className={cn(
              'flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-md transition-colors cursor-pointer',
              chartType === 'area'
                ? 'bg-zinc-800 text-zinc-50 shadow-sm'
                : 'text-zinc-400 hover:bg-zinc-900 hover:text-zinc-200'
            )}
            title="Area / Line Trend View"
          >
            <LineChart className="h-3.5 w-3.5 text-blue-400" />
            <span className="hidden sm:inline">Area</span>
          </button>
          <button
            type="button"
            onClick={() => setChartType('candle')}
            className={cn(
              'flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-md transition-colors cursor-pointer',
              chartType === 'candle'
                ? 'bg-zinc-800 text-zinc-50 shadow-sm'
                : 'text-zinc-400 hover:bg-zinc-900 hover:text-zinc-200'
            )}
            title="TradingView Candlestick View (Wick + Body)"
          >
            <CandlestickChart className="h-3.5 w-3.5 text-green-400" />
            <span>Candle</span>
          </button>
          <button
            type="button"
            onClick={() => setChartType('bar')}
            className={cn(
              'flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-md transition-colors cursor-pointer',
              chartType === 'bar'
                ? 'bg-zinc-800 text-zinc-50 shadow-sm'
                : 'text-zinc-400 hover:bg-zinc-900 hover:text-zinc-200'
            )}
            title="Classic Wall Street OHLC Bar View"
          >
            <BarChart3 className="h-3.5 w-3.5 text-amber-400" />
            <span>Bar (OHLC)</span>
          </button>
          <button
            type="button"
            onClick={() => setChartType('var')}
            className={cn(
              'flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-md transition-colors cursor-pointer',
              chartType === 'var'
                ? 'bg-purple-950/80 text-purple-300 border border-purple-700/60 shadow-sm font-semibold'
                : 'text-zinc-400 hover:bg-zinc-900 hover:text-zinc-200'
            )}
            title="Value at Risk (VaR) & Return Volatility Distribution"
          >
            <ShieldAlert className="h-3.5 w-3.5 text-purple-400" />
            <span>VaR Risk</span>
          </button>
        </div>

        {/* Technical Indicator Toggles (Active for Canvas Charts) */}
        {chartType !== 'var' && (
          <div className="flex items-center gap-1 bg-zinc-950 p-1 rounded-lg border border-zinc-800/80 ml-auto">
            <button
              type="button"
              onClick={() => setShowSMA20((prev) => !prev)}
              className={cn(
                'px-2 py-0.5 text-[11px] font-mono rounded transition-colors cursor-pointer',
                showSMA20
                  ? 'bg-blue-900/60 text-blue-300 border border-blue-700/60 font-semibold'
                  : 'text-zinc-400 hover:text-zinc-200'
              )}
              title="Toggle 20-period Simple Moving Average"
            >
              SMA 20
            </button>
            <button
              type="button"
              onClick={() => setShowSMA50((prev) => !prev)}
              className={cn(
                'px-2 py-0.5 text-[11px] font-mono rounded transition-colors cursor-pointer',
                showSMA50
                  ? 'bg-amber-900/60 text-amber-300 border border-amber-700/60 font-semibold'
                  : 'text-zinc-400 hover:text-zinc-200'
              )}
              title="Toggle 50-period Simple Moving Average"
            >
              SMA 50
            </button>
            <button
              type="button"
              onClick={() => setShowVolume((prev) => !prev)}
              className={cn(
                'flex items-center gap-1 px-2 py-0.5 text-[11px] font-mono rounded transition-colors cursor-pointer',
                showVolume
                  ? 'bg-zinc-800 text-zinc-200 font-semibold'
                  : 'text-zinc-500 hover:text-zinc-300'
              )}
              title="Toggle Volume Histogram"
            >
              <Volume2 className="h-3 w-3" />
              <span>Vol</span>
            </button>
          </div>
        )}

        {/* Currency Denomination Badge */}
        <div className="hidden sm:flex items-center text-[11px] font-mono text-zinc-400 gap-1">
          <span>Skala:</span>
          <span
            className={cn(
              'font-semibold px-1.5 py-0.5 rounded border text-[10px]',
              currency === 'IDR'
                ? 'bg-emerald-950/70 text-emerald-400 border-emerald-800/80'
                : 'bg-blue-950/70 text-blue-400 border-blue-800/80'
            )}
          >
            {currency}
          </span>
        </div>
      </div>

      {/* Real-Time Live Hover Legend for Price Action */}
      {chartType !== 'var' && (
        <div className="flex flex-wrap items-center gap-x-3.5 gap-y-1 text-xs font-mono bg-zinc-950/60 px-3 py-1.5 rounded-lg border border-zinc-800/60">
          <span className="text-zinc-400">{activeLegend.timeStr}</span>
          <span>
            O: <strong className="text-zinc-100">{formatCurrency(activeLegend.open, currency)}</strong>
          </span>
          <span>
            H: <strong className="text-zinc-100">{formatCurrency(activeLegend.high, currency)}</strong>
          </span>
          <span>
            L: <strong className="text-zinc-100">{formatCurrency(activeLegend.low, currency)}</strong>
          </span>
          <span>
            C: <strong className="text-zinc-100">{formatCurrency(activeLegend.close, currency)}</strong>
          </span>
          {showVolume && activeLegend.volume > 0 && (
            <span>
              Vol: <strong className="text-zinc-300">{formatVolume(activeLegend.volume)}</strong>
            </span>
          )}
          <span
            className={cn(
              'font-semibold ml-auto',
              activeLegend.change >= 0 ? 'text-green-400' : 'text-red-400'
            )}
          >
            {activeLegend.change >= 0 ? '+' : ''}
            {formatPercent(activeLegend.changePercent)}
          </span>
        </div>
      )}

      {/* Main Chart Presentation: TradingView Canvas vs VaR Distribution */}
      {chartType === 'var' ? (
        <div className="space-y-4">
          {/* VaR Risk Metrics Row */}
          {varAnalysis && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              <div className="rounded-xl border border-red-900/40 bg-red-950/20 p-3">
                <div className="text-[11px] font-semibold text-red-400 uppercase tracking-wider">
                  1-Day 95% VaR
                </div>
                <div className="mt-1 font-mono text-lg font-bold text-red-300">
                  {varAnalysis.var95Historical.toFixed(2)}%
                </div>
                <div className="text-[10px] text-zinc-400 mt-0.5">
                  Max loss expected on 19/20 trading sessions
                </div>
              </div>

              <div className="rounded-xl border border-red-950 bg-red-950/40 p-3">
                <div className="text-[11px] font-semibold text-red-300 uppercase tracking-wider">
                  1-Day 99% VaR (Tail)
                </div>
                <div className="mt-1 font-mono text-lg font-bold text-red-200">
                  {varAnalysis.var99Historical.toFixed(2)}%
                </div>
                <div className="text-[10px] text-zinc-400 mt-0.5">
                  1% extreme catastrophic tail risk
                </div>
              </div>

              <div className="rounded-xl border border-amber-900/40 bg-amber-950/20 p-3">
                <div className="text-[11px] font-semibold text-amber-400 uppercase tracking-wider">
                  CVaR (Expected Shortfall)
                </div>
                <div className="mt-1 font-mono text-lg font-bold text-amber-300">
                  {varAnalysis.cvar95.toFixed(2)}%
                </div>
                <div className="text-[10px] text-zinc-400 mt-0.5">
                  Avg loss when 95% VaR is breached
                </div>
              </div>

              <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-3">
                <div className="text-[11px] font-semibold text-zinc-300 uppercase tracking-wider">
                  Annualized Volatility
                </div>
                <div className="mt-1 font-mono text-lg font-bold text-zinc-100">
                  {varAnalysis.annualizedVol.toFixed(1)}%
                </div>
                <div className="text-[10px] text-zinc-400 mt-0.5">
                  $\sigma \times \sqrt{252}$ trading days
                </div>
              </div>
            </div>
          )}

          {/* VaR Returns Histogram Distribution */}
          <div className="rounded-xl border border-zinc-800/80 bg-zinc-950 p-4">
            <div className="flex items-center justify-between mb-3 text-xs">
              <span className="font-semibold text-zinc-300">
                Historical Return Probability Distribution ({period.toUpperCase()})
              </span>
              <span className="text-[11px] font-mono text-zinc-500">
                Sample: {varAnalysis?.sampleSize} trading days
              </span>
            </div>

            {varAnalysis && (
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={varAnalysis.bins} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
                  <XAxis
                    dataKey="range"
                    tick={{ fill: '#71717a', fontSize: 10 }}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis
                    tick={{ fill: '#71717a', fontSize: 10 }}
                    tickLine={false}
                    axisLine={false}
                    allowDecimals={false}
                  />
                  <RechartsTooltip
                    content={({ active, payload }) => {
                      if (!active || !payload || !payload.length) return null
                      const item = payload[0].payload
                      return (
                        <div className="rounded-lg border border-zinc-800 bg-zinc-950 p-2.5 text-xs shadow-xl font-mono space-y-1">
                          <div className="text-zinc-300 font-semibold">
                            Return Range: {item.range}
                          </div>
                          <div className="text-zinc-400">
                            Frequency: <strong className="text-white">{item.count} days</strong>
                          </div>
                          {item.isExtremeTail && (
                            <div className="text-red-400 text-[10px]">
                              ⚠ Tail Risk Zone (&le; 95% VaR)
                            </div>
                          )}
                        </div>
                      )
                    }}
                  />
                  <ReferenceLine
                    x={`${varAnalysis.var95Historical >= 0 ? '+' : ''}${varAnalysis.var95Historical.toFixed(1)}%`}
                    stroke="#ef4444"
                    strokeDasharray="4 4"
                    label={{
                      value: '95% VaR',
                      fill: '#ef4444',
                      fontSize: 10,
                      position: 'top',
                    }}
                  />
                  <Bar
                    dataKey="count"
                    shape={(props: any) => {
                      const { x, y, width, height, isExtremeTail, isPositive } = props
                      const fill = isExtremeTail
                        ? '#ef4444' // Red for tail risk
                        : isPositive
                        ? '#22c55e' // Green for positive days
                        : '#52525b' // Zinc for small pullbacks
                      return (
                        <rect
                          x={x}
                          y={y}
                          width={width}
                          height={height}
                          fill={fill}
                          rx={3}
                          opacity={0.85}
                        />
                      )
                    }}
                  />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      ) : (
        /* TradingView Lightweight Charts Container */
        <div className="relative w-full overflow-hidden rounded-xl border border-zinc-800/80 bg-zinc-950">
          <div ref={chartContainerRef} className="w-full h-[320px]" />
          <div className="absolute bottom-2 right-3 pointer-events-none text-[10px] font-mono text-zinc-600">
            Powered by TradingView Lightweight Charts
          </div>
        </div>
      )}
    </div>
  )
}
