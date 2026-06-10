# AI Portfolio Analyzer

A beginner-friendly fintech internship project that analyzes a stock portfolio from a CSV file, calculates risk, and generates AI-powered portfolio suggestions.

## Use Case

The user uploads a CSV portfolio. The backend parses holdings, calculates portfolio risk, sends the portfolio context to Gemini through LangChain, stores the result in PostgreSQL, and exposes history endpoints for past analyses.

## Tech Stack

- Backend: FastAPI
- Database: PostgreSQL + SQLAlchemy
- AI: Gemini API + LangChain
- Market Data: yfinance
- Frontend: React
- Deployment Target: Railway

## Current Backend Features

- CSV upload and validation
- Portfolio parsing with current value and profit/loss calculation
- Risk scoring
- Gemini analysis service
- PostgreSQL models for portfolios and analyses
- Portfolio API routes
- Analysis history API routes
- Docker Compose setup for local PostgreSQL

## CSV Format

```csv
ticker,quantity,buy_price
RELIANCE,10,2400
TCS,5,3500
INFY,20,1800
HDFCBANK,15,1600
```

## Backend Setup

Create and activate a virtual environment:

```bash
python3 -m venv .venv
source .venv/bin/activate
```

Install dependencies:

```bash
pip install -r backend/requirements.txt
```

Create `backend/.env`:

```env
GEMINI_API_KEY=your_gemini_api_key
DATABASE_URL=postgresql+psycopg://postgres:postgres@localhost:5432/portfolio_db
```

Start PostgreSQL:

```bash
docker compose up -d
```

Run the FastAPI backend:

```bash
uvicorn backend.main:app --reload
```

Open API docs:

```text
http://localhost:8000/docs
```

## API Endpoints

### Health Check

```http
GET /
```

### Upload Portfolio

```http
POST /upload
```

Form field:

- `file`: CSV file

### Analyze Portfolio

```http
POST /analyze
```

Body:

```json
{
  "portfolio_id": 1
}
```

### Get Portfolio

```http
GET /portfolio/{portfolio_id}
```

### List History

```http
GET /history
```

### Get History Detail

```http
GET /history/{analysis_id}
```

## Local Parser Test

Run this without calling yfinance:

```bash
.venv/bin/python - <<'PY'
from backend.services.parser import parse_portfolio_csv

csv_data = '''ticker,quantity,buy_price
RELIANCE,10,2400
TCS,5,3500
'''

print(parse_portfolio_csv(csv_data, fetch_prices=False))
PY
```

## Local Risk Test

```bash
.venv/bin/python - <<'PY'
from backend.services.risk import calculate_risk_score

holdings = [
    {"ticker": "RELIANCE", "invested_value": 24000, "current_value": 30000},
    {"ticker": "TCS", "invested_value": 17500, "current_value": 16000},
]

print(calculate_risk_score(holdings))
PY
```

## Next Build Steps

1. Test the full backend with PostgreSQL running.
2. Add frontend React app.
3. Build CSV upload UI.
4. Build dashboard charts.
5. Build analysis and history views.
6. Prepare Railway deployment.
