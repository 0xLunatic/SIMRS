// services/pemeriksaan_mata_service.js
import db from "../database/Database.js";

// =======================================================
// A. FUNGSI CRUD TERINTEGRASI (Master + Semua Detail)
// =======================================================

// 1. CREATE LENGKAP (Non-Transactional)
export const createPemeriksaanLengkap = async (data) => {
  // --- 1. INSERT MASTER_PEMERIKSAAN_MATA (core) ---
  const masterQuery = `
        INSERT INTO core.MASTER_PEMERIKSAAN_MATA (FN_pasien_id, FN_tenaga_kesehatan_id, FD_tanggal_pemeriksaan)
        OUTPUT INSERTED.FN_pemeriksaan_mata_id
        VALUES (@FN_pasien_id, @FN_tenaga_kesehatan_id, @FD_tanggal_pemeriksaan)
    `;
  const masterResult = await db.query(masterQuery, data.master);
  const masterId = masterResult[0].FN_pemeriksaan_mata_id;

  const detailParams = { FN_pemeriksaan_mata_id: masterId }; // --- 2. INSERT DETAIL_VISUS ---

  if (data.detail_visus) {
    const visusData = { ...data.detail_visus, ...detailParams };
    const visusQuery = `
            INSERT INTO deskripsi.DETAIL_VISUS (FN_pemeriksaan_mata_id, FN_loinc_id, FS_visus_od, FS_visus_os, FS_koreksi, FS_keterangan_tambahan)
            VALUES (@FN_pemeriksaan_mata_id, @FN_loinc_id, @FS_visus_od, @FS_visus_os, @FS_koreksi, @FS_keterangan_tambahan)
        `;
    await db.query(visusQuery, visusData);
  } // --- 3. INSERT DETAIL_TEKANAN_INTRAOKULAR ---

  if (data.detail_tio) {
    const tioData = { ...data.detail_tio, ...detailParams };
    const tioQuery = `
            INSERT INTO deskripsi.DETAIL_TEKANAN_INTRAOKULAR (FN_pemeriksaan_mata_id, FN_loinc_id, FS_tio_od, FS_tio_os, FS_metode_pengukuran, FS_keterangan_tambahan)
            VALUES (@FN_pemeriksaan_mata_id, @FN_loinc_id, @FS_tio_od, @FS_tio_os, @FS_metode_pengukuran, @FS_keterangan_tambahan)
        `;
    await db.query(tioQuery, tioData);
  } // --- 4. INSERT DETAIL_SEGMENT_ANTERIOR ---

  if (data.detail_segmen_ant) {
    const segmenAntData = { ...data.detail_segmen_ant, ...detailParams };
    const segmenAntQuery = `
            INSERT INTO deskripsi.DETAIL_SEGMENT_ANTERIOR (FN_pemeriksaan_mata_id, FN_loinc_id, FS_kornea, FS_acd, FS_pupil, FS_keterangan_tambahan)
            VALUES (@FN_pemeriksaan_mata_id, @FN_loinc_id, @FS_kornea, @FS_acd, @FS_pupil, @FS_keterangan_tambahan)
        `;
    await db.query(segmenAntQuery, segmenAntData);
  } // --- 5. INSERT DETAIL_LENSA ---

  if (data.detail_lensa) {
    const lensaData = { ...data.detail_lensa, ...detailParams };
    const lensaQuery = `
            INSERT INTO deskripsi.DETAIL_LENSA (FN_pemeriksaan_mata_id, FN_snomed_id, FS_temuan_lensa_od, FS_temuan_lensa_os, FS_keterangan_tambahan)
            VALUES (@FN_pemeriksaan_mata_id, @FN_snomed_id, @FS_temuan_lensa_od, @FS_temuan_lensa_os, @FS_keterangan_tambahan)
        `;
    await db.query(lensaQuery, lensaData);
  } // --- 6. INSERT DETAIL_FUNDUSKOPI ---

  if (data.detail_funduskopi) {
    const fundusData = { ...data.detail_funduskopi, ...detailParams };
    const fundusQuery = `
            INSERT INTO deskripsi.DETAIL_FUNDUSKOPI (FN_pemeriksaan_mata_id, FN_loinc_id, FS_refleks_fundus, FS_detail_retina, FS_keterangan_tambahan)
            VALUES (@FN_pemeriksaan_mata_id, @FN_loinc_id, @FS_refleks_fundus, @FS_detail_retina, @FS_keterangan_tambahan)
        `;
    await db.query(fundusQuery, fundusData);
  }

  return masterId;
};

