// routes/masterRoutes.js
import express from "express";
import masterController from "../controllers/MasterController.js";

const router = express.Router();

// ===============================
// 📋 MASTER DESKRIPSI
// ===============================
router.get("/jenis_kelamin", masterController.getJenisKelamin);
router.get("/status_perkawinan", masterController.getStatusPerkawinan);
router.get("/agama", masterController.getAgama);
router.get("/pekerjaan", masterController.getPekerjaan);
router.get("/profesi", masterController.getProfesi);
router.get("/spesialisasi", masterController.getSpesialisasi);

// ===============================
// 🏠 MASTER ALAMAT (CRUD)
// ===============================
router.get("/alamat", masterController.getAlamat);
router.get("/alamat/:id", masterController.getAlamatById);
router.post("/alamat", masterController.createAlamat);
router.put("/alamat/:id", masterController.updateAlamat);
router.delete("/alamat/:id", masterController.deleteAlamat);

export default router;
