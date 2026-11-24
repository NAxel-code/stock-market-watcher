from datetime import datetime, timezone
from app.models.schemas import SecurityMasterItem, SecurityMasterResponse
from app.services import yahoo_finance as yf_service


# Pre-populated primary security master universe
DEFAULT_SECURITIES: dict[str, SecurityMasterItem] = {
    # --- US MEGA CAPS & BLUECHIPS ---
    "AAPL": SecurityMasterItem(
        ticker="AAPL",
        name="Apple Inc.",
        exchange="NASDAQ",
        currency="USD",
        asset_type="EQUITY",
        sector="Technology",
        industry="Consumer Electronics",
        cik="0000320193",
        isin="US0378331005",
        is_primary=True,
    ),
    "NVDA": SecurityMasterItem(
        ticker="NVDA",
        name="NVIDIA Corporation",
        exchange="NASDAQ",
        currency="USD",
        asset_type="EQUITY",
        sector="Technology",
        industry="Semiconductors",
        cik="0001045810",
        isin="US67066G1040",
        is_primary=True,
    ),
    "MSFT": SecurityMasterItem(
        ticker="MSFT",
        name="Microsoft Corporation",
        exchange="NASDAQ",
        currency="USD",
        asset_type="EQUITY",
        sector="Technology",
        industry="Software—Infrastructure",
        cik="0000789019",
        isin="US5949181045",
        is_primary=True,
    ),
    "AMZN": SecurityMasterItem(
        ticker="AMZN",
        name="Amazon.com, Inc.",
        exchange="NASDAQ",
        currency="USD",
        asset_type="EQUITY",
        sector="Consumer Cyclical",
        industry="Internet Retail",
        cik="0001018724",
        isin="US0231351067",
        is_primary=True,
    ),
    "GOOGL": SecurityMasterItem(
        ticker="GOOGL",
        name="Alphabet Inc. (Class A)",
        exchange="NASDAQ",
        currency="USD",
        asset_type="EQUITY",
        sector="Communication Services",
        industry="Internet Content & Information",
        cik="0001652044",
        isin="US02079K3059",
        is_primary=True,
    ),
    "META": SecurityMasterItem(
        ticker="META",
        name="Meta Platforms, Inc.",
        exchange="NASDAQ",
        currency="USD",
        asset_type="EQUITY",
        sector="Communication Services",
        industry="Internet Content & Information",
        cik="0001326801",
        isin="US30303M1027",
        is_primary=True,
    ),
    "TSLA": SecurityMasterItem(
        ticker="TSLA",
        name="Tesla, Inc.",
        exchange="NASDAQ",
        currency="USD",
        asset_type="EQUITY",
        sector="Consumer Cyclical",
        industry="Auto Manufacturers",
        cik="0001318605",
        isin="US88160R1014",
        is_primary=True,
    ),
    "JPM": SecurityMasterItem(
        ticker="JPM",
        name="JPMorgan Chase & Co.",
        exchange="NYSE",
        currency="USD",
        asset_type="EQUITY",
        sector="Financial Services",
        industry="Banks—Diversified",
        cik="0000019617",
        isin="US46625H1005",
        is_primary=True,
    ),

    # --- SGX SINGAPORE BLUECHIPS ---
    "D05.SI": SecurityMasterItem(
        ticker="D05.SI",
        name="DBS Group Holdings Ltd",
        exchange="SGX",
        currency="SGD",
        asset_type="EQUITY",
        sector="Financial Services",
        industry="Banks—Regional",
        isin="SG1L01001701",
        is_primary=True,
    ),
    "O39.SI": SecurityMasterItem(
        ticker="O39.SI",
        name="Oversea-Chinese Banking Corporation",
        exchange="SGX",
        currency="SGD",
        asset_type="EQUITY",
        sector="Financial Services",
        industry="Banks—Regional",
        isin="SG1S04926220",
        is_primary=True,
    ),
    "U11.SI": SecurityMasterItem(
        ticker="U11.SI",
        name="United Overseas Bank Ltd",
        exchange="SGX",
        currency="SGD",
        asset_type="EQUITY",
        sector="Financial Services",
        industry="Banks—Regional",
        isin="SG1M31001969",
        is_primary=True,
    ),
    "Z74.SI": SecurityMasterItem(
        ticker="Z74.SI",
        name="Singapore Telecommunications Ltd",
        exchange="SGX",
        currency="SGD",
        asset_type="EQUITY",
        sector="Communication Services",
        industry="Telecom Services",
        isin="SG1T75931496",
        is_primary=True,
    ),
    "C6L.SI": SecurityMasterItem(
        ticker="C6L.SI",
        name="Singapore Airlines Ltd",
        exchange="SGX",
        currency="SGD",
        asset_type="EQUITY",
        sector="Industrials",
        industry="Airlines",
        isin="SG1V61937297",
        is_primary=True,
    ),
    "BN4.SI": SecurityMasterItem(
        ticker="BN4.SI",
        name="Keppel Corporation Ltd",
        exchange="SGX",
        currency="SGD",
        asset_type="EQUITY",
        sector="Industrials",
        industry="Conglomerates",
        isin="SG1U68934629",
        is_primary=True,
    ),

    # --- IDX INDONESIA (BEI) BLUECHIPS ---
    "BBCA.JK": SecurityMasterItem(
        ticker="BBCA.JK",
        name="PT Bank Central Asia Tbk",
        exchange="IDX",
        currency="IDR",
        asset_type="EQUITY",
        sector="Financial Services",
        industry="Banks—Regional",
        isin="ID1000109507",
        is_primary=True,
    ),
    "BBRI.JK": SecurityMasterItem(
        ticker="BBRI.JK",
        name="PT Bank Rakyat Indonesia (Persero) Tbk",
        exchange="IDX",
        currency="IDR",
        asset_type="EQUITY",
        sector="Financial Services",
        industry="Banks—Regional",
        isin="ID1000118201",
        is_primary=True,
    ),
    "BMRI.JK": SecurityMasterItem(
        ticker="BMRI.JK",
        name="PT Bank Mandiri (Persero) Tbk",
        exchange="IDX",
        currency="IDR",
        asset_type="EQUITY",
        sector="Financial Services",
        industry="Banks—Regional",
        isin="ID1000095003",
        is_primary=True,
    ),
    "TLKM.JK": SecurityMasterItem(
        ticker="TLKM.JK",
        name="PT Telkom Indonesia (Persero) Tbk",
        exchange="IDX",
        currency="IDR",
        asset_type="EQUITY",
        sector="Communication Services",
        industry="Telecom Services",
        isin="ID1000129000",
        is_primary=True,
    ),
    "ASII.JK": SecurityMasterItem(
        ticker="ASII.JK",
        name="PT Astra International Tbk",
        exchange="IDX",
        currency="IDR",
        asset_type="EQUITY",
        sector="Consumer Cyclical",
        industry="Auto Manufacturers",
        isin="ID1000122807",
        is_primary=True,
    ),
    "GOTO.JK": SecurityMasterItem(
        ticker="GOTO.JK",
        name="PT GoTo Gojek Tokopedia Tbk",
        exchange="IDX",
        currency="IDR",
        asset_type="EQUITY",
        sector="Technology",
        industry="Internet Retail",
        isin="ID1000169709",
        is_primary=True,
    ),

    # --- BENCHMARK INDICES ---
    "^GSPC": SecurityMasterItem(
        ticker="^GSPC",
        name="S&P 500 Index",
        exchange="US",
        currency="USD",
        asset_type="INDEX",
        sector="Broad Market",
        is_primary=True,
    ),
    "^STI": SecurityMasterItem(
        ticker="^STI",
        name="Straits Times Index",
        exchange="SGX",
        currency="SGD",
        asset_type="INDEX",
        sector="Broad Market",
        is_primary=True,
    ),
    "^JKSE": SecurityMasterItem(
        ticker="^JKSE",
        name="Jakarta Composite Index (IHSG)",
        exchange="IDX",
        currency="IDR",
        asset_type="INDEX",
        sector="Broad Market",
        is_primary=True,
    ),
}

