import Session from "../models/Session.js";

/**
 * CREATE SESSION (or update if exists)
 */
export async function createSession(userId, ws, account) {
  const session = await Session.findOneAndUpdate(
    { userId },
    {
      userId,
      account,
      wsState: "connected",
      updatedAt: new Date()
    },
    { upsert: true, new: true }
  );

  // attach websocket temporarily (NOT stored in DB)
  session.ws = ws;

  return session;
}

/**
 * GET SESSION
 */
export async function getSession(userId) {
  const session = await Session.findOne({ userId });
  if (!session) return null;

  return session;
}

/**
 * DELETE SESSION
 */
export async function deleteSession(userId) {
  await Session.deleteOne({ userId });
}

/**
 * UPDATE BALANCE
 */
export async function updateSessionBalance(userId, balance) {
  await Session.findOneAndUpdate(
    { userId },
    {
      balance,
      updatedAt: new Date()
    }
  );
}

/**
 * ADD CONTRACT (stored inside session record)
 */
export async function addContract(userId, contract) {
  await Session.findOneAndUpdate(
    { userId },
    {
      $push: { contracts: contract },
      updatedAt: new Date()
    }
  );
}

/**
 * GET ALL SESSIONS (ADMIN USE ONLY)
 */
export async function getAllSessions() {
  return await Session.find();
}