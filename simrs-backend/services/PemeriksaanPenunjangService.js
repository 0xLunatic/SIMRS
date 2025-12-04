import db from "../database/Database.js";

class PemeriksaanPenunjangService {
  // 🟢 CREATE NEW DATA (OPTIMIZED: SINGLE BATCH QUERY)
  async createPemeriksaan(data) {
    const { master, detail, type } = data; // type: 'BIOMETRI', 'BSCAN', 'LAB'

    // 1. Siapkan Parameter Gabungan
    // Kita gabung semua param master & detail jadi satu object agar dikirim sekali jalan
    const params = {
      pasienId: master.FN_pasien_id,
      nakesId: master.FN_tenaga_kesehatan_id,
      tanggal: master.FD_tanggal_pemeriksaan,
      isFinal: master.FB_is_final ? 1 : 0,
      // Spread detail params
      ...detail,
    };

    // 2. Tentukan Bagian Query Detail Berdasarkan Tipe
    let detailInsertQuery = "";

    if (type === "BIOMETRI") {
      detailInsertQuery = `
        INSERT INTO deskripsi.DETAIL_BIOMETRI 
        (FN_pemeriksaan_penunjang_id, FN_loinc_id, FS_panjang_aksial, FS_kekuatan_iol, FS_indikasi, FS_hasil_temuan, FS_keterangan_tambahan)
        VALUES 
        (@NewId, @loincId, @panjangAksial, @kekuatanIol, @indikasi, @hasil, @keterangan);
      `;
    } else if (type === "BSCAN") {
      detailInsertQuery = `
        INSERT INTO deskripsi.DETAIL_BSCAN_ULTRASOUND 
        (FN_pemeriksaan_penunjang_id, FN_loinc_id, FS_indikasi, FS_hasil_temuan, FS_keterangan_tambahan)
        VALUES 
        (@NewId, @loincId, @indikasi, @hasil, @keterangan);
      `;
    } else if (type === "LAB") {
      detailInsertQuery = `
        INSERT INTO deskripsi.DETAIL_LAB_PRA_BEDAH 
        (FN_pemeriksaan_penunjang_id, FN_loinc_id, FS_glukosa, FS_leukosit, FS_waktu_koagulasi)
        VALUES 
        (@NewId, @loincId, @glukosa, @leukosit, @koagulasi);
      `;
    } else {
      throw new Error("Tipe pemeriksaan tidak valid");
    }

    // 3. RAKIT QUERY UTAMA (TRANSAKSI SQL)
    // Menggunakan BEGIN TRY...CATCH di level SQL untuk keamanan data
    const fullQuery = `
      BEGIN TRANSACTION;
      BEGIN TRY
          -- A. Insert Master
          INSERT INTO core.MASTER_PEMERIKSAAN_PENUNJANG 
          (FN_pasien_id, FN_tenaga_kesehatan_id, FD_tanggal_pemeriksaan, FB_is_final)
          VALUES 
          (@pasienId, @nakesId, @tanggal, @isFinal);

          -- B. Ambil ID yang baru saja dibuat
          DECLARE @NewId INT = SCOPE_IDENTITY();

          -- C. Insert Detail (Query Dinamis dari variable JS di atas)
          ${detailInsertQuery}

          -- D. Jika sukses sampai sini, Commit (Simpan Permanen)
          COMMIT TRANSACTION;

          -- E. Kembalikan ID ke Node.js
          SELECT @NewId AS id;
      END TRY
      BEGIN CATCH
          -- F. Jika ada error di tengah jalan, batalkan SEMUANYA
          ROLLBACK TRANSACTION;
          
          -- Lempar error asli SQL ke Node.js
          DECLARE @ErrorMessage NVARCHAR(4000) = ERROR_MESSAGE();
          RAISERROR (@ErrorMessage, 16, 1);
      END CATCH
    `;

    // 4. Eksekusi Sekali Jalan
    const result = await db.query(fullQuery, params);

    if (!result || result.length === 0) {
      throw new Error("Gagal menyimpan data (Tidak ada ID yang dikembalikan).");
    }

    const newId = result[0].id;
    console.log(
      `✅ Transaction Success. Master & Detail created with ID: ${newId}`
    );

    return { success: true, id: newId, type: type };
  }

