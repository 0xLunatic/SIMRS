import express from "express";
import * as EdukasiController from "../controllers/EdukasiController.js";

const router = express.Router();

// GET /api/edukasi?nama=budi (Bisa search)
router.get("/", EdukasiController.index);

// GET /api/edukasi/10 (Detail)
router.get("/:id", EdukasiController.show);

// POST /api/edukasi (Simpan)
router.post("/", EdukasiController.store);

// PUT /api/edukasi/10 (Update)
router.put("/:id", EdukasiController.update);

// DELETE /api/edukasi/10 (Hapus)
router.delete("/:id", EdukasiController.destroy);

export default router;