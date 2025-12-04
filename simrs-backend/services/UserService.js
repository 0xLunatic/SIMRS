import bcrypt from "bcrypt";
import db from "../database/Database.js"; // asumsi mssql connection

const userService = {
  // 🔑 Kolom dasar yang diambil dari tabel USERS
  BASE_COLUMNS: `
    FN_user_id, FS_username, FS_password_hash, FS_nama_lengkap, FS_role, 
    FB_aktif, FD_created_at, FD_updated_at,
    -- Tambahkan kolom referensi Nakes ID:
    FN_tenaga_kesehatan_id 
  `,

  // 🔍 Ambil semua user
  async getAll() {
    return await db.query(
      `SELECT ${this.BASE_COLUMNS} FROM core.USERS ORDER BY FN_user_id DESC`
    );
  },

  // 🔍 Ambil satu user by ID
  async getById(id) {
    const userId = parseInt(id, 10);
    if (isNaN(userId)) return null;

    const result = await db.query(
      `SELECT ${this.BASE_COLUMNS} FROM core.USERS WHERE FN_user_id = @id`,
      { id: userId }
    );
    return result.length > 0 ? result[0] : null;
  },

  // 🔍 Cari user aktif berdasarkan username
  async findByUsername(username) {
    const result = await db.query(
      `SELECT ${this.BASE_COLUMNS} FROM core.USERS WHERE FS_username = @username`,
      { username }
    );
    return result.length > 0 ? result[0] : null;
  },

  // 🔑 Verifikasi password
  async verifyPassword(password, hash) {
    return await bcrypt.compare(password, hash);
  },

  // ➕ Tambah user baru (Sinkron dengan FN_tenaga_kesehatan_id)
  async create({
    username,
    password,
    nama_lengkap,
    role,
    aktif = 1,
    tenaga_kesehatan_id = null,
  }) {
    const hash = await bcrypt.hash(password, 10);

    // Penanganan Nakes ID: Pastikan null dikirim jika nilai 0 atau kosong
    const nakesId =
      tenaga_kesehatan_id === 0 || tenaga_kesehatan_id === ""
        ? null
        : tenaga_kesehatan_id;

    await db.query(
      `INSERT INTO core.USERS (
        FS_username, FS_password_hash, FS_nama_lengkap, FS_role, FB_aktif, FN_tenaga_kesehatan_id
      )
      VALUES (
        @username, @hash, @nama_lengkap, @role, @aktif, @nakesId
      )`,
      {
        username,
        hash,
        nama_lengkap,
        role,
        aktif,
        nakesId,
      }
    );
    return { message: "User berhasil dibuat" };
  },

  // ✏️ Update user (Perbaikan Logika untuk Update Parsial)
  async update(id, payload = {}) {
    // Menggunakan payload = {} untuk menghindari error jika tidak ada payload
    const userId = parseInt(id, 10);

    // Destructuring dari payload
    const { nama_lengkap, role, aktif, tenaga_kesehatan_id } = payload;

    let setClauses = [];
    let params = { userId };

    // 1. Update FS_nama_lengkap
    if (nama_lengkap !== undefined) {
      setClauses.push("FS_nama_lengkap = @nama_lengkap");
      params.nama_lengkap = nama_lengkap;
    }

    // 2. Update FS_role
    if (role !== undefined) {
      setClauses.push("FS_role = @role");
      params.role = role;
    }

    // 3. Update FB_aktif (Bit)
    if (aktif !== undefined) {
      const aktifBit = aktif ? 1 : 0;
      setClauses.push("FB_aktif = @aktif");
      params.aktif = aktifBit;
    }

    // 4. Update FN_tenaga_kesehatan_id (Sinkron: menerima null, 0, atau ID)
    if (tenaga_kesehatan_id !== undefined) {
      setClauses.push("FN_tenaga_kesehatan_id = @tenaga_kesehatan_id");

      let nakesIdUpdate = null;
      // Konversi string/number ke integer atau null
      const nakesVal = String(tenaga_kesehatan_id);

      // Hanya set ID jika nilai > 0
      if (nakesVal && Number(nakesVal) > 0) {
        nakesIdUpdate = Number(nakesVal);
      }
      // Nilai 0, null, atau string kosong akan menjadi null di DB.
      params.tenaga_kesehatan_id = nakesIdUpdate;
    }

    // 🔥 PENTING: Pengecekan untuk mencegah UPDATE tanpa SET clause.
    if (setClauses.length === 0) {
      throw new Error("Tidak ada field untuk diupdate");
    }

    const sql = `
    UPDATE core.USERS
    SET ${setClauses.join(", ")},
        FD_updated_at = SYSDATETIME()
    WHERE FN_user_id = @userId
    `;

    await db.query(sql, params);
    return { message: "User berhasil diperbarui" };
  },

  // 🔐 Ganti password
  async changePassword(id, newPassword) {
    const hash = await bcrypt.hash(newPassword, 10);
    const userId = parseInt(id, 10);

    await db.query(
      `UPDATE core.USERS
        SET FS_password_hash = @hash,
            FD_updated_at = SYSDATETIME()
        WHERE FN_user_id = @id`,
      { id: userId, hash }
    );
    return { message: "Password berhasil diganti" };
  },

  // 🗑️ Hapus user
  remove: async (id) => {
    const userId = parseInt(id, 10);
    if (isNaN(userId)) throw new Error("ID user tidak valid.");

    await db.query(
      `
    DELETE FROM core.USERS
    WHERE FN_user_id = @id
    `,
      { id: userId }
    );

    // DBCC CHECKIDENT (Khusus SQL Server untuk reset auto-increment)
    await db.query(
      `
    IF EXISTS (
      SELECT 1
      FROM sys.identity_columns
      WHERE [object_id] = OBJECT_ID('core.USERS')
        AND [name] = 'FN_user_id'
    )
    DBCC CHECKIDENT('core.USERS', RESEED, @newSeed)
    `,
      { newSeed: userId - 1 }
    );

    return { message: "User dihapus dan auto-increment disesuaikan" };
  },

  // 🆕 Ambil data Tenaga Kesehatan berdasarkan ID Nakes
  async getTenagaKesehatanById(nakesId) {
    const id = parseInt(nakesId, 10);
    if (isNaN(id) || id <= 0) return null;

    const columns = `
      FN_tenaga_kesehatan_id, FS_nama_lengkap, FS_gelar_depan, FS_gelar_belakang, 
      FS_nomor_str, FD_tanggal_terbit_str, FD_tanggal_kadaluwarsa_str,
      FS_spesialisasi_kode, FS_profesi_kode, FS_no_telepon, FS_email,
      FB_aktif
    `;

    const result = await db.query(
      `SELECT ${columns} 
        FROM MASTER_TENAGA_KESEHATAN 
        WHERE FN_tenaga_kesehatan_id = @id AND FB_aktif = 1`,
      { id }
    );
    return result.length > 0 ? result[0] : null;
  },
};

export default userService;
