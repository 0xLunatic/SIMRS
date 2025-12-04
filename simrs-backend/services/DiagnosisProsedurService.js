import db from "../database/Database.js";

class DiagnosisProsedurService {
  // =================================================================
  // SECTION A: PENCARIAN REFERENSI (READ - Master Data)
  // =================================================================

  /**
   * Pencarian ICD-10
   * @param {string} keyword - Kata kunci pencarian
   * @param {string|null} category - Filter kategori (opsional)
   */
  async searchICD10(keyword, category = null) {
    const query = `
      SELECT TOP 20 FN_icd10_id, FS_kode_icd10, FS_deskripsi, FS_kategori_aplikasi
      FROM core.MASTER_ICD10 WITH (NOLOCK)
      WHERE FB_aktif = 1 
      AND (FS_kode_icd10 LIKE @search OR FS_deskripsi LIKE @search)
      AND (@category IS NULL OR FS_kategori_aplikasi = @category)
    `;
    return await db.query(query, {
      search: `%${keyword}%`,
      category: category || null,
    });
  }

  /**
   * Pencarian SNOMED CT
   * @param {string} keyword
   * @param {string|null} category - 'Diagnosis' atau 'Prosedur'
   */
  async searchSNOMED(keyword, category = null) {
    const query = `
      SELECT TOP 20 FN_snomed_id, FS_fsn_term, FS_term_indonesia, FS_organ_target, FS_kategori_konsep
      FROM core.MASTER_SNOMED WITH (NOLOCK)
      WHERE FB_aktif = 1 
      AND (FS_fsn_term LIKE @search OR FS_term_indonesia LIKE @search)
      AND (@category IS NULL OR FS_kategori_konsep = @category)
    `;
    return await db.query(query, {
      search: `%${keyword}%`,
      category: category || null,
    });
  }

  /**
   * Pencarian ICD-9 CM (Biasanya Prosedur)
   */
  async searchICD9(keyword, category = null) {
    const query = `
      SELECT TOP 20 FN_icd9cm_id, FS_kode_icd9cm, FS_deskripsi 
      FROM core.MASTER_ICD9CM WITH (NOLOCK)
      WHERE FB_aktif = 1 
      AND (FS_kode_icd9cm LIKE @search OR FS_deskripsi LIKE @search)
      -- ICD9 biasanya selalu prosedur, tapi kita support filter jika ada kolom kategori
      AND (@category IS NULL OR FS_kategori_aplikasi = @category)
    `;
    return await db.query(query, {
      search: `%${keyword}%`,
      category: category || null,
    });
  }

  /**
   * Pencarian CPT (Biasanya Prosedur/Billing)
   */
  async searchCPT(keyword, category = null) {
    const query = `
      SELECT TOP 20 FN_cpt_id, FS_kode_cpt, FS_deskripsi 
      FROM core.MASTER_CPT WITH (NOLOCK)
      WHERE FB_aktif = 1 
      AND (FS_kode_cpt LIKE @search OR FS_deskripsi LIKE @search)
      AND (@category IS NULL OR FS_kategori_aplikasi = @category)
    `;
    return await db.query(query, {
      search: `%${keyword}%`,
      category: category || null,
    });
  }

  // =================================================================
  // SECTION B: CREATE (Simpan Baru)
  // =================================================================

  async createMedicalRecord(data) {
    try {
      // 1. Insert Header
      const headerQuery = `
        INSERT INTO core.MASTER_DIAGNOSIS_PROSEDUR 
        (FN_pasien_id, FN_tenaga_kesehatan_id, FD_tanggal_diagnosis, FB_is_final)
        OUTPUT INSERTED.FN_diagnosis_prosedur_id
        VALUES (@pasienId, @nakesId, GETDATE(), @isFinal);
      `;

      const headerResult = await db.query(headerQuery, {
        pasienId: data.pasien_id,
        nakesId: data.nakes_id,
        isFinal: data.is_final ? 1 : 0,
      });

      // Safety check jika insert gagal/tidak return ID
      if (!headerResult || headerResult.length === 0) {
        throw new Error("Gagal membuat header transaksi (No ID returned)");
      }

      const headerId = headerResult[0].FN_diagnosis_prosedur_id;

      // 2. Insert Semua Detail
      await this._insertAllDetails(headerId, data);

      return {
        success: true,
        message: "Data Berhasil Disimpan",
        id_transaksi: headerId,
      };
    } catch (error) {
      console.error("Error Create Medical Record:", error);
      throw error;
    }
  }

