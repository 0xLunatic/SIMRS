import EdukasiService from "../services/EdukasiService.js";

// GET ALL (With Search)
export const index = async (req, res) => {
  try {
    const { nama } = req.query; // Ambil ?nama=... dari URL
    const data = await EdukasiService.getAll(nama);

    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// GET BY ID
export const show = async (req, res) => {
  try {
    const data = await EdukasiService.getById(req.params.id);

    if (!data) {
      return res
        .status(404)
        .json({ success: false, message: "Data detail tidak ditemukan" });
    }

    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// CREATE
export const store = async (req, res) => {
  try {
    if (!req.body.FN_pasien_id) {
      return res
        .status(400)
        .json({ success: false, message: "ID Pasien wajib diisi" });
    }

    const newId = await EdukasiService.create(req.body);
    res
      .status(201)
      .json({ success: true, message: "Data berhasil disimpan", id: newId });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// UPDATE
export const update = async (req, res) => {
  try {
    await EdukasiService.update(req.params.id, req.body);
    res.json({ success: true, message: "Data berhasil diperbarui" });
  } catch (err) {
    if (err.message === "DATA_NOT_FOUND") {
      return res
        .status(404)
        .json({ success: false, message: "Gagal Update: ID tidak ditemukan" });
    }
    res.status(500).json({ success: false, error: err.message });
  }
};

// DELETE
// DELETE
export const destroy = async (req, res) => {
  try {
    const result = await EdukasiService.delete(req.params.id);
    // ✅ FIX: Ganti 'status' jadi 'success' biar konsisten sama frontend
    res.json({ success: true, message: "Data berhasil dihapus permanen" });
  } catch (err) {
    if (err.message === "DATA_NOT_FOUND") {
      return res
        .status(404)
        .json({ success: false, message: "Gagal Hapus: ID tidak ditemukan" });
    }
    console.error("Delete Error:", err);
    res.status(500).json({ success: false, error: err.message });
  }
};
