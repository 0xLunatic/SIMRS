// services/SnomedService.js
import db from "../database/Database.js";

const snomedService = {
  // ✅ 1. Ambil semua data SNOMED (Limit default 50)
  getAllSnomed: async (limit = 50) => {
    const query = `
      SELECT TOP (${limit}) *
      FROM core.MASTER_SNOMED
      WHERE FB_aktif = 1
      ORDER BY FN_snomed_id ASC
    `;
    return await db.query(query);
  },

  // ✅ 2. Ambil 1 data SNOMED berdasarkan ID
  getSnomedById: async (id) => {
    const query = `
      SELECT *
      FROM core.MASTER_SNOMED
      WHERE FN_snomed_id = @id
    `;
    return await db.query(query, { id });
  },

  // ✅ 3. Cari SNOMED Global (Keyword saja)
  searchSnomed: async (keyword) => {
    const query = `
      SELECT TOP (30) *
      FROM core.MASTER_SNOMED
      WHERE
        FS_fsn_term LIKE '%' + @keyword + '%' OR
        FS_term_indonesia LIKE '%' + @keyword + '%'
    `;
    return await db.query(query, { keyword });
  },

  // ✅ 4. [BARU] Cari SNOMED Berdasarkan Kategori (+ Keyword Opsional)
  // Ini yang dipakai untuk Dropdown di Frontend React
  getByCategory: async (category, keyword = "") => {
    let query = `
      SELECT TOP (50) 
        FN_snomed_id, 
        FS_fsn_term, 
        FS_term_indonesia, 
        FS_kategori_konsep
      FROM core.MASTER_SNOMED
      WHERE FB_aktif = 1
    `;

    const params = {};

    // Filter Kategori (Wajib jika ada)
    if (category && category !== "0") {
      query += ` AND FS_kategori_konsep = @category `;
      params.category = category;
    }

    // Filter Keyword (Jika user mengetik di search bar dropdown)
    if (keyword) {
      query += ` AND (FS_fsn_term LIKE '%' + @keyword + '%' OR FS_term_indonesia LIKE '%' + @keyword + '%') `;
      params.keyword = keyword;
    }

    query += ` ORDER BY FS_term_indonesia ASC`;

    return await db.query(query, params);
  },

  // ✅ 5. Update data SNOMED
  updateSnomed: async (id, data) => {
    const query = `
      UPDATE core.MASTER_SNOMED
      SET
        FS_fsn_term = @fsn,
        FS_term_indonesia = @term,
        FS_deskripsi = @deskripsi,
        FS_kategori_konsep = @kategori,
        FS_tipe_konsep = @tipe,
        FB_aktif = @aktif
      WHERE FN_snomed_id = @id
    `;

    const params = {
      id,
      fsn: data.FS_fsn_term,
      term: data.FS_term_indonesia,
      deskripsi: data.FS_deskripsi,
      kategori: data.FS_kategori_konsep,
      tipe: data.FS_tipe_konsep,
      aktif: data.FB_aktif ?? 1,
    };

    return await db.query(query, params);
  },

  // ✅ 6. Tambah Baru
  insertSnomed: async (data) => {
    const query = `
      SET IDENTITY_INSERT core.MASTER_SNOMED ON;

      INSERT INTO core.MASTER_SNOMED
      (FN_snomed_id, FS_fsn_term, FS_term_indonesia, FS_deskripsi, FS_kategori_konsep, FS_tipe_konsep, FB_aktif)
      VALUES (@id, @fsn, @term, @deskripsi, @kategori, @tipe, @aktif);

      SET IDENTITY_INSERT core.MASTER_SNOMED OFF;
    `;

    const params = {
      id: data.FN_snomed_id,
      fsn: data.FS_fsn_term,
      term: data.FS_term_indonesia,
      deskripsi: data.FS_deskripsi,
      kategori: data.FS_kategori_konsep,
      tipe: data.FS_tipe_konsep,
      aktif: data.FB_aktif ?? 1,
    };

    return await db.query(query, params);
  },

  // ✅ 7. Hapus SNOMED
  deleteSnomed: async (id) => {
    const deleteQuery = `
      DELETE FROM core.MASTER_SNOMED
      WHERE FN_snomed_id = @id
    `;

    await db.query(deleteQuery, { id });

    // Reset identity check (Opsional)
    const reseedQuery = `
      IF EXISTS (
        SELECT 1
        FROM sys.identity_columns
        WHERE [object_id] = OBJECT_ID('core.MASTER_SNOMED')
          AND [name] = 'FN_snomed_id'
      )
      DBCC CHECKIDENT ('core.MASTER_SNOMED', RESEED);
    `;

    return await db.query(reseedQuery);
  },
};

export default snomedService;
