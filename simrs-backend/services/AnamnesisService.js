// MasterAnamnesisService.js

import db from "../database/Database.js"; // Sesuaikan path jika perlu

class MasterAnamnesisService {
  // ===================================================================
  // ⚙️ FUNGSI TRANSAKSIONAL DASAR (CRUD MASTER)
  // ===================================================================

  // --- 1. CREATE Master Anamnesis ---
  async create(data) {
    try {
      const masterQuery = `
                INSERT INTO core.MASTER_ANAMNESIS 
                (FN_pasien_id, FD_tanggal_anamnesis, FN_tenaga_kesehatan_id, FT_waktu_input) 
                OUTPUT INSERTED.FN_anamnesis_id
                VALUES (@PasienID, GETDATE(), @NakesID, GETDATE());
            `;

      const result = await db.query(masterQuery, {
        PasienID: data.FN_pasien_id,
        NakesID: data.FN_tenaga_kesehatan_id,
      });

      return result;
    } catch (error) {
      console.error("Error in MasterAnamnesisService.create:", error);
      throw new Error(`Gagal menyimpan data master Anamnesis.`);
    }
  }

  // --- 2. READ Single Master Anamnesis (HANYA data MASTER) ---
  /**
   * Mengambil HANYA data dari tabel MASTER_ANAMNESIS.
   * Fungsi ini berbeda dengan getFullDetailById yang melakukan JOIN data Pasien/Nakes/Detail.
   */
  async getById(id) {
    try {
      const master = await db.query(
        "SELECT * FROM core.MASTER_ANAMNESIS WHERE FN_anamnesis_id = @ID",
        { ID: id }
      );
      return master || null; // Mengembalikan null jika tidak ada data
    } catch (error) {
      console.error("Error in MasterAnamnesisService.getById:", error);
      throw new Error("Gagal mengambil data master Anamnesis.");
    }
  }

  // --- 2. READ All Master Anamnesis ---
  async getAll() {
    try {
      const masters = await db.query(
        "SELECT * FROM core.MASTER_ANAMNESIS ORDER BY FD_tanggal_anamnesis DESC"
      );
      return masters || [];
    } catch (error) {
      console.error("Error in MasterAnamnesisService.getAll:", error);
      throw new Error("Gagal mengambil semua data master Anamnesis.");
    }
  }

  // --- 3. UPDATE Master Anamnesis ---
  async update(id, data) {
    try {
      const updateQuery = `
                UPDATE core.MASTER_ANAMNESIS 
                SET FN_pasien_id = @PasienID, FN_tenaga_kesehatan_id = @NakesID, FT_waktu_update = GETDATE()
                WHERE FN_anamnesis_id = @ID`;

      const result = await db.query(updateQuery, {
        PasienID: data.FN_pasien_id,
        NakesID: data.FN_tenaga_kesehatan_id,
        ID: id,
      });

      return (result.rowsAffected?.[0] || 0) > 0;
    } catch (error) {
      console.error("Error in MasterAnamnesisService.update:", error);
      throw new Error(`Gagal memperbarui data master Anamnesis.`);
    }
  }

  // --- 4. DELETE Master Anamnesis ---
  async delete(id) {
    try {
      const deleteQuery =
        "DELETE FROM core.MASTER_ANAMNESIS WHERE FN_anamnesis_id = @ID";
      const result = await db.query(deleteQuery, { ID: id });

      return (result.rowsAffected?.[0] || 0) > 0;
    } catch (error) {
      console.error("Error in MasterAnamnesisService.delete:", error);
      throw new Error(`Gagal menghapus data master Anamnesis.`);
    }
  }

