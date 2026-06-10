from __future__ import annotations

from datetime import datetime, timezone
from typing import Any

from fastapi import APIRouter, File, HTTPException, UploadFile

from backend.schemas.portfolio import (
    AnalysisRequest,
    AnalysisResponse,
    PortfolioDetailResponse,
    PortfolioUploadResponse,
)
from backend.services.analyzer import AnalyzerError, analyze_portfolio
from backend.services.parser import PortfolioParserError, parse_portfolio_csv
from backend.services.risk import RiskCalculationError, calculate_risk_score


router = APIRouter(tags=["portfolio"])

_portfolio_store: dict[int, dict[str, Any]] = {}
_next_portfolio_id = 1


@router.post("/upload", response_model=PortfolioUploadResponse)
async def upload_portfolio(file: UploadFile = File(...)) -> PortfolioUploadResponse:
    """Upload a CSV file, parse it, and temporarily store the holdings."""
    global _next_portfolio_id

    if not file.filename or not file.filename.endswith(".csv"):
        raise HTTPException(status_code=400, detail="Please upload a .csv file.")

    file_bytes = await file.read()

    try:
        holdings = parse_portfolio_csv(file_bytes)
    except PortfolioParserError as error:
        raise HTTPException(status_code=400, detail=str(error)) from error

    portfolio_id = _next_portfolio_id
    _next_portfolio_id += 1

    _portfolio_store[portfolio_id] = {
        "portfolio_id": portfolio_id,
        "filename": file.filename,
        "uploaded_at": datetime.now(timezone.utc),
        "holdings": holdings,
    }

    return PortfolioUploadResponse(
        portfolio_id=portfolio_id,
        filename=file.filename,
        holdings=holdings,
    )


@router.post("/analyze", response_model=AnalysisResponse)
def analyze_uploaded_portfolio(request: AnalysisRequest) -> AnalysisResponse:
    """Analyze a previously uploaded portfolio."""
    portfolio = _portfolio_store.get(request.portfolio_id)

    if not portfolio:
        raise HTTPException(status_code=404, detail="Portfolio not found.")

    try:
        risk_result = calculate_risk_score(portfolio["holdings"])
        analysis = analyze_portfolio(portfolio["holdings"], risk_result)
    except RiskCalculationError as error:
        raise HTTPException(status_code=400, detail=str(error)) from error
    except AnalyzerError as error:
        raise HTTPException(status_code=500, detail=str(error)) from error

    return AnalysisResponse(
        risk_score=analysis["risk_score"],
        risk_breakdown=risk_result["breakdown"],
        risk_summary=risk_result["summary"],
        suggestions=analysis["suggestions"],
        raw_ai_text=analysis["raw_ai_text"],
    )


@router.get("/portfolio/{portfolio_id}", response_model=PortfolioDetailResponse)
def get_portfolio(portfolio_id: int) -> PortfolioDetailResponse:
    """Return one temporarily stored portfolio."""
    portfolio = _portfolio_store.get(portfolio_id)

    if not portfolio:
        raise HTTPException(status_code=404, detail="Portfolio not found.")

    return PortfolioDetailResponse(**portfolio)
