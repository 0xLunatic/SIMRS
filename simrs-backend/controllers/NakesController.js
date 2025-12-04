// controllers/NakesController.js
import NakesService from "../services/NakesService.js";

class NakesController {
  async getAll(req, res) {
    try {
      const data = await NakesService.getAll();
      res.json(data);
    } catch (err) {
      console.error("❌ getAll Controller error:", err);
      res
        .status(500)
        .json({ message: "Gagal mengambil data tenaga kesehatan" });
    }
  }

  async getById(req, res) {
    try {
      const data = await NakesService.getById(req.params.id);
      if (!data)
        return res.status(404).json({ message: "Data tidak ditemukan" });
      res.json(data);
    } catch (err) {
      console.error("❌ getById Controller error:", err);
      res.status(500).json({ message: "Gagal mengambil data" });
    }
  }

  async create(req, res) {
    try {
      await NakesService.create(req.body);
      res
        .status(201)
        .json({ message: "Data tenaga kesehatan berhasil ditambahkan" });
    } catch (err) {
      console.error("❌ create Controller error:", err);
      res.status(500).json({ message: "Gagal menambah data" });
    }
  }

  async update(req, res) {
    try {
      await NakesService.update(req.params.id, req.body);
      res.json({ message: "Data tenaga kesehatan berhasil diperbarui" });
    } catch (err) {
      console.error("❌ update Controller error:", err);
      res.status(500).json({ message: "Gagal memperbarui data" });
    }
  }

  async delete(req, res) {
    try {
      await NakesService.delete(req.params.id);
      res.json({ message: "Data tenaga kesehatan berhasil dihapus" });
    } catch (err) {
      console.error("❌ delete Controller error:", err);
      res.status(500).json({ message: "Gagal menghapus data" });
    }
  }
}

export default new NakesController();
