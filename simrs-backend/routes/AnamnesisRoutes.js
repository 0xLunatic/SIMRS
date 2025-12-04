// AnamnesisRoutes.js - VERSI LENGKAP DAN TERKOREKSI

import express from "express";
import AnamnesisController from "../controllers/AnamnesisController.js";

const router = express.Router();

// ===================================================================
// 🔄 Rute Sinkronisasi Data Master (DITAMBAHKAN)
// ===================================================================

// 🆕 Rute untuk mengambil semua data master (pertanyaan dan jawaban) dalam 1x panggilan
router.get("/master/sync", AnamnesisController.getAnamnesisSyncData);

// ===================================================================
// 📝 Rute Transaksi dan Data Anamnesis
// ===================================================================

// 1. GET Master Pertanyaan (Legacy)
router.get("/master/pertanyaan", AnamnesisController.getMasterPertanyaan);

// 2. POST untuk membuat MASTER dan DETAIL Anamnesis secara bersamaan (Transaksi)
router.post("/full", AnamnesisController.saveFullAnamnesis);

// 3. POST untuk menambahkan DETAIL Anamnesis (Jika ingin add detail ke ID yang sudah ada)
router.post("/detail/:anamnesis_id", AnamnesisController.createDetailAnamnesis);

// 4. GET Detail Lengkap (Master + Detail JOINED)
router.get("/:anamnesis_id", AnamnesisController.getAnamnesisDetail);
router.get("/pasien/search", AnamnesisController.searchAnamnesis);

// --- Rute Lain (CRUD Master Legacy - DITAMBAH UNTUK KELENGKAPAN) ---
// router.post("/", AnamnesisController.createMasterAnamnesis); // Jika ada rute create master terpisah

// router.get("/", AnamnesisController.getAllMasterAnamnesis);
// router.put("/:anamnesis_id", AnamnesisController.updateMasterAnamnesis);
// router.delete("/:anamnesis_id", AnamnesisController.deleteMasterAnamnesis);

export default router;
