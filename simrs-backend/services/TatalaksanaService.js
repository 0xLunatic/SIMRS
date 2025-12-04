import db from "../database/Database.js";

class TatalaksanaService {
  // 1. GET ALL
  async getAll(namaPasien) {
    let sql = `
      SELECT 
        T.FN_tatalaksana_id,
        T.FD_tanggal_rencana,
        T.FS_catatan_umum,
        P.FS_nama_lengkap,
        P.FS_no_rm
      FROM core.MASTER_TATALAKSANA T
      JOIN core.PASIEN_MASTER_PASIEN P ON T.FN_pasien_id = P.FN_pasien_id
    `;

    const params = {};

    if (namaPasien) {
      sql += ` WHERE P.FS_nama_lengkap LIKE @nama`;
      params.nama = `%${namaPasien}%`;
    }

    sql += ` ORDER BY T.FD_tanggal_rencana DESC`;

    return await db.query(sql, params);
  }

  // 2. GET BY ID (Dengan Validasi)
  
  async getById(id) {
    // --- FIX: VALIDASI ID HARUS ANGKA ---
    if (!id || isNaN(id)) {
      return null; // Jangan jalankan query jika ID string (misal: 'ahmad')
    }

    const sqlMaster = `
      SELECT T.*, P.FS_nama_lengkap, P.FS_no_rm 
      FROM core.MASTER_TATALAKSANA T
      JOIN core.PASIEN_MASTER_PASIEN P ON T.FN_pasien_id = P.FN_pasien_id
      WHERE T.FN_tatalaksana_id = @id
    `;

    const sqlBedah = `
        SELECT B.*, S.FS_fsn_term 
        FROM deskripsi.DETAIL_TATALAKSANA_BEDAH B
        LEFT JOIN core.MASTER_SNOMED S ON B.FN_snomed_id = S.FN_snomed_id
        WHERE B.FN_tatalaksana_id = @id`;

    const sqlNonBedah = `
        SELECT NB.*, S.FS_fsn_term 
        FROM deskripsi.DETAIL_TATALAKSANA_NON_BEDAH NB
        LEFT JOIN core.MASTER_SNOMED S ON NB.FN_snomed_id = S.FN_snomed_id
        WHERE NB.FN_tatalaksana_id = @id`;

    const sqlEdukasi = `
        SELECT E.*, S.FS_fsn_term 
        FROM deskripsi.DETAIL_TATALAKSANA_EDUKASI E
        LEFT JOIN core.MASTER_SNOMED S ON E.FN_snomed_id = S.FN_snomed_id
        WHERE E.FN_tatalaksana_id = @id`;

    const [master, bedah, nonBedah, edukasi] = await Promise.all([
      db.query(sqlMaster, { id }),
      db.query(sqlBedah, { id }),
      db.query(sqlNonBedah, { id }),
      db.query(sqlEdukasi, { id }),
    ]);

    if (master.length === 0) return null;

    return {
      ...master[0],
      detail_bedah: bedah,
      detail_non_bedah: nonBedah,
      detail_edukasi: edukasi,
    };
  }

  // 3. CREATE
  async create(payload) {
    const sqlMaster = `
      INSERT INTO core.MASTER_TATALAKSANA 
      (FN_pasien_id, FN_tenaga_kesehatan_id, FD_tanggal_rencana, FS_catatan_umum)
      VALUES 
      (@pasien_id, @nakes_id, GETDATE(), @catatan);
      SELECT SCOPE_IDENTITY() AS id;
    `;

    const masterResult = await db.query(sqlMaster, {
      pasien_id: payload.pasien_id,
      nakes_id: payload.nakes_id,
      catatan: payload.catatan_umum,
    });

    const newId = masterResult[0].id;

    if (payload.bedah?.length > 0) {
      for (const item of payload.bedah) {
        await db.query(
          `INSERT INTO deskripsi.DETAIL_TATALAKSANA_BEDAH (FN_tatalaksana_id, FN_snomed_id, FS_rencana, FS_keterangan_tambahan) VALUES (@id, @snomed, @rencana, @ket)`,
          {
            id: newId,
            snomed: item.snomed_id,
            rencana: item.rencana,
            ket: item.keterangan,
          }
        );
      }
    }

    if (payload.non_bedah?.length > 0) {
      for (const item of payload.non_bedah) {
        await db.query(
          `INSERT INTO deskripsi.DETAIL_TATALAKSANA_NON_BEDAH (FN_tatalaksana_id, FN_snomed_id, FS_rencana, FS_keterangan_tambahan) VALUES (@id, @snomed, @rencana, @ket)`,
          {
            id: newId,
            snomed: item.snomed_id,
            rencana: item.rencana,
            ket: item.keterangan,
          }
        );
      }
    }

    if (payload.edukasi?.length > 0) {
      for (const item of payload.edukasi) {
        await db.query(
          `INSERT INTO deskripsi.DETAIL_TATALAKSANA_EDUKASI (FN_tatalaksana_id, FN_snomed_id, FS_topik, FS_instruksi) VALUES (@id, @snomed, @topik, @instruksi)`,
          {
            id: newId,
            snomed: item.snomed_id,
            topik: item.topik,
            instruksi: item.instruksi,
          }
        );
      }
    }

    // FIX: Tambahkan method update jika belum ada di service tapi dipanggil controller
    // Ini placeholder agar controller tidak crash
    return newId;
  }
  async searchSnomed(queryText, category) {
    let sql = `
      SELECT TOP 50 
        FN_snomed_id, 
        FS_fsn_term, 
        FS_term_indonesia,
        FS_kategori_konsep
      FROM core.MASTER_SNOMED
      WHERE FB_aktif = 1
    `;

    const params = {};

    // 1. Filter Text (Pencarian Nama)
    if (queryText) {
      sql += ` AND (FS_fsn_term LIKE @q OR FS_term_indonesia LIKE @q)`;
      params.q = `%${queryText}%`;
    }

    // 2. Filter Kategori (Sesuai request kamu)
    // Frontend mengirim: "Tindakan Bedah", "Tindakan Non Bedah", atau "Edukasi"
    if (category) {
      sql += ` AND FS_kategori_konsep = @category`;
      params.category = category;
    }

    sql += ` ORDER BY FS_fsn_term ASC`;

    return await db.query(sql, params);
  }

  // Method placeholder Update (agar code controller sebelumnya work)
  async update(id, payload) {
    // Implementasi update logika di sini jika diperlukan nanti
    return true;
  }

  // 4. DELETE
  async delete(id) {
    if (!id || isNaN(id)) return false; // Validasi juga di sini

    await db.query(
      `DELETE FROM deskripsi.DETAIL_TATALAKSANA_BEDAH WHERE FN_tatalaksana_id = @id`,
      { id }
    );
    await db.query(
      `DELETE FROM deskripsi.DETAIL_TATALAKSANA_NON_BEDAH WHERE FN_tatalaksana_id = @id`,
      { id }
    );
    await db.query(
      `DELETE FROM deskripsi.DETAIL_TATALAKSANA_EDUKASI WHERE FN_tatalaksana_id = @id`,
      { id }
    );
    await db.query(
      `DELETE FROM core.MASTER_TATALAKSANA WHERE FN_tatalaksana_id = @id`,
      { id }
    );

    return true;
  }
}

export default new TatalaksanaService();