  // 🔵 GET HISTORY (Sama seperti sebelumnya, query read jarang RTO)
  // 🔵 GET HISTORY (OPTIMIZED: ANTI-LOCKING)
  async getHistoryByPasien(pasienId) {
    // KUNCI PERBAIKAN: Tambahkan WITH (NOLOCK) di setiap tabel.
    // Ini mencegah query menunggu (wait) jika ada transaksi insert/update yang sedang berjalan.
    const query = `
      SELECT 
        m.FN_pemeriksaan_penunjang_id,
        m.FD_tanggal_pemeriksaan,
        m.FB_is_final,
        
        -- Deteksi Tipe (Logic tetap sama)
        CASE 
          WHEN bio.FN_biometri_id IS NOT NULL THEN 'BIOMETRI'
          WHEN bscan.FN_bscan_id IS NOT NULL THEN 'BSCAN'
          WHEN lab.FN_lab_id IS NOT NULL THEN 'LAB'
          ELSE 'UNKNOWN'
        END as tipe_pemeriksaan,

        -- Ambil kolom spesifik saja (Ringan)
        bio.FS_panjang_aksial, 
        bio.FS_kekuatan_iol,
        bscan.FS_hasil_temuan as hasil_bscan,
        lab.FS_glukosa, 
        lab.FS_leukosit

      FROM core.MASTER_PEMERIKSAAN_PENUNJANG m WITH (NOLOCK) -- 👈 PENTING!
      
      LEFT JOIN deskripsi.DETAIL_BIOMETRI bio WITH (NOLOCK) 
        ON m.FN_pemeriksaan_penunjang_id = bio.FN_pemeriksaan_penunjang_id
      
      LEFT JOIN deskripsi.DETAIL_BSCAN_ULTRASOUND bscan WITH (NOLOCK) 
        ON m.FN_pemeriksaan_penunjang_id = bscan.FN_pemeriksaan_penunjang_id
      
      LEFT JOIN deskripsi.DETAIL_LAB_PRA_BEDAH lab WITH (NOLOCK) 
        ON m.FN_pemeriksaan_penunjang_id = lab.FN_pemeriksaan_penunjang_id
      
      WHERE m.FN_pasien_id = @pasienId
      ORDER BY m.FD_tanggal_pemeriksaan DESC
    `;

    // Kita gunakan try-catch level function agar errornya jelas
    try {
      const result = await db.query(query, { pasienId });
      return result;
    } catch (error) {
      console.error("❌ Error Get History:", error.message);
      throw new Error("Gagal mengambil riwayat pemeriksaan.");
    }
  }

  // 🟡 GET DROPDOWN
  async getMasterLoinc(category) {
    let query =
      "SELECT FN_loinc_id, FS_kode_loinc, FS_deskripsi FROM core.MASTER_LOINC WHERE FB_aktif = 1";
    const params = {};
    if (category) {
      query += " AND FS_kategori_aplikasi = @category";
      params.category = category;
    }
    return await db.query(query, params);
  }
  async searchPasien(keyword) {
    if (!keyword || keyword.length < 3) {
      return []; // Hemat resource, jangan cari kalau kependekan
    }

    // Menggunakan TOP 10 agar tidak berat
    // Menggunakan WITH (NOLOCK) agar pencarian cepat dan tidak kena locking
    const query = `
      SELECT TOP 10 
        FN_pasien_id, 
        FS_nama_lengkap, 
        FS_no_rm 
      FROM core.PASIEN_MASTER_PASIEN WITH (NOLOCK)
      WHERE FS_nama_lengkap LIKE @keyword
      ORDER BY FS_nama_lengkap ASC
    `;

    try {
      const results = await db.query(query, { keyword: `%${keyword}%` });
      return results;
    } catch (error) {
      console.error("❌ Error Search Pasien:", error.message);
      throw new Error("Gagal mencari data pasien.");
    }
  }
  // 🔴 DELETE DATA (Transactional)
  async deletePemeriksaan(id) {
    // Kita hapus dari semua kemungkinan tabel detail dulu, baru master
    const query = `
      BEGIN TRANSACTION;
      BEGIN TRY
          -- 1. Hapus Detail (Coba hapus di semua tabel detail yg punya ID ini)
          DELETE FROM deskripsi.DETAIL_BIOMETRI WHERE FN_pemeriksaan_penunjang_id = @id;
          DELETE FROM deskripsi.DETAIL_BSCAN_ULTRASOUND WHERE FN_pemeriksaan_penunjang_id = @id;
          DELETE FROM deskripsi.DETAIL_LAB_PRA_BEDAH WHERE FN_pemeriksaan_penunjang_id = @id;

          -- 2. Hapus Master
          DELETE FROM core.MASTER_PEMERIKSAAN_PENUNJANG WHERE FN_pemeriksaan_penunjang_id = @id;

          COMMIT TRANSACTION;
      END TRY
      BEGIN CATCH
          ROLLBACK TRANSACTION;
          THROW;
      END CATCH
    `;
    return await db.query(query, { id });
  }

