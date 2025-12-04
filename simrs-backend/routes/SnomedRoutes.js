import express from "express";
import snomedController from "../controllers/SnomedController.js";

const router = express.Router();

// ✅ GET All (biasanya untuk list default)
router.get("/", snomedController.getAll);

// ✅ SEARCH (Harus ditaruh SEBELUM /:id)
// Agar "search" tidak dianggap sebagai "id"
router.get("/search", snomedController.search);

// ✅ CRUD Lainnya
router.post("/", snomedController.create);
router.put("/:id", snomedController.update);
router.delete("/:id", snomedController.remove);

// ✅ GET By ID (Taruh paling bawah untuk method GET)
router.get("/:id", snomedController.getById);

export default router;
