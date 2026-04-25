import jwt from "jsonwebtoken";

/**
 * ✅ AUTH MIDDLEWARE
 */
export const authMiddleware = (req, res, next) => {
  const token = req.headers.authorization;

  if (!token) {
    return res.status(401).json({ error: "No token provided" });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || "secret123");
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ error: "Invalid token" });
  }
};

/**
 * ✅ ADMIN MIDDLEWARE (THIS WAS MISSING)
 */
export const adminMiddleware = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ error: "Not authenticated" });
  }

  if (req.user.role !== "admin") {
    return res.status(403).json({ error: "Admin only access" });
  }

  next();
};