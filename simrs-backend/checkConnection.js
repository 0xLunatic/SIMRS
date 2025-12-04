const sql = require("mssql");

const config = {
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

(async () => {
  try {
    await sql.connect(config);
    console.log("✅ Koneksi berhasil ke SQL Server dengan user development");

    const result = await sql.query`SELECT TOP 5 * FROM NamaTabelKamu`;
    console.log(result.recordset);
  } catch (err) {
    console.error("❌ Error koneksi:", err);
  }
})();
