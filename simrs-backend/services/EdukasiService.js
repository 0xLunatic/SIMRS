import db from "../database/Database.js";

class EdukasiService {
  // =================================================================
  // 1. GET ALL
  // =================================================================
  async getAll(keyword = null) {
    let query = `
      SELECT 
        e.FN_edukasi_id, 
        e.FN_pasien_id,
        p.FS_nama_lengkap,
        p.FS_no_rm,
        e.FD_tanggal_edukasi, 
        e.FS_catatan_umum
      FROM core.MASTER_EDUKASI e
      JOIN core.PASIEN_MASTER_PASIEN p ON e.FN_pasien_id = p.FN_pasien_id
    `;

    const params = {};
    if (keyword) {
      query += ` WHERE p.FS_nama_lengkap LIKE @nama `;
      params.nama = `%${keyword}%`;
    }
    query += ` ORDER BY e.FD_tanggal_edukasi DESC`;

    return await db.query(query, params);
  }

  // =================================================================
  // 2. GET BY ID
  // =================================================================
  async getById(id) {
    const masterQuery = `
      SELECT e.*, p.FS_nama_lengkap, p.FS_no_rm
      FROM core.MASTER_EDUKASI e
      JOIN core.PASIEN_MASTER_PASIEN p ON e.FN_pasien_id = p.FN_pasien_id
      WHERE e.FN_edukasi_id = @id
    `;
    const master = await db.query(masterQuery, { id });

    if (master.length === 0) return null;

    const getDetail = async (table) => {
      return await db.query(
        `SELECT d.*, s.FS_fsn_term, s.FS_term_indonesia 
         FROM ${table} d
         LEFT JOIN core.MASTER_SNOMED s ON d.FN_snomed_id = s.FN_snomed_id
         WHERE d.FN_edukasi_id = @id`,
        { id }
      );
    };

    // Ambil detail satu per satu (Sequential biar aman)
    const penyakit = await getDetail(
      "deskripsi.DETAIL_EDUKASI_PENJELASAN_PENYAKIT"
    );
    const praBedah = await getDetail(
      "deskripsi.DETAIL_EDUKASI_PERSIAPAN_PRA_BEDAH"
    );
    const pascaBedah = await getDetail(
      "deskripsi.DETAIL_EDUKASI_PERAWATAN_PASCA_BEDAH"
    );

    return {
      ...master[0],
      penjelasan_penyakit: penyakit,
      persiapan_pra_bedah: praBedah,
      perawatan_pasca_bedah: pascaBedah,
    };
  }

  // =================================================================
  // 3. CREATE
  // =================================================================
  async create(data) {
    // 1. Insert Master
    const qMaster = `
      INSERT INTO core.MASTER_EDUKASI (FN_pasien_id, FD_tanggal_edukasi, FS_catatan_umum) 
      OUTPUT INSERTED.FN_edukasi_id 
      VALUES (@pasienId, GETDATE(), @catatan)
    `;
    const resMaster = await db.query(qMaster, {
      pasienId: data.FN_pasien_id,
      catatan: data.FS_catatan_umum,
    });

    // Tangkap ID baru (Support casing huruf besar/kecil dari driver SQL)
    const newId = resMaster[0]?.FN_edukasi_id || resMaster[0]?.fn_edukasi_id;

    // 2. Insert Detail
    await this._insertDetails(newId, data);

    return newId;
  }

  // =================================================================
  // 4. UPDATE
  // =================================================================
  async update(id, data) {
    const check = await db.query(
      `SELECT FN_edukasi_id FROM core.MASTER_EDUKASI WHERE FN_edukasi_id = @id`,
      { id }
    );
    if (check.length === 0) throw new Error("DATA_NOT_FOUND");

    // Update Master
    await db.query(
      `UPDATE core.MASTER_EDUKASI SET FS_catatan_umum = @catatan WHERE FN_edukasi_id = @id`,
      { id, catatan: data.FS_catatan_umum }
    );

    // Reset Detail (Hapus lama, Insert baru)
    await this._deleteDetails(id);
    await this._insertDetails(id, data);

    return true;
  }

  // =================================================================
  // 5. DELETE
  // =================================================================
  async delete(id) {
    // 1. Cek dulu datanya ada atau tidak
    const check = await db.query(
      `SELECT FN_edukasi_id FROM core.MASTER_EDUKASI WHERE FN_edukasi_id = @id`,
      { id }
    );
    if (check.length === 0) throw new Error("DATA_NOT_FOUND");

    // 2. HAPUS DETAIL DULUAN (Wajib agar tidak kena FK Constraint)
    await this._deleteDetails(id);

    // 3. BARU HAPUS MASTER
    await db.query(
      `DELETE FROM core.MASTER_EDUKASI WHERE FN_edukasi_id = @id`,
      { id }
    );

    return true;
  }

  // =================================================================
  // HELPERS
  // =================================================================

  async _deleteDetails(id) {
    // Pastikan nama kolom 'FN_edukasi_id' sesuai dengan di database Anda
    await db.query(
      `DELETE FROM deskripsi.DETAIL_EDUKASI_PENJELASAN_PENYAKIT WHERE FN_edukasi_id = @id`,
      { id }
    );
    await db.query(
      `DELETE FROM deskripsi.DETAIL_EDUKASI_PERSIAPAN_PRA_BEDAH WHERE FN_edukasi_id = @id`,
      { id }
    );
    await db.query(
      `DELETE FROM deskripsi.DETAIL_EDUKASI_PERAWATAN_PASCA_BEDAH WHERE FN_edukasi_id = @id`,
      { id }
    );
  }

  async _insertDetails(edukasiId, data) {
    const process = async (table, items) => {
      if (!items || !Array.isArray(items) || items.length === 0) return;
      for (const item of items) {
        await db.query(
          `INSERT INTO ${table} (FN_edukasi_id, FN_snomed_id, FS_topik, FS_keterangan) 
           VALUES (@edukasiId, @snomedId, @topik, @ket)`,
          {
            edukasiId,
            snomedId: item.FN_snomed_id || 0,
            topik: item.FS_topik,
            ket: item.FS_keterangan,
          }
        );
      }
    };

    await process(
      "deskripsi.DETAIL_EDUKASI_PENJELASAN_PENYAKIT",
      data.penjelasan_penyakit
    );
    await process(
      "deskripsi.DETAIL_EDUKASI_PERSIAPAN_PRA_BEDAH",
      data.persiapan_pra_bedah
    );
    await process(
      "deskripsi.DETAIL_EDUKASI_PERAWATAN_PASCA_BEDAH",
      data.perawatan_pasca_bedah
    );
  }
}

export default new EdukasiService();