// 2. READ ONE LENGKAP
export const getPemeriksaanLengkapById = async (id) => {
  const query = `
        SELECT 
            M.*, V.*, T.*, S.*, L.*, F.*,
            ML.FS_component as Visus_Component, MS.FS_fsn_term as Lensa_Term
        FROM core.MASTER_PEMERIKSAAN_MATA M
        LEFT JOIN deskripsi.DETAIL_VISUS V ON M.FN_pemeriksaan_mata_id = V.FN_pemeriksaan_mata_id
        LEFT JOIN deskripsi.DETAIL_TEKANAN_INTRAOKULAR T ON M.FN_pemeriksaan_mata_id = T.FN_pemeriksaan_mata_id
        LEFT JOIN deskripsi.DETAIL_SEGMENT_ANTERIOR S ON M.FN_pemeriksaan_mata_id = S.FN_pemeriksaan_mata_id
        LEFT JOIN deskripsi.DETAIL_LENSA L ON M.FN_pemeriksaan_mata_id = L.FN_pemeriksaan_mata_id
        LEFT JOIN deskripsi.DETAIL_FUNDUSKOPI F ON M.FN_pemeriksaan_mata_id = F.FN_pemeriksaan_mata_id
        LEFT JOIN core.MASTER_LOINC ML ON V.FN_loinc_id = ML.FN_loinc_id 
        LEFT JOIN core.MASTER_SNOMED MS ON L.FN_snomed_id = MS.FN_snomed_id 
        WHERE M.FN_pemeriksaan_mata_id = @id;
    `;
  const result = await db.query(query, { id });
  return result.length > 0 ? result[0] : null;
};

// 3. READ ALL LENGKAP
export const findAllPemeriksaanLengkap = async () => {
  const query = `
        SELECT 
            -- Master Fields (Pemeriksaan)
            M.FN_pemeriksaan_mata_id, 
            M.FD_tanggal_pemeriksaan, 
            
            -- Pasien Fields (JOIN ke core.PASIEN_MASTER_PASIEN)
            P.FN_pasien_id,
            P.FS_no_rm, 
            P.FS_nama_lengkap, 
            P.FS_jenis_kelamin_kode,
            P.FD_tanggal_lahir,
            P.FS_telepon,
            
            -- Detail Visus
            V.FS_visus_od, V.FS_visus_os, V.FS_koreksi,
            
            -- Detail TIO
            T.FS_tio_od, T.FS_tio_os, T.FS_metode_pengukuran,
            
            -- Detail Segmen Anterior
            S.FS_kornea, S.FS_acd, S.FS_pupil,
            
            -- Detail Lensa
            L.FS_temuan_lensa_od, L.FS_temuan_lensa_os,
            
            -- Detail Funduskopi
            F.FS_refleks_fundus, F.FS_detail_retina,
            
            -- Data Referensi (JOIN contoh)
            ML.FS_component as Visus_Component, 
            MS.FS_fsn_term as Lensa_Term
            
        FROM core.MASTER_PEMERIKSAAN_MATA M
        
        -- LEFT JOIN ke Tabel Pasien BARU
        LEFT JOIN core.PASIEN_MASTER_PASIEN P ON M.FN_pasien_id = P.FN_pasien_id
        
        -- LEFT JOIN ke semua tabel detail (skema deskripsi)
        LEFT JOIN deskripsi.DETAIL_VISUS V ON M.FN_pemeriksaan_mata_id = V.FN_pemeriksaan_mata_id
        LEFT JOIN deskripsi.DETAIL_TEKANAN_INTRAOKULAR T ON M.FN_pemeriksaan_mata_id = T.FN_pemeriksaan_mata_id
        LEFT JOIN deskripsi.DETAIL_SEGMENT_ANTERIOR S ON M.FN_pemeriksaan_mata_id = S.FN_pemeriksaan_mata_id
        LEFT JOIN deskripsi.DETAIL_LENSA L ON M.FN_pemeriksaan_mata_id = L.FN_pemeriksaan_mata_id
        LEFT JOIN deskripsi.DETAIL_FUNDUSKOPI F ON M.FN_pemeriksaan_mata_id = F.FN_pemeriksaan_mata_id

        -- LEFT JOIN ke Master Referensi (skema core)
        LEFT JOIN core.MASTER_LOINC ML ON V.FN_loinc_id = ML.FN_loinc_id
        LEFT JOIN core.MASTER_SNOMED MS ON L.FN_snomed_id = MS.FN_snomed_id
        
        ORDER BY M.FD_tanggal_pemeriksaan DESC;
    `;

  const result = await db.query(query);
  return result;
};

