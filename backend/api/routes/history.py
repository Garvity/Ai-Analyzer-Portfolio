from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session

from backend.core.database import get_db
from backend.core.models import Analysis, Portfolio
from backend.schemas.portfolio import HistoryDetailResponse, HistoryItem


router = APIRouter(tags=["history"])


@router.get("/history", response_model=list[HistoryItem])
def list_history(db: Session = Depends(get_db)) -> list[HistoryItem]:
    """Return all saved analyses, newest first."""
    statement = (
        select(Analysis, Portfolio)
        .join(Portfolio, Analysis.portfolio_id == Portfolio.id)
        .order_by(Analysis.created_at.desc())
    )
    rows = db.execute(statement).all()

    return [
        HistoryItem(
            analysis_id=analysis.id,
            portfolio_id=portfolio.id,
            filename=portfolio.filename,
            risk_score=analysis.risk_score,
            created_at=analysis.created_at,
        )
        for analysis, portfolio in rows
    ]


@router.get("/history/{analysis_id}", response_model=HistoryDetailResponse)
def get_history_detail(
    analysis_id: int,
    db: Session = Depends(get_db),
) -> HistoryDetailResponse:
    """Return full details for one saved analysis."""
    statement = (
        select(Analysis, Portfolio)
        .join(Portfolio, Analysis.portfolio_id == Portfolio.id)
        .where(Analysis.id == analysis_id)
    )
    row = db.execute(statement).first()

    if not row:
        raise HTTPException(status_code=404, detail="Analysis not found.")

    analysis, portfolio = row

    return HistoryDetailResponse(
        analysis_id=analysis.id,
        portfolio_id=portfolio.id,
        filename=portfolio.filename,
        uploaded_at=portfolio.uploaded_at,
        created_at=analysis.created_at,
        holdings=portfolio.raw_data,
        risk_score=analysis.risk_score,
        risk_breakdown=analysis.risk_breakdown,
        risk_summary=analysis.risk_summary,
        suggestions=analysis.suggestions,
        raw_ai_text=analysis.ai_response,
    )


@router.delete("/history/{analysis_id}")
def delete_history_item(
    analysis_id: int,
    db: Session = Depends(get_db),
) -> dict[str, str]:
    """Delete one saved AI analysis."""
    analysis = db.get(Analysis, analysis_id)

    if not analysis:
        raise HTTPException(status_code=404, detail="Analysis not found.")

    db.delete(analysis)
    db.commit()

    return {"message": "Analysis deleted successfully."}
