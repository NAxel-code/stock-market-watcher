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
  LineStyle,
  type IChartApi,
  type ISeriesApi,
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
  Maximize2,
  Minimize2,
  Layers,
} from 'lucide-react'
import {
  computeSMA,
  computeEMA,
  computeBollingerBands,
  computeVWAP,
  type OHLCVPoint,
} from '@/lib/indicators'
import { usePaperTradingStore } from '@/stores/usePaperTradingStore'

const PERIODS: { label: string; value: Period }[] = [
  { label: '1D', value: '1d' },
  { label: '1W', value: '1w' },
  { label: '1M', value: '1m' },
  { label: '3M', value: '3m' },
  { label: '1Y', value: '1y' },
]

export interface ChartTradePosition {
  entryPrice: number
  takeProfit?: number
  stopLoss?: number
  side?: 'BUY' | 'SELL'
}

interface PriceChartProps {
  ticker: string
  currency?: string
  previousClose?: number
  activeTradePosition?: ChartTradePosition
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

export function PriceChart({
  ticker,
  currency = 'USD',
  previousClose,
  activeTradePosition,
}: PriceChartProps) {
  const [period, setPeriod] = useState<Period>('1m')
  const [chartType, setChartType] = useState<ChartType>('candle')
  const [isExpanded, setIsExpanded] = useState<boolean>(false)

  // Technical Indicators Tray State
  const [showVolume, setShowVolume] = useState<boolean>(true)
  const [showEMA9, setShowEMA9] = useState<boolean>(false)
  const [showEMA21, setShowEMA21] = useState<boolean>(false)
  const [showSMA20, setShowSMA20] = useState<boolean>(false)
  const [showEMA50, setShowEMA50] = useState<boolean>(false)
  const [showEMA200, setShowEMA200] = useState<boolean>(false)
  const [showBB, setShowBB] = useState<boolean>(false)
  const [showVWAP, setShowVWAP] = useState<boolean>(false)

  const [hoveredPoint, setHoveredPoint] = useState<HoverLegendData | null>(null)

  const chartContainerRef = useRef<HTMLDivElement>(null)
  const chartInstanceRef = useRef<IChartApi | null>(null)

  const { data, isLoading, error } = useStockHistory(ticker, period)

  // Read active position from paper trading store if not explicitly passed as prop
  const storePosition = usePaperTradingStore((state) => state.getPositionForTicker(ticker))
  const positionToRender = activeTradePosition ?? (storePosition ? {
    entryPrice: storePosition.entryPrice,
    takeProfit: storePosition.takeProfit,
    stopLoss: storePosition.stopLoss,
    side: storePosition.side,
  } : undefined)

  // Transform and sort data points strictly ascending in time
  const processedData = useMemo<OHLCVPoint[]>(() => {
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

    // Build return frequency histogram bins (18 bins)
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

    const chartHeight = isExpanded ? 520 : 340

    const chart = createChart(container, {
      width: container.clientWidth,
      height: chartHeight,
      layout: {
        background: { type: ColorType.Solid, color: '#07080A' },
        textColor: '#6F7887',
        fontFamily: 'inherit',
      },
      grid: {
        vertLines: { color: '#121620' },
        horzLines: { color: '#121620' },
      },
      crosshair: {
        mode: CrosshairMode.Normal,
      },
      timeScale: {
        borderColor: '#161C26',
        timeVisible: period === '1d',
        secondsVisible: false,
      },
      rightPriceScale: {
        borderColor: '#161C26',
        scaleMargins: {
          top: 0.08,
          bottom: showVolume ? 0.22 : 0.06,
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

    // 1. Add Main Price Series according to selected chartType
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let primarySeries: ISeriesApi<any>

    if (chartType === 'candle') {
      const candleSeries = chart.addSeries(CandlestickSeries, {
        upColor: '#00E599',
        downColor: '#FF3B56',
        borderVisible: false,
        wickUpColor: '#00E599',
        wickDownColor: '#FF3B56',
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
      primarySeries = candleSeries
    } else if (chartType === 'bar') {
      const barSeries = chart.addSeries(BarSeries, {
        upColor: '#00E599',
        downColor: '#FF3B56',
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
      primarySeries = barSeries
    } else {
      // Area / Line Trend
      const isUp =
        (processedData[processedData.length - 1]?.close ?? 0) >=
        (processedData[0]?.open ?? 0)
      const color = isUp ? '#00E599' : '#FF3B56'
      const areaSeries = chart.addSeries(AreaSeries, {
        topColor: isUp ? 'rgba(0, 229, 153, 0.25)' : 'rgba(255, 59, 86, 0.25)',
        bottomColor: 'rgba(7, 8, 10, 0.0)',
        lineColor: color,
        lineWidth: 2,
      })
      areaSeries.setData(
        processedData.map((d) => ({
          time: d.time as UTCTimestamp,
          value: d.close,
        }))
      )
      primarySeries = areaSeries
    }

    // 2. Add Volume Histogram (Optional overlay)
    if (showVolume) {
      const volumeSeries = chart.addSeries(HistogramSeries, {
        color: '#272E3B',
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
          color: d.close >= d.open ? 'rgba(0, 229, 153, 0.25)' : 'rgba(255, 59, 86, 0.25)',
        }))
      )
    }

    // 3. Technical Indicator Overlays
    // EMA 9 (Cyan)
    if (showEMA9) {
      const ema9Data = computeEMA(processedData, 9)
      if (ema9Data.length > 0) {
        const ema9Series = chart.addSeries(LineSeries, {
          color: '#00B2FF',
          lineWidth: 1,
          title: 'EMA 9',
        })
        ema9Series.setData(ema9Data)
      }
    }

    // EMA 21 (Neo-Emerald)
    if (showEMA21) {
      const ema21Data = computeEMA(processedData, 21)
      if (ema21Data.length > 0) {
        const ema21Series = chart.addSeries(LineSeries, {
          color: '#00E599',
          lineWidth: 1,
          title: 'EMA 21',
        })
        ema21Series.setData(ema21Data)
      }
    }

    // SMA 20 (Royal Blue)
    if (showSMA20) {
      const sma20Data = computeSMA(processedData, 20)
      if (sma20Data.length > 0) {
        const sma20Series = chart.addSeries(LineSeries, {
          color: '#3B82F6',
          lineWidth: 1,
          title: 'SMA 20',
        })
        sma20Series.setData(sma20Data)
      }
    }

    // EMA 50 (Amber)
    if (showEMA50) {
      const ema50Data = computeEMA(processedData, 50)
      if (ema50Data.length > 0) {
        const ema50Series = chart.addSeries(LineSeries, {
          color: '#FFB800',
          lineWidth: 2,
          title: 'EMA 50',
        })
        ema50Series.setData(ema50Data)
      }
    }

    // EMA 200 (Purple)
    if (showEMA200) {
      const ema200Data = computeEMA(processedData, 200)
      if (ema200Data.length > 0) {
        const ema200Series = chart.addSeries(LineSeries, {
          color: '#A855F7',
          lineWidth: 2,
          title: 'EMA 200',
        })
        ema200Series.setData(ema200Data)
      }
    }

    // Bollinger Bands (20, 2)
    if (showBB) {
      const bbData = computeBollingerBands(processedData, 20, 2)
      if (bbData.middle.length > 0) {
        const upperSeries = chart.addSeries(LineSeries, {
          color: '#8C96A5',
          lineWidth: 1,
          lineStyle: LineStyle.Dotted,
          title: 'BB Upper',
        })
        upperSeries.setData(bbData.upper)

        const midSeries = chart.addSeries(LineSeries, {
          color: '#3B82F6',
          lineWidth: 1,
          lineStyle: LineStyle.SparseDotted,
          title: 'BB Mid',
        })
        midSeries.setData(bbData.middle)

        const lowerSeries = chart.addSeries(LineSeries, {
          color: '#8C96A5',
          lineWidth: 1,
          lineStyle: LineStyle.Dotted,
          title: 'BB Lower',
        })
        lowerSeries.setData(bbData.lower)
      }
    }

    // VWAP (Gold)
    if (showVWAP) {
      const vwapData = computeVWAP(processedData)
      if (vwapData.length > 0) {
        const vwapSeries = chart.addSeries(LineSeries, {
          color: '#FACC15',
          lineWidth: 2,
          title: 'VWAP',
        })
        vwapSeries.setData(vwapData)
      }
    }

    // 4. Paper Trading Price Line Overlays (Entry, TP, SL)
    if (positionToRender && primarySeries) {
      if (positionToRender.entryPrice > 0) {
        primarySeries.createPriceLine({
          price: positionToRender.entryPrice,
          color: '#00B2FF',
          lineWidth: 2,
          lineStyle: LineStyle.Dashed,
          axisLabelVisible: true,
          title: `ENTRY (${formatCurrency(positionToRender.entryPrice, currency)})`,
        })
      }

      if (positionToRender.takeProfit && positionToRender.takeProfit > 0) {
        const tpGain = positionToRender.entryPrice > 0
          ? ((positionToRender.takeProfit - positionToRender.entryPrice) / positionToRender.entryPrice) * 100
          : 0
        primarySeries.createPriceLine({
          price: positionToRender.takeProfit,
          color: '#00E599',
          lineWidth: 2,
          lineStyle: LineStyle.Dashed,
          axisLabelVisible: true,
          title: `TP +${tpGain.toFixed(1)}%`,
        })
      }

      if (positionToRender.stopLoss && positionToRender.stopLoss > 0) {
        const slLoss = positionToRender.entryPrice > 0
          ? ((positionToRender.entryPrice - positionToRender.stopLoss) / positionToRender.entryPrice) * 100
          : 0
        primarySeries.createPriceLine({
          price: positionToRender.stopLoss,
          color: '#FF3B56',
          lineWidth: 2,
          lineStyle: LineStyle.Dashed,
          axisLabelVisible: true,
          title: `SL -${slLoss.toFixed(1)}%`,
        })
      }
    }

    // 5. Crosshair tracking to update top legend
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
            timeStr: new Date((match as unknown as { rawTime: string }).rawTime).toLocaleDateString('en-US', {
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
  }, [
    chartType,
    period,
    processedData,
    showVolume,
    showEMA9,
    showEMA21,
    showSMA20,
    showEMA50,
    showEMA200,
    showBB,
    showVWAP,
    isExpanded,
    positionToRender,
    currency,
  ])

  if (isLoading) {
    return (
      <div className="space-y-3">
        <div className="flex justify-between items-center">
          <div className="flex gap-2">
            {PERIODS.map((p) => (
              <Skeleton key={p.value} className="h-7 w-10 rounded-md bg-[#121620]" />
            ))}
          </div>
          <Skeleton className="h-7 w-20 rounded-md bg-[#121620]" />
        </div>
        <Skeleton className="h-80 w-full rounded-xl bg-[#121620]" />
      </div>
    )
  }

  if (error || !data || processedData.length === 0) {
    return (
      <div className="h-72 flex items-center justify-center text-sm text-[#FF3B56] border border-[#FF3B56]/30 rounded-xl bg-[#0D0F14]">
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
    timeStr: new Date((latestData as unknown as { rawTime: string }).rawTime).toLocaleDateString('en-US', {
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
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#161C26] pb-3">
        {/* Timeframe Selector */}
        <div className="flex gap-1 bg-[#07080A] p-1 rounded-md border border-[#161C26]">
          {PERIODS.map((p) => (
            <button
              key={p.value}
              type="button"
              onClick={() => setPeriod(p.value)}
              className={cn(
                'px-2.5 py-1 text-xs font-mono font-medium rounded transition-colors cursor-pointer',
                period === p.value
                  ? 'bg-[#161C26] text-[#F0F4F8] shadow-xs font-semibold'
                  : 'text-[#6F7887] hover:bg-[#0D0F14] hover:text-[#F0F4F8]'
              )}
              aria-pressed={period === p.value}
              aria-label={`Timeframe ${p.label}`}
            >
              {p.label}
            </button>
          ))}
        </div>

        {/* Chart View Mode Selectors: Area, Candle, Bar, VaR */}
        <div className="flex items-center gap-1 bg-[#07080A] p-1 rounded-md border border-[#161C26]">
          <button
            type="button"
            onClick={() => setChartType('area')}
            className={cn(
              'flex items-center gap-1.5 px-2.5 py-1 text-xs font-mono font-medium rounded transition-colors cursor-pointer',
              chartType === 'area'
                ? 'bg-[#161C26] text-[#00B2FF] font-semibold'
                : 'text-[#6F7887] hover:bg-[#0D0F14] hover:text-[#F0F4F8]'
            )}
            title="Area / Line Trend View"
          >
            <LineChart className="h-3.5 w-3.5 text-[#00B2FF]" />
            <span className="hidden sm:inline">Area</span>
          </button>
          <button
            type="button"
            onClick={() => setChartType('candle')}
            className={cn(
              'flex items-center gap-1.5 px-2.5 py-1 text-xs font-mono font-medium rounded transition-colors cursor-pointer',
              chartType === 'candle'
                ? 'bg-[#161C26] text-[#00E599] font-semibold'
                : 'text-[#6F7887] hover:bg-[#0D0F14] hover:text-[#F0F4F8]'
            )}
            title="TradingView Candlestick View (Wick + Body)"
          >
            <CandlestickChart className="h-3.5 w-3.5 text-[#00E599]" />
            <span>Candle</span>
          </button>
          <button
            type="button"
            onClick={() => setChartType('bar')}
            className={cn(
              'flex items-center gap-1.5 px-2.5 py-1 text-xs font-mono font-medium rounded transition-colors cursor-pointer',
              chartType === 'bar'
                ? 'bg-[#161C26] text-[#FFB800] font-semibold'
                : 'text-[#6F7887] hover:bg-[#0D0F14] hover:text-[#F0F4F8]'
            )}
            title="Classic Wall Street OHLC Bar View"
          >
            <BarChart3 className="h-3.5 w-3.5 text-[#FFB800]" />
            <span className="hidden sm:inline">Bar</span>
          </button>
          <button
            type="button"
            onClick={() => setChartType('var')}
            className={cn(
              'flex items-center gap-1.5 px-2.5 py-1 text-xs font-mono font-medium rounded transition-colors cursor-pointer',
              chartType === 'var'
                ? 'bg-[#A855F7]/15 text-[#A855F7] border border-[#A855F7]/30 font-semibold'
                : 'text-[#6F7887] hover:bg-[#0D0F14] hover:text-[#F0F4F8]'
            )}
            title="Value at Risk (VaR) & Return Volatility Distribution"
          >
            <ShieldAlert className="h-3.5 w-3.5 text-[#A855F7]" />
            <span>VaR Risk</span>
          </button>
        </div>

        {/* Right Tools: Expand / Theater Mode & Currency Badge */}
        <div className="flex items-center gap-2 ml-auto">
          {chartType !== 'var' && (
            <button
              type="button"
              onClick={() => setIsExpanded((prev) => !prev)}
              className={cn(
                'flex items-center gap-1 px-2.5 py-1 text-xs font-mono rounded border transition-colors cursor-pointer',
                isExpanded
                  ? 'bg-[#00E599]/15 text-[#00E599] border-[#00E599]/30 font-semibold'
                  : 'bg-[#07080A] text-[#6F7887] border-[#161C26] hover:text-[#F0F4F8]'
              )}
              title={isExpanded ? 'Restore standard chart canvas' : 'Expand chart to theater canvas mode'}
            >
              {isExpanded ? (
                <>
                  <Minimize2 className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">Standard</span>
                </>
              ) : (
                <>
                  <Maximize2 className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">Expand</span>
                </>
              )}
            </button>
          )}

          <div className="hidden sm:flex items-center text-[11px] font-mono text-[#6F7887] gap-1">
            <span>Skala:</span>
            <span
              className={cn(
                'font-semibold px-1.5 py-0.5 rounded border text-[10px]',
                currency === 'IDR'
                  ? 'bg-[#00E599]/10 text-[#00E599] border-[#00E599]/30'
                  : 'bg-[#00B2FF]/10 text-[#00B2FF] border-[#00B2FF]/30'
              )}
            >
              {currency}
            </span>
          </div>
        </div>
      </div>

      {/* INSTITUTIONAL INDICATOR TRAY (Purbaya Sadewa & Professional Terminal Style) */}
      {chartType !== 'var' && (
        <div className="flex flex-wrap items-center gap-1.5 bg-[#07080A] px-2.5 py-1.5 rounded-md border border-[#161C26] text-xs font-mono">
          <div className="flex items-center gap-1 text-[11px] text-[#6F7887] uppercase tracking-wider mr-1">
            <Layers className="h-3.5 w-3.5 text-[#00B2FF]" />
            <span className="hidden md:inline">Indicators:</span>
          </div>

          {/* EMA 9 */}
          <button
            type="button"
            onClick={() => setShowEMA9((prev) => !prev)}
            className={cn(
              'flex items-center gap-1 px-2 py-0.5 rounded text-[11px] transition-all cursor-pointer border',
              showEMA9
                ? 'bg-[#00B2FF]/15 text-[#00B2FF] border-[#00B2FF]/40 font-semibold'
                : 'border-transparent text-[#6F7887] hover:text-[#F0F4F8] hover:bg-[#121620]'
            )}
            title="9-period Exponential Moving Average (Momentum trigger)"
          >
            <span className="h-1.5 w-1.5 rounded-full bg-[#00B2FF]" />
            <span>EMA 9</span>
          </button>

          {/* EMA 21 */}
          <button
            type="button"
            onClick={() => setShowEMA21((prev) => !prev)}
            className={cn(
              'flex items-center gap-1 px-2 py-0.5 rounded text-[11px] transition-all cursor-pointer border',
              showEMA21
                ? 'bg-[#00E599]/15 text-[#00E599] border-[#00E599]/40 font-semibold'
                : 'border-transparent text-[#6F7887] hover:text-[#F0F4F8] hover:bg-[#121620]'
            )}
            title="21-period Exponential Moving Average (Swing baseline)"
          >
            <span className="h-1.5 w-1.5 rounded-full bg-[#00E599]" />
            <span>EMA 21</span>
          </button>

          {/* SMA 20 */}
          <button
            type="button"
            onClick={() => setShowSMA20((prev) => !prev)}
            className={cn(
              'flex items-center gap-1 px-2 py-0.5 rounded text-[11px] transition-all cursor-pointer border',
              showSMA20
                ? 'bg-[#3B82F6]/15 text-[#3B82F6] border-[#3B82F6]/40 font-semibold'
                : 'border-transparent text-[#6F7887] hover:text-[#F0F4F8] hover:bg-[#121620]'
            )}
            title="20-period Simple Moving Average (Mean reversion)"
          >
            <span className="h-1.5 w-1.5 rounded-full bg-[#3B82F6]" />
            <span>SMA 20</span>
          </button>

          {/* EMA 50 */}
          <button
            type="button"
            onClick={() => setShowEMA50((prev) => !prev)}
            className={cn(
              'flex items-center gap-1 px-2 py-0.5 rounded text-[11px] transition-all cursor-pointer border',
              showEMA50
                ? 'bg-[#FFB800]/15 text-[#FFB800] border-[#FFB800]/40 font-semibold'
                : 'border-transparent text-[#6F7887] hover:text-[#F0F4F8] hover:bg-[#121620]'
            )}
            title="50-period Exponential Moving Average (Institutional trend)"
          >
            <span className="h-1.5 w-1.5 rounded-full bg-[#FFB800]" />
            <span>EMA 50</span>
          </button>

          {/* EMA 200 */}
          <button
            type="button"
            onClick={() => setShowEMA200((prev) => !prev)}
            className={cn(
              'flex items-center gap-1 px-2 py-0.5 rounded text-[11px] transition-all cursor-pointer border',
              showEMA200
                ? 'bg-[#A855F7]/15 text-[#A855F7] border-[#A855F7]/40 font-semibold'
                : 'border-transparent text-[#6F7887] hover:text-[#F0F4F8] hover:bg-[#121620]'
            )}
            title="200-period Exponential Moving Average (Macro bull/bear line)"
          >
            <span className="h-1.5 w-1.5 rounded-full bg-[#A855F7]" />
            <span>EMA 200</span>
          </button>

          {/* Bollinger Bands */}
          <button
            type="button"
            onClick={() => setShowBB((prev) => !prev)}
            className={cn(
              'flex items-center gap-1 px-2 py-0.5 rounded text-[11px] transition-all cursor-pointer border',
              showBB
                ? 'bg-[#8C96A5]/20 text-[#F0F4F8] border-[#8C96A5]/50 font-semibold'
                : 'border-transparent text-[#6F7887] hover:text-[#F0F4F8] hover:bg-[#121620]'
            )}
            title="Bollinger Bands (20 periods, 2 standard deviations)"
          >
            <span className="h-1.5 w-1.5 rounded-full bg-[#8C96A5]" />
            <span>BB (20,2)</span>
          </button>

          {/* VWAP */}
          <button
            type="button"
            onClick={() => setShowVWAP((prev) => !prev)}
            className={cn(
              'flex items-center gap-1 px-2 py-0.5 rounded text-[11px] transition-all cursor-pointer border',
              showVWAP
                ? 'bg-[#FACC15]/15 text-[#FACC15] border-[#FACC15]/40 font-semibold'
                : 'border-transparent text-[#6F7887] hover:text-[#F0F4F8] hover:bg-[#121620]'
            )}
            title="Volume-Weighted Average Price (Intraday institutional benchmark)"
          >
            <span className="h-1.5 w-1.5 rounded-full bg-[#FACC15]" />
            <span>VWAP</span>
          </button>

          {/* Volume Overlay */}
          <button
            type="button"
            onClick={() => setShowVolume((prev) => !prev)}
            className={cn(
              'flex items-center gap-1 px-2 py-0.5 rounded text-[11px] transition-all cursor-pointer border ml-auto',
              showVolume
                ? 'bg-[#161C26] text-[#F0F4F8] border-[#272E3B] font-semibold'
                : 'border-transparent text-[#6F7887] hover:text-[#F0F4F8] hover:bg-[#121620]'
            )}
            title="Toggle Volume Histogram Overlay"
          >
            <Volume2 className="h-3 w-3" />
            <span>Vol</span>
          </button>
        </div>
      )}

      {/* Real-Time Live Hover Legend for Price Action */}
      {chartType !== 'var' && (
        <div className="flex flex-wrap items-center gap-x-3.5 gap-y-1 text-xs font-mono bg-[#07080A] px-3 py-1.5 rounded-md border border-[#161C26]">
          <span className="text-[#6F7887]">{activeLegend.timeStr}</span>
          <span>
            O: <strong className="text-[#F0F4F8]">{formatCurrency(activeLegend.open, currency)}</strong>
          </span>
          <span>
            H: <strong className="text-[#F0F4F8]">{formatCurrency(activeLegend.high, currency)}</strong>
          </span>
          <span>
            L: <strong className="text-[#F0F4F8]">{formatCurrency(activeLegend.low, currency)}</strong>
          </span>
          <span>
            C: <strong className="text-[#F0F4F8]">{formatCurrency(activeLegend.close, currency)}</strong>
          </span>
          {showVolume && activeLegend.volume > 0 && (
            <span>
              Vol: <strong className="text-[#8C96A5]">{formatVolume(activeLegend.volume)}</strong>
            </span>
          )}
          <span
            className={cn(
              'font-semibold ml-auto tabular-nums',
              activeLegend.change >= 0 ? 'text-[#00E599]' : 'text-[#FF3B56]'
            )}
          >
            {activeLegend.change >= 0 ? '+' : ''}
            {formatPercent(activeLegend.changePercent)}
          </span>
        </div>
      )}

      {/* Active Paper Trading Bracket Notification Pill */}
      {positionToRender && chartType !== 'var' && (
        <div className="flex flex-wrap items-center gap-2 px-3 py-1 bg-[#121620] rounded border border-[#161C26] text-[11px] font-mono text-[#8C96A5]">
          <span className="flex items-center gap-1.5 text-[#00B2FF] font-semibold">
            <span className="h-2 w-2 rounded-full bg-[#00B2FF] animate-pulse" />
            Simulated Position Active:
          </span>
          <span>
            Entry: <strong className="text-[#F0F4F8]">{formatCurrency(positionToRender.entryPrice, currency)}</strong>
          </span>
          {positionToRender.takeProfit && (
            <span>
              TP: <strong className="text-[#00E599]">{formatCurrency(positionToRender.takeProfit, currency)}</strong>
            </span>
          )}
          {positionToRender.stopLoss && (
            <span>
              SL: <strong className="text-[#FF3B56]">{formatCurrency(positionToRender.stopLoss, currency)}</strong>
            </span>
          )}
        </div>
      )}

      {/* Main Chart Presentation: TradingView Canvas vs VaR Distribution */}
      {chartType === 'var' ? (
        <div className="space-y-4">
          {/* VaR Risk Metrics Row */}
          {varAnalysis && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              <div className="rounded-md border border-[#FF3B56]/30 bg-[#FF3B56]/10 p-3">
                <div className="text-[11px] font-semibold text-[#FF3B56] uppercase tracking-wider font-mono">
                  1-Day 95% VaR
                </div>
                <div className="mt-1 font-mono text-lg font-bold text-[#FF3B56] tabular-nums">
                  {varAnalysis.var95Historical.toFixed(2)}%
                </div>
                <div className="text-[10px] text-[#6F7887] mt-0.5">
                  Max loss on 19 of 20 sessions
                </div>
              </div>

              <div className="rounded-md border border-[#FF3B56]/40 bg-[#FF3B56]/15 p-3">
                <div className="text-[11px] font-semibold text-[#FF3B56] uppercase tracking-wider font-mono">
                  1-Day 99% VaR
                </div>
                <div className="mt-1 font-mono text-lg font-bold text-[#FF3B56] tabular-nums">
                  {varAnalysis.var99Historical.toFixed(2)}%
                </div>
                <div className="text-[10px] text-[#6F7887] mt-0.5">
                  Extreme tail risk threshold
                </div>
              </div>

              <div className="rounded-md border border-[#FFB800]/30 bg-[#FFB800]/10 p-3">
                <div className="text-[11px] font-semibold text-[#FFB800] uppercase tracking-wider font-mono">
                  CVaR (95% ES)
                </div>
                <div className="mt-1 font-mono text-lg font-bold text-[#FFB800] tabular-nums">
                  {varAnalysis.cvar95.toFixed(2)}%
                </div>
                <div className="text-[10px] text-[#6F7887] mt-0.5">
                  Expected Shortfall beyond VaR
                </div>
              </div>

              <div className="rounded-md border border-[#161C26] bg-[#07080A] p-3">
                <div className="text-[11px] font-semibold text-[#8C96A5] uppercase tracking-wider font-mono">
                  Annual Volatility
                </div>
                <div className="mt-1 font-mono text-lg font-bold text-[#00E599] tabular-nums">
                  {varAnalysis.annualizedVol.toFixed(2)}%
                </div>
                <div className="text-[10px] text-[#6F7887] mt-0.5">
                  Normalized ~252 sessions
                </div>
              </div>
            </div>
          )}

          {/* Histogram Chart */}
          {varAnalysis && (
            <div className="rounded-md border border-[#161C26] bg-[#07080A] p-4">
              <div className="flex items-center justify-between mb-3 text-xs font-mono">
                <span className="text-[#8C96A5] font-semibold">
                  Daily Return Distribution ({varAnalysis.sampleSize} periods)
                </span>
                <span className="text-[#6F7887]">
                  Red bars = 5% Left Tail Risk Zone
                </span>
              </div>
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={varAnalysis.bins} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#121620" vertical={false} />
                    <XAxis
                      dataKey="range"
                      stroke="#6F7887"
                      fontSize={10}
                      tickLine={false}
                    />
                    <YAxis
                      stroke="#6F7887"
                      fontSize={10}
                      tickLine={false}
                      allowDecimals={false}
                    />
                    <RechartsTooltip
                      contentStyle={{
                        backgroundColor: '#0D0F14',
                        borderColor: '#161C26',
                        borderRadius: '6px',
                        fontSize: '11px',
                        fontFamily: 'monospace',
                      }}
                      // eslint-disable-next-line @typescript-eslint/no-explicit-any
                      formatter={(val: any) => [`${val ?? 0} sessions`, 'Count']}
                    />
                    <ReferenceLine x="0.0%" stroke="#3B82F6" strokeDasharray="2 2" />
                    <Bar
                      dataKey="count"
                      shape={(props: unknown) => {
                        // eslint-disable-next-line @typescript-eslint/no-explicit-any
                        const p = props as any
                        const isTail = p.payload?.isExtremeTail
                        const fill = isTail ? '#FF3B56' : '#272E3B'
                        return <rect {...p} fill={fill} rx={2} />
                      }}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div
          ref={chartContainerRef}
          className="w-full rounded-md border border-[#161C26] overflow-hidden transition-all duration-200"
          style={{ height: isExpanded ? 520 : 340 }}
        />
      )}
    </div>
  )
}
