from __future__ import annotations

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile
from sqlalchemy.orm import Session

from backend.core.database import get_db
from backend.core.models import Analysis, Portfolio
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


@router.post("/upload", response_model=PortfolioUploadResponse)
async def upload_portfolio(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
) -> PortfolioUploadResponse:
    """Upload a CSV file, parse it, and store the holdings in PostgreSQL."""
    if not file.filename or not file.filename.endswith(".csv"):
        raise HTTPException(status_code=400, detail="Please upload a .csv file.")

    file_bytes = await file.read()

    try:
        holdings = parse_portfolio_csv(file_bytes)
    except PortfolioParserError as error:
        raise HTTPException(status_code=400, detail=str(error)) from error

    portfolio = Portfolio(filename=file.filename, raw_data=holdings)
    db.add(portfolio)
    db.commit()
    db.refresh(portfolio)

    return PortfolioUploadResponse(
        portfolio_id=portfolio.id,
        filename=file.filename,
        holdings=holdings,
    )


@router.post("/analyze", response_model=AnalysisResponse)
def analyze_uploaded_portfolio(
    request: AnalysisRequest,
    db: Session = Depends(get_db),
) -> AnalysisResponse:
    """Analyze a previously uploaded portfolio."""
    portfolio = db.get(Portfolio, request.portfolio_id)

    if not portfolio:
        raise HTTPException(status_code=404, detail="Portfolio not found.")

    try:
        risk_result = calculate_risk_score(portfolio.raw_data)
        analysis_result = analyze_portfolio(portfolio.raw_data, risk_result)
    except RiskCalculationError as error:
        raise HTTPException(status_code=400, detail=str(error)) from error
    except AnalyzerError as error:
        raise HTTPException(status_code=500, detail=str(error)) from error

    analysis = Analysis(
        portfolio_id=portfolio.id,
        risk_score=analysis_result["risk_score"],
        risk_breakdown=risk_result["breakdown"],
        risk_summary=risk_result["summary"],
        suggestions=analysis_result["suggestions"],
        ai_response=analysis_result["raw_ai_text"],
    )
    db.add(analysis)
    db.commit()

    return AnalysisResponse(
        risk_score=analysis_result["risk_score"],
        risk_breakdown=risk_result["breakdown"],
        risk_summary=risk_result["summary"],
        suggestions=analysis_result["suggestions"],
        raw_ai_text=analysis_result["raw_ai_text"],
    )


@router.get("/portfolio/{portfolio_id}", response_model=PortfolioDetailResponse)
def get_portfolio(
    portfolio_id: int,
    db: Session = Depends(get_db),
) -> PortfolioDetailResponse:
    """Return one stored portfolio."""
    portfolio = db.get(Portfolio, portfolio_id)

    if not portfolio:
        raise HTTPException(status_code=404, detail="Portfolio not found.")

    return PortfolioDetailResponse(
        portfolio_id=portfolio.id,
        filename=portfolio.filename,
        uploaded_at=portfolio.uploaded_at,
        holdings=portfolio.raw_data,
    )
