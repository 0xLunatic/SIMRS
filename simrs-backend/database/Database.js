// database/Database.js
import sql from "mssql";

class Database {
  constructor() {
    this.config = {
      user: "development",
      password: "fauzanqwe123",
      server: "127.0.0.1",
      database: "SIMRS_PKU_Muhammadiyah",
      options: {
        encrypt: false,
        trustServerCertificate: true,
      },
      port: 1433,
    };
    this.pool = null;
  }

  // ✅ Inisialisasi koneksi
  async connect() {
    if (this.pool) return this.pool; // gunakan koneksi yang sudah ada

    try {
      this.pool = await sql.connect(this.config);
      console.log("✅ Koneksi SQL Server berhasil (via class Database)");
      return this.pool;
    } catch (err) {
      console.error("❌ Gagal koneksi ke SQL Server:", err.message);
      throw err;
    }
  }

  // 📊 Jalankan query (dengan optional parameter)
  async query(queryString, params = {}) {
    const pool = await this.connect();
    const request = pool.request();

    // Tambahkan parameter kalau ada
    for (const [key, value] of Object.entries(params)) {
      request.input(key, value);
    }

    try {
      const result = await request.query(queryString);
      return result.recordset;
    } catch (err) {
      console.error("❌ Error saat menjalankan query:", err.message);
      throw err;
    }
  }

  // ❎ Tutup koneksi
  async close() {
    if (this.pool) {
      await this.pool.close();
      console.log("🔒 Koneksi SQL Server ditutup.");
      this.pool = null;
    }
  }
}

// export singleton instance
const db = new Database();
export default db;
