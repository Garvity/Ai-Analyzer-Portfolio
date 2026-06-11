import axios, { AxiosError } from 'axios'

import type {
  AnalysisRequest,
  AnalysisResponse,
  HistoryDetailResponse,
  HistoryItem,
  PortfolioDetailResponse,
  PortfolioUploadResponse,
} from '../types/portfolio'

interface ApiErrorResponse {
  detail?: string
}

interface DeleteHistoryResponse {
  message: string
}

const apiBaseUrl = import.meta.env.VITE_API_BASE_URL

if (!apiBaseUrl) {
  throw new Error('VITE_API_BASE_URL is not configured.')
}

const api = axios.create({
  baseURL: apiBaseUrl,
})

export const getApiErrorMessage = (error: unknown): string => {
  if (axios.isAxiosError<ApiErrorResponse>(error)) {
    const axiosError: AxiosError<ApiErrorResponse> = error
    return axiosError.response?.data?.detail ?? axiosError.message
  }

  if (error instanceof Error) {
    return error.message
  }

  return 'Something went wrong. Please try again.'
}

export const uploadPortfolio = async (
  file: File,
): Promise<PortfolioUploadResponse> => {
  const formData = new FormData()
  formData.append('file', file)

  const response = await api.post<PortfolioUploadResponse>('/upload', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  })

  return response.data
}

export const analyzePortfolio = async (
  request: AnalysisRequest,
): Promise<AnalysisResponse> => {
  const response = await api.post<AnalysisResponse>('/analyze', request)
  return response.data
}

export const getPortfolio = async (
  portfolioId: number,
): Promise<PortfolioDetailResponse> => {
  const response = await api.get<PortfolioDetailResponse>(
    `/portfolio/${portfolioId}`,
  )
  return response.data
}

export const getHistory = async (): Promise<HistoryItem[]> => {
  const response = await api.get<HistoryItem[]>('/history')
  return response.data
}

export const getHistoryDetail = async (
  analysisId: number,
): Promise<HistoryDetailResponse> => {
  const response = await api.get<HistoryDetailResponse>(`/history/${analysisId}`)
  return response.data
}

export const deleteHistoryItem = async (
  analysisId: number,
): Promise<DeleteHistoryResponse> => {
  const response = await api.delete<DeleteHistoryResponse>(
    `/history/${analysisId}`,
  )
  return response.data
}
