import uuid
from datetime import datetime, timezone
from fastapi import APIRouter, HTTPException, Request

from core.config import db
from core.security import get_current_user
from core.market import fetch_quote
from models.schemas import TradeRequest

router = APIRouter(prefix="/trading", tags=["trading"])


@router.post("/open")
async def open_position(req: TradeRequest, request: Request):
    user = await get_current_user(request)
    if req.direction not in ("long", "short"):
        raise HTTPException(status_code=400, detail="Direction must be 'long' or 'short'")
    size = req.size()
    if size <= 0:
        raise HTTPException(status_code=400, detail="Contracts must be a positive number")

    quote = fetch_quote(req.symbol)
    price = quote["price"]
    if price <= 0:
        raise HTTPException(status_code=400, detail="Unable to get current price for this instrument")

    cost = round(price * size, 2)
    user_doc = await db.users.find_one({"user_id": user["user_id"]}, {"_id": 0})
    if user_doc["balance"] < cost:
        raise HTTPException(
            status_code=400,
            detail=f"Insufficient balance. Need ${cost:.2f}, available ${user_doc['balance']:.2f}",
        )

    await db.users.update_one({"user_id": user["user_id"]}, {"$inc": {"balance": -cost}})

    position = {
        "position_id": str(uuid.uuid4()),
        "user_id": user["user_id"],
        "symbol": req.symbol,
        "direction": req.direction,
        "contracts": size,
        "entry_price": price,
        "cost": cost,
        "status": "open",
        "opened_at": datetime.now(timezone.utc).isoformat(),
    }
    await db.positions.insert_one(position)
    position.pop("_id", None)
    return position


@router.post("/close/{position_id}")
async def close_position(position_id: str, request: Request):
    user = await get_current_user(request)
    pos = await db.positions.find_one(
        {"position_id": position_id, "user_id": user["user_id"], "status": "open"},
        {"_id": 0},
    )
    if not pos:
        raise HTTPException(status_code=404, detail="Open position not found")

    quote = fetch_quote(pos["symbol"])
    current_price = quote["price"]
    direction_mult = 1 if pos["direction"] == "long" else -1
    pnl = round((current_price - pos["entry_price"]) * pos["contracts"] * direction_mult, 2)
    proceeds = round(pos["cost"] + pnl, 2)

    await db.users.update_one({"user_id": user["user_id"]}, {"$inc": {"balance": proceeds}})
    await db.positions.update_one(
        {"position_id": position_id},
        {"$set": {
            "status": "closed",
            "exit_price": current_price,
            "pnl": pnl,
            "proceeds": proceeds,
            "closed_at": datetime.now(timezone.utc).isoformat(),
        }},
    )
    return {"message": "Position closed", "pnl": pnl, "proceeds": proceeds}


@router.get("/positions")
async def get_open_positions(request: Request):
    user = await get_current_user(request)
    positions = await db.positions.find(
        {"user_id": user["user_id"], "status": "open"}, {"_id": 0}
    ).to_list(100)
    for pos in positions:
        q = fetch_quote(pos["symbol"])
        cp = q["price"]
        dm = 1 if pos["direction"] == "long" else -1
        pos["current_price"] = cp
        pos["unrealized_pnl"] = round((cp - pos["entry_price"]) * pos["contracts"] * dm, 2)
        pos["pnl_pct"] = round(((cp - pos["entry_price"]) / pos["entry_price"] * 100) * dm, 2) if pos["entry_price"] > 0 else 0
    return positions


@router.get("/history")
async def get_trade_history(request: Request):
    user = await get_current_user(request)
    trades = await db.positions.find(
        {"user_id": user["user_id"]}, {"_id": 0}
    ).sort("opened_at", -1).to_list(50)
    return trades
