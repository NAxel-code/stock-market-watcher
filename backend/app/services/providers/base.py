"""Abstract base class for financial market data providers."""

from abc import ABC, abstractmethod
from typing import Any


class BaseMarketDataProvider(ABC):
    """Protocol for fetching market quotes, histories, and searches."""

    @property
    @abstractmethod
    def name(self) -> str:
        """Provider identifier."""
        pass

    @abstractmethod
    def get_quote(self, ticker: str) -> dict[str, Any] | None:
        """Fetch real-time stock quote."""
        pass

    @abstractmethod
    def get_history(self, ticker: str, period: str) -> dict[str, Any] | None:
        """Fetch historical price points."""
        pass

    @abstractmethod
    def search(self, query: str) -> list[dict[str, Any]]:
        """Search tickers by text."""
        pass
