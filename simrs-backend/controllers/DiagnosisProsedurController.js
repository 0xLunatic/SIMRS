import DiagnosisProsedurService from "../services/DiagnosisProsedurService.js";

class DiagnosisProsedurController {
  // =================================================================
  // SECTION REFERENSI (Master Data)
  // =================================================================

  async searchRef(req, res) {
    try {
      const { type, q, category } = req.query; // Ambil param 'category'

      let data = [];

      if (type === "snomed") {
        // Kirim category ke service
        data = await DiagnosisProsedurService.searchSNOMED(q, category);
      } else if (type === "icd10") {
        data = await DiagnosisProsedurService.searchICD10(q);
      } else if (type === "icd9") {
        data = await DiagnosisProsedurService.searchICD9(q);
      } else if (type === "cpt") {
        data = await DiagnosisProsedurService.searchCPT(q);
      }

      res.json({ success: true, data });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  async getICD10(req, res) {
    try {
      const { q } = req.query;
      const data = await DiagnosisProsedurService.searchICD10(q || "");
      res.json({ success: true, count: data.length, data });
    } catch (err) {
      res.status(500).json({ success: false, message: err.message });
    }
  }

  async getSNOMED(req, res) {
    try {
      const { q } = req.query;
      const data = await DiagnosisProsedurService.searchSNOMED(q || "");
      res.json({ success: true, count: data.length, data });
    } catch (err) {
      res.status(500).json({ success: false, message: err.message });
    }
  }

  async getICD9(req, res) {
    try {
      const { q } = req.query;
      const data = await DiagnosisProsedurService.searchICD9(q || "");
      res.json({ success: true, count: data.length, data });
    } catch (err) {
      res.status(500).json({ success: false, message: err.message });
    }
  }

  async getCPT(req, res) {
    try {
      const { q } = req.query;
      const data = await DiagnosisProsedurService.searchCPT(q || "");
      res.json({ success: true, count: data.length, data });
    } catch (err) {
      res.status(500).json({ success: false, message: err.message });
    }
  }

  // =================================================================
  // SECTION TRANSAKSI (CRUD)
  // =================================================================

  // 1. CREATE (Simpan Baru)
  async create(req, res) {
    try {
      // Validasi Input Dasar
      if (!req.body.pasien_id || !req.body.nakes_id) {
        return res.status(400).json({
          success: false,
          message: "Data Pasien atau Nakes tidak lengkap",
        });
      }

      const result = await DiagnosisProsedurService.createMedicalRecord(
        req.body
      );
      res.status(201).json(result);
    } catch (err) {
      res.status(500).json({
        success: false,
        message: "Gagal menyimpan data",
        error: err.message,
      });
    }
  }

  // 2. READ (Lihat Detail Satuan)
  async getById(req, res) {
    try {
      const { id } = req.params;
      const data = await DiagnosisProsedurService.getMedicalRecordById(id);

      if (!data) {
        return res
          .status(404)
          .json({ success: false, message: "Data transaksi tidak ditemukan" });
      }

      res.json({ success: true, data });
    } catch (err) {
      res.status(500).json({ success: false, message: err.message });
    }
  }

  // 3. UPDATE (Ubah Data)
  async update(req, res) {
    try {
      const { id } = req.params;

      // Validasi body minimal
      if (!req.body.nakes_id) {
        return res
          .status(400)
          .json({ success: false, message: "Data Nakes diperlukan" });
      }

      const result = await DiagnosisProsedurService.updateMedicalRecord(
        id,
        req.body
      );
      res.json(result);
    } catch (err) {
      res.status(500).json({
        success: false,
        message: "Gagal memperbarui data",
        error: err.message,
      });
    }
  }

  // 4. DELETE (Hapus Data)
  async delete(req, res) {
    try {
      const { id } = req.params;
      const result = await DiagnosisProsedurService.deleteMedicalRecord(id);

      if (!result.success) {
        return res.status(404).json(result);
      }

      res.json(result);
    } catch (err) {
      res.status(500).json({
        success: false,
        message: "Gagal menghapus data",
        error: err.message,
      });
    }
  }

  // =================================================================
  // SECTION PASIEN & HISTORY
  // =================================================================

  // Method untuk melihat history list berdasarkan Pasien ID
  async getHistory(req, res) {
    try {
      const { pasienId } = req.params;
      if (!pasienId)
        return res
          .status(400)
          .json({ success: false, message: "ID Pasien diperlukan" });

      const data = await DiagnosisProsedurService.getHistoryByPasien(pasienId);
      res.json({ success: true, data });
    } catch (err) {
      res.status(500).json({
        success: false,
        message: "Gagal mengambil riwayat",
        error: err.message,
      });
    }
  }

  // Method Search Pasien
  async searchPasien(req, res) {
    try {
      const { keyword } = req.query;
      if (!keyword || keyword.length < 3) {
        return res.json({ success: true, data: [] });
      }
      const data = await DiagnosisProsedurService.searchPasien(keyword);
      res.json({ success: true, data });
    } catch (err) {
      res.status(500).json({
        success: false,
        message: "Gagal mencari pasien",
        error: err.message,
      });
    }
  }
}

export default new DiagnosisProsedurController();
