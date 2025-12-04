// controllers/pemeriksaan_mata_controller.js
import * as service from "../services/PemeriksaanMataService.js"; // Import semua fungsi dari service

// Helper function untuk menangani logika try-catch dan respons HTTP
const handleRequest = async (res, handler) => {
  try {
    await handler();
  } catch (error) {
    console.error("Controller Error:", error.message);
    return res.status(500).json({ error: error.message });
  }
};

class PemeriksaanMataController {
  // =======================================================
  // A. FUNGSI CRUD TERINTEGRASI (Master + Semua Detail)
  // =======================================================

  // [C] CREATE LENGKAP: Membuat Master dan semua Detail
  async createPemeriksaanLengkap(req, res) {
    return handleRequest(res, async () => {
      const newMasterId = await service.createPemeriksaanLengkap(req.body);
      return res.status(201).json({
        message: "Pemeriksaan mata lengkap berhasil disimpan.",
        id: newMasterId,
      });
    });
  }

  // [R] READ ALL LENGKAP: Mengambil semua Master + Detail
  async findAllPemeriksaanLengkap(req, res) {
    return handleRequest(res, async () => {
      const data = await service.findAllPemeriksaanLengkap();
      if (data.length === 0) {
        return res.status(200).json({
          message: "Tidak ada data pemeriksaan yang ditemukan.",
          data: [],
        });
      }
      return res.status(200).json(data);
    });
  }

  // [R] READ ONE LENGKAP: Mengambil satu Master + Detail berdasarkan ID Master
  async getPemeriksaanLengkap(req, res) {
    return handleRequest(res, async () => {
      const data = await service.getPemeriksaanLengkapById(req.params.id);
      if (!data) {
        return res
          .status(404)
          .json({ message: "Data pemeriksaan tidak ditemukan." });
      }
      return res.status(200).json(data);
    });
  }

  // =======================================================
  // B. FUNGSI CRUD DASAR (Per Tabel)
  // =======================================================

  // --- B.1 MASTER_PEMERIKSAAN_MATA CRUD ---

  // [U] UPDATE Master
  async updateMaster(req, res) {
    return handleRequest(res, async () => {
      await service.updateMasterPemeriksaan(req.params.id, req.body);
      return res
        .status(200)
        .json({ message: `Master ID ${req.params.id} berhasil diupdate` });
    });
  }

  // [D] DELETE Master (Catatan: Berpotensi menghapus semua detail terkait jika menggunakan Foreign Key CASCADE)
  async deleteMaster(req, res) {
    return handleRequest(res, async () => {
      await service.deleteMasterPemeriksaan(req.params.id);
      return res
        .status(200)
        .json({ message: `Master ID ${req.params.id} berhasil dihapus` });
    });
  }

  // --- B.2 DETAIL_VISUS CRUD ---

  // [C] CREATE Detail Visus (Digunakan jika ingin menambahkan detail visus secara terpisah)
  async createDetailVisus(req, res) {
    return handleRequest(res, async () => {
      const result = await service.createDetailVisus(req.body);
      return res.status(201).json({
        message: "Detail Visus berhasil ditambahkan",
        id: result[0].FN_visus_id,
      });
    });
  }

  // [R] READ ONE Detail Visus by Detail ID
  async getDetailVisus(req, res) {
    return handleRequest(res, async () => {
      const data = await service.getDetailVisusById(req.params.id);
      if (!data || data.length === 0) {
        return res
          .status(404)
          .json({ message: "Detail Visus tidak ditemukan." });
      }
      return res.status(200).json(data[0]);
    });
  }

  // [U] UPDATE Detail Visus
  async updateDetailVisus(req, res) {
    return handleRequest(res, async () => {
      await service.updateDetailVisus(req.params.id, req.body);
      return res.status(200).json({
        message: `Detail Visus ID ${req.params.id} berhasil diupdate`,
      });
    });
  }

  // [D] DELETE Detail Visus
  async deleteDetailVisus(req, res) {
    return handleRequest(res, async () => {
      await service.deleteDetailVisus(req.params.id);
      return res
        .status(200)
        .json({ message: `Detail Visus ID ${req.params.id} berhasil dihapus` });
    });
  }

