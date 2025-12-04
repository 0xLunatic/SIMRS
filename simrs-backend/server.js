// server.js
import express from "express";
import cors from "cors";
import bodyParser from "body-parser";

import snomedRoutes from "./routes/SnomedRoutes.js";
import pasienRoutes from "./routes/PasienRoutes.js";
import masterRoutes from "./routes/MasterUserRoutes.js";
import userRoutes from "./routes/UserRoutes.js";
import NakesRoutes from "./routes/NakesRoutes.js";
import caraDatangRoutes from "./routes/CaraDatangRoutes.js";
import CaraDatangWithPasienRoutes from "./routes/CaraDatangWithPasienRoutes.js";
import AnamnesisRoutes from "./routes/AnamnesisRoutes.js";
import PemeriksaanMataRoutes from "./routes/PemeriksaanMataRoutes.js";
import pemeriksaanPenunjangRoutes from "./routes/PemeriksaanPenunjangRoutes.js";
import diagnosisProsedurRoutes from "./routes/DiagnosisProsedurRoutes.js";
import tatalaksanaRoutes from "./routes/TatalaksanaRoutes.js";
import edukasiRoutes from "./routes/EdukasiRoutes.js";
import SoapRoutes from "./routes/SoapRoutes.js";
import BPJSRoutes from "./routes/BPJSRoutes.js";

import dotenv from "dotenv";
dotenv.config(); // <-- wajib paling atas

const app = express();

// Middleware
app.use(cors());
app.use(bodyParser.json());
// Routes
app.use("/api/snomed", snomedRoutes);
app.use("/api/pasien", pasienRoutes);
app.use("/api/master", masterRoutes);
app.use("/api/auth", userRoutes);
app.use("/api/nakes", NakesRoutes);
app.use("/api/cara-datang", caraDatangRoutes);
app.use("/api/cara-datang-pasien", CaraDatangWithPasienRoutes);

app.use("/api/anamnesis", AnamnesisRoutes);
app.use("/api/pemeriksaan", PemeriksaanMataRoutes);
app.use("/api/pemeriksaan-penunjang", pemeriksaanPenunjangRoutes);
app.use("/api/diagnosis-prosedur", diagnosisProsedurRoutes);
app.use("/api/tatalaksana", tatalaksanaRoutes);
app.use("/api/edukasi", edukasiRoutes);
app.use("/api/soap", SoapRoutes);
app.use("/api/bpjs", BPJSRoutes);

// Server start
const PORT = 3000;
app.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
});
