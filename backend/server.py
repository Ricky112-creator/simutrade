from dotenv import load_dotenv
load_dotenv()

from fastapi import FastAPI, APIRouter, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
from pydantic import BaseModel
from typing import Optional, List
import os
import jwt
import bcrypt
import uuid
import requests
import logging
from datetime import datetime, timezone, timedelta

logger = logging.getLogger(__name__)

mongo_url = os.environ["MONGO_URL"]
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ["DB_NAME"]]

app = FastAPI(title="SimuTrade API")
api_router = APIRouter(prefix="/api")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

JWT_SECRET = os.environ.get("JWT_SECRET", "default_jwt_secret_change_in_production_please")
JWT_ALG = "HS256"
STARTING_BALANCE = 10000.0

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


def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode(), bcrypt.gensalt()).decode()


def verify_password(plain: str, hashed: str) -> bool:
    return bcrypt.checkpw(plain.encode(), hashed.encode())


def create_access_token(user_id: str, email: str) -> str:
    payload = {
        "sub": user_id,
        "email": email,
        "exp": datetime.now(timezone.utc) + timedelta(days=7),
        "type": "access",
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALG)


async def get_current_user(request: Request) -> dict:
    token = None
    auth_header = request.headers.get("Authorization", "")
    if auth_header.startswith("Bearer "):
        token = auth_header[7:]
    if not token:
        raise HTTPException(status_code=401, detail="Not authenticated")

    # Try as JWT first
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALG])
        if payload.get("type") == "access":
            user_id = payload["sub"]
            user = await db.users.find_one({"user_id": user_id}, {"_id": 0, "password_hash": 0})
            if not user:
                raise HTTPException(status_code=401, detail="User not found")
            return user
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except jwt.InvalidTokenError:
        pass

    # Try as Emergent session token (Google OAuth)
    session = await db.sessions.find_one({"session_token": token}, {"_id": 0})
    if not session:
        raise HTTPException(status_code=401, detail="Invalid token")

    expires_at = session["expires_at"]
    if isinstance(expires_at, str):
        expires_at = datetime.fromisoformat(expires_at)
    if expires_at.tzinfo is None:
        expires_at = expires_at.replace(tzinfo=timezone.utc)
    if expires_at < datetime.now(timezone.utc):
        raise HTTPException(status_code=401, detail="Session expired")

    user = await db.users.find_one({"user_id": session["user_id"]}, {"_id": 0, "password_hash": 0})
    if not user:
        raise HTTPException(status_code=401, detail="User not found")
    return user


def fetch_quote(symbol: str) -> dict:
    cache_entry = _quote_cache.get(symbol)
    if cache_entry:
        cached_at = datetime.fromisoformat(cache_entry["last_updated"]).replace(tzinfo=timezone.utc)
        if (datetime.now(timezone.utc) - cached_at).seconds < 300:
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


# Pydantic models
class RegisterRequest(BaseModel):
    email: str
    password: str
    name: str


class LoginRequest(BaseModel):
    email: str
    password: str


class GoogleSessionRequest(BaseModel):
    session_id: str


class OnboardingRequest(BaseModel):
    experience_level: str
    risk_tolerance: str
    trading_goals: List[str] = []


class TradeRequest(BaseModel):
    symbol: str
    direction: str
    contracts: float


