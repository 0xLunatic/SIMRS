// routes/pemeriksaan_mata_routes.js
import express from "express";
import ctl from "../controllers/PemeriksaanMataController.js";

const router = express.Router();

// =======================================================
// A. ROUTES TERINTEGRASI (Master + Semua Detail)
// =======================================================

// CREATE: Master + Semua Detail
router.post("/lengkap", ctl.createPemeriksaanLengkap);

// READ ALL: Semua Master + Semua Detail
router.get("/lengkap", ctl.findAllPemeriksaanLengkap);

// READ ONE: Master + Semua Detail berdasarkan ID Master
router.get("/lengkap/:id", ctl.getPemeriksaanLengkap);

// =======================================================
// B. ROUTES CRUD DASAR (Per Tabel)
// =======================================================

// --- B.1 MASTER_PEMERIKSAAN_MATA CRUD (core) ---
router.put("/master/:id", ctl.updateMaster);
router.delete("/master/:id", ctl.deleteMaster);
router.get("/search", ctl.searchPemeriksaanByPasienName); // Tetap di sini, karena ini adalah pencarian Master

// --- B.2 DETAIL_VISUS CRUD (deskripsi) ---
router.get("/visus/:id", ctl.getDetailVisus); // Get by Detail ID
router.post("/visus", ctl.createDetailVisus); // Buat detail visus baru (harus menyertakan FN_pemeriksaan_mata_id di body)
router.put("/visus/:id", ctl.updateDetailVisus);
router.delete("/visus/:id", ctl.deleteDetailVisus);

// --- B.3 DETAIL_TEKANAN_INTRAOKULAR CRUD (deskripsi) ---
router.post("/tio", ctl.createDetailTio); // Tambahkan POST/CREATE TIO
router.get("/tio/:id", ctl.getDetailTio); // Tambahkan GET ONE TIO
router.put("/tio/:id", ctl.updateDetailTio);
router.delete("/tio/:id", ctl.deleteDetailTio);

// --- B.4 DETAIL_SEGMENT_ANTERIOR CRUD (deskripsi) ---
router.post("/segmen-ant", ctl.createDetailSegmenAnt); // Tambahkan POST/CREATE Segmen Ant
router.get("/segmen-ant/:id", ctl.getDetailSegmenAnt); // Tambahkan GET ONE Segmen Ant
router.put("/segmen-ant/:id", ctl.updateDetailSegmenAnt);
router.delete("/segmen-ant/:id", ctl.deleteDetailSegmenAnt);

// --- B.5 DETAIL_LENSA CRUD (deskripsi) ---
router.post("/lensa", ctl.createDetailLensa); // Tambahkan POST/CREATE Lensa
router.get("/lensa/:id", ctl.getDetailLensa); // Tambahkan GET ONE Lensa
router.put("/lensa/:id", ctl.updateDetailLensa);
router.delete("/lensa/:id", ctl.deleteDetailLensa);

// --- B.6 DETAIL_FUNDUSKOPI CRUD (deskripsi) ---
router.post("/funduskopi", ctl.createDetailFunduskopi); // Tambahkan POST/CREATE Funduskopi
router.get("/funduskopi/:id", ctl.getDetailFunduskopi); // Tambahkan GET ONE Funduskopi
router.put("/funduskopi/:id", ctl.updateDetailFunduskopi);
router.delete("/funduskopi/:id", ctl.deleteDetailFunduskopi);

// =======================================================
// C. ROUTES DATA MASTER (Untuk Dropdown/Referensi) 📋
// =======================================================

// Mengambil data LOINC berdasarkan kategori aplikasi (VISUS, TIO, SEGMENT_ANTERIOR, FUNDUSKOPI)
// Contoh penggunaan: GET /api/pemeriksaan/master/loinc?category=VISUS
router.get("/master/loinc", ctl.getLoincByCategory);

// Mengambil data SNOMED berdasarkan organ target (LENSA)
// Contoh penggunaan: GET /api/pemeriksaan/master/snomed?organ=LENSA
router.get("/master/snomed", ctl.getSnomedByOrgan);

export default router;
