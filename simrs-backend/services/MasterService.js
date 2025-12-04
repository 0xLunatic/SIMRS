// services/MasterService.js
import db from "../database/Database.js";

const masterService = {
  // ===============================
  // 1️⃣ Jenis Kelamin
  // ===============================
  getJenisKelamin: async () => {
    const query = `
      SELECT 
        FS_kode_jenis_kelamin AS kode, 
        FS_deskripsi AS deskripsi 
      FROM deskripsi.DESKRIPSI_JENIS_KELAMIN 
      ORDER BY FS_deskripsi
    `;
    return await db.query(query);
  },

  // ===============================
  // 2️⃣ Status Perkawinan
  // ===============================
  getStatusPerkawinan: async () => {
    const query = `
      SELECT 
        FS_kode_status_perkawinan AS kode, 
        FS_deskripsi AS deskripsi 
      FROM deskripsi.DESKRIPSI_STATUS_PERKAWINAN 
      ORDER BY FS_deskripsi
    `;
    return await db.query(query);
  },

  // ===============================
  // 3️⃣ Agama
  // ===============================
  getAgama: async () => {
    const query = `
      SELECT 
        FS_kode_agama AS kode, 
        FS_deskripsi AS deskripsi 
      FROM deskripsi.DESKRIPSI_AGAMA 
      ORDER BY FS_deskripsi
    `;
    return await db.query(query);
  },

  // ===============================
  // 4️⃣ Pekerjaan
  // ===============================
  getPekerjaan: async () => {
    const query = `
      SELECT 
        FS_kode_pekerjaan AS kode, 
        FS_nama_pekerjaan AS deskripsi 
      FROM deskripsi.DESKRIPSI_PEKERJAAN 
      ORDER BY FS_nama_pekerjaan
    `;
    return await db.query(query);
  },

  // ===============================
  // 5️⃣ Alamat
  // ===============================
  getAlamat: async () => {
    const query = `
      SELECT 
        FN_alamat_id AS id,
        FS_alamat_lengkap,
        FS_desa_kelurahan,
        FS_kecamatan,
        FS_kabupaten_kota,
        FS_provinsi,
        FS_kode_pos,
        FS_kode_wilayah_bps,
        FS_tipe_alamat
      FROM core.MASTER_ALAMAT
      ORDER BY FS_alamat_lengkap
    `;
    return await db.query(query);
  },

  getAlamatById: async (id) => {
    const query = `
      SELECT *
      FROM core.MASTER_ALAMAT
      WHERE FN_alamat_id = @id
    `;
    return await db.query(query, { id });
  },

  createAlamat: async (data) => {
    const query = `
      INSERT INTO core.MASTER_ALAMAT (
        FS_alamat_lengkap,
        FS_desa_kelurahan,
        FS_kecamatan,
        FS_kabupaten_kota,
        FS_provinsi,
        FS_kode_pos,
        FS_kode_wilayah_bps,
        FS_tipe_alamat
      ) VALUES (
        @FS_alamat_lengkap,
        @FS_desa_kelurahan,
        @FS_kecamatan,
        @FS_kabupaten_kota,
        @FS_provinsi,
        @FS_kode_pos,
        @FS_kode_wilayah_bps,
        @FS_tipe_alamat
      )
    `;
    return await db.query(query, data);
  },

  updateAlamat: async (id, data) => {
    const query = `
      UPDATE core.MASTER_ALAMAT
      SET 
        FS_alamat_lengkap = @FS_alamat_lengkap,
        FS_desa_kelurahan = @FS_desa_kelurahan,
        FS_kecamatan = @FS_kecamatan,
        FS_kabupaten_kota = @FS_kabupaten_kota,
        FS_provinsi = @FS_provinsi,
        FS_kode_pos = @FS_kode_pos,
        FS_kode_wilayah_bps = @FS_kode_wilayah_bps,
        FS_tipe_alamat = @FS_tipe_alamat
      WHERE FN_alamat_id = @id
    `;
    return await db.query(query, { ...data, id });
  },

  deleteAlamat: async (id) => {
    const query = `
      DELETE FROM core.MASTER_ALAMAT
      WHERE FN_alamat_id = @id
    `;
    return await db.query(query, { id });
  },

  // ===============================
  // 6️⃣ Profesi
  // ===============================
  getProfesi: async () => {
    const query = `
      SELECT 
        FS_kode_profesi AS kode, 
        FS_nama_profesi AS nama,
        FS_kode_snomed_ct AS kode_snomed
      FROM deskripsi.DESKRIPSI_PROFESI
      ORDER BY FS_nama_profesi
    `;
    return await db.query(query);
  },

  getProfesiByKode: async (kode) => {
    const query = `
      SELECT *
      FROM deskripsi.DESKRIPSI_PROFESI
      WHERE FS_kode_profesi = @kode
    `;
    return await db.query(query, { kode });
  },

  // ===============================
  // 7️⃣ Spesialisasi
  // ===============================
  getSpesialisasi: async () => {
    const query = `
      SELECT 
        FS_kode_spesialisasi AS kode, 
        FS_nama_spesialisasi AS nama,
        FS_kode_snomed_ct AS kode_snomed
      FROM deskripsi.DESKRIPSI_SPESIALISASI
      ORDER BY FS_nama_spesialisasi
    `;
    return await db.query(query);
  },

  getSpesialisasiByKode: async (kode) => {
    const query = `
      SELECT *
      FROM deskripsi.DESKRIPSI_SPESIALISASI
      WHERE FS_kode_spesialisasi = @kode
    `;
    return await db.query(query, { kode });
  },
};

export default masterService;
