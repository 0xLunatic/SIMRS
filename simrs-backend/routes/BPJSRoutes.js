import express from "express";
import {
  searchPasien,
  searchTindakan,
  createPathway,
  getHistory,
  getDetail,
  updatePathway,
  deletePathway,
} from "../controllers/BPJSController.js";

const router = express.Router();

// === HELPER (Load sebelum ID dinamis) ===
// GET /api/pathway/pasien?keyword=Budi
router.get("/pasien", searchPasien);

// GET /api/pathway/tindakan?keyword=Katarak
router.get("/tindakan", searchTindakan);

// === TRANSAKSI ===

// GET /api/pathway/history/3 (List pathway pasien ID 3)
router.get("/history/:pasienId", getHistory);

// POST /api/pathway (Input Baru)
router.post("/", createPathway);

// GET /api/pathway/10 (Detail lengkap ID Pathway 10)
router.get("/:pathwayId", getDetail);

// PUT /api/pathway/10 (Update)
router.put("/:pathwayId", updatePathway);

// DELETE /api/pathway/10 (Hapus)
router.delete("/:pathwayId", deletePathway);

export default router;
