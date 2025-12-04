import db from "../database/Database.js";

const CaraDatangService = {
  // 🔹 Get All Cara Datang (READ ALL)
  async getAll() {
    return await db.query(`
      SELECT 
        cd.FN_cara_datang_id,
        cd.FS_nama_cara_datang,
        cd.FS_keterangan,
        cd.FS_kode_snomed_ct,
        cd.FB_aktif,
        cd.FD_created_at,
        cd.FD_updated_at
      FROM core.PASIEN_MASTER_CARA_DATANG cd
      ORDER BY cd.FN_cara_datang_id ASC
    `);
  },

  // 🔹 Get Cara Datang by ID (READ ONE)
  async getById(id) {
    const result = await db.query(
      `
      SELECT 
        cd.FN_cara_datang_id,
        cd.FS_nama_cara_datang,
        cd.FS_keterangan,
        cd.FS_kode_snomed_ct,
        cd.FB_aktif,
        cd.FD_created_at,
        cd.FD_updated_at
      FROM core.PASIEN_MASTER_CARA_DATANG cd
      WHERE cd.FN_cara_datang_id = @id
    `,
      { id }
    );
    return result[0];
  },

  // 🔹 Create (CREATE)
  async create(data) {
    const result = await db.query(
      `
      INSERT INTO core.PASIEN_MASTER_CARA_DATANG 
      (FS_nama_cara_datang, FS_keterangan, FS_kode_snomed_ct, FB_aktif, FD_created_at, FD_updated_at)
      VALUES (@nama, @ket, @kode_snomed, @aktif, GETDATE(), GETDATE());
      SELECT SCOPE_IDENTITY() AS id;
    `,
      {
        nama: data.FS_nama_cara_datang,
        ket: data.FS_keterangan,
        kode_snomed: data.FS_kode_snomed_ct,
        aktif: data.FB_aktif ?? true,
      }
    );
    return { insertedId: result[0]?.id };
  },

  // 🔹 Update (UPDATE)
  async update(id, data) {
    await db.query(
      `
      UPDATE core.PASIEN_MASTER_CARA_DATANG
      SET 
        FS_nama_cara_datang = @nama,
        FS_keterangan = @ket,
        FS_kode_snomed_ct = @kode_snomed,
        FB_aktif = @aktif,
        FD_updated_at = GETDATE()
      WHERE FN_cara_datang_id = @id
    `,
      {
        id,
        nama: data.FS_nama_cara_datang,
        ket: data.FS_keterangan,
        kode_snomed: data.FS_kode_snomed_ct,
        aktif: data.FB_aktif ?? true,
      }
    );
    return { success: true };
  },

  // 🔹 Delete (DELETE)
  async delete(id) {
    await db.query(
      `DELETE FROM core.PASIEN_MASTER_CARA_DATANG WHERE FN_cara_datang_id = @id`,
      { id }
    );
    return { success: true };
  },

  // Fungsi getCaraDatangWithPasien telah DIHAPUS.
};

export default CaraDatangService;
