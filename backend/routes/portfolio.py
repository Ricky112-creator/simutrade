from fastapi import APIRouter, Request

from core.config import db, STARTING_BALANCE
from core.security import get_current_user
from core.market import fetch_quote

router = APIRouter(prefix="/portfolio", tags=["portfolio"])


@router.get("/summary")
async def get_portfolio(request: Request):
    user = await get_current_user(request)
    user_doc = await db.users.find_one({"user_id": user["user_id"]}, {"_id": 0})
    cash = user_doc.get("balance", STARTING_BALANCE)

    open_positions = await db.positions.find(
        {"user_id": user["user_id"], "status": "open"}, {"_id": 0}
    ).to_list(100)

    invested = sum(p["cost"] for p in open_positions)
    unrealized = 0.0
    for pos in open_positions:
        q = fetch_quote(pos["symbol"])
        dm = 1 if pos["direction"] == "long" else -1
        unrealized += (q["price"] - pos["entry_price"]) * pos["contracts"] * dm

    closed_trades = await db.positions.find(
        {"user_id": user["user_id"], "status": "closed"}, {"_id": 0}
    ).to_list(1000)
    realized = sum(t.get("pnl", 0) for t in closed_trades)

    total = round(cash + invested + unrealized, 2)
    total_return = round(total - STARTING_BALANCE, 2)
    total_pct = round((total_return / STARTING_BALANCE) * 100, 2)

    return {
        "cash_balance": round(cash, 2),
        "invested_value": round(invested, 2),
        "unrealized_pnl": round(unrealized, 2),
        "realized_pnl": round(realized, 2),
        "total_portfolio_value": total,
        "total_return": total_return,
        "total_return_pct": total_pct,
        "starting_balance": STARTING_BALANCE,
        "open_positions": len(open_positions),
        "total_trades": len(closed_trades),
    }
