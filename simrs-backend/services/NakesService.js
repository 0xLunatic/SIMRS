// services/NakesService.js
import db from "../database/Database.js";

class NakesService {
  // 🔹 Ambil semua data Nakes (dengan join deskripsi & alamat)
  async getAll() {
    const query = `
      SELECT tk.*,
             dp.FS_nama_profesi,
             ds.FS_nama_spesialisasi,
             a.FS_alamat_lengkap
      FROM core.NAKES_MASTER_TENAGA_KESEHATAN tk
      LEFT JOIN deskripsi.DESKRIPSI_PROFESI dp
             ON tk.FS_profesi_kode = dp.FS_kode_profesi
      LEFT JOIN deskripsi.DESKRIPSI_SPESIALISASI ds
             ON tk.FS_spesialisasi_kode = ds.FS_kode_spesialisasi
      LEFT JOIN core.MASTER_ALAMAT a
             ON tk.FN_alamat_id = a.FN_alamat_id
      ORDER BY tk.FN_tenaga_kesehatan_id ASC
    `;
    try {
      const result = await db.query(query);
      return result;
    } catch (err) {
      console.error("❌ getAll query error:", err);
      throw err;
    }
  }

  // 🔹 Ambil 1 Nakes berdasarkan ID
  async getById(id) {
    const query = `
      SELECT * FROM core.NAKES_MASTER_TENAGA_KESEHATAN
      WHERE FN_tenaga_kesehatan_id = @id
    `;
    try {
      const result = await db.query(query, { id });
      return result[0] || null;
    } catch (err) {
      console.error("❌ getById error:", err);
      throw err;
    }
  }

  // 🔹 Tambah data Nakes baru
  async create(data) {
    const query = `
      INSERT INTO core.NAKES_MASTER_TENAGA_KESEHATAN
      (FS_nama_lengkap, FS_gelar_depan, FS_gelar_belakang,
       FS_nomor_str, FD_tanggal_terbit_str, FD_tanggal_kadaluwarsa_str,
       FS_spesialisasi_kode, FS_profesi_kode, FS_no_telepon, FS_email,
       FN_alamat_id, FB_aktif, FD_created_at, FD_updated_at)
      VALUES
      (@nama, @gelarDepan, @gelarBelakang,
       @nomorSTR, @terbit, @kadaluwarsa,
       @spesialisasi, @profesi, @telepon, @email,
       @alamatId, @aktif, GETDATE(), GETDATE())
    `;

    const params = {
      nama: data.FS_nama_lengkap,
      gelarDepan: data.FS_gelar_depan ?? "",
      gelarBelakang: data.FS_gelar_belakang ?? "",
      nomorSTR: data.FS_nomor_str ?? "",
      terbit: data.FD_tanggal_terbit_str ?? null,
      kadaluwarsa: data.FD_tanggal_kadaluwarsa_str ?? null,
      spesialisasi: data.FS_spesialisasi_kode ?? "",
      profesi: data.FS_profesi_kode ?? "",
      telepon: data.FS_no_telepon ?? "",
      email: data.FS_email ?? "",
      alamatId: data.FN_alamat_id ?? null,
      aktif: data.FB_aktif ?? true,
    };

    try {
      await db.query(query, params);
      console.log("✅ Nakes berhasil dibuat:", params.nama);
    } catch (err) {
      console.error("❌ create Nakes error:", err);
      throw err;
    }
  }

  // 🔹 Update data Nakes
  async update(id, data) {
    const query = `
    UPDATE core.NAKES_MASTER_TENAGA_KESEHATAN
    SET 
      FS_nama_lengkap = COALESCE(@nama, FS_nama_lengkap),
      FS_gelar_depan = COALESCE(@gelarDepan, FS_gelar_depan),
      FS_gelar_belakang = COALESCE(@gelarBelakang, FS_gelar_belakang),
      FS_nomor_str = COALESCE(@nomorSTR, FS_nomor_str),
      FS_no_telepon = COALESCE(@telepon, FS_no_telepon),
      FS_email = COALESCE(@email, FS_email),
      FS_spesialisasi_kode = COALESCE(@spesialisasi, FS_spesialisasi_kode),
      FS_profesi_kode = COALESCE(@profesi, FS_profesi_kode),
      FB_aktif = @aktif,
      FD_updated_at = GETDATE()
    WHERE FN_tenaga_kesehatan_id = @id
  `;

    const params = {
      id,
      nama: data.FS_nama_lengkap ?? null,
      gelarDepan: data.FS_gelar_depan ?? null,
      gelarBelakang: data.FS_gelar_belakang ?? null,
      nomorSTR: data.FS_no_str ?? null,
      telepon: data.FS_no_telepon ?? null,
      email: data.FS_email ?? null,
      spesialisasi: data.FS_spesialisasi_kode ?? null,
      profesi: data.FS_profesi_kode ?? null,
      aktif: data.FB_aktif ?? true,
    };

    await db.query(query, params);
  }

  // 🔹 Hapus data Nakes
  // 🔹 Hapus data Nakes + reset auto increment
  async delete(id) {
    const deleteQuery = `
    DELETE FROM core.NAKES_MASTER_TENAGA_KESEHATAN
    WHERE FN_tenaga_kesehatan_id = @id
  `;

    // Query untuk reset auto increment ke MAX + 1
    const reseedQuery = `
    DECLARE @maxId INT;
    SELECT @maxId = ISNULL(MAX(FN_tenaga_kesehatan_id), 0) 
    FROM core.NAKES_MASTER_TENAGA_KESEHATAN;
    DBCC CHECKIDENT ('core.NAKES_MASTER_TENAGA_KESEHATAN', RESEED, @maxId);
  `;

    try {
      await db.query(deleteQuery, { id });
      await db.query(reseedQuery);
      console.log("✅ Nakes berhasil dihapus & reseed otomatis:", id);
    } catch (err) {
      console.error("❌ delete Nakes error:", err);
      throw err;
    }
  }
}

export default new NakesService();
