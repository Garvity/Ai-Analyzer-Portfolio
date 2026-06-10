from __future__ import annotations

from collections.abc import Generator

from sqlalchemy import create_engine
from sqlalchemy.orm import DeclarativeBase, Session, sessionmaker

from backend.core.config import settings


class Base(DeclarativeBase):
    """Base class used by all SQLAlchemy database models."""


engine = create_engine(settings.database_url)

SessionLocal = sessionmaker(
    bind=engine,
    autoflush=False,
    autocommit=False,
)


def get_db() -> Generator[Session, None, None]:
    """
    Provide one database session to a FastAPI endpoint.

    FastAPI will run the code before `yield`, pass the session to the route,
    then run the code after `yield` to close the session.
    """
    db = SessionLocal()

    try:
        yield db
    finally:
        db.close()
