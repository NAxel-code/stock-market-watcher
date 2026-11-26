"""StockPulse FastAPI Application entry point with real-time SSE/WS streaming and 24/7 worker lifespan."""

import asyncio
import logging
import os
import sys
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.gzip import GZipMiddleware

from app.api.v1 import (
    alerts,
    auth,
    market,
    paper,
    portfolio,
    securities,
    stocks,
    stream,
    watchlist,
)
from app.core.config import settings
from app.core.exceptions import register_exception_handlers
from app.core.logging_config import setup_structured_logging
from app.models.schemas import HealthResponse
from app.services.alert_worker import alert_worker_loop
from app.services.stream_hub import quote_broadcaster_loop

# Initialize structured JSON logging for Cloud Logging
setup_structured_logging()
logger = logging.getLogger("stockpulse")
logger.info("Initializing StockPulse FastAPI Application")


@asynccontextmanager
async def lifespan(_app: FastAPI):
    """Manage background streaming broadcaster and 24/7 alert evaluation workers."""
    stop_event = asyncio.Event()
    tasks: list[asyncio.Task[None]] = []

    is_serverless = bool(os.environ.get("VERCEL") or os.environ.get("AWS_LAMBDA_FUNCTION_NAME"))
    is_testing = "pytest" in sys.modules

    if settings.enable_alert_worker and not is_serverless and not is_testing:
        tasks.append(asyncio.create_task(quote_broadcaster_loop(stop_event)))
        tasks.append(asyncio.create_task(alert_worker_loop(stop_event)))

    try:
        yield
    finally:
        stop_event.set()
        for t in tasks:
            t.cancel()
        if tasks:
            await asyncio.gather(*tasks, return_exceptions=True)


app = FastAPI(
    title="StockPulse API",
    version="1.2.0",
    description="Real-time stock market watcher backend with live streaming, persistent multi-device storage, and 24/7 alert evaluation.",
    lifespan=lifespan,
)

app.add_middleware(GZipMiddleware, minimum_size=500)
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["*"],
)

register_exception_handlers(app)

app.include_router(auth.router, prefix="/api/v1")
app.include_router(stocks.router, prefix="/api/v1")
app.include_router(market.router, prefix="/api/v1")
app.include_router(watchlist.router, prefix="/api/v1")
app.include_router(alerts.router, prefix="/api/v1")
app.include_router(securities.router, prefix="/api/v1")
app.include_router(portfolio.router, prefix="/api/v1")
app.include_router(paper.router, prefix="/api/v1")
app.include_router(stream.router, prefix="/api/v1")


@app.get("/api/v1/health", response_model=HealthResponse, tags=["health"])
def health_check() -> HealthResponse:
    """Health check endpoint for Cloud Run, Vercel, and UptimeRobot."""
    return HealthResponse(status="ok", service="StockPulse API")
