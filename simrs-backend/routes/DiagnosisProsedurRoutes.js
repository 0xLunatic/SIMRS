import express from "express";
import DiagnosisProsedurController from "../controllers/DiagnosisProsedurController.js";

const router = express.Router();

// === SECTION REFERENSI (Pencarian Master Data) ===
router.get("/refs/icd10", DiagnosisProsedurController.getICD10);
router.get("/refs/snomed", DiagnosisProsedurController.getSNOMED);
router.get("/refs/icd9", DiagnosisProsedurController.getICD9);
router.get("/refs/cpt", DiagnosisProsedurController.getCPT);

router.get("/search", DiagnosisProsedurController.searchRef);

// === SECTION TRANSAKSI (CRUD) ===
// 1. Create
router.post("/create", DiagnosisProsedurController.create);

// 2. Read (Detail)
router.get("/record/:id", DiagnosisProsedurController.getById);

// 3. Update
router.put("/update/:id", DiagnosisProsedurController.update);

// 4. Delete
router.delete("/delete/:id", DiagnosisProsedurController.delete);

// === SECTION PASIEN & HISTORY ===
// Cari Pasien
router.get("/pasien/search", DiagnosisProsedurController.searchPasien);

// Ambil Riwayat berdasarkan ID Pasien
router.get("/history/:pasienId", DiagnosisProsedurController.getHistory);

export default router;