export const findPemeriksaanByPasienName = async (namaPasien) => {
  // Klausa pencarian WHERE yang akan disuntikkan ke query utama
  let whereClause = "";
  let params = {};

  if (namaPasien) {
    // Menggunakan LIKE dan wildcard (%) untuk pencocokan sebagian nama pasien
    whereClause = `WHERE P.FS_nama_lengkap LIKE @namaPasien`; // Menambahkan wildcard % di awal dan akhir string untuk pencarian fuzzy
    params.namaPasien = `%${namaPasien}%`;
  }

  const query = `
        SELECT 
            -- Master Fields (Pemeriksaan)
            M.FN_pemeriksaan_mata_id, 
            M.FD_tanggal_pemeriksaan, 
            
            -- Pasien Fields
            P.FN_pasien_id,
            P.FS_no_rm, 
            P.FS_nama_lengkap, 
            P.FS_jenis_kelamin_kode,
            P.FD_tanggal_lahir,
            P.FS_telepon,
            
            -- Detail Visus
            V.FS_visus_od, V.FS_visus_os, V.FS_koreksi,
            
            -- Detail TIO
            T.FS_tio_od, T.FS_tio_os, T.FS_metode_pengukuran,
            
            -- Detail Segmen Anterior
            S.FS_kornea, S.FS_acd, S.FS_pupil,
            
            -- Detail Lensa
            L.FS_temuan_lensa_od, L.FS_temuan_lensa_os,
            
            -- Detail Funduskopi
            F.FS_refleks_fundus, F.FS_detail_retina,
            
            -- Data Referensi
            ML.FS_component as Visus_Component, 
            MS.FS_fsn_term as Lensa_Term
            
        FROM core.MASTER_PEMERIKSAAN_MATA M
        
        LEFT JOIN core.PASIEN_MASTER_PASIEN P ON M.FN_pasien_id = P.FN_pasien_id
        
        LEFT JOIN deskripsi.DETAIL_VISUS V ON M.FN_pemeriksaan_mata_id = V.FN_pemeriksaan_mata_id
        LEFT JOIN deskripsi.DETAIL_TEKANAN_INTRAOKULAR T ON M.FN_pemeriksaan_mata_id = T.FN_pemeriksaan_mata_id
        LEFT JOIN deskripsi.DETAIL_SEGMENT_ANTERIOR S ON M.FN_pemeriksaan_mata_id = S.FN_pemeriksaan_mata_id
        LEFT JOIN deskripsi.DETAIL_LENSA L ON M.FN_pemeriksaan_mata_id = L.FN_pemeriksaan_mata_id
        LEFT JOIN deskripsi.DETAIL_FUNDUSKOPI F ON M.FN_pemeriksaan_mata_id = F.FN_pemeriksaan_mata_id

        LEFT JOIN core.MASTER_LOINC ML ON V.FN_loinc_id = ML.FN_loinc_id
        LEFT JOIN core.MASTER_SNOMED MS ON L.FN_snomed_id = MS.FN_snomed_id
        
        ${whereClause} 
        
        ORDER BY M.FD_tanggal_pemeriksaan DESC;
    `;

  return db.query(query, params);
};

