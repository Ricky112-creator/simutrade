import express from "express";
import cors from "cors";
import rateLimit from "express-rate-limit";

import { connectDB } from "./database.js";

import {
  createDerivConnection,
  authorizeUser,
  getBalance
} from "./derivSocket.js";

import {
  createSession,
  getSession,
  updateSessionBalance
} from "./core/sessionManager.js";

import { buyTrade, sellTrade } from "./trading.js";

import Trade from "./models/Trade.js";

/**
 * 💰 WALLET SYSTEM IMPORTS (STEP 4)
 */
import {
  getOrCreateWallet,
  addBalance
} from "./core/walletManager.js";

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 3000;

/**
 * 🔥 CRASH PROTECTION
 */
process.on("uncaughtException", (err) => {
  console.error("🔥 UNCAUGHT EXCEPTION:", err);
});

process.on("unhandledRejection", (err) => {
  console.error("🔥 UNHANDLED PROMISE:", err);
});

/**
 * 🧠 DATABASE CONNECT (SAFE)
 */
(async () => {
  try {
    await connectDB();
    console.log("✅ MongoDB connected");
  } catch (err) {
    console.error("❌ MongoDB connection failed:", err.message);
    process.exit(1);
  }
})();

/**
 * 🚦 RATE LIMIT
 */
app.use(
  rateLimit({
    windowMs: 60 * 1000,
    max: 30
  })
);

/**
 * 🧠 HELPERS
 */
const asyncHandler = (fn) => (req, res, next) =>
  Promise.resolve(fn(req, res, next)).catch(next);

function validateConnect({ userId, token }) {
  if (!userId) throw new Error("userId required");
  if (!token) throw new Error("token required");
}

function validateTrade({ userId, amount, symbol, duration }) {
  if (!userId) throw new Error("userId required");
  if (!amount || amount <= 0) throw new Error("Invalid amount");
  if (amount > 1000) throw new Error("Max trade is 1000");
  if (!symbol) throw new Error("Symbol required");
  if (!duration || duration < 1 || duration > 60)
    throw new Error("Invalid duration");
}

/**
 * 🧾 LOGGING
 */
function log(type, message, data = {}) {
  console.log(
    JSON.stringify({
      time: new Date().toISOString(),
      type,
      message,
      ...data
    })
  );
}

/**
 * 🔐 ACTIVE TRADE LOCK
 */
const activeTrades = new Set();

/**
 * HEALTH CHECK
 */
app.get("/", (req, res) => {
  res.json({ status: "SimuTrade backend running ✅" });
});

app.get("/health", (req, res) => {
  res.json({
    status: "ok",
    uptime: process.uptime()
  });
});

/**
 * 💰 STEP 4: WALLET ENDPOINTS
 */

// GET WALLET BALANCE
app.get(
  "/wallet/:userId",
  asyncHandler(async (req, res) => {
    const wallet = await getOrCreateWallet(req.params.userId);

    res.json({
      userId: req.params.userId,
      balance: wallet.balance
    });
  })
);

// DEPOSIT (SIMULATION / ADMIN USE)
app.post(
  "/wallet/deposit",
  asyncHandler(async (req, res) => {
    const { userId, amount } = req.body;

    if (!userId) throw new Error("userId required");
    if (!amount || amount <= 0) throw new Error("invalid amount");

    const wallet = await addBalance(userId, amount, "DEPOSIT");

    res.json({
      status: "credited",
      balance: wallet.balance
    });
  })
);

/**
 * 🔗 CONNECT USER
 */
app.post(
  "/connect",
  asyncHandler(async (req, res) => {
    const { userId, token } = req.body;

    validateConnect({ userId, token });

    const ws = createDerivConnection();

    await new Promise((resolve, reject) => {
      ws.on("open", resolve);
      ws.on("error", reject);
    });

    const account = await authorizeUser(ws, token);
    const balance = await getBalance(ws);

    const session = await createSession(userId, ws, account);
    await updateSessionBalance(userId, balance);

    session.ws = ws;

    log("CONNECT", "User connected", { userId });

    res.json({
      status: "connected",
      userId,
      account,
      balance
    });
  })
);

/**
 * 📈 BUY TRADE
 */
app.post(
  "/buy",
  asyncHandler(async (req, res) => {
    const { userId, amount, contractType, duration, symbol } = req.body;

    validateTrade({ userId, amount, symbol, duration });

    const session = await getSession(userId);
    if (!session) throw new Error("No session");

    if (!session.ws || session.ws.readyState !== 1) {
      throw new Error("Connection lost. Reconnect required.");
    }

    if (activeTrades.has(userId)) {
      throw new Error("Trade already in progress");
    }

    activeTrades.add(userId);

    try {
      const result = await buyTrade(session.ws, {
        amount,
        contractType,
        duration,
        symbol
      });

      await Trade.create({
        userId,
        amount,
        contractType,
        symbol,
        contractId: result.contractId,
        result: "pending"
      });

      log("TRADE", "Buy executed", { userId, amount });

      res.json(result);
    } finally {
      activeTrades.delete(userId);
    }
  })
);

/**
 * 📉 SELL TRADE + 💰 WALLET UPDATE (STEP 5)
 */
app.post(
  "/sell",
  asyncHandler(async (req, res) => {
    const { userId, contractId } = req.body;

    if (!userId) throw new Error("userId required");
    if (!contractId) throw new Error("contractId required");

    const session = await getSession(userId);
    if (!session) throw new Error("No session");

    if (!session.ws || session.ws.readyState !== 1) {
      throw new Error("Connection lost. Reconnect required.");
    }

    const result = await sellTrade(session.ws, contractId);

    await Trade.findOneAndUpdate(
      { contractId },
      {
        result: result.profit > 0 ? "win" : "loss",
        profit: result.profit || 0
      }
    );

    /**
     * 💰 WALLET UPDATE (STEP 5)
     */
    if (result.profit && result.profit !== 0) {
      await addBalance(
        userId,
        result.profit,
        result.profit > 0 ? "TRADE_PROFIT" : "TRADE_LOSS"
      );
    }

    log("TRADE", "Sell executed", { userId, contractId });

    res.json(result);
  })
);

/**
 * ❌ GLOBAL ERROR HANDLER
 */
app.use((err, req, res, next) => {
  console.error("❌ ERROR:", err.message);

  res.status(500).json({
    error: err.message || "Internal Server Error"
  });
});

/**
 * 🚀 START SERVER
 */
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});