# Auth endpoints
@api_router.post("/auth/register")
async def register(req: RegisterRequest):
    email = req.email.lower().strip()
    if await db.users.find_one({"email": email}):
        raise HTTPException(status_code=400, detail="Email already registered")

    user_id = f"user_{uuid.uuid4().hex[:12]}"
    doc = {
        "user_id": user_id,
        "email": email,
        "name": req.name.strip(),
        "password_hash": hash_password(req.password),
        "role": "user",
        "auth_type": "email",
        "onboarding_complete": False,
        "balance": STARTING_BALANCE,
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    await db.users.insert_one(doc)
    token = create_access_token(user_id, email)
    doc.pop("password_hash")
    doc.pop("_id", None)
    return {"user": doc, "token": token}


@api_router.post("/auth/login")
async def login(req: LoginRequest):
    email = req.email.lower().strip()
    user = await db.users.find_one({"email": email})
    if not user or not verify_password(req.password, user.get("password_hash", "")):
        raise HTTPException(status_code=401, detail="Invalid email or password")
    user.pop("_id", None)
    user.pop("password_hash", None)
    token = create_access_token(user["user_id"], email)
    return {"user": user, "token": token}


@api_router.post("/auth/google/session")
async def google_session(req: GoogleSessionRequest):
    # Exchange Emergent session_id for user data
    resp = requests.get(
        "https://demobackend.emergentagent.com/auth/v1/env/oauth/session-data",
        headers={"X-Session-ID": req.session_id},
        timeout=10,
    )
    if resp.status_code != 200:
        raise HTTPException(status_code=400, detail="Invalid Google session")

    data = resp.json()
    email = data["email"].lower()
    session_token = data["session_token"]

    existing = await db.users.find_one({"email": email}, {"_id": 0})
    if existing:
        user_id = existing["user_id"]
        await db.users.update_one(
            {"user_id": user_id},
            {"$set": {"name": data.get("name", ""), "picture": data.get("picture", "")}},
        )
    else:
        user_id = f"user_{uuid.uuid4().hex[:12]}"
        await db.users.insert_one({
            "user_id": user_id,
            "email": email,
            "name": data.get("name", ""),
            "picture": data.get("picture", ""),
            "role": "user",
            "auth_type": "google",
            "onboarding_complete": False,
            "balance": STARTING_BALANCE,
            "created_at": datetime.now(timezone.utc).isoformat(),
        })

    expires_at = datetime.now(timezone.utc) + timedelta(days=7)
    await db.sessions.insert_one({
        "user_id": user_id,
        "session_token": session_token,
        "expires_at": expires_at.isoformat(),
        "created_at": datetime.now(timezone.utc).isoformat(),
    })

    user_doc = await db.users.find_one({"user_id": user_id}, {"_id": 0, "password_hash": 0})
    return {"user": user_doc, "token": session_token}


@api_router.get("/auth/me")
async def get_me(request: Request):
    return await get_current_user(request)


@api_router.post("/auth/logout")
async def logout(request: Request):
    await get_current_user(request)
    auth_header = request.headers.get("Authorization", "")
    if auth_header.startswith("Bearer "):
        token = auth_header[7:]
        await db.sessions.delete_one({"session_token": token})
    return {"message": "Logged out"}


@api_router.put("/auth/onboarding")
async def complete_onboarding(req: OnboardingRequest, request: Request):
    user = await get_current_user(request)
    await db.users.update_one(
        {"user_id": user["user_id"]},
        {"$set": {
            "onboarding_complete": True,
            "experience_level": req.experience_level,
            "risk_tolerance": req.risk_tolerance,
            "trading_goals": req.trading_goals,
        }},
    )
    return {"message": "Onboarding complete"}


# Market endpoints
@api_router.get("/market/quotes")
async def get_quotes():
    result = []
    for idx in VOLATILITY_INDICES:
        quote = fetch_quote(idx["symbol"])
        result.append({**idx, **quote})
    return result


@api_router.get("/market/history/{symbol}")
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


# Trading endpoints
@api_router.post("/trading/open")
async def open_position(req: TradeRequest, request: Request):
    user = await get_current_user(request)
    if req.direction not in ("long", "short"):
        raise HTTPException(status_code=400, detail="Direction must be 'long' or 'short'")
    if req.contracts <= 0:
        raise HTTPException(status_code=400, detail="Contracts must be a positive number")

    quote = fetch_quote(req.symbol)
    price = quote["price"]
    if price <= 0:
        raise HTTPException(status_code=400, detail="Unable to get current price for this instrument")

    cost = round(price * req.contracts, 2)
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
        "contracts": req.contracts,
        "entry_price": price,
        "cost": cost,
        "status": "open",
        "opened_at": datetime.now(timezone.utc).isoformat(),
    }
    await db.positions.insert_one(position)
    position.pop("_id", None)
    return position


@api_router.post("/trading/close/{position_id}")
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


@api_router.get("/trading/positions")
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


@api_router.get("/trading/history")
async def get_trade_history(request: Request):
    user = await get_current_user(request)
    trades = await db.positions.find(
        {"user_id": user["user_id"]}, {"_id": 0}
    ).sort("opened_at", -1).to_list(50)
    return trades


# Portfolio endpoint
@api_router.get("/portfolio/summary")
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


app.include_router(api_router)


@app.on_event("startup")
async def startup():
    await db.users.create_index("email", unique=True)
    await db.users.create_index("user_id")
    await db.sessions.create_index("session_token")
    await db.positions.create_index("user_id")

    admin_email = os.environ.get("ADMIN_EMAIL", "admin@simutrade.com")
    admin_password = os.environ.get("ADMIN_PASSWORD", "SimuTrade2024!")
    if not await db.users.find_one({"email": admin_email}):
        user_id = f"user_{uuid.uuid4().hex[:12]}"
        await db.users.insert_one({
            "user_id": user_id,
            "email": admin_email,
            "name": "Admin",
            "password_hash": hash_password(admin_password),
            "role": "admin",
            "auth_type": "email",
            "onboarding_complete": True,
            "balance": STARTING_BALANCE,
            "created_at": datetime.now(timezone.utc).isoformat(),
        })


@app.on_event("shutdown")
async def shutdown():
    client.close()