  // =================================================================
  // SECTION C: READ (Get Data & History)
  // =================================================================

  async getMedicalRecordById(transactionId) {
    try {
      // 1. Ambil Header
      const headerQuery = `
        SELECT 
            H.FN_diagnosis_prosedur_id,
            H.FN_pasien_id,
            P.FS_no_rm,
            P.FS_nama_lengkap AS nama_pasien,
            P.FS_jenis_kelamin_kode,
            P.FD_tanggal_lahir,
            H.FN_tenaga_kesehatan_id,
            H.FD_tanggal_diagnosis,
            H.FB_is_final
        FROM core.MASTER_DIAGNOSIS_PROSEDUR AS H WITH (NOLOCK)
        LEFT JOIN core.PASIEN_MASTER_PASIEN AS P WITH (NOLOCK) ON H.FN_pasien_id = P.FN_pasien_id
        WHERE H.FN_diagnosis_prosedur_id = @id
      `;

      const headerResult = await db.query(headerQuery, { id: transactionId });

      if (!headerResult || headerResult.length === 0) return null;
      const headerData = headerResult[0];

      // 2. Ambil Detail secara Parallel
      const [dxKerja, dxBanding, dxAkhir, prosedur] = await Promise.all([
        // Query 1: Dx Kerja
        db.query(
          `SELECT D.FN_diagnosis_kerja_id, D.FN_snomed_id, S.FS_fsn_term, S.FS_term_indonesia, S.FS_organ_target,
                  D.FS_diagnosis AS deskripsi_dokter, D.FS_keterangan_tambahan
           FROM deskripsi.DETAIL_DIAGNOSIS_KERJA D WITH (NOLOCK)
           LEFT JOIN core.MASTER_SNOMED S WITH (NOLOCK) ON D.FN_snomed_id = S.FN_snomed_id
           WHERE D.FN_diagnosis_prosedur_id = @id`,
          { id: transactionId }
        ),

        // Query 2: Dx Banding
        db.query(
          `SELECT D.FN_diagnosis_banding_id, D.FN_snomed_id, S.FS_fsn_term, S.FS_term_indonesia, S.FS_organ_target,
                  D.FS_diagnosis AS deskripsi_dokter, D.FS_keterangan_tambahan
           FROM deskripsi.DETAIL_DIAGNOSIS_BANDING D WITH (NOLOCK)
           LEFT JOIN core.MASTER_SNOMED S WITH (NOLOCK) ON D.FN_snomed_id = S.FN_snomed_id
           WHERE D.FN_diagnosis_prosedur_id = @id`,
          { id: transactionId }
        ),

        // Query 3: Dx Akhir
        db.query(
          `SELECT D.FN_diagnosis_akhir_id, D.FN_icd10_id, I.FS_kode_icd10, I.FS_deskripsi AS icd10_desc, I.FS_kategori,
                  D.FS_diagnosis AS deskripsi_dokter, D.FS_keterangan_tambahan
           FROM deskripsi.DETAIL_DIAGNOSIS_AKHIR D WITH (NOLOCK)
           LEFT JOIN core.MASTER_ICD10 I WITH (NOLOCK) ON D.FN_icd10_id = I.FN_icd10_id
           WHERE D.FN_diagnosis_prosedur_id = @id`,
          { id: transactionId }
        ),

        // Query 4: Prosedur
        db.query(
          `SELECT P.FN_prosedur_id, P.FN_snomed_id, S.FS_fsn_term AS snomed_desc,
                  P.FN_icd9cm_id, I9.FS_kode_icd9cm, I9.FS_deskripsi AS icd9_desc,
                  P.FN_cpt_id, C.FS_kode_cpt, C.FS_deskripsi AS cpt_desc,
                  P.FS_nama_prosedur AS deskripsi_dokter, P.FS_keterangan_tambahan
           FROM deskripsi.DETAIL_PROSEDUR P WITH (NOLOCK)
           LEFT JOIN core.MASTER_SNOMED S WITH (NOLOCK) ON P.FN_snomed_id = S.FN_snomed_id
           LEFT JOIN core.MASTER_ICD9CM I9 WITH (NOLOCK) ON P.FN_icd9cm_id = I9.FN_icd9cm_id
           LEFT JOIN core.MASTER_CPT C WITH (NOLOCK) ON P.FN_cpt_id = C.FN_cpt_id
           WHERE P.FN_diagnosis_prosedur_id = @id`,
          { id: transactionId }
        ),
      ]);

      return {
        header: headerData,
        diagnosa_kerja: dxKerja,
        diagnosa_banding: dxBanding,
        diagnosa_akhir: dxAkhir,
        prosedur: prosedur,
      };
    } catch (error) {
      console.error("Error Get Medical Record:", error);
      throw error;
    }
  }

