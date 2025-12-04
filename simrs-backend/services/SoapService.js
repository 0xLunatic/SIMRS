import db from "../database/Database.js";

class SoapService {
  // ==========================================
  // 1. HELPER
  // ==========================================
  async searchPasien(keyword) {
    const query = `
      SELECT TOP 50 * FROM core.PASIEN_MASTER_PASIEN 
      WHERE FB_aktif = 1 AND FS_nama_lengkap LIKE @name 
      ORDER BY FS_nama_lengkap ASC
    `;
    return await db.query(query, { name: `%${keyword}%` });
  }

  async getSnomedCategories() {
    const query = `
      SELECT DISTINCT FS_kategori_konsep 
      FROM core.MASTER_SNOMED 
      WHERE FB_aktif = 1 AND FS_kategori_konsep IS NOT NULL
      ORDER BY FS_kategori_konsep ASC
    `;
    return await db.query(query);
  }

  async searchSnomed(keyword, category) {
    const query = `
      SELECT TOP 50 
        FN_snomed_id, FS_fsn_term, FS_term_indonesia, FS_kategori_konsep, FS_deskripsi
      FROM core.MASTER_SNOMED
      WHERE FB_aktif = 1
      AND (@category IS NULL OR FS_kategori_konsep = @category)
      AND (@keyword IS NULL OR FS_fsn_term LIKE @keyword OR FS_term_indonesia LIKE @keyword)
      ORDER BY FS_term_indonesia ASC
    `;
    return await db.query(query, {
      category: category || null,
      keyword: keyword ? `%${keyword}%` : null,
    });
  }

  async searchIcd10(keyword, category) {
    const query = `
      SELECT TOP 50 
        FN_icd10_id, FS_kode_icd10, FS_deskripsi, FS_kategori_aplikasi
      FROM core.MASTER_ICD10
      WHERE FB_aktif = 1
      AND (@category IS NULL OR FS_kategori_aplikasi = @category)
      AND (@keyword IS NULL OR FS_kode_icd10 LIKE @keyword OR FS_deskripsi LIKE @keyword)
      ORDER BY FS_kode_icd10 ASC
    `;
    return await db.query(query, {
      category: category || null,
      keyword: keyword ? `%${keyword}%` : null,
    });
  }

  // ==========================================
  // 2. CREATE (C)
  // ==========================================
  async createSoap(data) {
    // 1. Insert Master
    const qMaster = `
      INSERT INTO core.MASTER_SOAP (FN_pasien_id, FN_tenaga_kesehatan_id, FD_tanggal_pencatatan)
      OUTPUT INSERTED.FN_soap_id
      VALUES (@pasienId, @nakesId, GETDATE());
    `;
    const resMaster = await db.query(qMaster, {
      pasienId: data.pasien_id,
      nakesId: data.nakes_id,
    });
    const soapId = resMaster[0].FN_soap_id;

    // 2. Insert Subjective (Include IDs)
    if (data.subjective) {
      await db.query(
        `INSERT INTO deskripsi.DETAIL_SOAP_SUBJECTIVE 
         (FN_soap_id, FS_catatan_subjective, FN_snomed_id, FN_icd10cm_id) 
         VALUES (@id, @val, @snomed, @icd)`,
        {
          id: soapId,
          val: data.subjective,
          snomed: data.snomed_subjective || null, // ID dari Dropdown S
          icd: data.icd_subjective || null,
        }
      );
    }

    // 3. Insert Objective (Include IDs)
    if (data.objective) {
      await db.query(
        `INSERT INTO deskripsi.DETAIL_SOAP_OBJECTIVE 
         (FN_soap_id, FS_catatan_objective, FN_snomed_id, FN_icd10cm_id) 
         VALUES (@id, @val, @snomed, @icd)`,
        {
          id: soapId,
          val: data.objective,
          snomed: data.snomed_objective || null, // ID dari Dropdown O
          icd: data.icd_objective || null,
        }
      );
    }

    // 4. Insert Assessment (Include IDs)
    if (data.assessment) {
      await db.query(
        `INSERT INTO deskripsi.DETAIL_SOAP_ASSESSMENT 
         (FN_soap_id, FS_catatan_assessment, FN_snomed_id, FN_icd10cm_id) 
         VALUES (@id, @val, @snomed, @icd)`,
        {
          id: soapId,
          val: data.assessment,
          snomed: data.snomed_assessment || null, // ID dari Dropdown A (dahulu data.snomed_id)
          icd: data.icd_assessment || null, // ID dari Dropdown A (dahulu data.icd10_id)
        }
      );
    }

    // 5. Insert Plan (Include IDs)
    if (data.plan) {
      await db.query(
        `INSERT INTO deskripsi.DETAIL_SOAP_PLAN 
         (FN_soap_id, FS_catatan_plan, FN_tatalaksana_id, FN_snomed_id, FN_icd10cm_id) 
         VALUES (@id, @val, @tata, @snomed, @icd)`,
        {
          id: soapId,
          val: data.plan,
          tata: data.tatalaksana_id || null, // Legacy ID
          snomed: data.snomed_plan || null, // New SNOMED ID for Procedure
          icd: data.icd_plan || null,
        }
      );
    }

    return { soap_id: soapId };
  }

