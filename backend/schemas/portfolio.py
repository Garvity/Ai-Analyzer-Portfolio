from __future__ import annotations

from datetime import datetime

from pydantic import BaseModel, Field


class Holding(BaseModel):
    """One stock position after CSV parsing."""

    ticker: str
    quantity: float = Field(gt=0)
    buy_price: float = Field(gt=0)
    invested_value: float = Field(ge=0)
    current_price: float | None = Field(default=None, ge=0)
    current_value: float | None = Field(default=None, ge=0)
    profit_loss: float | None = None


class PortfolioUploadResponse(BaseModel):
    """Response returned after a CSV upload is parsed."""

    portfolio_id: int | None = None
    filename: str
    holdings: list[Holding]


class AnalysisRequest(BaseModel):
    """Request body for analyzing an already uploaded portfolio."""

    portfolio_id: int


class RiskBreakdown(BaseModel):
    """Detailed risk metric scores."""

    concentration: int = Field(ge=1, le=10)
    diversification: int = Field(ge=1, le=10)
    loss: int = Field(ge=1, le=10)


class AnalysisResponse(BaseModel):
    """AI analysis returned to the frontend."""

    risk_score: int = Field(ge=1, le=10)
    risk_breakdown: RiskBreakdown | None = None
    risk_summary: list[str] = []
    suggestions: list[str]
    raw_ai_text: str


class PortfolioDetailResponse(BaseModel):
    """Portfolio details for dashboard reloads."""

    portfolio_id: int
    filename: str
    uploaded_at: datetime
    holdings: list[Holding]


class HistoryItem(BaseModel):
    """One row in the analysis history table."""

    analysis_id: int
    portfolio_id: int
    filename: str
    risk_score: int = Field(ge=1, le=10)
    created_at: datetime


class HistoryDetailResponse(BaseModel):
    """Full details for one past analysis."""

    analysis_id: int
    portfolio_id: int
    filename: str
    uploaded_at: datetime
    created_at: datetime
    holdings: list[Holding]
    risk_score: int = Field(ge=1, le=10)
    risk_breakdown: RiskBreakdown | None = None
    risk_summary: list[str] = []
    suggestions: list[str]
    raw_ai_text: str
