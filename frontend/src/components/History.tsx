import { useEffect, useState } from 'react'

import { getApiErrorMessage, getHistory, getHistoryDetail } from '../api/client'
import type { HistoryDetailResponse, HistoryItem } from '../types/portfolio'
import Analysis from './Analysis'

interface HistoryProps {
  onBackToUpload: () => void
}

const formatDate = (value: string): string => {
  return new Intl.DateTimeFormat('en-IN', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value))
}

const getRiskClass = (score: number): string => {
  if (score <= 3) {
    return 'bg-green-50 text-green-700 ring-green-200'
  }

  if (score <= 6) {
    return 'bg-yellow-50 text-yellow-700 ring-yellow-200'
  }

  return 'bg-red-50 text-red-700 ring-red-200'
}

const History: React.FC<HistoryProps> = ({ onBackToUpload }) => {
  const [items, setItems] = useState<HistoryItem[]>([])
  const [selectedDetail, setSelectedDetail] =
    useState<HistoryDetailResponse | null>(null)
  const [isLoading, setIsLoading] = useState<boolean>(true)
  const [isDetailLoading, setIsDetailLoading] = useState<boolean>(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const loadHistory = async (): Promise<void> => {
      setIsLoading(true)
      setError(null)

      try {
        const historyItems = await getHistory()
        setItems(historyItems)
      } catch (historyError: unknown) {
        setError(getApiErrorMessage(historyError))
      } finally {
        setIsLoading(false)
      }
    }

    void loadHistory()
  }, [])

  const handleViewDetail = async (analysisId: number): Promise<void> => {
    setIsDetailLoading(true)
    setError(null)

    try {
      const detail = await getHistoryDetail(analysisId)
      setSelectedDetail(detail)
    } catch (detailError: unknown) {
      setError(getApiErrorMessage(detailError))
    } finally {
      setIsDetailLoading(false)
    }
  }

  if (selectedDetail) {
    return (
      <div className="bg-slate-50">
        <div className="mx-auto flex max-w-6xl justify-start px-4 pt-8 sm:px-6 lg:px-8">
          <button
            type="button"
            className="rounded-xl border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-900 shadow-sm hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-slate-900 focus:ring-offset-2"
            onClick={() => setSelectedDetail(null)}
          >
            ← Back to history
          </button>
        </div>
        <Analysis
          analysis={{
            risk_score: selectedDetail.risk_score,
            risk_breakdown: selectedDetail.risk_breakdown,
            risk_summary: selectedDetail.risk_summary,
            suggestions: selectedDetail.suggestions,
            raw_ai_text: selectedDetail.raw_ai_text,
          }}
          onViewHistory={() => setSelectedDetail(null)}
        />
      </div>
    )
  }

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-8 text-slate-900 sm:px-6 lg:px-8">
      <section className="mx-auto flex max-w-6xl flex-col gap-6">
        <div className="flex flex-col justify-between gap-4 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:flex-row sm:items-center">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">
              History
            </p>
            <h1 className="mt-3 text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl">
              Past AI analyses
            </h1>
            <p className="mt-2 text-sm text-slate-600">
              Review saved portfolio analyses from PostgreSQL.
            </p>
          </div>
          <button
            type="button"
            className="rounded-xl bg-slate-950 px-5 py-3 text-sm font-semibold text-white shadow-sm hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-900 focus:ring-offset-2"
            onClick={onBackToUpload}
          >
            Upload New CSV
          </button>
        </div>

        {error ? (
          <div
            className="rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-sm font-medium text-red-700"
            role="alert"
          >
            {error}
          </div>
        ) : null}

        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((item) => (
              <div
                key={item}
                className="h-20 animate-pulse rounded-2xl bg-slate-200"
              />
            ))}
          </div>
        ) : null}

        {!isLoading && items.length === 0 ? (
          <div className="rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-sm">
            <h2 className="text-2xl font-semibold text-slate-950">
              No analysis history yet
            </h2>
            <p className="mt-3 text-slate-600">
              Upload and analyze a portfolio first. The results will appear
              here.
            </p>
          </div>
        ) : null}

        {!isLoading && items.length > 0 ? (
          <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
            <div className="max-h-[620px] overflow-auto">
              <table className="min-w-full border-separate border-spacing-0 text-sm">
                <thead className="sticky top-0 z-10 bg-slate-100 text-left text-xs uppercase tracking-wide text-slate-600">
                  <tr>
                    <th className="px-4 py-3 font-semibold">Filename</th>
                    <th className="px-4 py-3 font-semibold">Date</th>
                    <th className="px-4 py-3 text-center font-semibold">
                      Risk Score
                    </th>
                    <th className="px-4 py-3 text-right font-semibold">
                      Action
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((item, index) => (
                    <tr
                      key={item.analysis_id}
                      className={index % 2 === 0 ? 'bg-white' : 'bg-slate-50'}
                    >
                      <td className="px-4 py-4 font-semibold text-slate-950">
                        {item.filename}
                      </td>
                      <td className="px-4 py-4 text-slate-700">
                        {formatDate(item.created_at)}
                      </td>
                      <td className="px-4 py-4 text-center">
                        <span
                          className={`inline-flex rounded-full px-3 py-1 text-xs font-bold ring-1 ${getRiskClass(
                            item.risk_score,
                          )}`}
                        >
                          {item.risk_score}/10
                        </span>
                      </td>
                      <td className="px-4 py-4 text-right">
                        <button
                          type="button"
                          className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-900 shadow-sm hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-slate-900 focus:ring-offset-2 disabled:bg-slate-100 disabled:text-slate-400"
                          disabled={isDetailLoading}
                          onClick={() => {
                            void handleViewDetail(item.analysis_id)
                          }}
                        >
                          {isDetailLoading ? 'Loading...' : 'View'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : null}
      </section>
    </main>
  )
}

export default History
