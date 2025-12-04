import db from "../database/Database.js";

class PathwayService {
  // ==========================================
  // 1. HELPER: PENCARIAN DATA MASTER
  // ==========================================

  // Cari Pasien (Untuk Form Input)
  async searchPasien(keyword) {
    const query = `
      SELECT TOP 20 FN_pasien_id, FS_nama_lengkap, FS_no_rm 
      FROM core.PASIEN_MASTER_PASIEN 
      WHERE FB_aktif = 1 AND (FS_nama_lengkap LIKE @key OR FS_no_rm LIKE @key)
      ORDER BY FS_nama_lengkap ASC
    `;
    return await db.query(query, { key: `%${keyword}%` });
  }

  // Cari Tindakan (Join ke ICD9 & Snomed untuk info lengkap)
  async searchTindakan(keyword) {
    const query = `
      SELECT TOP 20 
        T.FN_tindakan_id, T.FS_nama_tindakan, 
        I.FS_kode_icd9cm, S.FS_term_indonesia
      FROM core.MASTER_TINDAKAN T
      LEFT JOIN core.MASTER_ICD9CM I ON T.FN_icd9cm_id = I.FN_icd9cm_id
      LEFT JOIN core.MASTER_SNOMED S ON T.FN_snomed_id = S.FN_snomed_id
      WHERE T.FS_nama_tindakan LIKE @key OR I.FS_kode_icd9cm LIKE @key
    `;
    return await db.query(query, { key: `%${keyword}%` });
  }

  // ==========================================
  // 2. CREATE (INSERT BERTINGKAT)
  // ==========================================
  async createPathway(data) {
    // A. Insert Header (Master Pathway)
    const qHeader = `
      INSERT INTO core.MASTER_PATHWAY_BPJS (FN_pasien_id, FN_tenaga_kesehatan_id, FD_tanggal_penyusunan, FS_catatan_umum)
      OUTPUT INSERTED.FN_pathway_id
      VALUES (@pasienId, @nakesId, GETDATE(), @catatan);
    `;

    const resHeader = await db.query(qHeader, {
      pasienId: data.pasien_id,
      nakesId: data.nakes_id,
      catatan: data.catatan_umum || "",
    });

    const pathwayId = resHeader[0].FN_pathway_id;

    // B. Insert Detail Deskripsi (Nama & Kebijakan)
    const qDetail = `
      INSERT INTO deskripsi.DETAIL_CLINICAL_PATHWAY (FN_pathway_id, FS_nama_pathway, FS_deskripsi_pathway, FS_kebijakan_rs)
      VALUES (@id, @nama, @desc, @kebijakan);
    `;
    await db.query(qDetail, {
      id: pathwayId,
      nama: data.nama_pathway,
      desc: data.deskripsi_pathway || "-",
      kebijakan: data.kebijakan_rs || "-",
    });

    // C. Insert Items Forecasting (Looping)
    if (data.forecasting_items && data.forecasting_items.length > 0) {
      for (const item of data.forecasting_items) {
        await db.query(
          `
          INSERT INTO deskripsi.DETAIL_FORECASTING_BPJS 
          (FN_pathway_id, FN_icd10cm_id, FN_tindakan_id, FS_komponen_biaya, FS_perhitungan_tarif, FS_catatan_forecast)
          VALUES (@id, @icd10, @tindakan, @biaya, @tarif, @catatan)
        `,
          {
            id: pathwayId,
            icd10: item.icd10_id || null,
            tindakan: item.tindakan_id || null,
            biaya: item.komponen_biaya,
            tarif: item.perhitungan_tarif, // Pastikan dikirim sebagai number/string angka bersih
            catatan: item.catatan_forecast || "",
          }
        );
      }
    }

    return { message: "Data Pathway berhasil disimpan", pathway_id: pathwayId };
  }

  // ==========================================
  // 3. READ LIST (JOIN HEADER & PASIEN)
  // ==========================================
  async getPathwayHistory(pasienId) {
    const query = `
      SELECT 
        M.FN_pathway_id,
        M.FD_tanggal_penyusunan,
        P.FS_nama_lengkap AS nama_pasien,
        P.FS_no_rm,
        D.FS_nama_pathway,
        D.FS_deskripsi_pathway,
        (SELECT COUNT(*) FROM deskripsi.DETAIL_FORECASTING_BPJS F WHERE F.FN_pathway_id = M.FN_pathway_id) AS jumlah_tindakan
      FROM core.MASTER_PATHWAY_BPJS M
      JOIN core.PASIEN_MASTER_PASIEN P ON M.FN_pasien_id = P.FN_pasien_id
      LEFT JOIN deskripsi.DETAIL_CLINICAL_PATHWAY D ON M.FN_pathway_id = D.FN_pathway_id
      WHERE M.FN_pasien_id = @pasienId
      ORDER BY M.FD_tanggal_penyusunan DESC
    `;
    return await db.query(query, { pasienId });
  }

