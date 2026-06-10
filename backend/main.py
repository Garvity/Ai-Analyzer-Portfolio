from __future__ import annotations

from collections.abc import AsyncGenerator
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from backend.api.routes import history, portfolio
from backend.core.database import Base, engine
from backend.core import models


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncGenerator[None, None]:
    """Create database tables when the FastAPI app starts."""
    Base.metadata.create_all(bind=engine)
    yield


app = FastAPI(title="AI Portfolio Analyzer", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(portfolio.router)
app.include_router(history.router)


@app.get("/")
def health_check() -> dict[str, str]:
    """Simple health check for local development."""
    return {"status": "ok"}
