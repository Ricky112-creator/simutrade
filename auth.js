import jwt from "jsonwebtoken";

const SECRET = "SIMUTRADE_SECRET_KEY_CHANGE_ME";

/**
 * Generate JWT token
 */
export function generateToken(userId) {
  return jwt.sign({ userId }, SECRET, { expiresIn: "7d" });
}

/**
 * Middleware to protect routes
 */
export function verifyToken(req, res, next) {
  try {
    const header = req.headers.authorization;

    if (!header) {
      return res.status(401).json({ error: "No token provided" });
    }

    const token = header.split(" ")[1];

    const decoded = jwt.verify(token, SECRET);

    req.user = decoded;
    next();

  } catch (err) {
    return res.status(401).json({ error: "Invalid token" });
  }
}