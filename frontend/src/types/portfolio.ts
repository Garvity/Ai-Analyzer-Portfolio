export interface Holding {
  ticker: string
  quantity: number
  buy_price: number
  invested_value: number
  current_price: number | null
  current_value: number | null
  profit_loss: number | null
  profit_loss_percent: number | null
  weight_percent: number | null
  sector: string | null
  beta: number | null
  long_name: string | null
  fifty_two_week_high: number | null
  fifty_two_week_low: number | null
}

export interface PortfolioUploadResponse {
  portfolio_id: number | null
  filename: string
  holdings: Holding[]
}

export interface UploadSuccessPayload {
  response: PortfolioUploadResponse
  geminiApiKey: string | null
}

export interface PortfolioDetailResponse {
  portfolio_id: number
  filename: string
  uploaded_at: string
  holdings: Holding[]
}

export interface AnalysisRequest {
  portfolio_id: number
  gemini_api_key?: string | null
}

export interface RiskBreakdown {
  concentration: number
  sector: number
  diversification: number
  loss: number
}

export interface AnalysisResponse {
  risk_score: number
  risk_breakdown: RiskBreakdown | null
  risk_summary: string[]
  suggestions: string[]
  raw_ai_text: string
}

export interface HistoryItem {
  analysis_id: number
  portfolio_id: number
  filename: string
  risk_score: number
  created_at: string
}

export interface HistoryDetailResponse {
  analysis_id: number
  portfolio_id: number
  filename: string
  uploaded_at: string
  created_at: string
  holdings: Holding[]
  risk_score: number
  risk_breakdown: RiskBreakdown | null
  risk_summary: string[]
  suggestions: string[]
  raw_ai_text: string
}

export type RiskLevel = 'low' | 'medium' | 'high'
