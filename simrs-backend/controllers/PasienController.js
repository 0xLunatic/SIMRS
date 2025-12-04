// controllers/PasienController.js
import pasienService from "../services/PasienService.js";

const pasienController = {
  // 🩺 Ambil semua pasien
  getAll: async (req, res) => {
    try {
      const data = await pasienService.getAll();
      res.json(data);
    } catch (err) {
      console.error("❌ Error getAll:", err);
      res.status(500).json({ message: "Gagal mengambil data pasien" });
    }
  },
  async searchPasien(req, res) {
    try {
      const keyword = req.query.keyword;

      if (!keyword) {
        return res.status(400).json({
          success: false,
          message: "Parameter 'keyword' harus disediakan.",
        });
      }

      const results = await pasienService.searchPasien(keyword);

      res.status(200).json({
        success: true,
        data: results,
        count: results.length,
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  },

  // 🔍 Ambil pasien by ID
  getById: async (req, res) => {
    try {
      const data = await pasienService.getById(req.params.id);
      if (!data)
        return res.status(404).json({ message: "Pasien tidak ditemukan" });
      res.json(data);
    } catch (err) {
      console.error("❌ Error getById:", err);
      res.status(500).json({ message: "Gagal mengambil detail pasien" });
    }
  },

  // ➕ Tambah pasien baru
  create: async (req, res) => {
    try {
      const data = await pasienService.create(req.body);
      res.status(201).json(data);
    } catch (err) {
      console.error("❌ Error create:", err);
      res.status(500).json({ message: "Gagal menambahkan pasien" });
    }
  },
  update: async (req, res) => {
    try {
      const id = req.params.id;
      const data = req.body;
      const result = await pasienService.update(id, data);
      res.json(result);
    } catch (err) {
      console.error("❌ Gagal update pasien:", err);
      res.status(500).json({ message: "Gagal update pasien" });
    }
  },
  remove: async (req, res) => {
    try {
      const id = req.params.id;
      const result = await pasienService.remove(id);
      res.json({ message: "Pasien berhasil dihapus", result });
    } catch (err) {
      console.error("❌ Gagal hapus pasien:", err);
      res.status(500).json({ message: "Gagal menghapus pasien" });
    }
  },
};

export default pasienController;
