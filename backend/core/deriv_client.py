import asyncio
import json
import logging
import os
import uuid
from typing import Optional, Dict, Any, Callable

import websockets

logger = logging.getLogger(__name__)

DERIV_APP_ID = os.environ.get("DERIV_APP_ID", "1089")
DERIV_WS_URL = f"wss://ws.derivws.com/websockets/v3?app_id={DERIV_APP_ID}"


class DerivError(Exception):
    pass


class DerivClient:
    """Short-lived async WebSocket client for a single Deriv API call sequence.

    Usage:
        async with DerivClient(token) as c:
            info = await c.authorize()
            bal  = await c.balance()
    """

    def __init__(self, token: str, timeout: float = 12.0):
        self.token = token
        self.timeout = timeout
        self.ws: Optional[websockets.WebSocketClientProtocol] = None
        self._req_id = 0

    async def __aenter__(self):
        self.ws = await asyncio.wait_for(
            websockets.connect(DERIV_WS_URL, ping_interval=20, ping_timeout=20),
            timeout=self.timeout,
        )
        return self

    async def __aexit__(self, exc_type, exc, tb):
        if self.ws is not None:
            try:
                await self.ws.close()
            except Exception:
                pass

    async def _call(self, payload: Dict[str, Any]) -> Dict[str, Any]:
        self._req_id += 1
        payload = {**payload, "req_id": self._req_id}
        await self.ws.send(json.dumps(payload))
        # Wait for matching response
        deadline = asyncio.get_event_loop().time() + self.timeout
        while True:
            remaining = deadline - asyncio.get_event_loop().time()
            if remaining <= 0:
                raise DerivError("Deriv request timed out")
            msg = await asyncio.wait_for(self.ws.recv(), timeout=remaining)
            data = json.loads(msg)
            if data.get("req_id") == self._req_id:
                if data.get("error"):
                    raise DerivError(data["error"].get("message", "Deriv error"))
                return data

    async def authorize(self) -> Dict[str, Any]:
        return (await self._call({"authorize": self.token})).get("authorize", {})

    async def balance(self) -> Dict[str, Any]:
        return (await self._call({"balance": 1})).get("balance", {})

    async def active_symbols(self, product: str = "basic") -> list:
        data = await self._call({"active_symbols": "brief", "product_type": product})
        return data.get("active_symbols", [])

    async def portfolio(self) -> list:
        data = await self._call({"portfolio": 1})
        return data.get("portfolio", {}).get("contracts", [])

    async def profit_table(self, limit: int = 50) -> list:
        data = await self._call({"profit_table": 1, "limit": limit, "sort": "DESC"})
        return data.get("profit_table", {}).get("transactions", [])

    async def proposal(self, *, symbol: str, contract_type: str, amount: float,
                       duration: int, duration_unit: str, currency: str = "USD") -> Dict[str, Any]:
        data = await self._call({
            "proposal": 1,
            "amount": amount,
            "basis": "stake",
            "contract_type": contract_type,
            "currency": currency,
            "duration": duration,
            "duration_unit": duration_unit,
            "symbol": symbol,
        })
        return data.get("proposal", {})

    async def buy(self, proposal_id: str, price: float) -> Dict[str, Any]:
        data = await self._call({"buy": proposal_id, "price": price})
        return data.get("buy", {})

    async def sell(self, contract_id: int, price: float = 0) -> Dict[str, Any]:
        data = await self._call({"sell": contract_id, "price": price})
        return data.get("sell", {})


async def stream_ticks(token: str, symbol: str, on_tick: Callable[[Dict[str, Any]], Any],
                       stop_event: asyncio.Event):
    """Long-lived tick subscription. Reconnects on drop until stop_event is set."""
    backoff = 1.0
    subscription_id = str(uuid.uuid4())
    while not stop_event.is_set():
        try:
            async with websockets.connect(DERIV_WS_URL, ping_interval=20, ping_timeout=20) as ws:
                await ws.send(json.dumps({"authorize": token, "req_id": 1}))
                auth = json.loads(await ws.recv())
                if auth.get("error"):
                    logger.error(f"Deriv tick auth failed: {auth['error']}")
                    return
                await ws.send(json.dumps({"ticks": symbol, "subscribe": 1, "req_id": 2}))
                backoff = 1.0  # reset on success
                while not stop_event.is_set():
                    try:
                        msg = await asyncio.wait_for(ws.recv(), timeout=30)
                    except asyncio.TimeoutError:
                        continue
                    data = json.loads(msg)
                    if data.get("msg_type") == "tick":
                        tick = data.get("tick", {})
                        await on_tick({
                            "symbol": tick.get("symbol"),
                            "quote": tick.get("quote"),
                            "epoch": tick.get("epoch"),
                            "subscription_id": subscription_id,
                        })
        except Exception as e:
            logger.warning(f"Deriv tick stream error: {e}; reconnecting in {backoff}s")
            await asyncio.sleep(backoff)
            backoff = min(backoff * 2, 30)
