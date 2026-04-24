import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";

const SECRET = process.env.JWT_SECRET || "dev_secret_change_me";

/**
 * Generate JWT Token
 */
export function generateToken(user) {
  return jwt.sign(
    {
      userId: user.userId,
      role: user.role || "user"
    },
    SECRET,
    { expiresIn: "7d" }
  );
}

/**
 * Verify JWT Token
 */
export function verifyToken(token) {
  return jwt.verify(token, SECRET);
}

/**
 * Hash Password
 */
export async function hashPassword(password) {
  return await bcrypt.hash(password, 10);
}

/**
 * Compare Password
 */
export async function comparePassword(password, hash) {
  return await bcrypt.compare(password, hash);
}