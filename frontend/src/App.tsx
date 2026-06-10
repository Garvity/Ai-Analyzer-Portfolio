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

type AppPage = 'upload' | 'dashboard' | 'analysis' | 'history'

const pageOrder: AppPage[] = ['upload', 'dashboard', 'analysis', 'history']

const AppRoutes: React.FC = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const [portfolioId, setPortfolioId] = useState<number | null>(null)
  const [filename, setFilename] = useState<string | null>(null)
  const [holdings, setHoldings] = useState<Holding[]>([])
  const [analysis, setAnalysis] = useState<AnalysisResponse | null>(null)
  const [loading, setLoading] = useState<boolean>(false)
  const [error, setError] = useState<string | null>(null)

  const getCurrentPage = (): AppPage => {
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

    return 'upload'
  }

  const canVisitPage = (page: AppPage): boolean => {
    if (page === 'upload' || page === 'history') {
      return true
    }

    if (page === 'dashboard') {
      return holdings.length > 0
    }

    return analysis !== null
  }

  const navigateToPage = (page: AppPage): void => {
    const pathByPage: Record<AppPage, string> = {
      upload: '/',
      dashboard: '/dashboard',
      analysis: '/analysis',
      history: '/history',
    }

    if (canVisitPage(page)) {
      navigate(pathByPage[page])
      return
    }

    setError(
      page === 'analysis'
        ? 'Run analysis before opening the analysis page.'
        : 'Upload a portfolio before opening the dashboard.',
    )
  }

  const handlePreviousPage = (): void => {
    const currentIndex = pageOrder.indexOf(getCurrentPage())
    const previousPage = pageOrder[Math.max(currentIndex - 1, 0)]
    navigateToPage(previousPage)
  }

  const handleNextPage = (): void => {
    const currentIndex = pageOrder.indexOf(getCurrentPage())
    const nextPage = pageOrder[Math.min(currentIndex + 1, pageOrder.length - 1)]
    navigateToPage(nextPage)
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
      <PageNavigation
        currentPage={getCurrentPage()}
        onPrevious={handlePreviousPage}
        onNext={handleNextPage}
      />

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

interface PageNavigationProps {
  currentPage: AppPage
  onPrevious: () => void
  onNext: () => void
}

const PageNavigation: React.FC<PageNavigationProps> = ({
  currentPage,
  onPrevious,
  onNext,
}) => {
  const currentIndex = pageOrder.indexOf(currentPage)

  return (
    <nav className="fixed bottom-4 left-1/2 z-40 flex -translate-x-1/2 items-center gap-3 rounded-2xl border border-slate-200 bg-white/95 px-4 py-3 text-sm shadow-lg backdrop-blur">
      <button
        type="button"
        className="rounded-xl border border-slate-300 px-4 py-2 font-semibold text-slate-800 hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-40"
        disabled={currentIndex === 0}
        onClick={onPrevious}
      >
        ← Back
      </button>
      <span className="hidden text-xs font-semibold uppercase tracking-[0.16em] text-slate-500 sm:inline">
        {currentPage}
      </span>
      <button
        type="button"
        className="rounded-xl bg-slate-950 px-4 py-2 font-semibold text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-400"
        disabled={currentIndex === pageOrder.length - 1}
        onClick={onNext}
      >
        Next →
      </button>
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
