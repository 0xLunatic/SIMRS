import "./App.css";
import { Routes, Route, Navigate } from "react-router-dom";

// Import Pages
import Login from "./pages/Login";
import SnomedTable from "./pages/master/SnomedTable";
import DashboardLayout from "./layouts/DashboardLayout";
import PasienPage from "./components/page/PasienPage";
import UserPage from "./components/page/UserPage";
import Dashboard from "./pages/Dashboard";
import ProtectedRoute from "./components/ProtectedRoute";
import GuestRoute from "./components/GuestRoute"; //
import NakesPage from "./components/page/NakesPage";
import CheckInPage from "./components/page/CheckInPage";
import CaraDatangPage from "./components/page/CaraDatangPage";
import AnamnesisPage from "./components/page/AnamnesisPage";
import AnamnesisHistoryPage from "./components/page/AnamnesisHistoryPage";
import PemeriksaanMataHistoryPage from "./components/page/PemeriksaanMataHistoryPage";
import PemeriksaanMataInputPage from "./components/page/PemeriksaanMataInputPage";
import PemeriksaanPenunjangPage from "./components/page/PemeriksaanPenunjangPage";
import DiagnosisProsedurPage from "./components/page/DiagnosisProsedurPage";
import TatalaksanaPage from "./components/page/TatalaksanaPage";
import EdukasiPage from "./components/page/EdukasiPage";
import SoapPage from "./components/page/SoapPage";
import BPJSPage from "./components/page/BPJSPage";

function App() {
  return (
    <div className="min-h-screen">
      <Routes>
        {/* 🔒 Hanya bisa diakses kalau BELUM login */}
        <Route
          path="/"
          element={
            <GuestRoute>
              <Login />
            </GuestRoute>
          }
        />

        {/* 🔐 Semua route di bawah ini butuh login */}
        <Route
          element={
            <ProtectedRoute>
              <DashboardLayout />
            </ProtectedRoute>
          }
        >
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/master/snomed" element={<SnomedTable />} />
          <Route path="/pasien" element={<PasienPage />} />
          <Route path="/user" element={<UserPage />} />
          <Route path="/nakes" element={<NakesPage />} />
          <Route path="/layanan/check-in" element={<CheckInPage />} />
          <Route path="/cara-datang" element={<CaraDatangPage />} />
          <Route path="/layanan/anamnesis" element={<AnamnesisPage />} />
          <Route
            path="/layanan/anamnesis-history"
            element={<AnamnesisHistoryPage />}
          />
          <Route
            path="/layanan/pemeriksaan-mata"
            element={<PemeriksaanMataInputPage />}
          />
          <Route
            path="/layanan/pemeriksaan-mata-history"
            element={<PemeriksaanMataHistoryPage />}
          />
          <Route
            path="/layanan/pemeriksaan-penunjang"
            element={<PemeriksaanPenunjangPage />}
          />
          <Route
            path="/layanan/diagnosis-prosedur"
            element={<DiagnosisProsedurPage />}
          />
          <Route path="/layanan/tatalaksana" element={<TatalaksanaPage />} />
          <Route path="/layanan/edukasi" element={<EdukasiPage />} />
          <Route path="/layanan/soap" element={<SoapPage />} />
          <Route path="/layanan/bpjs" element={<BPJSPage />} />
        </Route>

        {/* 🚫 Jika path tidak dikenal, redirect ke login */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </div>
  );
}

export default App;