// =======================================================
// B. CRUD DASAR (Untuk Update/Delete per Detail)
// =======================================================

// --- B.1 MASTER_PEMERIKSAAN_MATA CRUD ---
export const updateMasterPemeriksaan = async (id, data) => {
  const query = `
        UPDATE core.MASTER_PEMERIKSAAN_MATA
        SET FN_tenaga_kesehatan_id = @FN_tenaga_kesehatan_id, FD_tanggal_pemeriksaan = @FD_tanggal_pemeriksaan
        WHERE FN_pemeriksaan_mata_id = @id
    `;
  return db.query(query, { ...data, id });
};
export const deleteMasterPemeriksaan = async (id) => {
  // Catatan: Jika tabel detail memiliki Foreign Key CASCADE DELETE, ini akan menghapus semua detail.
  const query = `DELETE FROM core.MASTER_PEMERIKSAAN_MATA WHERE FN_pemeriksaan_mata_id = @id`;
  return db.query(query, { id });
};

// --- B.2 DETAIL_VISUS CRUD ---
export const getDetailVisusById = async (id) => {
  const query = `SELECT * FROM deskripsi.DETAIL_VISUS WHERE FN_visus_id = @id`;
  return db.query(query, { id });
};
export const updateDetailVisus = async (id, data) => {
  const query = `
        UPDATE deskripsi.DETAIL_VISUS
        SET FN_loinc_id = @FN_loinc_id, FS_visus_od = @FS_visus_od, FS_visus_os = @FS_visus_os, FS_koreksi = @FS_koreksi, FS_keterangan_tambahan = @FS_keterangan_tambahan
        WHERE FN_visus_id = @id
    `;
  return db.query(query, { ...data, id });
};
export const deleteDetailVisus = async (id) => {
  const query = `DELETE FROM deskripsi.DETAIL_VISUS WHERE FN_visus_id = @id`;
  return db.query(query, { id });
};

// --- B.3 DETAIL_TEKANAN_INTRAOKULAR CRUD ---
export const getDetailTioById = async (id) => {
  const query = `SELECT * FROM deskripsi.DETAIL_TEKANAN_INTRAOKULAR WHERE FN_tio_id = @id`;
  return db.query(query, { id });
};
export const updateDetailTio = async (id, data) => {
  const query = `
        UPDATE deskripsi.DETAIL_TEKANAN_INTRAOKULAR
        SET FN_loinc_id = @FN_loinc_id, FS_tio_od = @FS_tio_od, FS_tio_os = @FS_tio_os, FS_metode_pengukuran = @FS_metode_pengukuran, FS_keterangan_tambahan = @FS_keterangan_tambahan
        WHERE FN_tio_id = @id
    `;
  return db.query(query, { ...data, id });
};
export const deleteDetailTio = async (id) => {
  const query = `DELETE FROM deskripsi.DETAIL_TEKANAN_INTRAOKULAR WHERE FN_tio_id = @id`;
  return db.query(query, { id });
};

// --- B.4 DETAIL_SEGMENT_ANTERIOR CRUD ---
export const getDetailSegmenAntById = async (id) => {
  const query = `SELECT * FROM deskripsi.DETAIL_SEGMENT_ANTERIOR WHERE FN_segmen_ant_id = @id`;
  return db.query(query, { id });
};
export const updateDetailSegmenAnt = async (id, data) => {
  const query = `
        UPDATE deskripsi.DETAIL_SEGMENT_ANTERIOR
        SET FN_loinc_id = @FN_loinc_id, FS_kornea = @FS_kornea, FS_acd = @FS_acd, FS_pupil = @FS_pupil, FS_keterangan_tambahan = @FS_keterangan_tambahan
        WHERE FN_segmen_ant_id = @id
    `;
  return db.query(query, { ...data, id });
};
export const deleteDetailSegmenAnt = async (id) => {
  const query = `DELETE FROM deskripsi.DETAIL_SEGMENT_ANTERIOR WHERE FN_segmen_ant_id = @id`;
  return db.query(query, { id });
};

