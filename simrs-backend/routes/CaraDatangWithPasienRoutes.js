import express from "express";
import { getAllCaraDatangWithPasien } from "../controllers/CaraDatangWithPasienController.js";
import authMiddleware from "../middlewares/AuthMiddleware.js"; // 🔹 Import auth

const router = express.Router();

// 🔒 hanya user dengan token valid yang bisa akses
router.get("/", authMiddleware, getAllCaraDatangWithPasien);

export default router;
