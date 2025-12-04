import jwt from "jsonwebtoken";
import dotenv from "dotenv";

dotenv.config();

const JWT_SECRET = process.env.JWT_SECRET;

export default function authMiddleware(req, res, next) {
  const authHeader = req.headers["authorization"];
  if (!authHeader)
    return res.status(401).json({ message: "Token tidak ada di header." });

  const token = authHeader.split(" ")[1];
  if (!token) return res.status(401).json({ message: "Token tidak valid." });

  if (!JWT_SECRET)
    return res
      .status(500)
      .json({ message: "Server error: JWT secret tidak tersedia." });

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    if (err.name === "TokenExpiredError") {
      return res.status(401).json({ message: "Token expired." });
    } else if (err.name === "JsonWebTokenError") {
      return res.status(401).json({ message: "Token invalid." });
    } else {
      return res.status(401).json({ message: "Gagal verifikasi token." });
    }
  }
}