  /**
   * Mengambil SEMUA detail lengkap Anamnesis untuk seluruh riwayat pasien.
   * Ini akan mengembalikan ARRAY dari objek Anamnesis.
   * * @param {number} pasienId - FN_pasien_id
   * @returns {Promise<Array<{ master: Object, allDetails: Array<Object> }>>}
   */
  async getAllFullDetailsByPasienId(pasienId) {
    try {
      // 1. Dapatkan semua ID Anamnesis untuk pasien tersebut
      const anamnesisIds = await this.getAllAnamnesisIdsByPasienId(pasienId);

      if (anamnesisIds.length === 0) {
        return []; // Mengembalikan array kosong jika tidak ada riwayat
      }

      // 2. Mengambil detail lengkap (master + union details) untuk setiap ID secara paralel.
      // Fungsi getFullDetailById(id) yang sudah ada akan dipanggil untuk setiap ID.
      const detailPromises = anamnesisIds.map((id) =>
        this.getFullDetailById(id)
      );
      const allFullDetails = await Promise.all(detailPromises);

      // Filter hasil yang tidak valid dan kembalikan array.
      return allFullDetails.filter((detail) => detail !== null);
    } catch (error) {
      console.error(
        "Error in MasterAnamnesisService.getAllFullDetailsByPasienId:",
        error
      );
      throw new Error(
        `Gagal mengambil seluruh riwayat Anamnesis untuk Pasien ID ${pasienId}.`
      );
    }
  }

  // ===================================================================
  // 🔍 FUNGSI BARU: GET FULL ANAMNESIS DETAIL (FINAL FIX)
  // ===================================================================

