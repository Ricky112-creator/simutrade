from fastapi import APIRouter, HTTPException

from core.market import VOLATILITY_INDICES, fetch_quote

router = APIRouter(prefix="/market", tags=["market"])


@router.get("/quotes")
async def get_quotes():
    result = []
    for idx in VOLATILITY_INDICES:
        quote = fetch_quote(idx["symbol"])
        result.append({**idx, **quote})
    return result


@router.get("/history/{symbol}")
async def get_history(symbol: str, period: str = "1mo"):
    clean = symbol if symbol.startswith("^") else f"^{symbol}"
    try:
        import yfinance as yf
        ticker = yf.Ticker(clean)
        hist = ticker.history(period=period, interval="1d")
        data = []
        for date, row in hist.iterrows():
            data.append({
                "date": date.strftime("%Y-%m-%d"),
                "open": round(float(row["Open"]), 2),
                "high": round(float(row["High"]), 2),
                "low": round(float(row["Low"]), 2),
                "close": round(float(row["Close"]), 2),
            })
        return {"symbol": clean, "data": data}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))
