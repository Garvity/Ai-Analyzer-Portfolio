import type { RiskBreakdown, RiskLevel } from '../types/portfolio'

interface RiskScoreProps {
  riskScore: number
  breakdown: RiskBreakdown | null
  summary: string[]
}

interface RiskMetric {
  key: keyof RiskBreakdown
  label: string
  description: string
}

const riskMetrics: RiskMetric[] = [
  {
    key: 'concentration',
    label: 'Concentration',
    description: 'Single-stock allocation risk',
  },
  {
    key: 'sector',
    label: 'Sector',
    description: 'Sector diversification risk',
  },
  {
    key: 'diversification',
    label: 'Diversification',
    description: 'Number of holdings risk',
  },
  {
    key: 'loss',
    label: 'Loss',
    description: 'Unrealized loss risk',
  },
]

const getRiskLevel = (score: number): RiskLevel => {
  if (score <= 3) {
    return 'low'
  }

  if (score <= 6) {
    return 'medium'
  }

  return 'high'
}

const getRiskLabel = (score: number): string => {
  const level = getRiskLevel(score)

  if (level === 'low') {
    return 'Low Risk'
  }

  if (level === 'medium') {
    return 'Moderate Risk'
  }

  return 'High Risk'
}

const getRiskColorClass = (score: number): string => {
  const level = getRiskLevel(score)

  if (level === 'low') {
    return 'text-green-600'
  }

  if (level === 'medium') {
    return 'text-yellow-600'
  }

  return 'text-red-600'
}

const getRiskBarClass = (score: number): string => {
  const level = getRiskLevel(score)

  if (level === 'low') {
    return 'bg-green-600'
  }

  if (level === 'medium') {
    return 'bg-yellow-600'
  }

  return 'bg-red-600'
}

const RiskScore: React.FC<RiskScoreProps> = ({
  riskScore,
  breakdown,
  summary,
}) => {
  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="grid gap-6 lg:grid-cols-[0.8fr_1.2fr] lg:items-start">
        <div className="rounded-3xl bg-slate-50 p-6 text-center">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">
            Risk Score
          </p>
          <div
            className={`mt-4 text-7xl font-bold tracking-tight ${getRiskColorClass(
              riskScore,
            )}`}
          >
            {riskScore}
            <span className="text-3xl text-slate-400">/10</span>
          </div>
          <p className="mt-3 text-xl font-semibold text-slate-950">
            {getRiskLabel(riskScore)}
          </p>
          <p className="mt-3 text-sm leading-6 text-slate-600">
            Lower scores suggest a more balanced portfolio. Higher scores mean
            risk is concentrated or losses need closer review.
          </p>
        </div>

        <div>
          <h2 className="text-xl font-semibold text-slate-950">
            Risk breakdown
          </h2>
          <p className="mt-2 text-sm text-slate-600">
            Each metric is scored from 1 to 10. Higher means riskier.
          </p>

          {breakdown ? (
            <div className="mt-6 space-y-5">
              {riskMetrics.map((metric) => {
                const value = breakdown[metric.key]
                const width = `${value * 10}%`

                return (
                  <div key={metric.key}>
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="font-semibold text-slate-950">
                          {metric.label}
                        </p>
                        <p className="text-sm text-slate-500">
                          {metric.description}
                        </p>
                      </div>
                      <p
                        className={`text-sm font-bold ${getRiskColorClass(
                          value,
                        )}`}
                      >
                        {value}/10
                      </p>
                    </div>
                    <div
                      className="mt-3 h-3 overflow-hidden rounded-full bg-slate-200"
                      role="progressbar"
                      aria-label={`${metric.label} risk score`}
                      aria-valuemin={1}
                      aria-valuemax={10}
                      aria-valuenow={value}
                    >
                      <div
                        className={`h-full rounded-full ${getRiskBarClass(value)}`}
                        style={{ width }}
                      />
                    </div>
                  </div>
                )
              })}
            </div>
          ) : (
            <div className="mt-6 rounded-2xl border border-slate-200 bg-slate-50 p-5 text-sm text-slate-600">
              Risk breakdown is unavailable for this analysis.
            </div>
          )}
        </div>
      </div>

      <div className="mt-6 rounded-3xl border border-slate-200 bg-slate-50 p-5">
        <h3 className="text-base font-semibold text-slate-950">
          Why this score?
        </h3>
        {summary.length > 0 ? (
          <ul className="mt-4 space-y-3 text-sm leading-6 text-slate-700">
            {summary.map((item) => (
              <li key={item} className="flex gap-3">
                <span className="mt-2 h-2 w-2 shrink-0 rounded-full bg-slate-400" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-3 text-sm text-slate-600">
            No risk summary was returned by the backend.
          </p>
        )}
      </div>
    </section>
  )
}

export default RiskScore
