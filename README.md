# AI Portfolio Analyzer

A beginner-friendly fintech internship project that analyzes a stock portfolio from a CSV file, calculates risk, and generates AI-powered portfolio suggestions.

## Use Case

The user uploads a CSV portfolio. The backend parses holdings, calculates portfolio risk, sends the portfolio context to Gemini through LangChain, stores the result in PostgreSQL, and exposes history endpoints for past analyses.

## Tech Stack

- Backend: FastAPI
- Database: PostgreSQL + SQLAlchemy
- AI: Gemini API + LangChain
- Market Data: yfinance
- Frontend: React + TypeScript + Vite
- Styling: TailwindCSS
- Charts: Recharts
- HTTP Client: Axios
- Routing: React Router
- Markdown Rendering: React Markdown
- Deployment Target: Render / Railway

## Current Features

- CSV upload and validation
- Portfolio parsing with current value and profit/loss calculation
- Enriched holding data including sector, beta, 52-week high/low, and portfolio weight
- Risk scoring
- Gemini analysis service
- PostgreSQL models for portfolios and analyses
- Portfolio API routes
- Analysis history API routes
- Docker Compose setup for local PostgreSQL
- React upload flow
- Dashboard summary cards, holdings table, allocation pie chart, and P&L bar chart
- Risk score display with metric breakdown
- AI analysis screen with markdown rendering
- History screen for past analyses

## Project Structure

```text
backend/
  api/routes/
    history.py
    portfolio.py
  core/
    config.py
    database.py
    models.py
  schemas/
    portfolio.py
  services/
    analyzer.py
    parser.py
    risk.py
  main.py
  requirements.txt

frontend/
  src/
    api/client.ts
    components/
      Analysis.tsx
      Dashboard.tsx
      History.tsx
      RiskScore.tsx
      Upload.tsx
    types/portfolio.ts
    App.tsx
    index.css
```

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

## Docker Full-Stack Setup

Run PostgreSQL, FastAPI, and the React frontend together:

```bash
GEMINI_API_KEY=your_gemini_api_key docker compose up --build
```

Open:

```text
Frontend: http://localhost:5173
Backend API docs: http://localhost:8000/docs
PostgreSQL: localhost:5432
```

Services:

- `db`: PostgreSQL database
- `backend`: FastAPI app on port `8000`
- `frontend`: React app served by Nginx on port `5173`

## Frontend Setup

Install frontend dependencies:

```bash
cd frontend
npm install
```

Create `frontend/.env` if your backend is not running on the default URL:

```env
VITE_API_BASE_URL=http://localhost:8000
```

Run the React frontend:

```bash
npm run dev
```

Open the app:

```text
http://localhost:5173
```

Build the frontend:

```bash
npm run build
```

## Frontend User Flow

1. Upload a CSV portfolio on the upload screen.
2. Review holdings, allocation, current value, and P&L on the dashboard.
3. Click `Analyze Portfolio`.
4. View risk score, metric breakdown, AI suggestions, and full markdown analysis.
5. Open history to review previous saved analyses.

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
  "portfolio_id": 1,
  "gemini_api_key": "optional_user_key"
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

## Full Local Test Flow

Start PostgreSQL:

```bash
docker compose up -d
```

Start the backend:

```bash
source .venv/bin/activate
uvicorn backend.main:app --reload
```

Start the frontend in a second terminal:

```bash
cd frontend
npm run dev
```

Then visit:

```text
http://localhost:5173
```

## Next Build Steps

1. Test the complete upload → dashboard → analyze → history flow.
2. Add frontend polish after real browser QA.
3. Add deployment configuration.
4. Prepare final internship demo script.