  // ==========================================
  // 4. READ DETAIL (FULL JOIN SEMUA TABEL)
  // ==========================================
  async getPathwayDetail(pathwayId) {
    // 1. Ambil Header Data
    const qHeader = `
      SELECT 
        M.FN_pathway_id, M.FD_tanggal_penyusunan, M.FS_catatan_umum,
        P.FN_pasien_id, P.FS_nama_lengkap, P.FS_no_rm,
        D.FS_nama_pathway, D.FS_deskripsi_pathway, D.FS_kebijakan_rs
      FROM core.MASTER_PATHWAY_BPJS M
      JOIN core.PASIEN_MASTER_PASIEN P ON M.FN_pasien_id = P.FN_pasien_id
      LEFT JOIN deskripsi.DETAIL_CLINICAL_PATHWAY D ON M.FN_pathway_id = D.FN_pathway_id
      WHERE M.FN_pathway_id = @id
    `;
    const headerRes = await db.query(qHeader, { id: pathwayId });

    if (!headerRes[0]) return null;

    // 2. Ambil Items Forecasting (Join ICD10 & Tindakan)
    const qItems = `
      SELECT 
        F.*,
        ICD.FS_kode_icd10, ICD.FS_deskripsi AS deskripsi_icd,
        T.FS_nama_tindakan, T.FS_kategori_tindakan
      FROM deskripsi.DETAIL_FORECASTING_BPJS F
      LEFT JOIN core.MASTER_ICD10 ICD ON F.FN_icd10cm_id = ICD.FN_icd10_id
      LEFT JOIN core.MASTER_TINDAKAN T ON F.FN_tindakan_id = T.FN_tindakan_id
      WHERE F.FN_pathway_id = @id
    `;
    const itemsRes = await db.query(qItems, { id: pathwayId });

    // Gabungkan Result
    return {
      ...headerRes[0],
      forecasting_items: itemsRes,
    };
  }

  // ==========================================
  // 5. UPDATE (FULL UPDATE)
  // ==========================================
  async updatePathway(pathwayId, data) {
    // 1. Update Header
    await db.query(
      `
      UPDATE core.MASTER_PATHWAY_BPJS 
      SET FS_catatan_umum = @catatan 
      WHERE FN_pathway_id = @id
    `,
      { id: pathwayId, catatan: data.catatan_umum }
    );

    // 2. Update Detail Deskripsi
    await db.query(
      `
      UPDATE deskripsi.DETAIL_CLINICAL_PATHWAY
      SET FS_nama_pathway = @nama, FS_deskripsi_pathway = @desc, FS_kebijakan_rs = @kebijakan
      WHERE FN_pathway_id = @id
    `,
      {
        id: pathwayId,
        nama: data.nama_pathway,
        desc: data.deskripsi_pathway,
        kebijakan: data.kebijakan_rs,
      }
    );

    // 3. Update Forecasting (Cara aman: Hapus semua item lama, insert item baru)
    // Ini menangani kasus edit: tambah item, hapus item, atau ubah item sekaligus.
    if (data.forecasting_items) {
      await db.query(
        `DELETE FROM deskripsi.DETAIL_FORECASTING_BPJS WHERE FN_pathway_id = @id`,
        { id: pathwayId }
      );

      for (const item of data.forecasting_items) {
        await db.query(
          `
          INSERT INTO deskripsi.DETAIL_FORECASTING_BPJS 
          (FN_pathway_id, FN_icd10cm_id, FN_tindakan_id, FS_komponen_biaya, FS_perhitungan_tarif, FS_catatan_forecast)
          VALUES (@id, @icd10, @tindakan, @biaya, @tarif, @catatan)
        `,
          {
            id: pathwayId,
            icd10: item.icd10_id || null,
            tindakan: item.tindakan_id || null,
            biaya: item.komponen_biaya,
            tarif: item.perhitungan_tarif,
            catatan: item.catatan_forecast || "",
          }
        );
      }
    }

    return { message: "Data Pathway berhasil diperbarui" };
  }

  // ==========================================
  // 6. DELETE (CASCADING DELETE MANUAL)
  // ==========================================
  async deletePathway(pathwayId) {
    // Hapus Child (Forecasting & Detail)
    await db.query(
      `DELETE FROM deskripsi.DETAIL_FORECASTING_BPJS WHERE FN_pathway_id = @id`,
      { id: pathwayId }
    );
    await db.query(
      `DELETE FROM deskripsi.DETAIL_CLINICAL_PATHWAY WHERE FN_pathway_id = @id`,
      { id: pathwayId }
    );

    // Hapus Parent (Master)
    await db.query(
      `DELETE FROM core.MASTER_PATHWAY_BPJS WHERE FN_pathway_id = @id`,
      { id: pathwayId }
    );

    return { message: "Data Pathway berhasil dihapus" };
  }
}

export default new PathwayService();
