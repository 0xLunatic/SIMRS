// routes/caraDatangRoutes.js

import express from "express";
import {
  getAllCaraDatang,
  getCaraDatangById,
  createCaraDatang,
  updateCaraDatang,
  deleteCaraDatang,
} from "../controllers/CaraDatangController.js";

// Asumsi Anda punya middleware otentikasi
// import { verifyToken } from '../middleware/auth.js';

const router = express.Router();

// Endpoint utama yang digunakan oleh frontend: `${API_BASE_URL}cara-datang`

// READ ALL
router.get("/", getAllCaraDatang);

// READ ONE
router.get("/:id", getCaraDatangById);

// CREATE
router.post("/", createCaraDatang);

// UPDATE
router.put("/:id", updateCaraDatang);
// router.patch('/:id', updateCaraDatang); // Alternatif jika menggunakan PATCH

// DELETE
router.delete("/:id", deleteCaraDatang);

export default router;