  /**
   * Mengambil detail lengkap Anamnesis (Master + Semua Details yang di-JOIN
   * dengan Pertanyaan dan Jawaban) berdasarkan FN_anamnesis_id.
   * @param {number} id - FN_anamnesis_id
   * @returns {Promise<{ master: Object, allDetails: Array<Object> }>}
   */
  async searchAnamnesis(searchTerm) {
    // Menggunakan LIKE '%[keyword]%' untuk pencarian parsial yang fleksibel
    const sql = `
            SELECT
                -- 1. DATA PASIEN
                P.FN_pasien_id,
                P.FS_nama_lengkap AS Pasien_Nama,
                P.FS_no_rm AS Pasien_NoRM,
                
                -- 2. Data Utama Anamnesis
                MA.FN_anamnesis_id,
                MA.FD_tanggal_anamnesis,
                MA.FN_tenaga_kesehatan_id,
                MA.FT_waktu_input,
                
                -- 3. Detail Anamnesis (Hanya Keterangan yang Diambil)
                DK.FS_keterangan AS Keluhan_Keterangan,
                DRP.FS_keterangan AS RiwayatPenyakit_Keterangan,
                DPT.FS_keterangan AS PenyakitTerdahulu_Keterangan,
                DRPO.FS_keterangan AS RiwayatPengobatan_Keterangan,
                DFR.FS_keterangan AS FaktorResiko_Keterangan,
                DRBT.FS_keterangan AS BedahTerapi_Keterangan,
                DPFV.FS_keterangan AS FungsiVisus_Keterangan,
                DPB.FS_keterangan AS Biomikroskopi_Keterangan
                
            FROM
                core.MASTER_ANAMNESIS MA
                
            -- JOIN ke Master Pasien (INNER JOIN karena harus punya Pasien)
            INNER JOIN core.PASIEN_MASTER_PASIEN P ON MA.FN_pasien_id = P.FN_pasien_id
            
            -- JOIN ke Semua Detail Tables
            LEFT JOIN deskripsi.DETAIL_KELUHAN DK ON MA.FN_anamnesis_id = DK.FN_anamnesis_id
            LEFT JOIN deskripsi.DETAIL_RIWAYAT_PENYAKIT DRP ON MA.FN_anamnesis_id = DRP.FN_anamnesis_id
            LEFT JOIN deskripsi.DETAIL_PENYAKIT_TERDAHULU DPT ON MA.FN_anamnesis_id = DPT.FN_anamnesis_id
            LEFT JOIN deskripsi.DETAIL_RIWAYAT_PENGOBATAN DRPO ON MA.FN_anamnesis_id = DRPO.FN_anamnesis_id
            LEFT JOIN deskripsi.DETAIL_FAKTOR_RESIKO DFR ON MA.FN_anamnesis_id = DFR.FN_anamnesis_id
            LEFT JOIN deskripsi.DETAIL_RIWAYAT_BEDAH_TERAPI DRBT ON MA.FN_anamnesis_id = DRBT.FN_anamnesis_id
            LEFT JOIN deskripsi.DETAIL_PEMERIKSAAN_FUNGSI_VISUS DPFV ON MA.FN_anamnesis_id = DPFV.FN_anamnesis_id
            LEFT JOIN deskripsi.DETAIL_PEMERIKSAAN_BIOMIKROSKOPI DPB ON MA.FN_anamnesis_id = DPB.FN_anamnesis_id
            
            WHERE
                -- Filter pencarian di Pasien
                (P.FS_nama_lengkap LIKE @SearchTermWildcard OR P.FS_no_rm LIKE @SearchTermWildcard)
                -- Tambahkan filter detail jika perlu: OR DK.FS_keterangan LIKE @SearchTermWildcard
                
            ORDER BY 
                MA.FD_tanggal_anamnesis DESC;
        `;

    // ⚠️ PENTING: Untuk T-SQL, Anda harus menambahkan wildcard (%) ke parameter
    const searchTermWildcard = "%" + searchTerm + "%";

    try {
      // Asumsi: db.query menggunakan parameterisasi berbasis nama
      const results = await db.query(sql, {
        SearchTermWildcard: searchTermWildcard,
      });
      return results;
    } catch (error) {
      console.error("Error executing searchAnamnesis:", error);
      throw new Error("Gagal mencari data anamnesis.");
    }
  }
  async getFullDetailById(id) {
    try {
      // 1. MASTER ANAMNESIS (dengan Pasien dan Nakes info)
      // Query ini akan mengembalikan data Master Anamnesis, Pasien, dan Nakes.
      const masterQuery = `
            SELECT 
                M.FN_anamnesis_id, M.FD_tanggal_anamnesis, M.FT_waktu_input,
                -- Asumsi nama tabel Pasien dan Nakes
                P.FS_nama_lengkap AS Pasien_Nama, P.FS_no_rm AS Pasien_NoRM,
                N.FS_nama_lengkap AS Nakes_Nama
            FROM core.MASTER_ANAMNESIS M
            LEFT JOIN core.PASIEN_MASTER_PASIEN P ON M.FN_pasien_id = P.FN_pasien_id
            LEFT JOIN core.NAKES_MASTER_TENAGA_KESEHATAN N ON M.FN_tenaga_kesehatan_id = N.FN_tenaga_kesehatan_id
            WHERE M.FN_anamnesis_id = @ID;
        `;

      // 2. Query untuk semua DETAIL TABLES (Semua menggunakan skema deskripsi)
      // Menggunakan UNION ALL untuk menggabungkan semua hasil detail ke dalam satu result set.
      const detailQuery = `
            -- DETAIL_KELUHAN (T1)
            SELECT 
                'KELUHAN' AS Kategori, T1.FN_anamnesis_id, P.FS_pertanyaan, T1.FS_keterangan, J.FS_label AS Jawaban_Label
            FROM deskripsi.DETAIL_KELUHAN T1
            INNER JOIN core.MASTER_PERTANYAAN P ON T1.FN_pertanyaan_id = P.FN_pertanyaan_id
            LEFT JOIN core.MASTER_JAWABAN_TERSTRUKTUR J ON T1.FN_jawaban_id = J.FN_jawaban_id
            WHERE T1.FN_anamnesis_id = @ID
            
            UNION ALL
            
            -- DETAIL_RIWAYAT_PENYAKIT (T2)
            SELECT 
                'RIWAYAT_PENYAKIT' AS Kategori, T2.FN_anamnesis_id, P.FS_pertanyaan, T2.FS_keterangan, J.FS_label AS Jawaban_Label
            FROM deskripsi.DETAIL_RIWAYAT_PENYAKIT T2
            INNER JOIN core.MASTER_PERTANYAAN P ON T2.FN_pertanyaan_id = P.FN_pertanyaan_id
            LEFT JOIN core.MASTER_JAWABAN_TERSTRUKTUR J ON T2.FN_jawaban_id = J.FN_jawaban_id
            WHERE T2.FN_anamnesis_id = @ID

            UNION ALL

            -- DETAIL_PENYAKIT_TERDAHULU (T3)
            SELECT 
                'PENYAKIT_TERDAHULU' AS Kategori, T3.FN_anamnesis_id, P.FS_pertanyaan, T3.FS_keterangan, J.FS_label AS Jawaban_Label
            FROM deskripsi.DETAIL_PENYAKIT_TERDAHULU T3
            INNER JOIN core.MASTER_PERTANYAAN P ON T3.FN_pertanyaan_id = P.FN_pertanyaan_id
            LEFT JOIN core.MASTER_JAWABAN_TERSTRUKTUR J ON T3.FN_jawaban_id = J.FN_jawaban_id
            WHERE T3.FN_anamnesis_id = @ID

            UNION ALL

            -- DETAIL_RIWAYAT_PENGOBATAN (T4)
            SELECT 
                'RIWAYAT_PENGOBATAN' AS Kategori, T4.FN_anamnesis_id, P.FS_pertanyaan, T4.FS_keterangan, J.FS_label AS Jawaban_Label
            FROM deskripsi.DETAIL_RIWAYAT_PENGOBATAN T4
            INNER JOIN core.MASTER_PERTANYAAN P ON T4.FN_pertanyaan_id = P.FN_pertanyaan_id
            LEFT JOIN core.MASTER_JAWABAN_TERSTRUKTUR J ON T4.FN_jawaban_id = J.FN_jawaban_id
            WHERE T4.FN_anamnesis_id = @ID
            
            UNION ALL

            -- DETAIL_FAKTOR_RESIKO (T5)
            SELECT 
                'FAKTOR_RESIKO' AS Kategori, T5.FN_anamnesis_id, P.FS_pertanyaan, T5.FS_keterangan, J.FS_label AS Jawaban_Label
            FROM deskripsi.DETAIL_FAKTOR_RESIKO T5
            INNER JOIN core.MASTER_PERTANYAAN P ON T5.FN_pertanyaan_id = P.FN_pertanyaan_id
            LEFT JOIN core.MASTER_JAWABAN_TERSTRUKTUR J ON T5.FN_jawaban_id = J.FN_jawaban_id
            WHERE T5.FN_anamnesis_id = @ID

            UNION ALL
            
            -- DETAIL_RIWAYAT_BEDAH_TERAPI (T6)
            SELECT 
                'RIWAYAT_BEDAH_TERAPI' AS Kategori, T6.FN_anamnesis_id, P.FS_pertanyaan, T6.FS_keterangan, J.FS_label AS Jawaban_Label
            FROM deskripsi.DETAIL_RIWAYAT_BEDAH_TERAPI T6
            INNER JOIN core.MASTER_PERTANYAAN P ON T6.FN_pertanyaan_id = P.FN_pertanyaan_id
            LEFT JOIN core.MASTER_JAWABAN_TERSTRUKTUR J ON T6.FN_jawaban_id = J.FN_jawaban_id
            WHERE T6.FN_anamnesis_id = @ID

            UNION ALL

            -- DETAIL_PEMERIKSAAN_FUNGSI_VISUS (T7)
            SELECT 
                'PEMERIKSAAN_FUNGSI_VISUS' AS Kategori, T7.FN_anamnesis_id, P.FS_pertanyaan, T7.FS_keterangan, J.FS_label AS Jawaban_Label
            FROM deskripsi.DETAIL_PEMERIKSAAN_FUNGSI_VISUS T7 
            INNER JOIN core.MASTER_PERTANYAAN P ON T7.FN_pertanyaan_id = P.FN_pertanyaan_id
            LEFT JOIN core.MASTER_JAWABAN_TERSTRUKTUR J ON T7.FN_jawaban_id = J.FN_jawaban_id
            WHERE T7.FN_anamnesis_id = @ID

            UNION ALL
            
            -- DETAIL_PEMERIKSAAN_BIOMIKROSKOPI (T8)
            SELECT 
                'PEMERIKSAAN_BIOMIKROSKOPI' AS Kategori, T8.FN_anamnesis_id, P.FS_pertanyaan, T8.FS_keterangan, J.FS_label AS Jawaban_Label
            FROM deskripsi.DETAIL_PEMERIKSAAN_BIOMIKROSKOPI T8
            INNER JOIN core.MASTER_PERTANYAAN P ON T8.FN_pertanyaan_id = P.FN_pertanyaan_id
            LEFT JOIN core.MASTER_JAWABAN_TERSTRUKTUR J ON T8.FN_jawaban_id = J.FN_jawaban_id
            WHERE T8.FN_anamnesis_id = @ID;
        `;

      // Eksekusi kedua query secara paralel untuk kecepatan
      const [masterResult, detailResults] = await Promise.all([
        db.query(masterQuery, { ID: id }),
        db.query(detailQuery, { ID: id }),
      ]);

      const master = masterResult?.[0] || null;
      const allDetails = detailResults || [];

      if (!master) {
        return null;
      }

      return {
        master,
        allDetails,
      };
    } catch (error) {
      console.error(
        "Error in MasterAnamnesisService.getFullDetailById:",
        error
      );
      throw new Error(
        `Gagal mengambil detail lengkap Anamnesis (ID: ${id}). Pesan Error: ${error.message}`
      );
    }
  }

