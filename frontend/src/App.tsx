import { useState } from 'react'
import {
  BrowserRouter,
  Navigate,
  Route,
  Routes,
  useLocation,
  useNavigate,
} from 'react-router-dom'

import { analyzePortfolio, getApiErrorMessage } from './api/client'
import Analysis from './components/Analysis'
import Dashboard from './components/Dashboard'
import History from './components/History'
import Upload from './components/Upload'
import type {
  AnalysisResponse,
  Holding,
  PortfolioUploadResponse,
} from './types/portfolio'

type AppTab = 'dashboard' | 'analysis' | 'history'

const AppRoutes: React.FC = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const [portfolioId, setPortfolioId] = useState<number | null>(null)
  const [filename, setFilename] = useState<string | null>(null)
  const [holdings, setHoldings] = useState<Holding[]>([])
  const [analysis, setAnalysis] = useState<AnalysisResponse | null>(null)
  const [loading, setLoading] = useState<boolean>(false)
  const [error, setError] = useState<string | null>(null)

  const getCurrentTab = (): AppTab | null => {
    const path = location.pathname

    if (path.startsWith('/dashboard')) {
      return 'dashboard'
    }

    if (path.startsWith('/analysis')) {
      return 'analysis'
    }

    if (path.startsWith('/history')) {
      return 'history'
    }

    return null
  }

  const canVisitTab = (tab: AppTab): boolean => {
    if (tab === 'history') {
      return true
    }

    if (tab === 'dashboard') {
      return holdings.length > 0
    }

    return analysis !== null
  }

  const navigateToTab = (tab: AppTab): void => {
    const pathByTab: Record<AppTab, string> = {
      dashboard: '/dashboard',
      analysis: '/analysis',
      history: '/history',
    }

    if (canVisitTab(tab)) {
      navigate(pathByTab[tab])
      return
    }

    setError(
      tab === 'analysis'
        ? 'Run analysis before opening the analysis page.'
        : 'Upload a portfolio before opening the dashboard.',
    )
  }

  const handleUploadSuccess = (response: PortfolioUploadResponse): void => {
    setPortfolioId(response.portfolio_id)
    setFilename(response.filename)
    setHoldings(response.holdings)
    setAnalysis(null)
    setError(null)
    navigate('/dashboard')
  }

  const handleAnalyze = async (): Promise<void> => {
    if (portfolioId === null) {
      setError('Upload a portfolio before running analysis.')
      navigate('/')
      return
    }

    setLoading(true)
    setError(null)

    try {
      const analysisResponse = await analyzePortfolio({
        portfolio_id: portfolioId,
      })
      setAnalysis(analysisResponse)
      navigate('/analysis')
    } catch (analysisError: unknown) {
      setError(getApiErrorMessage(analysisError))
    } finally {
      setLoading(false)
    }
  }

  const handleBackToUpload = (): void => {
    setPortfolioId(null)
    setFilename(null)
    setHoldings([])
    setAnalysis(null)
    setError(null)
    navigate('/')
  }

  return (
    <>
      {holdings.length > 0 ? (
        <AppTabs
          activeTab={getCurrentTab()}
          hasAnalysis={analysis !== null}
          onNavigate={navigateToTab}
        />
      ) : null}

      {loading ? <LoadingOverlay message="Fetching AI analysis..." /> : null}

      {error ? (
        <div className="fixed inset-x-4 top-4 z-50 mx-auto max-w-4xl rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-sm font-medium text-red-700 shadow-lg">
          {error}
        </div>
      ) : null}

      <Routes>
        <Route
          path="/"
          element={<Upload onUploadSuccess={handleUploadSuccess} />}
        />
        <Route
          path="/dashboard"
          element={
            holdings.length > 0 ? (
              <Dashboard
                holdings={holdings}
                filename={filename}
                isAnalyzing={loading}
                onAnalyze={handleAnalyze}
              />
            ) : (
              <Navigate to="/" replace />
            )
          }
        />
        <Route
          path="/analysis"
          element={
            analysis ? (
              <Analysis
                analysis={analysis}
                onViewHistory={() => navigate('/history')}
              />
            ) : (
              <Navigate to={holdings.length > 0 ? '/dashboard' : '/'} replace />
            )
          }
        />
        <Route
          path="/history"
          element={<History onBackToUpload={handleBackToUpload} />}
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  )
}

interface AppTabsProps {
  activeTab: AppTab | null
  hasAnalysis: boolean
  onNavigate: (tab: AppTab) => void
}

const AppTabs: React.FC<AppTabsProps> = ({
  activeTab,
  hasAnalysis,
  onNavigate,
}) => {
  return (
    <nav className="sticky top-0 z-40 border-b border-slate-200 bg-white/95 px-4 py-3 shadow-sm backdrop-blur">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-2">
      <button
        type="button"
          className={`rounded-xl px-4 py-2 text-sm font-semibold ${
            activeTab === 'dashboard'
              ? 'bg-slate-950 text-white'
              : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
          }`}
          onClick={() => onNavigate('dashboard')}
      >
          Dashboard
      </button>
      <button
        type="button"
          className={`rounded-xl px-4 py-2 text-sm font-semibold ${
            activeTab === 'analysis'
              ? 'bg-slate-950 text-white'
              : 'bg-slate-100 text-slate-700 hover:bg-slate-200 disabled:cursor-not-allowed disabled:opacity-50'
          }`}
          disabled={!hasAnalysis}
          onClick={() => onNavigate('analysis')}
      >
          Analysis
      </button>
        <button
          type="button"
          className={`rounded-xl px-4 py-2 text-sm font-semibold ${
            activeTab === 'history'
              ? 'bg-slate-950 text-white'
              : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
          }`}
          onClick={() => onNavigate('history')}
        >
          Past AI Analysis
        </button>
      </div>
    </nav>
  )
}

interface LoadingOverlayProps {
  message: string
}

const LoadingOverlay: React.FC<LoadingOverlayProps> = ({ message }) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 px-4 backdrop-blur-sm">
      <div className="flex max-w-sm flex-col items-center rounded-3xl bg-white p-8 text-center shadow-2xl">
        <div
          className="h-12 w-12 animate-spin rounded-full border-4 border-slate-200 border-t-slate-950"
          aria-hidden="true"
        />
        <p className="mt-5 text-lg font-semibold text-slate-950">{message}</p>
        <p className="mt-2 text-sm leading-6 text-slate-600">
          This can take a moment while the backend calculates risk and waits for
          the AI response.
        </p>
      </div>
    </div>
  )
}

const App: React.FC = () => {
  return (
    <BrowserRouter>
      <AppRoutes />
    </BrowserRouter>
  )
}

export default App