  // --- B.3 DETAIL_TEKANAN_INTRAOKULAR CRUD ---

  // [C] CREATE Detail TIO
  async createDetailTio(req, res) {
    return handleRequest(res, async () => {
      const result = await service.createDetailTio(req.body);
      return res.status(201).json({
        message: "Detail TIO berhasil ditambahkan",
        id: result[0].FN_tio_id,
      });
    });
  }
  async searchPemeriksaanByPasienName(req, res) {
    return handleRequest(res, async () => {
      // Ambil parameter pencarian dari query string, misalnya: /api/pemeriksaan/search?nama=Budi
      const { nama } = req.query;

      if (!nama) {
        return res
          .status(400)
          .json({ message: 'Parameter "nama" diperlukan untuk pencarian.' });
      }

      const data = await service.findPemeriksaanByPasienName(nama);

      if (data.length === 0) {
        return res.status(404).json({
          message: `Tidak ada data pemeriksaan ditemukan untuk pasien bernama "${nama}".`,
          data: [],
        });
      }

      return res.status(200).json(data);
    });
  }

  // [R] READ ONE Detail TIO by Detail ID
  async getDetailTio(req, res) {
    return handleRequest(res, async () => {
      const data = await service.getDetailTioById(req.params.id);
      if (!data || data.length === 0)
        return res.status(404).json({ message: "Detail TIO tidak ditemukan." });
      return res.status(200).json(data[0]);
    });
  }

  // [U] UPDATE Detail TIO
  async updateDetailTio(req, res) {
    return handleRequest(res, async () => {
      await service.updateDetailTio(req.params.id, req.body);
      return res
        .status(200)
        .json({ message: `Detail TIO ID ${req.params.id} berhasil diupdate` });
    });
  }

  // [D] DELETE Detail TIO
  async deleteDetailTio(req, res) {
    return handleRequest(res, async () => {
      await service.deleteDetailTio(req.params.id);
      return res
        .status(200)
        .json({ message: `Detail TIO ID ${req.params.id} berhasil dihapus` });
    });
  }

  // --- B.4 DETAIL_SEGMENT_ANTERIOR CRUD ---

  // [C] CREATE Detail Segmen Ant
  async createDetailSegmenAnt(req, res) {
    return handleRequest(res, async () => {
      const result = await service.createDetailSegmenAnt(req.body);
      return res.status(201).json({
        message: "Detail Segmen Anterior berhasil ditambahkan",
        id: result[0].FN_segmen_ant_id,
      });
    });
  }

  // [R] READ ONE Detail Segmen Ant by Detail ID
  async getDetailSegmenAnt(req, res) {
    return handleRequest(res, async () => {
      const data = await service.getDetailSegmenAntById(req.params.id);
      if (!data || data.length === 0)
        return res
          .status(404)
          .json({ message: "Detail Segmen Anterior tidak ditemukan." });
      return res.status(200).json(data[0]);
    });
  }

  // [U] UPDATE Detail Segmen Ant
  async updateDetailSegmenAnt(req, res) {
    return handleRequest(res, async () => {
      await service.updateDetailSegmenAnt(req.params.id, req.body);
      return res.status(200).json({
        message: `Detail Segmen Anterior ID ${req.params.id} berhasil diupdate`,
      });
    });
  }

  // [D] DELETE Detail Segmen Ant
  async deleteDetailSegmenAnt(req, res) {
    return handleRequest(res, async () => {
      await service.deleteDetailSegmenAnt(req.params.id);
      return res.status(200).json({
        message: `Detail Segmen Anterior ID ${req.params.id} berhasil dihapus`,
      });
    });
  }

  // --- B.5 DETAIL_LENSA CRUD ---

  // [C] CREATE Detail Lensa
  async createDetailLensa(req, res) {
    return handleRequest(res, async () => {
      const result = await service.createDetailLensa(req.body);
      return res.status(201).json({
        message: "Detail Lensa berhasil ditambahkan",
        id: result[0].FN_lensa_id,
      });
    });
  }