  async getHistoryByPasien(pasienId) {
    try {
      const query = `
        SELECT H.FN_diagnosis_prosedur_id, H.FD_tanggal_diagnosis, H.FB_is_final,
               (SELECT COUNT(*) FROM deskripsi.DETAIL_DIAGNOSIS_AKHIR WHERE FN_diagnosis_prosedur_id = H.FN_diagnosis_prosedur_id) as total_dx_akhir,
               (SELECT COUNT(*) FROM deskripsi.DETAIL_PROSEDUR WHERE FN_diagnosis_prosedur_id = H.FN_diagnosis_prosedur_id) as total_tindakan
        FROM core.MASTER_DIAGNOSIS_PROSEDUR AS H WITH (NOLOCK)
        WHERE H.FN_pasien_id = @pasienId
        ORDER BY H.FD_tanggal_diagnosis DESC
      `;
      return await db.query(query, { pasienId });
    } catch (error) {
      console.error("Error Get History:", error);
      throw error;
    }
  }

  // =================================================================
  // SECTION D: UPDATE (Ubah Data)
  // =================================================================

  async updateMedicalRecord(transactionId, data) {
    try {
      const checkQuery = `SELECT FN_diagnosis_prosedur_id FROM core.MASTER_DIAGNOSIS_PROSEDUR WHERE FN_diagnosis_prosedur_id = @id`;
      const check = await db.query(checkQuery, { id: transactionId });
      if (check.length === 0)
        throw new Error("Data transaksi tidak ditemukan.");

      const updateHeaderQuery = `
        UPDATE core.MASTER_DIAGNOSIS_PROSEDUR
        SET FN_tenaga_kesehatan_id = @nakesId,
            FB_is_final = @isFinal
        WHERE FN_diagnosis_prosedur_id = @id
      `;

      await db.query(updateHeaderQuery, {
        id: transactionId,
        nakesId: data.nakes_id,
        isFinal: data.is_final ? 1 : 0,
      });

      await this._deleteAllDetails(transactionId);
      await this._insertAllDetails(transactionId, data);

      return {
        success: true,
        message: "Data Berhasil Diperbarui",
        id_transaksi: transactionId,
      };
    } catch (error) {
      console.error("Error Update Medical Record:", error);
      throw error;
    }
  }

  // =================================================================
  // SECTION E: DELETE (Hapus Data)
  // =================================================================

  async deleteMedicalRecord(transactionId) {
    try {
      const checkQuery = `SELECT FN_diagnosis_prosedur_id FROM core.MASTER_DIAGNOSIS_PROSEDUR WHERE FN_diagnosis_prosedur_id = @id`;
      const check = await db.query(checkQuery, { id: transactionId });
      if (check.length === 0)
        return { success: false, message: "Data tidak ditemukan" };

      await this._deleteAllDetails(transactionId);

      const deleteHeaderQuery = `DELETE FROM core.MASTER_DIAGNOSIS_PROSEDUR WHERE FN_diagnosis_prosedur_id = @id`;
      await db.query(deleteHeaderQuery, { id: transactionId });

      return { success: true, message: "Data Berhasil Dihapus Permanen" };
    } catch (error) {
      console.error("Error Delete Medical Record:", error);
      throw error;
    }
  }

  // =================================================================
  // SECTION F: HELPER METHODS (Private Logic - FIXED)
  // =================================================================

