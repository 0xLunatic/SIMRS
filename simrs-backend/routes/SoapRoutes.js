import express from "express";
import {
  searchPasien,
  createSoap,
  getHistory,
  getDetail,
  updateSoap,
  deleteSoap,
  getSnomedCategories,
  getSnomed,
  getIcd10,
} from "../controllers/SoapController.js";

const router = express.Router();

// ==================================================================
// 1. STATIC ROUTES (HARUS DI ATAS)
// ==================================================================

// Helper Pasien
router.get("/pasien", searchPasien);

// Master Data (Snomed & ICD10)
// PENTING: Ini harus sebelum /:soapId agar tidak dianggap sebagai ID
router.get("/snomed-categories", getSnomedCategories);
router.get("/snomed", getSnomed);
router.get("/icd10", getIcd10);

// ==================================================================
// 2. DYNAMIC ROUTES (SPECIFIC)
// ==================================================================

// History by Pasien ID
router.get("/history/:pasienId", getHistory);

// Create (POST tidak konflik dengan GET)
router.post("/", createSoap);

// ==================================================================
// 3. DYNAMIC ROUTES (GENERIC ID) - WAJIB DI PALING BAWAH
// ==================================================================

// GET Detail by SOAP ID
// Jika ditaruh di atas, kata 'snomed' akan masuk ke sini sebagai :soapId
router.get("/:soapId", getDetail);

// Update
router.put("/:soapId", updateSoap);

// Delete
router.delete("/:soapId", deleteSoap);

export default router;
