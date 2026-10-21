'use client'

import React from 'react'
import {
  AlertTriangle,
  ArrowDownRight,
  ArrowUpRight,
  BarChart2,
  CheckCircle2,
  Clock,
  Compass,
  Layers,
  Percent,
  RefreshCw,
  ShieldAlert,
  ShieldCheck,
  TrendingDown,
  TrendingUp,
  XCircle,
  Zap,
} from 'lucide-react'
import { useStockDesk } from '@/hooks/useStockDesk'
import { formatCurrency, formatPercent } from '@/lib/formatters'

interface AnalysisDeskTabProps {
  ticker: string
}

export function AnalysisDeskTab({ ticker }: AnalysisDeskTabProps) {
  const { data: desk, isLoading, isError, error, refetch } = useStockDesk(ticker)

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[420px] rounded-2xl border border-zinc-800 bg-zinc-950/60 p-8 text-center backdrop-blur-md">
        <div className="relative mb-4 flex items-center justify-center">
          <div className="h-14 w-14 animate-spin rounded-full border-2 border-emerald-500/20 border-t-emerald-500" />
          <Compass className="absolute h-6 w-6 text-emerald-400 animate-pulse" />
        </div>
        <h3 className="text-lg font-semibold text-zinc-100">
          Generating Institutional Technical Desk Analysis
        </h3>
        <p className="mt-1 text-sm text-zinc-400 max-w-md">
          Running Stan Weinstein 4-stage cycle engine, Volume Spread Analysis, swing pivots, and multi-scenario forecast for <span className="font-mono text-zinc-200">{ticker}</span>...
        </p>
      </div>
    )
  }

  if (isError || !desk) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[320px] rounded-2xl border border-rose-900/40 bg-zinc-950/80 p-8 text-center">
        <AlertTriangle className="h-10 w-10 text-rose-400 mb-3" />
        <h3 className="text-base font-medium text-zinc-100">Unable to load technical desk analysis</h3>
        <p className="mt-1 text-xs text-zinc-400 max-w-sm">
          {error?.message || 'Failed to fetch historical indicators or compute institutional desk analytics.'}
        </p>
        <button
          onClick={() => refetch()}
          className="mt-4 inline-flex items-center gap-2 px-3.5 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-xs font-medium text-zinc-200 transition-colors"
        >
          <RefreshCw className="h-3.5 w-3.5" />
          Retry Analysis
        </button>
      </div>
    )
  }

  const { stage, trade_plan, scenarios, market_structure, vsa, momentum, relative_strength } = desk

  // Verdict style mapping
  const verdictConfig = {
    AVOID: {
      bg: 'bg-rose-500/10 border-rose-500/30 text-rose-400',
      badge: 'bg-rose-500 text-zinc-950',
      icon: ShieldAlert,
    },
    'BUY ON BREAKOUT': {
      bg: 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400',
      badge: 'bg-emerald-500 text-zinc-950',
      icon: ArrowUpRight,
    },
    'BUY ON WEAKNESS': {
      bg: 'bg-teal-500/10 border-teal-500/30 text-teal-400',
      badge: 'bg-teal-500 text-zinc-950',
      icon: TrendingUp,
    },
    'TAKE PROFIT': {
      bg: 'bg-amber-500/10 border-amber-500/30 text-amber-400',
      badge: 'bg-amber-500 text-zinc-950',
      icon: AlertTriangle,
    },
    HOLD: {
      bg: 'bg-blue-500/10 border-blue-500/30 text-blue-400',
      badge: 'bg-blue-500 text-zinc-950',
      icon: ShieldCheck,
    },
  }[trade_plan.verdict] || {
    bg: 'bg-zinc-800 border-zinc-700 text-zinc-300',
    badge: 'bg-zinc-700 text-zinc-200',
    icon: Compass,
  }

  const VerdictIcon = verdictConfig.icon

  return (
    <div className="space-y-6">
      {/* 1. STAGE & CYCLE BANNER */}
      <div className="rounded-2xl border border-zinc-800/90 bg-gradient-to-b from-zinc-900/90 via-zinc-900/50 to-zinc-950 p-5 md:p-6 shadow-xl backdrop-blur-md">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded text-[11px] font-mono font-medium tracking-wider uppercase bg-zinc-800 text-zinc-300 border border-zinc-700/60">
                Stan Weinstein Cycle
              </span>
              <span className="text-xs text-zinc-400 flex items-center gap-1">
                <Clock className="h-3 w-3" /> As of {desk.as_of_date}
              </span>
            </div>
            <h2 className="text-xl md:text-2xl font-bold tracking-tight text-zinc-100 flex items-center gap-2.5">
              <span>{stage.stage_name}</span>
            </h2>
            <p className="text-xs md:text-sm text-zinc-400 max-w-3xl leading-relaxed">
              {stage.description}
            </p>
          </div>

          <div className="flex items-center gap-2 self-start md:self-center shrink-0">
            <span
              className={`px-3 py-1 rounded-full text-xs font-semibold tracking-wide border ${
                stage.bias === 'BULLISH'
                  ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-400'
                  : stage.bias === 'BEARISH'
                  ? 'bg-rose-500/15 border-rose-500/40 text-rose-400'
                  : 'bg-amber-500/15 border-amber-500/40 text-amber-400'
              }`}
            >
              {stage.bias} BIAS
            </span>
            <span className="px-3 py-1 rounded-full text-xs font-mono font-medium bg-zinc-800/90 border border-zinc-700 text-zinc-200">
              {stage.confidence_pct}% Confidence
            </span>
          </div>
        </div>

        {/* 4-Stage Visual Progress Bar */}
        <div className="mt-6 pt-5 border-t border-zinc-800/80">
          <div className="grid grid-cols-4 gap-2 text-center text-xs font-medium">
            {[
              { num: 1, label: 'Stage 1: Base', desc: 'Accumulation' },
              { num: 2, label: 'Stage 2: Advancing', desc: 'Markup' },
              { num: 3, label: 'Stage 3: Top', desc: 'Distribution' },
              { num: 4, label: 'Stage 4: Declining', desc: 'Markdown' },
            ].map((step) => {
              const isActive = stage.stage_number === step.num
              return (
                <div
                  key={step.num}
                  className={`rounded-xl p-2.5 border transition-all ${
                    isActive
                      ? step.num === 2
                        ? 'bg-emerald-500/20 border-emerald-500/60 text-emerald-300 ring-2 ring-emerald-500/30'
                        : step.num === 4
                        ? 'bg-rose-500/20 border-rose-500/60 text-rose-300 ring-2 ring-rose-500/30'
                        : 'bg-amber-500/20 border-amber-500/60 text-amber-300 ring-2 ring-amber-500/30'
                      : 'bg-zinc-950/60 border-zinc-800/60 text-zinc-500 hover:text-zinc-400'
                  }`}
                >
                  <div className="flex items-center justify-center gap-1.5">
                    <span className="text-xs font-bold font-mono">#{step.num}</span>
                    <span className="truncate">{step.label.split(':')[1]}</span>
                  </div>
                  <div className="text-[10px] text-zinc-400 truncate mt-0.5">{step.desc}</div>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* 2. ACTIONABLE TRADE PLAN */}
      <div className={`rounded-2xl border p-5 md:p-6 ${verdictConfig.bg} shadow-lg backdrop-blur-md`}>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-5 border-b border-zinc-800/80">
          <div className="flex items-center gap-3">
            <div className={`h-10 w-10 rounded-xl flex items-center justify-center ${verdictConfig.badge}`}>
              <VerdictIcon className="h-5 w-5" />
            </div>
            <div>
              <div className="text-[11px] font-mono uppercase tracking-wider text-zinc-400">
                Actionable Trading Plan
              </div>
              <div className="text-2xl font-black tracking-tight text-zinc-100">
                {trade_plan.verdict}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="text-right">
              <div className="text-[10px] uppercase font-mono text-zinc-400">Risk : Reward</div>
              <div className="text-base font-mono font-bold text-zinc-100">
                {trade_plan.risk_reward_ratio}
              </div>
            </div>
          </div>
        </div>

        {/* Level Metrics Grid */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mt-5">
          <div className="rounded-xl bg-zinc-950/70 border border-zinc-800/80 p-3">
            <span className="text-[11px] font-medium text-zinc-400">Current Price</span>
            <div className="mt-1 text-base font-bold font-mono text-zinc-100">
              {formatCurrency(trade_plan.current_price, desk.currency)}
            </div>
          </div>

          <div className="rounded-xl bg-zinc-950/70 border border-zinc-800/80 p-3">
            <span className="text-[11px] font-medium text-zinc-400">Buy Entry Area</span>
            <div className="mt-1 text-sm font-bold font-mono text-emerald-400 truncate">
              {trade_plan.buy_area_min && trade_plan.buy_area_max
                ? `${formatCurrency(trade_plan.buy_area_min, desk.currency)} - ${formatCurrency(
                    trade_plan.buy_area_max,
                    desk.currency
                  )}`
                : 'Wait for base'}
            </div>
          </div>

          <div className="rounded-xl bg-zinc-950/70 border border-zinc-800/80 p-3">
            <span className="text-[11px] font-medium text-zinc-400">Stop Loss</span>
            <div className="mt-1 text-base font-bold font-mono text-rose-400">
              {trade_plan.stop_loss ? formatCurrency(trade_plan.stop_loss, desk.currency) : 'N/A'}
            </div>
          </div>

          <div className="rounded-xl bg-zinc-950/70 border border-zinc-800/80 p-3">
            <span className="text-[11px] font-medium text-zinc-400">Target 1 (Primary)</span>
            <div className="mt-1 text-base font-bold font-mono text-emerald-400">
              {trade_plan.target_1 ? formatCurrency(trade_plan.target_1, desk.currency) : 'N/A'}
            </div>
          </div>

          <div className="rounded-xl bg-zinc-950/70 border border-zinc-800/80 p-3 col-span-2 md:col-span-1">
            <span className="text-[11px] font-medium text-zinc-400">Target 2 (Extended)</span>
            <div className="mt-1 text-base font-bold font-mono text-cyan-400">
              {trade_plan.target_2 ? formatCurrency(trade_plan.target_2, desk.currency) : 'N/A'}
            </div>
          </div>
        </div>

        <p className="mt-4 text-xs text-zinc-300/90 leading-relaxed bg-zinc-950/50 p-3 rounded-lg border border-zinc-800/60 font-sans">
          <strong className="text-zinc-200">Execution Strategy:</strong> {trade_plan.rationale}
        </p>
      </div>

      {/* 3. CONDITIONAL 3-SCENARIO PROJECTION (20 BARS) */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Layers className="h-4 w-4 text-zinc-400" />
            <h3 className="text-sm font-bold uppercase tracking-wider text-zinc-200">
              20-Bar Conditional Scenarios
            </h3>
          </div>
          <span className="text-[11px] text-zinc-400">Probabilistic evidence-weighted model</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {scenarios.map((sc) => {
            const isUp = sc.direction === 'UP'
            const isDown = sc.direction === 'DOWN'

            return (
              <div
                key={sc.name}
                className="flex flex-col justify-between rounded-xl border border-zinc-800 bg-zinc-900/60 p-4 shadow-sm hover:border-zinc-700 transition-colors"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-zinc-200 flex items-center gap-1.5">
                      {isUp ? (
                        <ArrowUpRight className="h-4 w-4 text-emerald-400" />
                      ) : isDown ? (
                        <ArrowDownRight className="h-4 w-4 text-rose-400" />
                      ) : (
                        <Compass className="h-4 w-4 text-zinc-400" />
                      )}
                      {sc.name}
                    </span>
                    <span
                      className={`px-2 py-0.5 rounded-full text-xs font-mono font-bold ${
                        isUp
                          ? 'bg-emerald-500/20 text-emerald-400'
                          : isDown
                          ? 'bg-rose-500/20 text-rose-400'
                          : 'bg-zinc-800 text-zinc-300'
                      }`}
                    >
                      {sc.probability_pct}% Prob
                    </span>
                  </div>

                  <div className="mt-3 flex items-baseline justify-between border-y border-zinc-800/60 py-2">
                    <span className="text-[11px] text-zinc-400">Target Projection</span>
                    <div className="text-right">
                      <span className="font-mono text-sm font-bold text-zinc-100">
                        {sc.price_target ? formatCurrency(sc.price_target, desk.currency) : 'Range'}
                      </span>
                      {sc.price_target_pct !== null && sc.price_target_pct !== undefined && (
                        <span
                          className={`ml-1.5 text-xs font-mono ${
                            sc.price_target_pct >= 0 ? 'text-emerald-400' : 'text-rose-400'
                          }`}
                        >
                          ({sc.price_target_pct >= 0 ? '+' : ''}
                          {sc.price_target_pct}%)
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="mt-2.5">
                    <span className="text-[10px] font-mono uppercase text-zinc-400 block">
                      Trigger Requirement
                    </span>
                    <p className="text-xs text-zinc-300 mt-0.5">{sc.trigger_condition}</p>
                  </div>

                  {/* Supporting Factors */}
                  {sc.supporting_factors.length > 0 && (
                    <div className="mt-3 space-y-1">
                      <span className="text-[10px] font-mono uppercase text-emerald-400 flex items-center gap-1">
                        <CheckCircle2 className="h-3 w-3" /> Supporting Drivers ({sc.supporting_factors.length})
                      </span>
                      <ul className="text-[11px] text-zinc-300 space-y-0.5 pl-1">
                        {sc.supporting_factors.map((f, i) => (
                          <li key={i} className="flex items-start gap-1.5">
                            <span className="text-emerald-500">•</span>
                            <span>{f}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Opposing Factors */}
                  {sc.opposing_factors.length > 0 && (
                    <div className="mt-2.5 space-y-1">
                      <span className="text-[10px] font-mono uppercase text-rose-400 flex items-center gap-1">
                        <XCircle className="h-3 w-3" /> Opposing Headwinds ({sc.opposing_factors.length})
                      </span>
                      <ul className="text-[11px] text-zinc-400 space-y-0.5 pl-1">
                        {sc.opposing_factors.map((f, i) => (
                          <li key={i} className="flex items-start gap-1.5">
                            <span className="text-rose-500">•</span>
                            <span>{f}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* 4. MULTI-PILLAR MARKET INTELLIGENCE GRID */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Quadrant 1: Market Structure */}
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-4 space-y-3">
          <div className="flex items-center justify-between border-b border-zinc-800/80 pb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-zinc-200 flex items-center gap-1.5">
              <BarChart2 className="h-4 w-4 text-blue-400" /> Market Structure & Pivots
            </span>
            <span
              className={`px-2 py-0.5 rounded text-xs font-mono font-bold ${
                market_structure.trend_structure === 'HH-HL'
                  ? 'bg-emerald-500/15 text-emerald-400'
                  : market_structure.trend_structure === 'LH-LL'
                  ? 'bg-rose-500/15 text-rose-400'
                  : 'bg-zinc-800 text-zinc-300'
              }`}
            >
              {market_structure.trend_structure}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="rounded-lg bg-zinc-950/60 p-2.5 border border-zinc-800/60">
              <span className="text-zinc-400 block text-[11px]">Nearest Support</span>
              <span className="font-mono font-bold text-zinc-100 text-sm">
                {formatCurrency(market_structure.nearest_support, desk.currency)}
              </span>
            </div>
            <div className="rounded-lg bg-zinc-950/60 p-2.5 border border-zinc-800/60">
              <span className="text-zinc-400 block text-[11px]">Nearest Resistance</span>
              <span className="font-mono font-bold text-zinc-100 text-sm">
                {formatCurrency(market_structure.nearest_resistance, desk.currency)}
              </span>
            </div>
            <div className="rounded-lg bg-zinc-950/60 p-2.5 border border-zinc-800/60">
              <span className="text-zinc-400 block text-[11px]">300d Peak Drawdown</span>
              <span className="font-mono font-bold text-rose-400 text-sm">
                {market_structure.drawdown_300d_pct}%
              </span>
              <span className="text-[10px] text-zinc-500 block">Peak: {market_structure.peak_300d_price}</span>
            </div>
            <div className="rounded-lg bg-zinc-950/60 p-2.5 border border-zinc-800/60">
              <span className="text-zinc-400 block text-[11px]">MA200 20d Slope</span>
              <span
                className={`font-mono font-bold text-sm ${
                  (market_structure.ma200_slope_pct || 0) >= 0 ? 'text-emerald-400' : 'text-rose-400'
                }`}
              >
                {market_structure.ma200_slope_pct !== null ? `${market_structure.ma200_slope_pct}%` : 'N/A'}
              </span>
              <span className="text-[10px] text-zinc-500 block truncate">
                {market_structure.ma_stack_status.replace('_', ' ')}
              </span>
            </div>
          </div>
        </div>

        {/* Quadrant 2: Volume Spread Analysis (VSA) */}
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-4 space-y-3">
          <div className="flex items-center justify-between border-b border-zinc-800/80 pb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-zinc-200 flex items-center gap-1.5">
              <Zap className="h-4 w-4 text-amber-400" /> Volume Spread Analysis (VSA)
            </span>
            <span className="px-2 py-0.5 rounded text-xs font-mono font-medium bg-zinc-800 text-zinc-200">
              {vsa.participation_status}
            </span>
          </div>

          <div className="space-y-3 text-xs">
            <div>
              <div className="flex justify-between text-[11px] mb-1">
                <span className="text-zinc-400">20d Up/Down Volume Ratio</span>
                <span className="font-mono font-bold text-zinc-100">{vsa.up_down_volume_ratio_20d}</span>
              </div>
              <div className="h-2 w-full rounded-full bg-zinc-800 overflow-hidden flex">
                <div
                  className="bg-emerald-500 h-full"
                  style={{
                    width: `${Math.min(
                      85,
                      Math.max(15, (vsa.up_down_volume_ratio_20d / (vsa.up_down_volume_ratio_20d + 1)) * 100)
                    )}%`,
                  }}
                />
                <div className="bg-rose-500 h-full flex-1" />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2 pt-1">
              <div
                className={`rounded-lg p-2 text-center border ${
                  vsa.is_selling_climax
                    ? 'bg-rose-500/20 border-rose-500/50 text-rose-300'
                    : 'bg-zinc-950/60 border-zinc-800/60 text-zinc-500'
                }`}
              >
                <div className="text-[10px] font-mono">SELLING CLIMAX</div>
                <div className="font-bold text-xs mt-0.5">{vsa.is_selling_climax ? 'DETECTED' : 'None'}</div>
              </div>

              <div
                className={`rounded-lg p-2 text-center border ${
                  vsa.is_stopping_volume
                    ? 'bg-teal-500/20 border-teal-500/50 text-teal-300'
                    : 'bg-zinc-950/60 border-zinc-800/60 text-zinc-500'
                }`}
              >
                <div className="text-[10px] font-mono">STOPPING VOL</div>
                <div className="font-bold text-xs mt-0.5">{vsa.is_stopping_volume ? 'DETECTED' : 'None'}</div>
              </div>

              <div
                className={`rounded-lg p-2 text-center border ${
                  vsa.is_absorption
                    ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-300'
                    : 'bg-zinc-950/60 border-zinc-800/60 text-zinc-500'
                }`}
              >
                <div className="text-[10px] font-mono">ABSORPTION</div>
                <div className="font-bold text-xs mt-0.5">{vsa.is_absorption ? 'ACTIVE' : 'None'}</div>
              </div>
            </div>
          </div>
        </div>

        {/* Quadrant 3: Momentum & Money Flow */}
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-4 space-y-3">
          <div className="flex items-center justify-between border-b border-zinc-800/80 pb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-zinc-200 flex items-center gap-1.5">
              <TrendingUp className="h-4 w-4 text-emerald-400" /> Momentum & Chaikin Money Flow
            </span>
            <span
              className={`px-2 py-0.5 rounded text-xs font-mono font-bold ${
                momentum.cmf_status === 'NET_INFLOW'
                  ? 'bg-emerald-500/20 text-emerald-400'
                  : momentum.cmf_status === 'NET_OUTFLOW'
                  ? 'bg-rose-500/20 text-rose-400'
                  : 'bg-zinc-800 text-zinc-300'
              }`}
            >
              CMF {momentum.cmf_20}
            </span>
          </div>

          <div className="grid grid-cols-3 gap-2 text-xs">
            <div className="rounded-lg bg-zinc-950/60 p-2 border border-zinc-800/60">
              <span className="text-zinc-400 text-[10px] block">RSI (14)</span>
              <span className="font-mono font-bold text-zinc-100 text-sm">{momentum.rsi_14}</span>
              <span className="text-[9px] text-zinc-400 block">{momentum.rsi_status}</span>
            </div>

            <div className="rounded-lg bg-zinc-950/60 p-2 border border-zinc-800/60">
              <span className="text-zinc-400 text-[10px] block">MACD Hist</span>
              <span
                className={`font-mono font-bold text-sm ${
                  momentum.macd_histogram >= 0 ? 'text-emerald-400' : 'text-rose-400'
                }`}
              >
                {momentum.macd_histogram}
              </span>
              <span className="text-[9px] text-zinc-400 block">{momentum.macd_bias}</span>
            </div>

            <div className="rounded-lg bg-zinc-950/60 p-2 border border-zinc-800/60">
              <span className="text-zinc-400 text-[10px] block">ADX Trend</span>
              <span className="font-mono font-bold text-zinc-100 text-sm">{momentum.adx_14}</span>
              <span className="text-[9px] text-zinc-400 block truncate">{momentum.trend_strength}</span>
            </div>
          </div>
        </div>

        {/* Quadrant 4: Relative Strength vs Benchmark */}
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-4 space-y-3">
          <div className="flex items-center justify-between border-b border-zinc-800/80 pb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-zinc-200 flex items-center gap-1.5">
              <Percent className="h-4 w-4 text-purple-400" /> Relative Strength vs Benchmark
            </span>
            <span
              className={`px-2 py-0.5 rounded text-xs font-mono font-bold ${
                relative_strength.rating === 'OUTPERFORMING'
                  ? 'bg-emerald-500/20 text-emerald-400'
                  : relative_strength.rating === 'UNDERPERFORMING'
                  ? 'bg-rose-500/20 text-rose-400'
                  : 'bg-zinc-800 text-zinc-300'
              }`}
            >
              {relative_strength.rating}
            </span>
          </div>

          <div className="grid grid-cols-3 gap-2 text-xs">
            <div className="rounded-lg bg-zinc-950/60 p-2 border border-zinc-800/60">
              <span className="text-zinc-400 text-[10px] block">1M Return</span>
              <span
                className={`font-mono font-bold text-sm ${
                  relative_strength.stock_1m_return_pct >= 0 ? 'text-emerald-400' : 'text-rose-400'
                }`}
              >
                {formatPercent(relative_strength.stock_1m_return_pct)}
              </span>
            </div>

            <div className="rounded-lg bg-zinc-950/60 p-2 border border-zinc-800/60">
              <span className="text-zinc-400 text-[10px] block">{relative_strength.benchmark_name}</span>
              <span
                className={`font-mono font-bold text-sm ${
                  relative_strength.benchmark_1m_return_pct >= 0 ? 'text-emerald-400' : 'text-rose-400'
                }`}
              >
                {formatPercent(relative_strength.benchmark_1m_return_pct)}
              </span>
            </div>

            <div className="rounded-lg bg-zinc-950/60 p-2 border border-zinc-800/60">
              <span className="text-zinc-400 text-[10px] block">Alpha (Excess)</span>
              <span
                className={`font-mono font-bold text-sm ${
                  relative_strength.alpha_pct >= 0 ? 'text-emerald-400' : 'text-rose-400'
                }`}
              >
                {relative_strength.alpha_pct >= 0 ? '+' : ''}
                {relative_strength.alpha_pct}%
              </span>
            </div>
          </div>

          {relative_strength.kalman_beta !== undefined && (
            <div className="pt-2 border-t border-zinc-800/60 mt-2 space-y-2">
              <div className="flex items-center justify-between text-[11px]">
                <span className="text-zinc-400 font-medium flex items-center gap-1">
                  Kalman Filter Beta Drift
                </span>
                <span
                  className={`px-1.5 py-0.5 rounded text-[10px] font-mono font-bold ${
                    relative_strength.kalman_beta_drift === 'BETA_EXPANDING'
                      ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                      : relative_strength.kalman_beta_drift === 'BETA_DEFENSIVE'
                      ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                      : 'bg-zinc-800 text-zinc-300'
                  }`}
                >
                  {relative_strength.kalman_beta_drift ?? 'STABLE'}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="rounded-lg bg-zinc-950/60 p-2 border border-zinc-800/60">
                  <span className="text-zinc-400 text-[10px] block">Dynamic Beta (&beta;<sub>t</sub>)</span>
                  <span className="font-mono font-bold text-sm text-zinc-100">
                    {relative_strength.kalman_beta.toFixed(2)}x
                  </span>
                  <span className="text-[9px] text-zinc-400 block truncate">
                    {relative_strength.kalman_beta > 1.2
                      ? 'High sensitivity to index'
                      : relative_strength.kalman_beta < 0.8
                      ? 'Defensive market sensitivity'
                      : 'Moderate index tracking'}
                  </span>
                </div>
                <div className="rounded-lg bg-zinc-950/60 p-2 border border-zinc-800/60">
                  <span className="text-zinc-400 text-[10px] block">Decoupling (1 - R&sup2;)</span>
                  <span className="font-mono font-bold text-sm text-purple-300">
                    {relative_strength.decoupling_score !== undefined
                      ? `${relative_strength.decoupling_score.toFixed(1)}%`
                      : '0.0%'}
                  </span>
                  <span className="text-[9px] text-zinc-400 block truncate">
                    {relative_strength.decoupling_score && relative_strength.decoupling_score > 60
                      ? 'Strong idiosyncratic alpha'
                      : 'Index-driven returns'}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 5. MINDSET & CAPITAL PRESERVATION GUARDRAIL */}
      <div className="rounded-xl border border-amber-900/40 bg-gradient-to-r from-amber-950/30 via-zinc-950 to-zinc-950 p-4 md:p-5">
        <div className="flex items-start gap-3">
          <AlertTriangle className="h-5 w-5 text-amber-400 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <div className="text-xs font-bold uppercase tracking-wider text-amber-300">
              Institutional Mindset & Risk Protocol
            </div>
            <p className="text-xs md:text-sm text-zinc-300 leading-relaxed">
              {desk.mindset_guardrail}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
