// DetailAnamnesisService.js

import db from "../database/Database.js";

// Tabel mapping tetap sama
const detailTableMap = {
  DETAIL_KELUHAN: {
    table: "DETAIL_KELUHAN",
    pertanyaanCol: "FN_pertanyaan_id",
  },
  DETAIL_RIWAYAT_PENYAKIT: {
    table: "DETAIL_RIWAYAT_PENYAKIT",
    pertanyaanCol: "FN_pertanyaan_id",
  },
  DETAIL_PENYAKIT_TERDAHULU: {
    table: "DETAIL_PENYAKIT_TERDAHULU",
    pertanyaanCol: "FN_pertanyaan_id",
  },
  DETAIL_RIWAYAT_PENGOBATAN: {
    table: "DETAIL_RIWAYAT_PENGOBATAN",
    pertanyaanCol: "FN_pertanyaan_id",
  },
  DETAIL_FAKTOR_RESIKO: {
    table: "DETAIL_FAKTOR_RESIKO",
    pertanyaanCol: "FN_pertanyaan_id",
  },
  DETAIL_RIWAYAT_BEDAH_TERAPI: {
    table: "DETAIL_RIWAYAT_BEDAH_TERAPI",
    pertanyaanCol: "FN_pertanyaan_id",
  },
  DETAIL_PEMERIKSAAN_FUNGSI_VISUS: {
    table: "DETAIL_PEMERIKSAAN_FUNGSI_VISUS",
    pertanyaanCol: "FN_pertanyaan_id",
  },
  DETAIL_PEMERIKSAAN_BIOMIKROSKOPI: {
    table: "DETAIL_PEMERIKSAAN_BIOMIKROSKOPI",
    pertanyaanCol: "FN_pertanyaan_id",
  },
};

class DetailAnamnesisService {
  // ... (Fungsi getMasterPertanyaan, getMasterStructuredAnswers, dan getSyncData TIDAK BERUBAH)

  // --------------------------------------------------
  // 1. MASTER PERTANYAAN (READ)
  // --------------------------------------------------
  async getMasterPertanyaan() {
    try {
      const query = `
        SELECT 
          FN_pertanyaan_id, 
          FS_kategori, 
          FS_pertanyaan, 
          FS_kode_snomed, 
          FS_kode_loinc,
          CONCAT(SUBSTRING(REPLACE(FS_kategori, ' ', '_'), 1, 4), '_', FS_kode_snomed) AS FS_kode_pertanyaan
        FROM core.MASTER_PERTANYAAN 
        WHERE FB_aktif = 1;`;

      const result = await db.query(query);
      return result || [];
    } catch (error) {
      console.error(
        "Error in DetailAnamnesisService.getMasterPertanyaan:",
        error
      );
      throw new Error("Gagal mengambil data master pertanyaan.");
    }
  }

  // --------------------------------------------------
  // 2. MASTER JAWABAN TERSTRUKTUR (READ)
  // --------------------------------------------------
  async getMasterStructuredAnswers() {
    try {
      const query = `
        SELECT
          FN_jawaban_id,
          FN_pertanyaan_id,
          FS_label,
          FS_definisi,
          FS_level
        FROM core.MASTER_JAWABAN_TERSTRUKTUR
        WHERE FB_aktif = 1;`; // Asumsikan ada kolom FB_aktif

      const result = await db.query(query);
      return result || [];
    } catch (error) {
      console.error(
        "Error in DetailAnamnesisService.getMasterStructuredAnswers:",
        error
      );
      throw new Error("Gagal mengambil data master jawaban terstruktur.");
    }
  }

  // --------------------------------------------------
  // 3. SYNC DATA (MENGGABUNGKAN PERTANYAAN & JAWABAN)
  // --------------------------------------------------
  async getSyncData() {
    // Jalankan kedua promise secara paralel
    const [questions, structuredAnswers] = await Promise.all([
      this.getMasterPertanyaan(),
      this.getMasterStructuredAnswers(),
    ]);

    return {
      questions,
      structuredAnswers,
    };
  }

  // --------------------------------------------------
  // 4. DETAIL CREATE (Save Detail Anamnesis)
  // --------------------------------------------------
  async save(anamnesisId, detailData) {
    if (!anamnesisId) {
      throw new Error("ID Anamnesis tidak valid.");
    }

    try {
      // Simpan ke Tabel Detail (Skema deskripsi)
      for (const key in detailTableMap) {
        if (!detailTableMap.hasOwnProperty(key)) continue;

        const tableInfo = detailTableMap[key];
        const tableName = tableInfo.table;
        const questionColumn = tableInfo.pertanyaanCol;
        const detailEntries = detailData[tableName];

        if (
          detailEntries &&
          Array.isArray(detailEntries) &&
          detailEntries.length > 0
        ) {
          // Siapkan nama parameter untuk menghindari SQL Injection
          const insertColumns = [
            "FN_anamnesis_id",
            questionColumn,
            "FN_jawaban_id", // 🆕 Tambah kolom Jawaban ID
            "FS_keterangan",
          ];

          const valuesSql = detailEntries
            .map((entry, index) => {
              // 🆕 Nama parameter unik untuk Jawaban ID
              const jawabanIdParam = `@JawabanId_${tableName}_${index}`;
              const keteranganParam = `@Keterangan_${tableName}_${index}`;

              return `
                SELECT 
                  @AnamnesisID AS FN_anamnesis_id,
                  ${entry.FN_pertanyaan_id} AS ${questionColumn}, 
                  ${jawabanIdParam} AS FN_jawaban_id,
                  ${keteranganParam} AS FS_keterangan`;
            })
            .join("\nUNION ALL\n");

          const finalInsertQuery = `
              INSERT INTO deskripsi.${tableName} 
              (${insertColumns.join(", ")}) 
              ${valuesSql}`;

          // Siapkan parameter untuk SQL Server
          const params = { AnamnesisID: anamnesisId };
          detailEntries.forEach((entry, index) => {
            // 🆕 Tambahkan parameter untuk FN_jawaban_id
            // Gunakan nilai 0 jika null atau undefined (karena SQL Server T-SQL
            // biasanya lebih rapi dengan parameter numerik yang pasti)
            params[`JawabanId_${tableName}_${index}`] =
              entry.FN_jawaban_id || 0;
            params[`Keterangan_${tableName}_${index}`] = entry.FS_keterangan;
          });

          await db.query(finalInsertQuery, params);
        }
      }

      return { success: true, message: "Detail Anamnesis berhasil disimpan." };
    } catch (error) {
      const userErrorMessage = error.sqlMessage || error.message;
      console.error(
        "FATAL DATABASE ERROR in DetailAnamnesisService.save:",
        userErrorMessage,
        error
      );
      throw new Error(
        `Penyimpanan Detail Anamnesis gagal: ${userErrorMessage}`
      );
    }
  }

  // --------------------------------------------------
  // 5. DETAIL READ (Get All Details)
  // --------------------------------------------------
  async getByAnamnesisId(id) {
    const details = {};

    for (const key in detailTableMap) {
      if (!detailTableMap.hasOwnProperty(key)) continue;

      const tableName = detailTableMap[key].table;

      // ⚠️ CATATAN: Fungsi READ ini akan mengambil kolom FN_jawaban_id secara otomatis
      // jika kolom tersebut sudah ada di tabel database.
      const result = await db.query(
        `SELECT * FROM deskripsi.${tableName} WHERE FN_anamnesis_id = @ID`,
        { ID: id }
      );
      details[tableName] = result || [];
    }

    return details;
  }
}

export default new DetailAnamnesisService();