// --- B.5 DETAIL_LENSA CRUD ---
export const getDetailLensaById = async (id) => {
  const query = `SELECT * FROM deskripsi.DETAIL_LENSA WHERE FN_lensa_id = @id`;
  return db.query(query, { id });
};
export const updateDetailLensa = async (id, data) => {
  const query = `
        UPDATE deskripsi.DETAIL_LENSA
        SET FN_snomed_id = @FN_snomed_id, FS_temuan_lensa_od = @FS_temuan_lensa_od, FS_temuan_lensa_os = @FS_temuan_lensa_os, FS_keterangan_tambahan = @FS_keterangan_tambahan
        WHERE FN_lensa_id = @id
    `;
  return db.query(query, { ...data, id });
};
export const deleteDetailLensa = async (id) => {
  const query = `DELETE FROM deskripsi.DETAIL_LENSA WHERE FN_lensa_id = @id`;
  return db.query(query, { id });
};

// --- B.6 DETAIL_FUNDUSKOPI CRUD ---
export const getDetailFunduskopiById = async (id) => {
  const query = `SELECT * FROM deskripsi.DETAIL_FUNDUSKOPI WHERE FN_funduskopi_id = @id`;
  return db.query(query, { id });
};
export const updateDetailFunduskopi = async (id, data) => {
  const query = `
        UPDATE deskripsi.DETAIL_FUNDUSKOPI
        SET FN_loinc_id = @FN_loinc_id, FS_refleks_fundus = @FS_refleks_fundus, FS_detail_retina = @FS_detail_retina, FS_keterangan_tambahan = @FS_keterangan_tambahan
        WHERE FN_funduskopi_id = @id
    `;
  return db.query(query, { ...data, id });
};
export const deleteDetailFunduskopi = async (id) => {
  const query = `DELETE FROM deskripsi.DETAIL_FUNDUSKOPI WHERE FN_funduskopi_id = @id`;
  return db.query(query, { id });
};

// =======================================================
// C. FUNGSI MASTER REFERENSI (REVISI)
// =======================================================

/**
 * Mendapatkan daftar LOINC berdasarkan kategori aplikasi (Contoh: 'VISUS', 'TIO').
 * @param {string} category Kategori aplikasi LOINC.
 * @returns {Promise<Array>} Daftar objek LOINC.
 */
export const getLoincByCategory = async (category) => {
  const query = `
        SELECT 
            FN_loinc_id AS ID, 
            FS_kode_loinc AS Kode, 
            FS_deskripsi AS Deskripsi,
            FS_component AS Komponen
        FROM core.MASTER_LOINC
        WHERE FS_kategori_aplikasi = @category AND FB_aktif = 1
        ORDER BY FS_deskripsi ASC
    `; // Menggunakan format parameter yang sesuai dengan db.query
  return db.query(query, { category });
};

/**
 * Mendapatkan daftar SNOMED berdasarkan organ target (Contoh: 'LENSA', 'KORNEA').
 * @param {string} organ Organ target SNOMED.
 * @returns {Promise<Array>} Daftar objek SNOMED.
 */
export const getSnomedByOrgan = async (organ) => {
  const query = `
        SELECT 
            FN_snomed_id AS ID, 
            FS_term_indonesia, 
            FS_fsn_Term
        FROM core.MASTER_SNOMED
        WHERE FS_organ_target = @organ AND FB_aktif = 1
        ORDER BY FS_term_indonesia ASC
    `; // Menggunakan format parameter yang sesuai dengan db.query
  return db.query(query, { organ });
};
