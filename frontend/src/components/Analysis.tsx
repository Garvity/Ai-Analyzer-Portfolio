import ReactMarkdown from 'react-markdown'

import type { AnalysisResponse } from '../types/portfolio'
import RiskScore from './RiskScore'

interface AnalysisProps {
  analysis: AnalysisResponse | null
  onBackToUpload: () => void
  onViewHistory: () => void
}

const Analysis: React.FC<AnalysisProps> = ({
  analysis,
  onBackToUpload,
  onViewHistory,
}) => {
  if (!analysis) {
    return (
      <section className="rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-sm">
        <h2 className="text-2xl font-semibold text-slate-950">
          No analysis yet
        </h2>
        <p className="mt-3 text-slate-600">
          Upload a portfolio and click Analyze Portfolio to see AI insights.
        </p>
      </section>
    )
  }

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-8 text-slate-900 sm:px-6 lg:px-8">
      <section className="mx-auto flex max-w-6xl flex-col gap-6">
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">
            AI Analysis
          </p>
          <h1 className="mt-3 text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl">
            Portfolio risk insights
          </h1>
          <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-600">
            Gemini generated this analysis from your holdings and the backend
            risk engine. Treat it as educational guidance, not guaranteed
            financial advice.
          </p>
        </div>

        <RiskScore
          riskScore={analysis.risk_score}
          breakdown={analysis.risk_breakdown}
          summary={analysis.risk_summary}
        />

        <div className="grid gap-6 lg:grid-cols-[0.75fr_1.25fr]">
          <aside className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-xl font-semibold text-slate-950">
              Suggestions
            </h2>
            <p className="mt-2 text-sm text-slate-600">
              Actionable points extracted from the AI response.
            </p>

            {analysis.suggestions.length > 0 ? (
              <div className="mt-5 space-y-3">
                {analysis.suggestions.map((suggestion, index) => (
                  <div
                    key={`${suggestion}-${index}`}
                    className="rounded-2xl border border-slate-200 bg-slate-50 p-4"
                  >
                    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                      Suggestion {index + 1}
                    </p>
                    <p className="mt-2 text-sm leading-6 text-slate-800">
                      {suggestion}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="mt-5 rounded-2xl bg-slate-50 p-4 text-sm text-slate-600">
                No suggestions were extracted. Read the full analysis instead.
              </p>
            )}
          </aside>

          <article className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-xl font-semibold text-slate-950">
              Full AI response
            </h2>
            <div className="prose prose-slate mt-5 max-w-none prose-headings:text-slate-950 prose-p:leading-7 prose-li:leading-7">
              <ReactMarkdown>{analysis.raw_ai_text}</ReactMarkdown>
            </div>
          </article>
        </div>

        <div className="flex flex-col justify-end gap-3 sm:flex-row">
          <button
            type="button"
            className="rounded-xl border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-900 shadow-sm hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-slate-900 focus:ring-offset-2"
            onClick={onBackToUpload}
          >
            Upload New Portfolio
          </button>
          <button
            type="button"
            className="rounded-xl border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-900 shadow-sm hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-slate-900 focus:ring-offset-2"
            onClick={onViewHistory}
          >
            View History
          </button>
        </div>
      </section>
    </main>
  )
}

export default Analysis
