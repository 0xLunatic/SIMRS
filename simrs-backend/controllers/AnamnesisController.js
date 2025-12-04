// AnamnesisController.js - VERSI LENGKAP DAN TERKOREKSI

import masterAnamnesisService from "../services/AnamnesisService.js"; // KOREKSI NAMA SERVICE
import detailAnamnesisService from "../services/AnamnesisDetail.js"; // ASUMSI NAMA SERVICE DETAIL
import AnamnesisService from "../services/AnamnesisService.js";

class AnamnesisController {
  // --- NEW: GABUNGAN MASTER DAN DETAIL (TRANSAKSI) ---
  static async saveFullAnamnesis(req, res) {
    const { master_data, detail_data } = req.body;

    // 1. Validasi Data Master
    if (
      !master_data ||
      !master_data.FN_pasien_id ||
      !master_data.FN_tenaga_kesehatan_id
    ) {
      return res.status(400).json({
        success: false,
        message: "ID Pasien dan ID Nakes (dalam master_data) wajib diisi.",
      });
    }
    // 2. Validasi Data Detail (Minimal cek array)
    if (!detail_data || Object.keys(detail_data).length === 0) {
      return res.status(400).json({
        success: false,
        message: "Detail Anamnesis (detail_data) wajib diisi.",
      });
    }

    try {
      // A. CREATE MASTER ANAMNESIS
      const masterResult = await masterAnamnesisService.create(master_data);
      const anamnesisId = masterResult?.[0]?.FN_anamnesis_id;

      if (!anamnesisId) {
        throw new Error(
          "Gagal mendapatkan ID Anamnesis setelah pembuatan master."
        );
      }

      // B. SAVE DETAIL ANAMNESIS (menggunakan ID yang baru dibuat)
      const detailResult = await detailAnamnesisService.save(
        anamnesisId,
        detail_data
      );

      res.status(201).json({
        success: true,
        message: detailResult.message || "Anamnesis lengkap berhasil disimpan.",
        anamnesis_id: anamnesisId,
      });
    } catch (error) {
      console.error(
        "Error in AnamnesisController.saveFullAnamnesis:",
        error.message
      );
      res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  }
  async getAllByPasienId(req, res) {
    const pasienId = req.params.pasienId;
    const riwayatArray =
      await masterAnamnesisService.getAllFullDetailsByPasienId(pasienId);

    res.status(200).json({
      success: true,
      data: riwayatArray,
      // Output: [{"master": {...}, "allDetails": [...]}, {"master": {...}, "allDetails": [...]}, ...]
    });
  }

  // --- NEW: GET DATA MASTER SINKRONISASI (DITAMBAHKAN) ---
  static async getAnamnesisSyncData(req, res) {
    try {
      // Menggunakan service yang sudah kita definisikan sebelumnya untuk mengambil
      // semua data master (pertanyaan dan jawaban terstruktur) dalam satu panggilan.
      const syncData = await masterAnamnesisService.getSyncData();

      res.status(200).json({
        success: true,
        data: syncData, // Mengandung { questions: [...], structuredAnswers: [...] }
      });
    } catch (error) {
      console.error(
        "Error in AnamnesisController.getAnamnesisSyncData:",
        error.message
      );
      res.status(500).json({
        success: false,
        message:
          "Gagal mengambil data sinkronisasi master Anamnesis: " +
          error.message,
      });
    }
  }

  // --- 4. GET Detail Lengkap (Master + Detail) ---
  /**
   * Menggunakan getFullDetailById() dari Service untuk mengambil data yang sudah di-JOIN.
   */
  static async getAnamnesisDetail(req, res) {
    const { anamnesis_id } = req.params;
    const idNum = parseInt(anamnesis_id);

    if (isNaN(idNum) || idNum <= 0) {
      return res.status(400).json({
        success: false,
        message:
          "ID Anamnesis tidak valid. Harap gunakan ID numerik yang benar.",
      });
    }

    try {
      const fullData = await masterAnamnesisService.getFullDetailById(idNum);

      if (!fullData) {
        return res
          .status(404)
          .json({ success: false, message: "Anamnesis tidak ditemukan." });
      }

      // fullData sudah berisi { master: {...}, allDetails: [...] }
      res.status(200).json({ success: true, data: fullData });
    } catch (error) {
      console.error(
        "Error in AnamnesisController.getAnamnesisDetail:",
        error.message
      );
      res.status(500).json({ success: false, message: error.message });
    }
  }
  static async searchAnamnesis(req, res) {
    // Ambil keyword dari query parameter (misal: /api/anamnesis/search?q=Ahmad)
    const searchTerm = req.query.q;

    if (!searchTerm || searchTerm.length < 3) {
      return res.status(400).json({
        success: false,
        message: "Keyword pencarian (q) wajib diisi minimal 3 karakter.",
      });
    }

    try {
      // Panggil service untuk menjalankan query search
      const searchResults = await AnamnesisService.searchAnamnesis(
        searchTerm
      );

      res.status(200).json({
        success: true,
        data: searchResults,
        count: searchResults.length,
        message: `Ditemukan ${searchResults.length} riwayat anamnesis yang cocok.`,
      });
    } catch (error) {
      console.error(
        "Error in AnamnesisController.searchAnamnesis:",
        error.message
      );
      res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  }
  // --- 3. POST untuk menambahkan DETAIL Anamnesis (Dipertahankan) ---
  static async createDetailAnamnesis(req, res) {
    const { anamnesis_id } = req.params;
    const detailData = req.body.detail_data;

    const idNum = parseInt(anamnesis_id);
    if (isNaN(idNum) || idNum <= 0 || !detailData) {
      return res.status(400).json({
        success: false,
        message:
          "ID Anamnesis wajib diisi dan harus angka, serta detail_data wajib diisi.",
      });
    }

    try {
      const result = await detailAnamnesisService.save(idNum, detailData);
      res.status(201).json({
        success: true,
        message: result.message || "Detail Anamnesis berhasil disimpan.",
        anamnesis_id: idNum,
      });
    } catch (error) {
      console.error(
        "Error in AnamnesisController.createDetailAnamnesis:",
        error.message
      );
      res.status(500).json({ success: false, message: error.message });
    }
  }

  // --- 1. GET Master Pertanyaan (Fungsi lama/Legacy) ---
  static async getMasterPertanyaan(req, res) {
    try {
      // Menggunakan fungsi di MasterAnamnesisService
      const result = await masterAnamnesisService.getMasterPertanyaan();
      res.status(200).json({ success: true, data: result || [] });
    } catch (error) {
      console.error(
        "Error in AnamnesisController.getMasterPertanyaan:",
        error.message
      );
      res.status(500).json({ success: false, message: error.message });
    }
  }

  // --- 2. CREATE MASTER Anamnesis (Fungsi Legacy) ---
  static async createMasterAnamnesis(req, res) {
    const inputData = req.body;
    if (!inputData.FN_pasien_id || !inputData.FN_tenaga_kesehatan_id) {
      return res
        .status(400)
        .json({ success: false, message: "ID Pasien dan Nakes wajib diisi." });
    }
    try {
      const masterResult = await masterAnamnesisService.create(inputData);
      const anamnesisId = masterResult?.[0]?.FN_anamnesis_id;

      res.status(201).json({
        success: true,
        message: "Master Anamnesis berhasil dibuat.",
        anamnesis_id: anamnesisId,
      });
    } catch (error) {
      console.error(
        "Error in AnamnesisController.createMasterAnamnesis:",
        error.message
      );
      res.status(500).json({ success: false, message: error.message });
    }
  }
}

export default AnamnesisController;
