import logging
from datetime import datetime, timezone

logger = logging.getLogger(__name__)

VOLATILITY_INDICES = [
    {"symbol": "^VIX", "display": "VIX", "name": "CBOE Volatility Index", "description": "The S&P 500 fear gauge. Measures expected 30-day market volatility."},
    {"symbol": "^VXN", "display": "VXN", "name": "CBOE NASDAQ Volatility", "description": "Measures expected volatility of the tech-heavy NASDAQ-100 index."},
    {"symbol": "^VVIX", "display": "VVIX", "name": "Volatility of VIX", "description": "The second-order fear gauge. Measures how much the VIX itself fluctuates."},
    {"symbol": "^OVX", "display": "OVX", "name": "CBOE Crude Oil Volatility", "description": "Tracks expected price swings in WTI crude oil futures."},
    {"symbol": "^GVZ", "display": "GVZ", "name": "CBOE Gold Volatility", "description": "Measures expected 30-day volatility of gold prices (GLD ETF)."},
    {"symbol": "^EVZ", "display": "EVZ", "name": "CBOE EuroCurrency Volatility", "description": "Tracks expected volatility of the EUR/USD currency pair."},
    {"symbol": "^RVX", "display": "RVX", "name": "CBOE Russell 2000 Volatility", "description": "Measures expected volatility of small-cap stocks (Russell 2000)."},
]

_quote_cache: dict = {}


def fetch_quote(symbol: str) -> dict:
    cache_entry = _quote_cache.get(symbol)
    if cache_entry:
        cached_at = datetime.fromisoformat(cache_entry["last_updated"]).replace(tzinfo=timezone.utc)
        if (datetime.now(timezone.utc) - cached_at).seconds < 60:
            return cache_entry

    try:
        import yfinance as yf
        ticker = yf.Ticker(symbol)
        hist = ticker.history(period="5d", interval="1d")

        if hist.empty:
            raise ValueError("No data returned")

        current_price = float(hist["Close"].iloc[-1])
        prev_close = float(hist["Close"].iloc[-2]) if len(hist) >= 2 else current_price
        change = current_price - prev_close
        change_pct = (change / prev_close * 100) if prev_close else 0

        result = {
            "symbol": symbol,
            "price": round(current_price, 2),
            "change": round(change, 2),
            "change_pct": round(change_pct, 2),
            "prev_close": round(prev_close, 2),
            "last_updated": datetime.now(timezone.utc).isoformat(),
        }
        _quote_cache[symbol] = result
        return result
    except Exception as e:
        logger.error(f"Quote fetch error {symbol}: {e}")
        if symbol in _quote_cache:
            return _quote_cache[symbol]
        return {
            "symbol": symbol, "price": 0.0, "change": 0.0,
            "change_pct": 0.0, "prev_close": 0.0,
            "last_updated": datetime.now(timezone.utc).isoformat(),
        }
