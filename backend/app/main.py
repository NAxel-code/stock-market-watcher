import logging

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.gzip import GZipMiddleware

from app.api.v1 import alerts, market, stocks, watchlist
from app.core.config import settings
from app.core.exceptions import register_exception_handlers
from app.core.logging_config import setup_structured_logging
from app.models.schemas import HealthResponse

# Initialize structured JSON logging for Cloud Logging
setup_structured_logging()
logger = logging.getLogger("stockpulse")
logger.info("Initializing StockPulse FastAPI Application")

app = FastAPI(
    title="StockPulse API",
    version="1.1.0",
    description="Real-time stock market watcher backend with IDX & US market mechanics.",
)

app.add_middleware(GZipMiddleware, minimum_size=500)
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["GET", "POST", "DELETE", "OPTIONS"],
    allow_headers=["*"],
)

register_exception_handlers(app)

app.include_router(stocks.router, prefix="/api/v1")
app.include_router(market.router, prefix="/api/v1")
app.include_router(watchlist.router, prefix="/api/v1")
app.include_router(alerts.router, prefix="/api/v1")


@app.get("/api/v1/health", response_model=HealthResponse, tags=["health"])
def health_check() -> HealthResponse:
    """Health check endpoint for Cloud Run and UptimeRobot."""
    return HealthResponse(status="ok", service="StockPulse API")
