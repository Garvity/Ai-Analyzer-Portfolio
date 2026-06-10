from __future__ import annotations

from datetime import datetime
from typing import Any

from sqlalchemy import DateTime, ForeignKey, Integer, String, Text, func
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column, relationship

from backend.core.database import Base


class Portfolio(Base):
    """Uploaded portfolio CSV and its parsed holdings."""

    __tablename__ = "portfolios"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    filename: Mapped[str] = mapped_column(String(255), nullable=False)
    raw_data: Mapped[list[dict[str, Any]]] = mapped_column(JSONB, nullable=False)
    uploaded_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
    )

    analyses: Mapped[list[Analysis]] = relationship(
        back_populates="portfolio",
        cascade="all, delete-orphan",
    )


class Analysis(Base):
    """AI analysis result for one uploaded portfolio."""

    __tablename__ = "analyses"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    portfolio_id: Mapped[int] = mapped_column(
        ForeignKey("portfolios.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    risk_score: Mapped[int] = mapped_column(Integer, nullable=False)
    risk_breakdown: Mapped[dict[str, Any] | None] = mapped_column(JSONB, nullable=True)
    risk_summary: Mapped[list[str]] = mapped_column(JSONB, nullable=False)
    suggestions: Mapped[list[str]] = mapped_column(JSONB, nullable=False)
    ai_response: Mapped[str] = mapped_column(Text, nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
    )

    portfolio: Mapped[Portfolio] = relationship(back_populates="analyses")
