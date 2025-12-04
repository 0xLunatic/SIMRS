import db from "../database/Database.js";

const CaraDatangWithPasienService = {
  async getAll() {
    const result = await db.query(`
      SELECT 
        cd.FN_cara_datang_id,
        cd.FS_nama_cara_datang,
        cd.FS_keterangan,
        cd.FS_kode_snomed_ct,
        cd.FB_aktif,
        cd.FD_created_at,
        cd.FD_updated_at,
        p.FN_pasien_id,
        p.FS_no_rm,
        p.FS_nama_lengkap,
        p.FS_nik,
        p.FS_telepon,
        p.FS_email
      FROM core.PASIEN_MASTER_CARA_DATANG cd
      LEFT JOIN core.PASIEN_MASTER_PASIEN p
        ON cd.FN_cara_datang_id = p.FN_cara_datang_id
      ORDER BY cd.FN_cara_datang_id ASC, p.FN_pasien_id ASC
    `);

    const grouped = {};
    for (const row of result) {
      if (!grouped[row.FN_cara_datang_id]) {
        grouped[row.FN_cara_datang_id] = {
          FN_cara_datang_id: row.FN_cara_datang_id,
          FS_nama_cara_datang: row.FS_nama_cara_datang,
          FS_keterangan: row.FS_keterangan,
          FS_kode_snomed_ct: row.FS_kode_snomed_ct,
          FB_aktif: row.FB_aktif,
          FD_created_at: row.FD_created_at,
          FD_updated_at: row.FD_updated_at,
          pasien: [],
        };
      }
      if (row.FN_pasien_id) {
        grouped[row.FN_cara_datang_id].pasien.push({
          FN_pasien_id: row.FN_pasien_id,
          FS_no_rm: row.FS_no_rm,
          FS_nama_lengkap: row.FS_nama_lengkap,
          FS_nik: row.FS_nik,
          FS_telepon: row.FS_telepon,
          FS_email: row.FS_email,
        });
      }
    }
    return Object.values(grouped);
  },
};

export default CaraDatangWithPasienService;
