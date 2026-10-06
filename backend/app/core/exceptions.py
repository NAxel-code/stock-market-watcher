from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse


class StockNotFoundError(Exception):
    def __init__(self, ticker: str) -> None:
        self.ticker = ticker
        super().__init__(f"Stock '{ticker}' not found")


class ExternalAPIError(Exception):
    def __init__(self, message: str) -> None:
        super().__init__(message)


def register_exception_handlers(app: FastAPI) -> None:
    @app.exception_handler(StockNotFoundError)
    async def stock_not_found_handler(request: Request, exc: StockNotFoundError) -> JSONResponse:
        return JSONResponse(
            status_code=404,
            content={"error": str(exc), "code": 404},
        )

    @app.exception_handler(ExternalAPIError)
    async def external_api_error_handler(request: Request, exc: ExternalAPIError) -> JSONResponse:
        return JSONResponse(
            status_code=503,
            content={"error": str(exc), "code": 503},
        )
