from __future__ import annotations

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from backend.api.routes import portfolio


app = FastAPI(title="AI Portfolio Analyzer")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(portfolio.router)


@app.get("/")
def health_check() -> dict[str, str]:
    """Simple health check for local development."""
    return {"status": "ok"}