  // ...

  // ===================================================================
  // 🗃️ FUNGSI SINKRONISASI DATA MASTER (Pertanyaan & Jawaban Terstruktur)
  // ===================================================================

  /**
   * Mengambil semua data master yang diperlukan untuk sinkronisasi front-end.
   */
  async getSyncData() {
    try {
      const [questions, structuredAnswers] = await Promise.all([
        this.getAllActiveQuestions(),
        this.getAllStructuredAnswers(),
      ]);

      return { questions, structuredAnswers };
    } catch (error) {
      console.error("Error in MasterAnamnesisService.getSyncData:", error);
      throw new Error("Gagal mengambil data sinkronisasi master.");
    }
  }

  // 🔨 Helper Function: Mengambil Pertanyaan Aktif
  async getAllActiveQuestions() {
    const query = `
            SELECT 
                FN_pertanyaan_id, 
                FS_kategori, 
                FS_pertanyaan, 
                FS_kode_snomed, 
                FS_kode_loinc 
            FROM core.MASTER_PERTANYAAN 
            WHERE FB_aktif = 1 
            ORDER BY FS_kategori, FN_pertanyaan_id;
        `;
    const questions = await db.query(query);
    return questions || [];
  }

  // 🔨 Helper Function: Mengambil Semua Jawaban Terstruktur Aktif
  async getAllStructuredAnswers() {
    const query = `
            SELECT 
                FN_jawaban_id, 
                FN_pertanyaan_id, 
                FS_label, 
                FN_snomed_id, 
                FS_loinc_id, 
                FS_definisi,
                FS_level
            FROM core.MASTER_JAWABAN_TERSTRUKTUR 
            WHERE FB_aktif = 1
            ORDER BY FN_pertanyaan_id, FN_jawaban_id;
        `;
    const answers = await db.query(query);
    return answers || [];
  }

  // --- 5. READ All Pertanyaan Aktif (Legacy/Individual Read) ---
  async getMasterPertanyaan() {
    return this.getAllActiveQuestions();
  }
}

export default new MasterAnamnesisService();
