import { useEffect, useState } from "react";
import axios from "axios";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";
import { motion } from "framer-motion";

export default function Dashboard() {
  const [latency, setLatency] = useState<number | null>(null);
  const [status, setStatus] = useState("Checking...");
  const [history, setHistory] = useState<{ time: string; latency: number }[]>(
    []
  );

  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

  const testLatency = async () => {
    const start = performance.now();
    try {
      await axios.get(`${API_BASE_URL}snomed?limit=1`);
      const end = performance.now();
      const duration = Math.round(end - start);
      setLatency(duration);
      setStatus("🟢 Connected");

      // simpan history (maksimal 20 titik)
      setHistory((prev) => {
        const newData = [
          ...prev,
          { time: new Date().toLocaleTimeString(), latency: duration },
        ];
        return newData.slice(-20);
      });
    } catch {
      setStatus("🔴 Offline");
      setLatency(null);
    }
  };

  useEffect(() => {
    testLatency();
    const interval = setInterval(testLatency, 2000); // cek tiap 2 detik
    return () => clearInterval(interval);
  }, []);

  // Tentukan warna berdasarkan latency
  const getLatencyColor = () => {
    if (latency === null) return "text-gray-400";
    if (latency < 150) return "text-green-500";
    if (latency < 400) return "text-yellow-500";
    return "text-red-500";
  };

  const getLineColor = () => {
    if (history.length === 0) return "#9ca3af";
    const last = history[history.length - 1].latency;
    if (last < 150) return "#22c55e";
    if (last < 400) return "#eab308";
    return "#ef4444";
  };

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold text-gray-800 mb-2">Dashboard Utama</h1>
      <p className="text-gray-600 mb-6">
        Pantau stabilitas koneksi ke database.
      </p>

      {/* Kartu Statistik */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
          <h2 className="text-gray-700 font-semibold mb-2">Status Koneksi</h2>
          <motion.p
            className="text-lg font-bold"
            animate={{ opacity: [0.5, 1] }}
            transition={{ duration: 0.5 }}
          >
            {status}
          </motion.p>
        </div>

        <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
          <h2 className="text-gray-700 font-semibold mb-2">Waktu Respon</h2>
          <motion.p
            className={`text-2xl font-bold ${getLatencyColor()}`}
            animate={{ scale: [0.95, 1] }}
            transition={{ duration: 0.3 }}
          >
            {latency ? `${latency} ms` : "Tidak tersedia"}
          </motion.p>
        </div>

        <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
          <h2 className="text-gray-700 font-semibold mb-2">Update Terakhir</h2>
          <p className="text-lg font-bold">
            {history.length > 0
              ? history[history.length - 1].time
              : "Belum ada data"}
          </p>
        </div>
      </div>

      {/* Grafik Latency */}
      <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
        <h2 className="text-gray-700 font-semibold mb-4">
          ⏱ Grafik Latency Database
        </h2>
        {history.length > 0 ? (
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={history}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="time" />
              <YAxis
                label={{
                  value: "ms",
                  angle: -90,
                  position: "insideLeft",
                }}
              />
              <Tooltip />
              <Line
                type="monotone"
                dataKey="latency"
                stroke={getLineColor()}
                strokeWidth={3}
                dot={false}
                activeDot={{ r: 6 }}
                animationDuration={400}
              />
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <p className="text-gray-400 text-center">Menunggu data...</p>
        )}
      </div>
    </div>
  );
}