# Runtime memory security master repository
_security_cache: dict[str, SecurityMasterItem] = dict(DEFAULT_SECURITIES)


def get_security(ticker: str) -> SecurityMasterItem | None:
    """Retrieve security metadata by ticker, with dynamic fallback resolution."""
    symbol = ticker.strip().upper()
    if symbol in _security_cache:
        return _security_cache[symbol]

    # Dynamic lookup via quote service
    try:
        quote = yf_service.get_quote(symbol)
        exchange = "IDX" if symbol.endswith(".JK") else "SGX" if symbol.endswith(".SI") else "US"
        sec = SecurityMasterItem(
            ticker=quote.ticker,
            name=quote.company_name,
            exchange=exchange,
            currency=quote.currency,
            asset_type="EQUITY",
            sector=quote.sector,
            industry=quote.industry,
            is_primary=True,
        )
        _security_cache[symbol] = sec
        return sec
    except Exception:
        return None


def list_securities(
    exchange: str | None = None,
    sector: str | None = None,
    asset_type: str | None = None,
    query: str | None = None,
    limit: int = 50,
) -> SecurityMasterResponse:
    """Search and filter the security master universe."""
    items = list(_security_cache.values())

    if exchange:
        exch = exchange.strip().upper()
        items = [s for s in items if s.exchange.upper() == exch]

    if sector:
        sec = sector.strip().lower()
        items = [s for s in items if s.sector and s.sector.strip().lower() == sec]

    if asset_type:
        atype = asset_type.strip().upper()
        items = [s for s in items if s.asset_type.upper() == atype]

    if query:
        q = query.strip().upper()
        items = [s for s in items if q in s.ticker.upper() or q in s.name.upper()]

    limited = items[:limit]
    return SecurityMasterResponse(
        total=len(items),
        securities=limited,
        as_of=datetime.now(timezone.utc).isoformat(),
    )


def upsert_security(item: SecurityMasterItem) -> SecurityMasterItem:
    """Upsert a security into the master repository."""
    _security_cache[item.ticker.upper()] = item
    return item
