import express from "express";
import PemeriksaanController from "../controllers/PemeriksaanPenunjangController.js";

const router = express.Router();

// =================================================
// GROUP 1: Master Data & Search
// =================================================

// Cari Pasien (Auto-complete)
// URL: /api/pasien/search?keyword=...
router.get("/pasien/search", PemeriksaanController.searchPasien);

// Ambil Dropdown LOINC (Biometri/Lab/etc)
// URL: /api/master/loinc?category=BIOMETRI
router.get("/master/loinc", PemeriksaanController.getLoinc);

// =================================================
// GROUP 2: Transaksi Pemeriksaan (CRUD)
// =================================================

// 1. CREATE: Simpan Data Baru
router.post("/", PemeriksaanController.store);

// 2. READ (History): Ambil daftar pemeriksaan berdasarkan ID Pasien
router.get("/pasien/:id", PemeriksaanController.getByPasien);

// 3. READ (Single): Ambil 1 data detail untuk ditampilkan di Form Edit
router.get("/:id", PemeriksaanController.getById);

// 4. UPDATE: Simpan perubahan data
router.put("/:id", PemeriksaanController.update);

// 5. DELETE: Hapus data
router.delete("/:id", PemeriksaanController.delete);

export default router;