  // ==========================================
  // 3. READ (R)
  // ==========================================

  // List History (Ringkas)
  async getSoapHistoryByPasien(pasienId) {
    const query = `
      SELECT 
        M.FN_soap_id, M.FD_tanggal_pencatatan, P.FS_nama_lengkap,
        S.FS_catatan_subjective, 
        O.FS_catatan_objective, 
        A.FS_catatan_assessment, 
        -- Ambil Nama Diagnosa Utama (Assessment) untuk ditampilkan di tabel
        MA_Sn.FS_term_indonesia as diagnosa_utama_snomed,
        MA_Icd.FS_kode_icd10 as diagnosa_utama_icd10,
        PL.FS_catatan_plan
      FROM core.MASTER_SOAP M
      JOIN core.PASIEN_MASTER_PASIEN P ON M.FN_pasien_id = P.FN_pasien_id
      LEFT JOIN deskripsi.DETAIL_SOAP_SUBJECTIVE S ON M.FN_soap_id = S.FN_soap_id
      LEFT JOIN deskripsi.DETAIL_SOAP_OBJECTIVE O ON M.FN_soap_id = O.FN_soap_id
      LEFT JOIN deskripsi.DETAIL_SOAP_ASSESSMENT A ON M.FN_soap_id = A.FN_soap_id
        -- Join ke Master untuk nama diagnosa
        LEFT JOIN core.MASTER_SNOMED MA_Sn ON A.FN_snomed_id = MA_Sn.FN_snomed_id
        LEFT JOIN core.MASTER_ICD10 MA_Icd ON A.FN_icd10cm_id = MA_Icd.FN_icd10_id
      LEFT JOIN deskripsi.DETAIL_SOAP_PLAN PL ON M.FN_soap_id = PL.FN_soap_id
      WHERE M.FN_pasien_id = @pasienId
      ORDER BY M.FD_tanggal_pencatatan DESC
    `;
    return await db.query(query, { pasienId });
  }

  // Get Detail (Lengkap dengan ID dan Nama Referensi untuk semua bagian)
  async getSoapById(soapId) {
    const query = `
      SELECT M.*, 
        -- SUBJECTIVE
        S.FS_catatan_subjective, S.FN_snomed_id AS snomed_subjective, S.FN_icd10cm_id AS icd_subjective,
        SnS.FS_term_indonesia AS snomed_subjective_name,
        
        -- OBJECTIVE
        O.FS_catatan_objective, O.FN_snomed_id AS snomed_objective, O.FN_icd10cm_id AS icd_objective,
        SnO.FS_term_indonesia AS snomed_objective_name,
        
        -- ASSESSMENT
        A.FS_catatan_assessment, A.FN_snomed_id AS snomed_assessment, A.FN_icd10cm_id AS icd_assessment,
        SnA.FS_term_indonesia AS snomed_assessment_name,
        IcdA.FS_kode_icd10 AS icd_assessment_code, IcdA.FS_deskripsi AS icd_assessment_name,

        -- PLAN
        PL.FS_catatan_plan, PL.FN_tatalaksana_id, PL.FN_snomed_id AS snomed_plan, PL.FN_icd10cm_id AS icd_plan,
        SnP.FS_term_indonesia AS snomed_plan_name

      FROM core.MASTER_SOAP M
      
      -- JOIN TABLES
      LEFT JOIN deskripsi.DETAIL_SOAP_SUBJECTIVE S ON M.FN_soap_id = S.FN_soap_id
        LEFT JOIN core.MASTER_SNOMED SnS ON S.FN_snomed_id = SnS.FN_snomed_id

      LEFT JOIN deskripsi.DETAIL_SOAP_OBJECTIVE O ON M.FN_soap_id = O.FN_soap_id
        LEFT JOIN core.MASTER_SNOMED SnO ON O.FN_snomed_id = SnO.FN_snomed_id

      LEFT JOIN deskripsi.DETAIL_SOAP_ASSESSMENT A ON M.FN_soap_id = A.FN_soap_id
        LEFT JOIN core.MASTER_SNOMED SnA ON A.FN_snomed_id = SnA.FN_snomed_id
        LEFT JOIN core.MASTER_ICD10 IcdA ON A.FN_icd10cm_id = IcdA.FN_icd10_id

      LEFT JOIN deskripsi.DETAIL_SOAP_PLAN PL ON M.FN_soap_id = PL.FN_soap_id
        LEFT JOIN core.MASTER_SNOMED SnP ON PL.FN_snomed_id = SnP.FN_snomed_id

      WHERE M.FN_soap_id = @soapId
    `;
    const result = await db.query(query, { soapId });
    return result[0];
  }

