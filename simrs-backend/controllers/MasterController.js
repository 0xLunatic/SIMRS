// controllers/MasterController.js
import masterService from "../services/MasterService.js";

const masterController = {
  // ===============================
  // 1️⃣ Jenis Kelamin
  // ===============================
  getJenisKelamin: async (req, res) => {
    try {
      const result = await masterService.getJenisKelamin();
      res.status(200).json(result);
    } catch (err) {
      res.status(500).json({
        message: "Gagal fetch jenis kelamin",
        error: err.message,
      });
    }
  },

  // ===============================
  // 2️⃣ Status Perkawinan
  // ===============================
  getStatusPerkawinan: async (req, res) => {
    try {
      const result = await masterService.getStatusPerkawinan();
      res.status(200).json(result);
    } catch (err) {
      res.status(500).json({
        message: "Gagal fetch status perkawinan",
        error: err.message,
      });
    }
  },

  // ===============================
  // 3️⃣ Agama
  // ===============================
  getAgama: async (req, res) => {
    try {
      const result = await masterService.getAgama();
      res.status(200).json(result);
    } catch (err) {
      res.status(500).json({
        message: "Gagal fetch agama",
        error: err.message,
      });
    }
  },

  // ===============================
  // 4️⃣ Pekerjaan
  // ===============================
  getPekerjaan: async (req, res) => {
    try {
      const result = await masterService.getPekerjaan();
      res.status(200).json(result);
    } catch (err) {
      res.status(500).json({
        message: "Gagal fetch pekerjaan",
        error: err.message,
      });
    }
  },

  // ===============================
  // 5️⃣ Profesi
  // ===============================
  getProfesi: async (req, res) => {
    try {
      const result = await masterService.getProfesi();
      res.status(200).json(result);
    } catch (err) {
      res.status(500).json({
        message: "Gagal fetch profesi",
        error: err.message,
      });
    }
  },

  // ===============================
  // 6️⃣ Spesialisasi
  // ===============================
  getSpesialisasi: async (req, res) => {
    try {
      const result = await masterService.getSpesialisasi();
      res.status(200).json(result);
    } catch (err) {
      res.status(500).json({
        message: "Gagal fetch spesialisasi",
        error: err.message,
      });
    }
  },

  // ===============================
  // 7️⃣ Alamat (CRUD)
  // ===============================
  getAlamat: async (req, res) => {
    try {
      const result = await masterService.getAlamat();
      res.status(200).json(result);
    } catch (err) {
      res.status(500).json({
        message: "Gagal fetch alamat",
        error: err.message,
      });
    }
  },

  getAlamatById: async (req, res) => {
    try {
      const { id } = req.params;
      const result = await masterService.getAlamatById(id);

      if (!result || result.length === 0) {
        return res.status(404).json({ message: "Alamat tidak ditemukan" });
      }

      res.status(200).json(result[0]);
    } catch (err) {
      res.status(500).json({
        message: "Gagal fetch alamat by ID",
        error: err.message,
      });
    }
  },

  createAlamat: async (req, res) => {
    try {
      const result = await masterService.createAlamat(req.body);
      res.status(201).json({ message: "Alamat berhasil ditambahkan", result });
    } catch (err) {
      res.status(500).json({
        message: "Gagal tambah alamat",
        error: err.message,
      });
    }
  },

  updateAlamat: async (req, res) => {
    try {
      const result = await masterService.updateAlamat(req.params.id, req.body);
      res.status(200).json({ message: "Alamat berhasil diperbarui", result });
    } catch (err) {
      res.status(500).json({
        message: "Gagal update alamat",
        error: err.message,
      });
    }
  },

  deleteAlamat: async (req, res) => {
    try {
      await masterService.deleteAlamat(req.params.id);
      res.status(200).json({ message: "Alamat berhasil dihapus" });
    } catch (err) {
      res.status(500).json({
        message: "Gagal hapus alamat",
        error: err.message,
      });
    }
  },
};

export default masterController;
