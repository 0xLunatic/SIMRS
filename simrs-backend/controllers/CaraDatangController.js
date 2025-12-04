// controllers/CaraDatangController.js

import CaraDatangService from "../services/CaraDatangService.js";

// Handler untuk GET /cara-datang (READ ALL)
export const getAllCaraDatang = async (req, res) => {
  try {
    const data = await CaraDatangService.getAll();
    res.status(200).json(data);
  } catch (error) {
    console.error("Error fetching all Cara Datang:", error);
    res.status(500).json({ message: "Gagal memuat data Cara Datang" });
  }
};

// Handler untuk GET /cara-datang/:id (READ ONE - Tidak digunakan di FE Anda, tapi baik untuk API)
export const getCaraDatangById = async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const data = await CaraDatangService.getById(id);

    if (data) {
      res.status(200).json(data);
    } else {
      res.status(404).json({ message: "Data tidak ditemukan" });
    }
  } catch (error) {
    console.error("Error fetching Cara Datang by ID:", error);
    res.status(500).json({ message: "Gagal memuat data Cara Datang" });
  }
};

// Handler untuk POST /cara-datang (CREATE)
export const createCaraDatang = async (req, res) => {
  try {
    // Validasi minimal
    if (!req.body.FS_nama_cara_datang) {
      return res.status(400).json({ message: "Nama Cara Datang wajib diisi." });
    }

    const result = await CaraDatangService.create(req.body);
    res.status(201).json({
      message: "Data berhasil ditambahkan",
      id: result.insertedId,
    });
  } catch (error) {
    console.error("Error creating Cara Datang:", error);
    res.status(500).json({ message: "Gagal menambahkan data Cara Datang" });
  }
};

// Handler untuk PUT /cara-datang/:id (UPDATE)
export const updateCaraDatang = async (req, res) => {
  try {
    const id = parseInt(req.params.id);

    // Validasi minimal
    if (!req.body.FS_nama_cara_datang) {
      return res.status(400).json({ message: "Nama Cara Datang wajib diisi." });
    }

    await CaraDatangService.update(id, req.body);
    res.status(200).json({ message: "Data berhasil diperbarui" });
  } catch (error) {
    console.error("Error updating Cara Datang:", error);
    res.status(500).json({ message: "Gagal memperbarui data Cara Datang" });
  }
};

// Handler untuk DELETE /cara-datang/:id (DELETE)
export const deleteCaraDatang = async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    await CaraDatangService.delete(id);
    res.status(200).json({ message: "Data berhasil dihapus" });
  } catch (error) {
    console.error("Error deleting Cara Datang:", error);
    // Error 500 sering dikaitkan dengan konflik Foreign Key (FK) di service delete
    res.status(500).json({
      message: "Gagal menghapus data. Data mungkin digunakan di tabel lain.",
    });
  }
};