  // [R] READ ONE Detail Lensa by Detail ID
  async getDetailLensa(req, res) {
    return handleRequest(res, async () => {
      const data = await service.getDetailLensaById(req.params.id);
      if (!data || data.length === 0)
        return res
          .status(404)
          .json({ message: "Detail Lensa tidak ditemukan." });
      return res.status(200).json(data[0]);
    });
  }

  // [U] UPDATE Detail Lensa
  async updateDetailLensa(req, res) {
    return handleRequest(res, async () => {
      await service.updateDetailLensa(req.params.id, req.body);
      return res.status(200).json({
        message: `Detail Lensa ID ${req.params.id} berhasil diupdate`,
      });
    });
  }

  // [D] DELETE Detail Lensa
  async deleteDetailLensa(req, res) {
    return handleRequest(res, async () => {
      await service.deleteDetailLensa(req.params.id);
      return res
        .status(200)
        .json({ message: `Detail Lensa ID ${req.params.id} berhasil dihapus` });
    });
  }

  // --- B.6 DETAIL_FUNDUSKOPI CRUD ---

  // [C] CREATE Detail Funduskopi
  async createDetailFunduskopi(req, res) {
    return handleRequest(res, async () => {
      const result = await service.createDetailFunduskopi(req.body);
      return res.status(201).json({
        message: "Detail Funduskopi berhasil ditambahkan",
        id: result[0].FN_funduskopi_id,
      });
    });
  }

  // [R] READ ONE Detail Funduskopi by Detail ID
  async getDetailFunduskopi(req, res) {
    return handleRequest(res, async () => {
      const data = await service.getDetailFunduskopiById(req.params.id);
      if (!data || data.length === 0)
        return res
          .status(404)
          .json({ message: "Detail Funduskopi tidak ditemukan." });
      return res.status(200).json(data[0]);
    });
  }

  // [U] UPDATE Detail Funduskopi
  async updateDetailFunduskopi(req, res) {
    return handleRequest(res, async () => {
      await service.updateDetailFunduskopi(req.params.id, req.body);
      return res.status(200).json({
        message: `Detail Funduskopi ID ${req.params.id} berhasil diupdate`,
      });
    });
  }

  // [D] DELETE Detail Funduskopi
  async deleteDetailFunduskopi(req, res) {
    return handleRequest(res, async () => {
      await service.deleteDetailFunduskopi(req.params.id);
      return res.status(200).json({
        message: `Detail Funduskopi ID ${req.params.id} berhasil dihapus`,
      });
    });
  }
  async getLoincByCategory(req, res) {
    return handleRequest(res, async () => {
      // Mengambil kategori dari query string: /api/master/loinc?category=VISUS
      const { category } = req.query;

      if (!category) {
        return res.status(400).json({
          message: 'Parameter "category" diperlukan (VISUS, TIO, dll).',
        });
      }

      // Panggil fungsi service untuk mengambil data LOINC yang difilter
      const data = await service.getLoincByCategory(category);

      if (data.length === 0) {
        return res.status(404).json({
          message: `Tidak ada kode LOINC ditemukan untuk kategori "${category}".`,
          data: [],
        });
      }
      return res.status(200).json(data);
    });
  }

  // [R] READ SNOMED BY ORGAN: Mengambil data SNOMED berdasarkan FS_organ_target
  async getSnomedByOrgan(req, res) {
    return handleRequest(res, async () => {
      // Mengambil target organ dari query string: /api/master/snomed?organ=LENSA
      const { organ } = req.query;

      if (!organ) {
        return res
          .status(400)
          .json({ message: 'Parameter "organ" diperlukan (LENSA, dll).' });
      }

      // Panggil fungsi service untuk mengambil data SNOMED yang difilter
      const data = await service.getSnomedByOrgan(organ);

      if (data.length === 0) {
        return res.status(404).json({
          message: `Tidak ada kode SNOMED ditemukan untuk target organ "${organ}".`,
          data: [],
        });
      }
      return res.status(200).json(data);
    });
  }
}

export default new PemeriksaanMataController();
