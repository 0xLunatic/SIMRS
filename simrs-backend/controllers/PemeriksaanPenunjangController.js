import PemeriksaanService from "../services/PemeriksaanPenunjangService.js";

class PemeriksaanPenunjangController {
  // =========================================
  // 1. DATA MASTER & PENCARIAN
  // =========================================

  // GET /api/pasien/search?keyword=budi
  async searchPasien(req, res) {
    try {
      const { keyword } = req.query;
      const data = await PemeriksaanService.searchPasien(keyword);
      // Format return: { data: [...] } agar konsisten dengan frontend
      return res.status(200).json({ data });
    } catch (error) {
      console.error("Error Search Pasien:", error);
      return res.status(500).json({ message: error.message });
    }
  }

  // GET /api/master/loinc?category=BIOMETRI
  async getLoinc(req, res) {
    try {
      const { category } = req.query;
      const data = await PemeriksaanService.getMasterLoinc(category);
      // Frontend mengharapkan array langsung untuk dropdown options
      return res.status(200).json(data);
    } catch (error) {
      console.error("Error Get LOINC:", error);
      return res.status(500).json({ message: error.message });
    }
  }

  // =========================================
  // 2. CRUD TRANSAKSI
  // =========================================

  // POST /api/pemeriksaan (CREATE)
  async store(req, res) {
    try {
      // req.body berisi { type, master, detail }
      const result = await PemeriksaanService.createPemeriksaan(req.body);
      return res.status(201).json({
        message: "Data pemeriksaan berhasil disimpan",
        data: result,
      });
    } catch (error) {
      console.error("Error Create Pemeriksaan:", error);
      return res.status(500).json({
        message: "Gagal menyimpan data",
        error: error.message,
      });
    }
  }

  // GET /api/pemeriksaan/pasien/:id (READ HISTORY)
  async getByPasien(req, res) {
    try {
      const { id } = req.params; // ID Pasien
      const history = await PemeriksaanService.getHistoryByPasien(id);
      return res.status(200).json({ data: history });
    } catch (error) {
      console.error("Error Get History:", error);
      return res.status(500).json({ message: error.message });
    }
  }

  // GET /api/pemeriksaan/:id (READ SINGLE ITEM FOR EDIT)
  async getById(req, res) {
    try {
      const { id } = req.params; // ID Pemeriksaan Penunjang
      const data = await PemeriksaanService.getPemeriksaanById(id);

      if (!data || data.length === 0) {
        return res.status(404).json({ message: "Data tidak ditemukan" });
      }

      // Ambil index ke-0 karena db.query selalu return array
      return res.status(200).json({ data: data[0] });
    } catch (error) {
      console.error("Error Get Detail:", error);
      return res.status(500).json({ message: error.message });
    }
  }

  // PUT /api/pemeriksaan/:id (UPDATE)
  async update(req, res) {
    try {
      const { id } = req.params;
      // req.body berisi data update { master, detail, type }
      await PemeriksaanService.updatePemeriksaan(id, req.body);
      return res.status(200).json({ message: "Data berhasil diperbarui" });
    } catch (error) {
      console.error("Error Update:", error);
      return res.status(500).json({ message: error.message });
    }
  }

  // DELETE /api/pemeriksaan/:id (DELETE)
  async delete(req, res) {
    try {
      const { id } = req.params;
      await PemeriksaanService.deletePemeriksaan(id);
      return res.status(200).json({ message: "Data berhasil dihapus" });
    } catch (error) {
      console.error("Error Delete:", error);
      return res.status(500).json({ message: error.message });
    }
  }
}

export default new PemeriksaanPenunjangController();
