// services/PasienService.js
import db from "../database/Database.js";

const pasienService = {
  // ==========================================================
  // GET ALL PASIEN + JOIN ALAMAT, CARA DATANG, DAN DESKRIPSI
  // ==========================================================

  getAll: async () => {
    const query = `
      SELECT 
        p.FN_pasien_id,
        p.FN_alamat_id,
        p.FS_no_rm,
        p.FS_nik,
        p.FS_nama_lengkap,
        p.FS_nama_panggilan,
        p.FS_gelar_depan,
        p.FS_gelar_belakang,
        p.FD_tanggal_lahir,
        p.FS_tempat_lahir,
        p.FS_golongan_darah,
        p.FS_telepon,
        p.FS_email,
        p.FS_kontak_darurat_nama,
        p.FS_kontak_darurat_telp,
        p.FB_aktif,
        p.FN_cara_datang_id, -- 💡 Kolom Baru
        
        -- Alamat lengkap
        CONCAT(
          al.FS_alamat_lengkap, ', ',
          al.FS_desa_kelurahan, ', ',
          al.FS_kecamatan, ', ',
          al.FS_kabupaten_kota, ', ',
          al.FS_provinsi, ' ',
          al.FS_kode_pos
        ) AS alamat_lengkap,

        -- Deskripsi tambahan
        cd.FS_nama_cara_datang AS cara_datang, -- 💡 Deskripsi Cara Datang
        jk.FS_deskripsi AS jenis_kelamin,
        st.FS_deskripsi AS status_perkawinan,
        ag.FS_deskripsi AS agama,
        pk.FS_nama_pekerjaan AS pekerjaan

      FROM core.PASIEN_MASTER_PASIEN p
      LEFT JOIN core.MASTER_ALAMAT al 
        ON p.FN_alamat_id = al.FN_alamat_id
      LEFT JOIN core.PASIEN_MASTER_CARA_DATANG cd -- 💡 JOIN Cara Datang
        ON p.FN_cara_datang_id = cd.FN_cara_datang_id
      LEFT JOIN deskripsi.DESKRIPSI_JENIS_KELAMIN jk 
        ON p.FS_jenis_kelamin_kode = jk.FS_kode_jenis_kelamin
      LEFT JOIN deskripsi.DESKRIPSI_STATUS_PERKAWINAN st 
        ON p.FS_status_perkawinan_kode = st.FS_kode_status_perkawinan
      LEFT JOIN deskripsi.DESKRIPSI_AGAMA ag 
        ON p.FS_agama_kode = ag.FS_kode_agama
      LEFT JOIN deskripsi.DESKRIPSI_PEKERJAAN pk 
        ON p.FS_pekerjaan_kode = pk.FS_kode_pekerjaan

      WHERE p.FB_aktif = 1
      ORDER BY p.FN_pasien_id ASC
    `;
    return await db.query(query);
  },
  /**
   * Mencari pasien berdasarkan nama atau nomor RM.
   * @param {string} keyword - Kata kunci pencarian
   * @returns {Promise<Array<Object>>}
   */
  async searchPasien(keyword) {
    try {
      // Mencegah SQL Injection dan membuat keyword siap untuk LIKE
      const searchPattern = `%${keyword}%`;

      const query = `
                SELECT 
                    FN_pasien_id, 
                    FS_nama_lengkap, 
                    FS_no_rm,
                    FD_tanggal_lahir,
                    FS_jenis_kelamin_kode
                FROM core.PASIEN_MASTER_PASIEN 
                WHERE 
                    FS_nama_lengkap LIKE @SearchPattern OR 
                    FS_no_rm LIKE @SearchPattern
                ORDER BY FS_nama_lengkap
            `;

      const result = await db.query(query, {
        SearchPattern: searchPattern,
      });

      return result || [];
    } catch (error) {
      console.error("Error in PasienService.searchPasien:", error);
      throw new Error("Gagal mencari data pasien.");
    }
  },

  // ==========================================================
  // GET BY ID (DENGAN DETAIL ALAMAT DAN CARA DATANG)
  // ==========================================================
  getById: async (id) => {
    const query = `
      SELECT 
        p.*,
        cd.FS_nama_cara_datang AS cara_datang, -- 💡 Deskripsi Cara Datang
        al.FS_alamat_lengkap,
        al.FS_desa_kelurahan,
        al.FS_kecamatan,
        al.FS_kabupaten_kota,
        al.FS_provinsi,
        al.FS_kode_pos,
        al.FS_kode_wilayah_bps,
        al.FS_tipe_alamat
      FROM core.PASIEN_MASTER_PASIEN p
      LEFT JOIN core.MASTER_ALAMAT al
        ON p.FN_alamat_id = al.FN_alamat_id
      LEFT JOIN core.PASIEN_MASTER_CARA_DATANG cd -- 💡 JOIN Cara Datang
        ON p.FN_cara_datang_id = cd.FN_cara_datang_id
      WHERE p.FN_pasien_id = @id
    `;
    const result = await db.query(query, { id });
    return result[0];
  },

  // ==========================================================
  // CREATE PASIEN + ALAMAT (FN_cara_datang_id ditambahkan)
  // ==========================================================
  create: async (data) => {
    const {
      FS_no_rm,
      FS_nik,
      FS_nama_lengkap,
      FS_jenis_kelamin_kode,
      FD_tanggal_lahir,
      FS_tempat_lahir,
      FS_status_perkawinan_kode,
      FS_agama_kode,
      FS_pekerjaan_kode,
      FS_golongan_darah,
      FS_telepon,
      FS_email,
      FS_kontak_darurat_nama,
      FS_kontak_darurat_telp,
      FN_cara_datang_id, // 💡 Kolom Baru
      // Alamat
      FS_alamat_lengkap,
      FS_desa_kelurahan,
      FS_kecamatan,
      FS_kabupaten_kota,
      FS_provinsi,
      FS_kode_pos,
      FS_kode_wilayah_bps,
      FS_tipe_alamat,
    } = data;

    // 1️⃣ Insert alamat
    const insertAlamatQuery = `
      INSERT INTO core.MASTER_ALAMAT (
        FS_alamat_lengkap, FS_desa_kelurahan, FS_kecamatan, FS_kabupaten_kota,
        FS_provinsi, FS_kode_pos, FS_kode_wilayah_bps, FS_tipe_alamat
      )
      OUTPUT INSERTED.FN_alamat_id
      VALUES (
        @FS_alamat_lengkap, @FS_desa_kelurahan, @FS_kecamatan, @FS_kabupaten_kota,
        @FS_provinsi, @FS_kode_pos, @FS_kode_wilayah_bps, @FS_tipe_alamat
      )
    `;
    const alamatResult = await db.query(insertAlamatQuery, {
      FS_alamat_lengkap,
      FS_desa_kelurahan,
      FS_kecamatan,
      FS_kabupaten_kota,
      FS_provinsi,
      FS_kode_pos,
      FS_kode_wilayah_bps,
      FS_tipe_alamat,
    });

    const alamatId = alamatResult[0]?.FN_alamat_id;
    if (!alamatId) throw new Error("Gagal membuat data alamat.");

    // 2️⃣ Insert pasien
    const insertPasienQuery = `
      INSERT INTO core.PASIEN_MASTER_PASIEN (
        FS_no_rm, FS_nik, FS_nama_lengkap, FS_jenis_kelamin_kode, 
        FD_tanggal_lahir, FS_tempat_lahir,
        FS_status_perkawinan_kode, FS_agama_kode, FS_pekerjaan_kode,
        FS_golongan_darah, FS_telepon, FS_email, 
        FS_kontak_darurat_nama, FS_kontak_darurat_telp,
        FN_alamat_id, FN_cara_datang_id, -- 💡 Kolom Baru
        FB_aktif, FD_created_at, FD_updated_at
      )
      OUTPUT INSERTED.FN_pasien_id
      VALUES (
        @FS_no_rm, @FS_nik, @FS_nama_lengkap, @FS_jenis_kelamin_kode, 
        @FD_tanggal_lahir, @FS_tempat_lahir,
        @FS_status_perkawinan_kode, @FS_agama_kode, @FS_pekerjaan_kode,
        @FS_golongan_darah, @FS_telepon, @FS_email,
        @FS_kontak_darurat_nama, @FS_kontak_darurat_telp,
        @FN_alamat_id, @FN_cara_datang_id, -- 💡 Value Baru
        1, GETDATE(), GETDATE()
      )
    `;

    const pasienResult = await db.query(insertPasienQuery, {
      FS_no_rm,
      FS_nik,
      FS_nama_lengkap,
      FS_jenis_kelamin_kode,
      FD_tanggal_lahir,
      FS_tempat_lahir,
      FS_status_perkawinan_kode,
      FS_agama_kode,
      FS_pekerjaan_kode,
      FS_golongan_darah,
      FS_telepon,
      FS_email,
      FS_kontak_darurat_nama,
      FS_kontak_darurat_telp,
      FN_alamat_id: alamatId,
      FN_cara_datang_id: FN_cara_datang_id, // 💡 Passing Value Baru
    });

    return {
      success: true,
      message: "Pasien dan alamat berhasil ditambahkan",
      pasien_id: pasienResult[0]?.FN_pasien_id,
      alamat_id: alamatId,
    };
  },

  // ==========================================================
  // UPDATE PASIEN + ALAMAT TERKAIT (FN_cara_datang_id ditambahkan)
  // ==========================================================
  update: async (id, data) => {
    try {
      // 🔍 Ambil FN_alamat_id pasien
      const getAlamatQuery = `
      SELECT FN_alamat_id 
      FROM core.PASIEN_MASTER_PASIEN 
      WHERE FN_pasien_id = @id
    `;
      const result = await db.query(getAlamatQuery, { id });
      const alamatId = result[0]?.FN_alamat_id;

      if (!alamatId)
        throw new Error("Alamat untuk pasien ini tidak ditemukan.");

      // 🔹 Pisahkan field pasien dan alamat
      const pasienFields = [
        "FS_no_rm",
        "FS_nik",
        "FS_nama_lengkap",
        "FS_nama_panggilan",
        "FS_gelar_depan",
        "FS_gelar_belakang",
        "FS_jenis_kelamin_kode",
        "FD_tanggal_lahir",
        "FS_tempat_lahir",
        "FS_status_perkawinan_kode",
        "FS_agama_kode",
        "FS_pekerjaan_kode",
        "FS_golongan_darah",
        "FS_telepon",
        "FS_email",
        "FS_kontak_darurat_nama",
        "FS_kontak_darurat_telp",
        "FN_cara_datang_id", // 💡 Kolom Baru
      ];

      const alamatFields = [
        "FS_alamat_lengkap",
        "FS_desa_kelurahan",
        "FS_kecamatan",
        "FS_kabupaten_kota",
        "FS_provinsi",
        "FS_kode_pos",
        "FS_kode_wilayah_bps",
        "FS_tipe_alamat",
      ];

      // 🧠 Buat SET dinamis untuk pasien
      const pasienUpdates = pasienFields
        .filter((key) => data[key] !== undefined)
        .map((key) => `${key} = @${key}`)
        .join(", ");

      const pasienParams = {};
      pasienFields.forEach((key) => {
        if (data[key] !== undefined) pasienParams[key] = data[key];
      });
      pasienParams.id = id;

      // 🧠 Buat SET dinamis untuk alamat
      const alamatUpdates = alamatFields
        .filter((key) => data[key] !== undefined)
        .map((key) => `${key} = @${key}`)
        .join(", ");

      const alamatParams = {};
      alamatFields.forEach((key) => {
        if (data[key] !== undefined) alamatParams[key] = data[key];
      });
      alamatParams.alamatId = alamatId;

      // 🔸 Jalankan update pasien
      if (pasienUpdates) {
        await db.query(
          `
        UPDATE core.PASIEN_MASTER_PASIEN
        SET ${pasienUpdates}, FD_updated_at = GETDATE()
        WHERE FN_pasien_id = @id
        `,
          pasienParams
        );
      }

      // 🔸 Jalankan update alamat
      if (alamatUpdates) {
        await db.query(
          `
        UPDATE core.MASTER_ALAMAT
        SET ${alamatUpdates}
        WHERE FN_alamat_id = @alamatId
        `,
          alamatParams
        );
      }

      return {
        success: true,
        message: "Data pasien dan alamat berhasil diperbarui.",
      };
    } catch (error) {
      console.error("❌ Gagal update pasien:", error);
      throw error;
    }
  },

  // ==========================================================
  // DELETE PASIEN + HAPUS ALAMAT
  // ==========================================================
  remove: async (id) => {
    const getAlamatQuery = `
      SELECT FN_alamat_id 
      FROM core.PASIEN_MASTER_PASIEN 
      WHERE FN_pasien_id = @id
    `;
    const result = await db.query(getAlamatQuery, { id });
    const alamatId = result[0]?.FN_alamat_id;

    await db.query(
      `DELETE FROM core.PASIEN_MASTER_PASIEN WHERE FN_pasien_id = @id`,
      { id }
    );

    if (alamatId) {
      await db.query(
        `DELETE FROM core.MASTER_ALAMAT WHERE FN_alamat_id = @alamatId`,
        { alamatId }
      );
    }

    await db.query(`
      DECLARE @maxId INT;
      SELECT @maxId = ISNULL(MAX(FN_pasien_id), 0) FROM core.PASIEN_MASTER_PASIEN;
      DBCC CHECKIDENT ('core.PASIEN_MASTER_PASIEN', RESEED, @maxId);
    `);

    return {
      success: true,
      message: "Pasien dan alamat berhasil dihapus dan reseed ID diperbarui.",
    };
  },
};

export default pasienService;