  // ==========================================
  // 4. UPDATE (U)
  // ==========================================
  async updateSoap(soapId, data) {
    // 1. Update Subjective
    if (data.subjective) {
      await db.query(
        `
        MERGE deskripsi.DETAIL_SOAP_SUBJECTIVE AS Target
        USING (SELECT @id AS id) AS Source ON Target.FN_soap_id = Source.id
        WHEN MATCHED THEN 
            UPDATE SET FS_catatan_subjective = @val, FN_snomed_id = @snomed, FN_icd10cm_id = @icd
        WHEN NOT MATCHED THEN 
            INSERT (FN_soap_id, FS_catatan_subjective, FN_snomed_id, FN_icd10cm_id) VALUES (@id, @val, @snomed, @icd);
      `,
        {
          id: soapId,
          val: data.subjective,
          snomed: data.snomed_subjective || null,
          icd: data.icd_subjective || null,
        }
      );
    }

    // 2. Update Objective
    if (data.objective) {
      await db.query(
        `
        MERGE deskripsi.DETAIL_SOAP_OBJECTIVE AS Target
        USING (SELECT @id AS id) AS Source ON Target.FN_soap_id = Source.id
        WHEN MATCHED THEN 
            UPDATE SET FS_catatan_objective = @val, FN_snomed_id = @snomed, FN_icd10cm_id = @icd
        WHEN NOT MATCHED THEN 
            INSERT (FN_soap_id, FS_catatan_objective, FN_snomed_id, FN_icd10cm_id) VALUES (@id, @val, @snomed, @icd);
      `,
        {
          id: soapId,
          val: data.objective,
          snomed: data.snomed_objective || null,
          icd: data.icd_objective || null,
        }
      );
    }

    // 3. Update Assessment
    if (data.assessment) {
      await db.query(
        `
        MERGE deskripsi.DETAIL_SOAP_ASSESSMENT AS Target
        USING (SELECT @id AS id) AS Source ON Target.FN_soap_id = Source.id
        WHEN MATCHED THEN 
           UPDATE SET FS_catatan_assessment = @val, FN_snomed_id = @snomed, FN_icd10cm_id = @icd
        WHEN NOT MATCHED THEN 
           INSERT (FN_soap_id, FS_catatan_assessment, FN_snomed_id, FN_icd10cm_id) VALUES (@id, @val, @snomed, @icd);
      `,
        {
          id: soapId,
          val: data.assessment,
          snomed: data.snomed_assessment || null,
          icd: data.icd_assessment || null,
        }
      );
    }

    // 4. Update Plan
    if (data.plan) {
      await db.query(
        `
        MERGE deskripsi.DETAIL_SOAP_PLAN AS Target
        USING (SELECT @id AS id) AS Source ON Target.FN_soap_id = Source.id
        WHEN MATCHED THEN 
           UPDATE SET FS_catatan_plan = @val, FN_tatalaksana_id = @tata, FN_snomed_id = @snomed
        WHEN NOT MATCHED THEN 
           INSERT (FN_soap_id, FS_catatan_plan, FN_tatalaksana_id, FN_snomed_id) VALUES (@id, @val, @tata, @snomed);
      `,
        {
          id: soapId,
          val: data.plan,
          tata: data.tatalaksana_id || null,
          snomed: data.snomed_plan || null,
        }
      );
    }

    return { message: "Update berhasil", soap_id: soapId };
  }

  // 5. Delete (Sama seperti sebelumnya)
  async deleteSoap(soapId) {
    await db.query(
      `DELETE FROM deskripsi.DETAIL_SOAP_SUBJECTIVE WHERE FN_soap_id = @id`,
      { id: soapId }
    );
    await db.query(
      `DELETE FROM deskripsi.DETAIL_SOAP_OBJECTIVE WHERE FN_soap_id = @id`,
      { id: soapId }
    );
    await db.query(
      `DELETE FROM deskripsi.DETAIL_SOAP_ASSESSMENT WHERE FN_soap_id = @id`,
      { id: soapId }
    );
    await db.query(
      `DELETE FROM deskripsi.DETAIL_SOAP_PLAN WHERE FN_soap_id = @id`,
      { id: soapId }
    );
    await db.query(`DELETE FROM core.MASTER_SOAP WHERE FN_soap_id = @id`, {
      id: soapId,
    });
    return { message: "Data SOAP berhasil dihapus permanen" };
  }
}

export default new SoapService();
