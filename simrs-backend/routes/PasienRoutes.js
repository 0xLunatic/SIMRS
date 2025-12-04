// routes/PasienRoutes.js (FIXED)
import express from "express";
import pasienController from "../controllers/PasienController.js";

const router = express.Router();

// ==========================
// Rute Pencarian Pasien
// ==========================
// Rute ini harus diletakkan SEBELUM rute get("/:id")
router.get("/search", pasienController.searchPasien);

// ==========================
// CRUD Pasien
// ==========================

router.get("/", pasienController.getAll);
router.get("/:id", pasienController.getById);
router.post("/", pasienController.create);
router.put("/:id", pasienController.update);
router.delete("/:id", pasienController.remove);

export default router;