  async _insertAllDetails(headerId, data) {
    const promises = [];

    // CATATAN PENTING:
    // ID (snomed_id, icd10_id, dll) dari frontend dikirim '0' jika belum dipilih dropdown.
    // Kita harus ubah '0' menjadi 'NULL' agar tidak kena Foreign Key Constraint di DB.
    // Menggunakan logic: (item.id || null)

    // 1. Dx Kerja
    if (data.diagnosa_kerja?.length) {
      for (const item of data.diagnosa_kerja) {
        promises.push(
          db.query(
            `INSERT INTO deskripsi.DETAIL_DIAGNOSIS_KERJA (FN_diagnosis_prosedur_id, FN_snomed_id, FS_diagnosis, FS_keterangan_tambahan)
             VALUES (@headerId, @snomedId, @diagnosis, @ket)`,
            {
              headerId,
              snomedId: item.snomed_id || null, // FIX: Ubah 0 jadi NULL
              diagnosis: item.deskripsi || item.snomed_term || "",
              ket: item.keterangan || "",
            }
          )
        );
      }
    }

    // 2. Dx Banding
    if (data.diagnosa_banding?.length) {
      for (const item of data.diagnosa_banding) {
        promises.push(
          db.query(
            `INSERT INTO deskripsi.DETAIL_DIAGNOSIS_BANDING (FN_diagnosis_prosedur_id, FN_snomed_id, FS_diagnosis, FS_keterangan_tambahan)
             VALUES (@headerId, @snomedId, @diagnosis, @ket)`,
            {
              headerId,
              snomedId: item.snomed_id || null, // FIX: Ubah 0 jadi NULL
              diagnosis: item.deskripsi || item.snomed_term || "",
              ket: item.keterangan || "",
            }
          )
        );
      }
    }

    // 3. Dx Akhir
    if (data.diagnosa_akhir?.length) {
      for (const item of data.diagnosa_akhir) {
        promises.push(
          db.query(
            `INSERT INTO deskripsi.DETAIL_DIAGNOSIS_AKHIR (FN_diagnosis_prosedur_id, FN_icd10_id, FS_diagnosis, FS_keterangan_tambahan)
             VALUES (@headerId, @icd10Id, @diagnosis, @ket)`,
            {
              headerId,
              icd10Id: item.icd10_id || null, // FIX: Ubah 0 jadi NULL
              diagnosis: item.deskripsi || "",
              ket: item.keterangan || "",
            }
          )
        );
      }
    }

    // 4. Prosedur
    if (data.prosedur?.length) {
      for (const item of data.prosedur) {
        promises.push(
          db.query(
            `INSERT INTO deskripsi.DETAIL_PROSEDUR (FN_diagnosis_prosedur_id, FN_snomed_id, FN_icd9cm_id, FN_cpt_id, FS_nama_prosedur, FS_keterangan_tambahan)
             VALUES (@headerId, @snomedId, @icd9Id, @cptId, @namaProsedur, @ket)`,
            {
              headerId,
              snomedId: item.snomed_id || null,
              icd9Id: item.icd9_id || null,
              cptId: item.cpt_id || null,
              namaProsedur: item.nama_prosedur || "Prosedur Medis",
              ket: item.keterangan || "",
            }
          )
        );
      }
    }

    await Promise.all(promises);
  }

  async _deleteAllDetails(headerId) {
    const queries = [
      `DELETE FROM deskripsi.DETAIL_DIAGNOSIS_KERJA WHERE FN_diagnosis_prosedur_id = @id`,
      `DELETE FROM deskripsi.DETAIL_DIAGNOSIS_BANDING WHERE FN_diagnosis_prosedur_id = @id`,
      `DELETE FROM deskripsi.DETAIL_DIAGNOSIS_AKHIR WHERE FN_diagnosis_prosedur_id = @id`,
      `DELETE FROM deskripsi.DETAIL_PROSEDUR WHERE FN_diagnosis_prosedur_id = @id`,
    ];
    await Promise.all(queries.map((q) => db.query(q, { id: headerId })));
  }

  // =================================================================
  // SECTION G: UTILS LAINNYA
  // =================================================================

  async searchPasien(keyword) {
    if (!keyword || keyword.length < 3) return [];
    const query = `
      SELECT TOP 10 FN_pasien_id, FS_nama_lengkap, FS_no_rm 
      FROM core.PASIEN_MASTER_PASIEN WITH (NOLOCK)
      WHERE FS_nama_lengkap LIKE @keyword OR FS_no_rm LIKE @keyword
      ORDER BY FS_nama_lengkap ASC
    `;
    return await db.query(query, { keyword: `%${keyword}%` });
  }
}

export default new DiagnosisProsedurService();
