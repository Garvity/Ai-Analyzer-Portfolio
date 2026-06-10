import type { ChangeEvent, DragEvent } from 'react'
import { useRef, useState } from 'react'

import { getApiErrorMessage, uploadPortfolio } from '../api/client'
import type { PortfolioUploadResponse } from '../types/portfolio'

interface UploadProps {
  onUploadSuccess: (response: PortfolioUploadResponse) => void
}

const isCsvFile = (file: File): boolean => {
  return file.name.toLowerCase().endsWith('.csv')
}

const Upload: React.FC<UploadProps> = ({ onUploadSuccess }) => {
  const inputRef = useRef<HTMLInputElement | null>(null)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [isDragging, setIsDragging] = useState<boolean>(false)
  const [isUploading, setIsUploading] = useState<boolean>(false)
  const [error, setError] = useState<string | null>(null)

  const handleFileSelection = (file: File): void => {
    if (!isCsvFile(file)) {
      setSelectedFile(null)
      setError('Please upload a valid .csv file.')
      return
    }

    setSelectedFile(file)
    setError(null)
  }

  const handleInputChange = (event: ChangeEvent<HTMLInputElement>): void => {
    const file = event.target.files?.[0]

    if (file) {
      handleFileSelection(file)
    }
  }

  const handleDragOver = (event: DragEvent<HTMLDivElement>): void => {
    event.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = (): void => {
    setIsDragging(false)
  }

  const handleDrop = (event: DragEvent<HTMLDivElement>): void => {
    event.preventDefault()
    setIsDragging(false)

    const file = event.dataTransfer.files[0]

    if (file) {
      handleFileSelection(file)
    }
  }

  const handleUpload = async (): Promise<void> => {
    if (!selectedFile) {
      setError('Select a CSV file before uploading.')
      return
    }

    setIsUploading(true)
    setError(null)

    try {
      const response = await uploadPortfolio(selectedFile)
      onUploadSuccess(response)
    } catch (uploadError: unknown) {
      setError(getApiErrorMessage(uploadError))
    } finally {
      setIsUploading(false)
    }
  }

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-8 text-slate-900 sm:px-6 lg:px-8">
      <section className="mx-auto flex max-w-5xl flex-col gap-8">
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">
            AI Portfolio Analyzer
          </p>
          <div className="mt-4 grid gap-4 lg:grid-cols-[1.3fr_0.7fr] lg:items-end">
            <div>
              <h1 className="text-3xl font-semibold tracking-tight text-slate-950 sm:text-5xl">
                Upload your portfolio CSV
              </h1>
              <p className="mt-4 max-w-2xl text-base leading-7 text-slate-600">
                Start with a clean CSV. The app will parse holdings, calculate
                live value, then prepare the dashboard for AI risk analysis.
              </p>
            </div>
            <div className="rounded-2xl bg-slate-100 p-4 text-sm text-slate-700">
              <p className="font-semibold text-slate-900">Accepted format</p>
              <pre className="mt-3 overflow-x-auto rounded-xl bg-slate-950 p-4 text-left text-xs leading-6 text-slate-100">
                {`ticker,quantity,buy_price
RELIANCE,10,2400
TCS,5,3500`}
              </pre>
            </div>
          </div>
        </div>

        {error ? (
          <div
            className="rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-sm font-medium text-red-700"
            role="alert"
          >
            {error}
          </div>
        ) : null}

        <div
          className={`rounded-3xl border-2 border-dashed bg-white p-8 text-center shadow-sm transition-colors sm:p-12 ${
            isDragging
              ? 'border-slate-900 bg-slate-100'
              : 'border-slate-300 hover:border-slate-500'
          }`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          <input
            ref={inputRef}
            type="file"
            accept=".csv,text/csv"
            className="sr-only"
            onChange={handleInputChange}
          />

          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-100 text-3xl">
            📈
          </div>
          <h2 className="mt-6 text-2xl font-semibold text-slate-950">
            Drag and drop your CSV here
          </h2>
          <p className="mt-3 text-sm leading-6 text-slate-600">
            Or choose a file from your computer. Only `.csv` files are accepted.
          </p>

          <div className="mt-6 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <button
              type="button"
              className="rounded-xl border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-900 shadow-sm hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-slate-900 focus:ring-offset-2"
              onClick={() => inputRef.current?.click()}
            >
              Choose CSV
            </button>
            <button
              type="button"
              className="rounded-xl bg-slate-950 px-5 py-3 text-sm font-semibold text-white shadow-sm hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-900 focus:ring-offset-2 disabled:bg-slate-400"
              disabled={!selectedFile || isUploading}
              onClick={handleUpload}
            >
              {isUploading ? 'Uploading portfolio...' : 'Upload portfolio'}
            </button>
          </div>

          {selectedFile ? (
            <div className="mx-auto mt-6 max-w-md rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700">
              Selected file:{' '}
              <span className="font-semibold text-slate-950">
                {selectedFile.name}
              </span>
            </div>
          ) : (
            <p className="mt-6 text-sm text-slate-500">
              No file selected yet. Tiny CSV, big fintech energy.
            </p>
          )}
        </div>
      </section>
    </main>
  )
}

export default Upload
