import { useMemo, useState } from 'react'
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'

import type { Holding } from '../types/portfolio'

interface DashboardProps {
  holdings: Holding[]
  filename: string | null
  isAnalyzing: boolean
  onAnalyze: () => Promise<void>
}

type SortKey =
  | 'ticker'
  | 'current_value'
  | 'profit_loss'
  | 'profit_loss_percent'
  | 'weight_percent'

type SortDirection = 'asc' | 'desc'

interface ChartTooltipPayload {
  name?: string
  value?: number
  payload?: {
    ticker?: string
    profit_loss?: number
    weight_percent?: number
  }
}

interface ChartTooltipProps {
  active?: boolean
  payload?: ChartTooltipPayload[]
  label?: string
}

const chartColors = ['#0f172a', '#2563eb', '#7c3aed', '#0891b2', '#16a34a', '#ca8a04']

const formatCurrency = (value: number | null): string => {
  if (value === null) {
    return '—'
  }

  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value)
}

const formatPercent = (value: number | null): string => {
  if (value === null) {
    return '—'
  }

  const sign = value > 0 ? '+' : ''
  return `${sign}${value.toFixed(2)}%`
}

const formatNumber = (value: number | null): string => {
  if (value === null) {
    return '—'
  }

  return new Intl.NumberFormat('en-IN', {
    maximumFractionDigits: 2,
  }).format(value)
}

const getProfitClass = (value: number | null): string => {
  if (value === null || value === 0) {
    return 'text-slate-600'
  }

  return value > 0 ? 'text-green-600' : 'text-red-600'
}

const getSortableValue = (holding: Holding, key: SortKey): string | number => {
  if (key === 'ticker') {
    return holding.ticker
  }

  return holding[key] ?? Number.NEGATIVE_INFINITY
}

const MoneyTooltip: React.FC<ChartTooltipProps> = ({ active, payload, label }) => {
  if (!active || !payload?.length) {
    return null
  }

  const value = payload[0]?.value ?? null

  return (
    <div className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm shadow-lg">
      <p className="font-semibold text-slate-950">{label}</p>
      <p className={getProfitClass(value)}>{formatCurrency(value)}</p>
    </div>
  )
}

const WeightTooltip: React.FC<ChartTooltipProps> = ({ active, payload }) => {
  if (!active || !payload?.length) {
    return null
  }

  const item = payload[0]
  const ticker = item.payload?.ticker ?? item.name ?? 'Holding'
  const weight = item.payload?.weight_percent ?? item.value ?? null

  return (
    <div className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm shadow-lg">
      <p className="font-semibold text-slate-950">{ticker}</p>
      <p className="text-slate-700">{formatPercent(weight)}</p>
    </div>
  )
}