  // 🟠 UPDATE DATA
  async updatePemeriksaan(id, data) {
    const { master, detail, type } = data;

    // 1. Update Master
    // 2. Update Detail (Sesuai Tipe)

    let detailUpdateQuery = "";

    if (type === "BIOMETRI") {
      detailUpdateQuery = `
        UPDATE deskripsi.DETAIL_BIOMETRI SET 
          FN_loinc_id = @loincId,
          FS_panjang_aksial = @panjangAksial,
          FS_kekuatan_iol = @kekuatanIol,
          FS_indikasi = @indikasi,
          FS_hasil_temuan = @hasil,
          FS_keterangan_tambahan = @keterangan
        WHERE FN_pemeriksaan_penunjang_id = @id;
      `;
    } else if (type === "BSCAN") {
      detailUpdateQuery = `
        UPDATE deskripsi.DETAIL_BSCAN_ULTRASOUND SET 
          FN_loinc_id = @loincId,
          FS_indikasi = @indikasi,
          FS_hasil_temuan = @hasil,
          FS_keterangan_tambahan = @keterangan
        WHERE FN_pemeriksaan_penunjang_id = @id;
      `;
    } else if (type === "LAB") {
      detailUpdateQuery = `
        UPDATE deskripsi.DETAIL_LAB_PRA_BEDAH SET 
          FN_loinc_id = @loincId,
          FS_glukosa = @glukosa,
          FS_leukosit = @leukosit,
          FS_waktu_koagulasi = @koagulasi
        WHERE FN_pemeriksaan_penunjang_id = @id;
      `;
    }

    const fullQuery = `
      BEGIN TRANSACTION;
      BEGIN TRY
          -- A. Update Master
          UPDATE core.MASTER_PEMERIKSAAN_PENUNJANG SET 
            FN_tenaga_kesehatan_id = @nakesId,
            FD_tanggal_pemeriksaan = @tanggal,
            FB_is_final = @isFinal
          WHERE FN_pemeriksaan_penunjang_id = @id;

          -- B. Update Detail
          ${detailUpdateQuery}

          COMMIT TRANSACTION;
      END TRY
      BEGIN CATCH
          ROLLBACK TRANSACTION;
          THROW;
      END CATCH
    `;

    const params = {
      id,
      nakesId: master.FN_tenaga_kesehatan_id,
      tanggal: master.FD_tanggal_pemeriksaan,
      isFinal: master.FB_is_final ? 1 : 0,
      ...detail,
    };

    return await db.query(fullQuery, params);
  }

  // 🔵 GET SINGLE (Untuk Edit Form)
  async getPemeriksaanById(id) {
    const query = `
      SELECT 
        m.*,
        -- BIOMETRI
        bio.FN_loinc_id as bio_loinc, bio.FS_panjang_aksial, bio.FS_kekuatan_iol, bio.FS_indikasi as bio_indikasi, bio.FS_hasil_temuan as bio_hasil, bio.FS_keterangan_tambahan as bio_ket,
        -- BSCAN
        bscan.FN_loinc_id as bscan_loinc, bscan.FS_indikasi as bscan_indikasi, bscan.FS_hasil_temuan as bscan_hasil, bscan.FS_keterangan_tambahan as bscan_ket,
        -- LAB
        lab.FN_loinc_id as lab_loinc, lab.FS_glukosa, lab.FS_leukosit, lab.FS_waktu_koagulasi
      FROM core.MASTER_PEMERIKSAAN_PENUNJANG m WITH (NOLOCK)
      LEFT JOIN deskripsi.DETAIL_BIOMETRI bio WITH (NOLOCK) ON m.FN_pemeriksaan_penunjang_id = bio.FN_pemeriksaan_penunjang_id
      LEFT JOIN deskripsi.DETAIL_BSCAN_ULTRASOUND bscan WITH (NOLOCK) ON m.FN_pemeriksaan_penunjang_id = bscan.FN_pemeriksaan_penunjang_id
      LEFT JOIN deskripsi.DETAIL_LAB_PRA_BEDAH lab WITH (NOLOCK) ON m.FN_pemeriksaan_penunjang_id = lab.FN_pemeriksaan_penunjang_id
      WHERE m.FN_pemeriksaan_penunjang_id = @id
    `;
    return await db.query(query, { id });
  }
  // 🟡 GET DROPDOWN MASTER LOINC
  async getMasterLoinc(category) {
    let query =
      "SELECT FN_loinc_id, FS_kode_loinc, FS_deskripsi FROM core.MASTER_LOINC WHERE FB_aktif = 1";
    let params = {};

    if (category) {
      // Filter berdasarkan kolom kategori di database (BIOMETRI, LAB, BSCAN)
      query += " AND FS_kategori_aplikasi = @category";
      params.category = category;
    }

    return await db.query(query, params);
  }
}

export default new PemeriksaanPenunjangService();
