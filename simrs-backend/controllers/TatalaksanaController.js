import TatalaksanaService from "../services/TatalaksanaService.js";

class TatalaksanaController {
  // GET /api/tatalaksana?nama=budi
  async getAll(req, res) {
    try {
      const { nama } = req.query; // Ambil query param ?nama=...
      const data = await TatalaksanaService.getAll(nama);
      res.json({
        status: true,
        message: "Data tatalaksana berhasil diambil",
        total: data.length,
        data: data,
      });
    } catch (error) {
      res.status(500).json({ status: false, message: error.message });
    }
  }

  // GET /api/tatalaksana/:id (Detail Lengkap)
  async getById(req, res) {
    try {
      const { id } = req.params;

      // --- TAMBAHKAN PENGECEKAN INI ---
      // Jika user mengetik /api/tatalaksana/ahmad, kita tolak disini
      if (isNaN(id)) {
        return res.status(400).json({
          status: false,
          message:
            "ID harus angka. Jika ingin mencari nama, gunakan format: ?nama=nama_pasien",
        });
      }

      const data = await TatalaksanaService.getById(id);

      if (!data) {
        return res
          .status(404)
          .json({ status: false, message: "Tatalaksana tidak ditemukan" });
      }
      res.json({ status: true, data: data });
    } catch (error) {
      res.status(500).json({ status: false, message: error.message });
    }
  }
  async searchSnomed(req, res) {
    try {
      // Ambil parameter dari URL: ?q=...&category=...
      const { q, category } = req.query;

      const data = await TatalaksanaService.searchSnomed(q, category);

      res.json({
        status: true,
        message: "Data SNOMED ditemukan",
        data: data,
      });
    } catch (error) {
      res.status(500).json({ status: false, message: error.message });
    }
  }

  // POST /api/tatalaksana
  async create(req, res) {
    try {
      // Payload dari frontend diharapkan lengkap (Header + Array Details)
      const newId = await TatalaksanaService.create(req.body);
      res.status(201).json({
        status: true,
        message: "Rencana Tatalaksana berhasil dibuat",
        tatalaksana_id: newId,
      });
    } catch (error) {
      res.status(500).json({ status: false, message: error.message });
    }
  }

  // DELETE /api/tatalaksana/:id
  async delete(req, res) {
    try {
      const { id } = req.params;
      await TatalaksanaService.delete(id);
      res.json({ status: true, message: "Data berhasil dihapus permanen" });
    } catch (error) {
      res.status(500).json({ status: false, message: error.message });
    }
  }
}

export default new TatalaksanaController();