const Dashboard: React.FC<DashboardProps> = ({
  holdings,
  filename,
  isAnalyzing,
  onAnalyze,
}) => {
  const [sortKey, setSortKey] = useState<SortKey>('weight_percent')
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc')

  const totalInvested = useMemo<number>(() => {
    return holdings.reduce((total, holding) => total + holding.invested_value, 0)
  }, [holdings])

  const currentValue = useMemo<number>(() => {
    return holdings.reduce(
      (total, holding) => total + (holding.current_value ?? 0),
      0,
    )
  }, [holdings])

  const overallProfitLoss = currentValue - totalInvested
  const overallProfitLossPercent =
    totalInvested > 0 ? (overallProfitLoss / totalInvested) * 100 : null

  const sortedHoldings = useMemo<Holding[]>(() => {
    return [...holdings].sort((first, second) => {
      const firstValue = getSortableValue(first, sortKey)
      const secondValue = getSortableValue(second, sortKey)

      if (typeof firstValue === 'string' && typeof secondValue === 'string') {
        return sortDirection === 'asc'
          ? firstValue.localeCompare(secondValue)
          : secondValue.localeCompare(firstValue)
      }

      return sortDirection === 'asc'
        ? Number(firstValue) - Number(secondValue)
        : Number(secondValue) - Number(firstValue)
    })
  }, [holdings, sortDirection, sortKey])

  const allocationData = holdings
    .filter((holding) => holding.weight_percent !== null)
    .map((holding) => ({
      ticker: holding.ticker,
      weight_percent: holding.weight_percent ?? 0,
    }))

  const profitLossData = holdings.map((holding) => ({
    ticker: holding.ticker,
    profit_loss: holding.profit_loss ?? 0,
  }))

  const handleSort = (key: SortKey): void => {
    if (sortKey === key) {
      setSortDirection((current) => (current === 'asc' ? 'desc' : 'asc'))
      return
    }

    setSortKey(key)
    setSortDirection('desc')
  }

  if (holdings.length === 0) {
    return (
      <section className="rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-sm">
        <h2 className="text-2xl font-semibold text-slate-950">
          No portfolio uploaded yet
        </h2>
        <p className="mt-3 text-slate-600">
          Upload a CSV first to unlock dashboard metrics and AI analysis.
        </p>
      </section>
    )
  }

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-8 text-slate-900 sm:px-6 lg:px-8">
      <section className="mx-auto flex max-w-7xl flex-col gap-6">
        <div className="flex flex-col justify-between gap-4 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm lg:flex-row lg:items-center">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">
              Portfolio Dashboard
            </p>
            <h1 className="mt-3 text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl">
              {filename ?? 'Uploaded portfolio'}
            </h1>
            <p className="mt-2 text-sm text-slate-600">
              Review allocation, live value, and unrealized profit/loss before
              running AI analysis.
            </p>
          </div>
          <button
            type="button"
            className="rounded-xl bg-slate-950 px-5 py-3 text-sm font-semibold text-white shadow-sm hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-900 focus:ring-offset-2 disabled:bg-slate-400"
            disabled={isAnalyzing}
            onClick={() => {
              void onAnalyze()
            }}
          >
            {isAnalyzing ? 'Analyzing portfolio...' : 'Analyze Portfolio'}
          </button>
        </div>

        {isAnalyzing ? (
          <div className="grid gap-4 md:grid-cols-4">
            {[1, 2, 3, 4].map((item) => (
              <div
                key={item}
                className="h-28 animate-pulse rounded-3xl bg-slate-200"
              />
            ))}
          </div>
        ) : null}

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <SummaryCard label="Total Invested" value={formatCurrency(totalInvested)} />
          <SummaryCard label="Current Value" value={formatCurrency(currentValue)} />
          <SummaryCard
            label="Overall P&L"
            value={formatCurrency(overallProfitLoss)}
            valueClassName={getProfitClass(overallProfitLoss)}
          />
          <SummaryCard
            label="Overall P&L %"
            value={formatPercent(overallProfitLossPercent)}
            valueClassName={getProfitClass(overallProfitLossPercent)}
          />
        </div>

        <div className="grid gap-6 xl:grid-cols-2">
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-slate-950">
              Allocation by ticker
            </h2>
            <p className="mt-1 text-sm text-slate-600">
              Portfolio weight percentage by stock.
            </p>
            <div className="mt-6 h-80">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={allocationData}
                    dataKey="weight_percent"
                    nameKey="ticker"
                    outerRadius={110}
                    label={({ name, value }) =>
                      `${String(name)} ${formatPercent(Number(value))}`
                    }
                  >
                    {allocationData.map((entry, index) => (
                      <Cell
                        key={entry.ticker}
                        fill={chartColors[index % chartColors.length]}
                      />
                    ))}
                  </Pie>
                  <Tooltip content={<WeightTooltip />} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-slate-950">
              Profit/Loss by ticker
            </h2>
            <p className="mt-1 text-sm text-slate-600">
              Unrealized gain or loss for each holding.
            </p>
            <div className="mt-6 h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={profitLossData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="ticker" />
                  <YAxis tickFormatter={(value: number) => `₹${value / 1000}k`} />
                  <Tooltip content={<MoneyTooltip />} />
                  <Legend />
                  <Bar dataKey="profit_loss" name="P&L">
                    {profitLossData.map((entry) => (
                      <Cell
                        key={entry.ticker}
                        fill={entry.profit_loss >= 0 ? '#16a34a' : '#dc2626'}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-200 px-6 py-5">
            <h2 className="text-lg font-semibold text-slate-950">Holdings</h2>
            <p className="mt-1 text-sm text-slate-600">
              Sort by ticker, value, P&L, P&L %, or weight.
            </p>
          </div>
          <div className="max-h-[560px] overflow-auto">
            <table className="min-w-full border-separate border-spacing-0 text-sm">
              <thead className="sticky top-0 z-10 bg-slate-100 text-left text-xs uppercase tracking-wide text-slate-600">
                <tr>
                  <SortableHeader label="Ticker" sortKey="ticker" onSort={handleSort} />
                  <th className="px-4 py-3 font-semibold">Name</th>
                  <th className="px-4 py-3 text-right font-semibold">Qty</th>
                  <th className="px-4 py-3 text-right font-semibold">Buy Price</th>
                  <th className="px-4 py-3 text-right font-semibold">
                    Current Price
                  </th>
                  <SortableHeader
                    label="P&L"
                    sortKey="profit_loss"
                    align="right"
                    onSort={handleSort}
                  />
                  <SortableHeader
                    label="P&L %"
                    sortKey="profit_loss_percent"
                    align="right"
                    onSort={handleSort}
                  />
                  <SortableHeader
                    label="Weight"
                    sortKey="weight_percent"
                    align="right"
                    onSort={handleSort}
                  />
                  <th className="px-4 py-3 font-semibold">Sector</th>
                </tr>
              </thead>
              <tbody>
                {sortedHoldings.map((holding, index) => (
                  <tr
                    key={holding.ticker}
                    className={index % 2 === 0 ? 'bg-white' : 'bg-slate-50'}
                  >
                    <td className="whitespace-nowrap px-4 py-4 font-semibold text-slate-950">
                      {holding.ticker}
                    </td>
                    <td className="min-w-56 px-4 py-4 text-slate-700">
                      {holding.long_name ?? '—'}
                    </td>
                    <td className="px-4 py-4 text-right text-slate-700">
                      {formatNumber(holding.quantity)}
                    </td>
                    <td className="px-4 py-4 text-right text-slate-700">
                      {formatCurrency(holding.buy_price)}
                    </td>
                    <td className="px-4 py-4 text-right text-slate-700">
                      {formatCurrency(holding.current_price)}
                    </td>
                    <td
                      className={`px-4 py-4 text-right font-semibold ${getProfitClass(
                        holding.profit_loss,
                      )}`}
                    >
                      {formatCurrency(holding.profit_loss)}
                    </td>
                    <td
                      className={`px-4 py-4 text-right font-semibold ${getProfitClass(
                        holding.profit_loss_percent,
                      )}`}
                    >
                      {formatPercent(holding.profit_loss_percent)}
                    </td>
                    <td className="px-4 py-4 text-right text-slate-700">
                      {formatPercent(holding.weight_percent)}
                    </td>
                    <td className="whitespace-nowrap px-4 py-4 text-slate-700">
                      {holding.sector ?? 'Unknown'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>
    </main>
  )
}

interface SummaryCardProps {
  label: string
  value: string
  valueClassName?: string
}

const SummaryCard: React.FC<SummaryCardProps> = ({
  label,
  value,
  valueClassName = 'text-slate-950',
}) => {
  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
      <p className="text-sm font-medium text-slate-500">{label}</p>
      <p className={`mt-3 text-2xl font-semibold tracking-tight ${valueClassName}`}>
        {value}
      </p>
    </div>
  )
}

interface SortableHeaderProps {
  label: string
  sortKey: SortKey
  align?: 'left' | 'right'
  onSort: (key: SortKey) => void
}

const SortableHeader: React.FC<SortableHeaderProps> = ({
  label,
  sortKey,
  align = 'left',
  onSort,
}) => {
  return (
    <th
      className={`px-4 py-3 font-semibold ${
        align === 'right' ? 'text-right' : 'text-left'
      }`}
    >
      <button
        type="button"
        className="inline-flex items-center gap-1 hover:text-slate-950"
        onClick={() => onSort(sortKey)}
      >
        {label}
        <span aria-hidden="true">↕</span>
      </button>
    </th>
  )
}

export default Dashboard
