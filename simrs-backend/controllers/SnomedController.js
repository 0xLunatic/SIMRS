import snomedService from "../services/SnomedService.js";

const snomedController = {
  // GET semua data
  getAll: async (req, res) => {
    try {
      const data = await snomedService.getAllSnomed();
      res.json({ data });
    } catch (err) {
      console.error("Error getAll:", err);
      res.status(500).json({ message: "Gagal mengambil data" });
    }
  },

  // GET by ID
  getById: async (req, res) => {
    try {
      const data = await snomedService.getSnomedById(req.params.id);
      res.json({ data });
    } catch (err) {
      res.status(500).json({ message: "Gagal mengambil data" });
    }
  },

  // POST (insert)
  create: async (req, res) => {
    try {
      await snomedService.insertSnomed(req.body);
      res.json({ message: "Data berhasil ditambahkan" });
    } catch (err) {
      res.status(500).json({ message: "Gagal menambah data" });
    }
  },

  // ✅ PUT (update)
  update: async (req, res) => {
    try {
      await snomedService.updateSnomed(req.params.id, req.body);
      res.json({ message: "Data berhasil diperbarui" });
    } catch (err) {
      console.error("Error update:", err);
      res.status(500).json({ message: "Gagal memperbarui data" });
    }
  },

  // DELETE
  remove: async (req, res) => {
    try {
      await snomedService.deleteSnomed(req.params.id);
      res.json({ message: "Data berhasil dihapus" });
    } catch (err) {
      res.status(500).json({ message: "Gagal menghapus data" });
    }
  },
  search: async (req, res) => {
    try {
      const { category, keyword } = req.query; // Ambil parameter dari URL

      // Panggil fungsi baru di service
      const data = await snomedService.getByCategory(category, keyword);

      res.json({ success: true, data: data });
    } catch (err) {
      res.status(500).json({ success: false, message: err.message });
    }
  },
};

export default snomedController;
