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
 * 💰 WALLET SYSTEM
 */
import {
  getOrCreateWallet,
  addBalance
} from "./core/walletManager.js";

/**
 * 🔐 AUTH SYSTEM
 */
import User from "./models/User.js";
import { generateToken, hashPassword, comparePassword } from "./auth/auth.js";
import { authMiddleware } from "./middleware/authMiddleware.js";

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
 * 🧠 DATABASE CONNECT
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
app.use(rateLimit({
  windowMs: 60 * 1000,
  max: 30
}));

/**
 * 🧠 HELPERS
 */
const asyncHandler = (fn) => (req, res, next) =>
  Promise.resolve(fn(req, res, next)).catch(next);

/**
 * 🔐 ADMIN MIDDLEWARE
 */
function adminOnly(req, res, next) {
  if (!req.user || req.user.role !== "admin") {
    return res.status(403).json({ error: "Admin only" });
  }
  next();
}

/**
 * =========================
 * AUTH ROUTES
 * =========================
 */

// REGISTER
app.post("/register", asyncHandler(async (req, res) => {
  const { userId, password } = req.body;

  if (!userId || !password) throw new Error("Missing fields");

  const exists = await User.findOne({ userId });
  if (exists) throw new Error("User exists");

  const hashed = await hashPassword(password);

  await User.create({
    userId,
    password: hashed,
    role: "user"
  });

  res.json({ message: "User created" });
}));

// LOGIN
app.post("/login", asyncHandler(async (req, res) => {
  const { userId, password } = req.body;

  const user = await User.findOne({ userId });
  if (!user) throw new Error("User not found");

  const ok = await comparePassword(password, user.password);
  if (!ok) throw new Error("Invalid credentials");

  const token = generateToken(user);

  res.json({
    token,
    userId: user.userId,
    role: user.role
  });
}));

/**
 * =========================
 * ADMIN ROUTES 🔥
 * =========================
 */

// VIEW ALL USERS
app.get("/admin/users",
  authMiddleware,
  adminOnly,
  asyncHandler(async (req, res) => {
    const users = await User.find().select("-password");
    res.json(users);
  })
);

// CREDIT USER WALLET
app.post("/admin/credit",
  authMiddleware,
  adminOnly,
  asyncHandler(async (req, res) => {
    const { userId, amount } = req.body;

    if (!userId || !amount) throw new Error("Invalid request");

    const wallet = await addBalance(userId, amount, "ADMIN_CREDIT");

    res.json({
      message: "Wallet credited",
      balance: wallet.balance
    });
  })
);

/**
 * =========================
 * WALLET
 * =========================
 */
app.get("/wallet/:userId",
  authMiddleware,
  asyncHandler(async (req, res) => {
    const wallet = await getOrCreateWallet(req.params.userId);

    res.json(wallet);
  })
);

/**
 * =========================
 * CONNECT
 * =========================
 */
app.post("/connect",
  authMiddleware,
  asyncHandler(async (req, res) => {

    const { userId, token } = req.body;

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

    res.json({ status: "connected", balance });
  })
);

/**
 * =========================
 * BUY
 * =========================
 */
const activeTrades = new Set();

app.post("/buy",
  authMiddleware,
  asyncHandler(async (req, res) => {

    const { userId, amount, contractType, duration, symbol } = req.body;

    const session = await getSession(userId);
    if (!session) throw new Error("No session");

    if (activeTrades.has(userId)) throw new Error("Trade locked");

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

      res.json(result);

    } finally {
      activeTrades.delete(userId);
    }
  })
);

/**
 * =========================
 * SELL
 * =========================
 */
app.post("/sell",
  authMiddleware,
  asyncHandler(async (req, res) => {

    const { userId, contractId } = req.body;

    const session = await getSession(userId);
    if (!session) throw new Error("No session");

    const result = await sellTrade(session.ws, contractId);

    await Trade.findOneAndUpdate(
      { contractId },
      {
        result: result.profit > 0 ? "win" : "loss",
        profit: result.profit
      }
    );

    if (result.profit) {
      await addBalance(userId, result.profit, "TRADE_RESULT");
    }

    res.json(result);
  })
);

/**
 * ❌ ERROR HANDLER
 */
app.use((err, req, res, next) => {
  console.error("❌ ERROR:", err.message);
  res.status(500).json({ error: err.message });
});

/**
 * 🚀 START
 */
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});