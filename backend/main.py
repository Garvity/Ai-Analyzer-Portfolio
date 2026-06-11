from __future__ import annotations

import asyncio
import logging
from collections.abc import AsyncGenerator
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.exc import OperationalError

from backend.api.routes import history, portfolio
from backend.core.database import Base, engine
from backend.core import models


logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncGenerator[None, None]:
    """Create database tables when the FastAPI app starts."""
    max_attempts = 10

    for attempt in range(1, max_attempts + 1):
        try:
            Base.metadata.create_all(bind=engine)
            break
        except OperationalError as error:
            if attempt == max_attempts:
                raise RuntimeError(
                    "Could not connect to PostgreSQL. Start the database with "
                    "`docker compose up -d db` or set DATABASE_URL to a running "
                    "PostgreSQL instance."
                ) from error

            logger.warning(
                "Database is not ready yet; retrying startup (%s/%s).",
                attempt,
                max_attempts,
            )
            await asyncio.sleep(1)

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
