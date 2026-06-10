import { useState } from 'react'
import {
  BrowserRouter,
  Navigate,
  Route,
  Routes,
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

const AppRoutes: React.FC = () => {
  const navigate = useNavigate()
  const [portfolioId, setPortfolioId] = useState<number | null>(null)
  const [filename, setFilename] = useState<string | null>(null)
  const [holdings, setHoldings] = useState<Holding[]>([])
  const [analysis, setAnalysis] = useState<AnalysisResponse | null>(null)
  const [loading, setLoading] = useState<boolean>(false)
  const [error, setError] = useState<string | null>(null)

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

const App: React.FC = () => {
  return (
    <BrowserRouter>
      <AppRoutes />
    </BrowserRouter>
  )
}

export default App
