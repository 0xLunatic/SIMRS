import { useEffect, useState } from "react";
import axios from "axios";

interface NakesItem {
  FN_nakes_id: number;
  FS_nama_lengkap: string;
  FS_profesi_kode: string;
  FS_spesialisasi_kode: string;
  FS_no_str?: string;
  FB_aktif: boolean;
}

interface OptionItem {
  kode: string;
  nama: string;
}

export default function NakesTable() {
  const [data, setData] = useState<NakesItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState<Partial<NakesItem>>({});
  const [searchTerm, setSearchTerm] = useState("");

  // Dropdown data
  const [profesiList, setProfesiList] = useState<OptionItem[]>([]);
  const [spesialisasiList, setSpesialisasiList] = useState<OptionItem[]>([]);

  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
  const API_URL = `${API_BASE_URL}nakes`;
  const PROFESI_URL = `${API_BASE_URL}master/profesi`;
  const SPESIALISASI_URL = `${API_BASE_URL}master/spesialisasi`;

  const token =
    localStorage.getItem("token") || sessionStorage.getItem("token");

  // Ambil role user
  let userRole = "";
  try {
    const rawUser =
      localStorage.getItem("user") || sessionStorage.getItem("user");
    const parsed = rawUser ? JSON.parse(rawUser) : null;
    userRole = parsed?.FS_role?.trim() || parsed?.role?.trim() || "";
  } catch (err) {
    console.error("❌ Gagal parse data user:", err);
  }

  const isAdmin = userRole.toLowerCase() === "admin";

  // 🔹 Fetch data utama (tenaga kesehatan)
  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await axios.get(API_URL, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const formattedData: NakesItem[] = (res.data ?? []).map((item: any) => ({
        FN_nakes_id: item.FN_tenaga_kesehatan_id,
        FS_nama_lengkap: item.FS_nama_lengkap,
        FS_profesi_kode: item.FS_profesi_kode,
        FS_spesialisasi_kode: item.FS_spesialisasi_kode,
        FS_no_str: item.FS_nomor_str,
        FB_aktif: item.FB_aktif,
      }));
      setData(formattedData);
      setError(null);
    } catch (err) {
      console.error("Fetch error:", err);
      setError("Gagal memuat data tenaga kesehatan");
      setData([]);
    } finally {
      setLoading(false);
    }
  };

  // 🔹 Fetch data dropdown dari backend MasterController
  const fetchDropdowns = async () => {
    try {
      const [profesiRes, spesRes] = await Promise.all([
        axios.get(PROFESI_URL, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        axios.get(SPESIALISASI_URL, {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);

      // ✅ pakai field 'kode' dan 'nama' dari hasil log
      setProfesiList(
        (profesiRes.data ?? []).map((p: any) => ({
          kode: p.kode,
          nama: p.nama,
        }))
      );

      setSpesialisasiList(
        (spesRes.data ?? []).map((s: any) => ({
          kode: s.kode,
          nama: s.nama,
        }))
      );

      console.log("📋 Profesi:", profesiRes.data);
      console.log("📋 Spesialisasi:", spesRes.data);
    } catch (err) {
      console.error("❌ Gagal memuat data dropdown:", err);
    }
  };

  useEffect(() => {
    fetchData();
    fetchDropdowns();
  }, []);

  // 🔹 Simpan data baru
  const handleSave = async () => {
    if (!formData.FS_nama_lengkap || !formData.FS_profesi_kode) {
      alert("Nama dan profesi wajib diisi");
      return;
    }

    const payload = {
      FS_nama_lengkap: formData.FS_nama_lengkap,
      FS_profesi_kode: formData.FS_profesi_kode,
      FS_spesialisasi_kode: formData.FS_spesialisasi_kode ?? "",
      FS_nomor_str: formData.FS_no_str ?? "",
      FB_aktif: formData.FB_aktif ?? true,
    };

    try {
      await axios.post(API_URL, payload, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setShowModal(false);
      setFormData({});
      fetchData();
    } catch (err: any) {
      console.error("Gagal menyimpan nakes:", err.response?.data ?? err);
      alert("Gagal menyimpan data. Cek console untuk detail.");
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Yakin ingin menghapus tenaga kesehatan ini?")) return;
    try {
      await axios.delete(`${API_URL}/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      fetchData();
    } catch {
      alert("Gagal menghapus data");
    }
  };

  const handleToggleAktif = async (id: number, aktif: boolean) => {
    try {
      await axios.put(
        `${API_URL}/${id}`,
        { FB_aktif: aktif },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      fetchData();
    } catch {
      alert("Gagal mengubah status aktif");
    }
  };

  const filteredData = data.filter((row) =>
    [row.FS_nama_lengkap, row.FS_profesi_kode, row.FS_spesialisasi_kode].some(
      (f) => f?.toLowerCase().includes(searchTerm.toLowerCase())
    )
  );

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold text-gray-800">
          🏥 Data Tenaga Kesehatan
        </h1>
        {isAdmin && (
          <button
            onClick={() => {
              setFormData({ FB_aktif: true });
              setShowModal(true);
            }}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          >
            ➕ Tambah Nakes
          </button>
        )}
      </div>

      <div className="mb-3">
        <input
          type="text"
          placeholder="Cari tenaga kesehatan..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full border border-gray-300 p-2 rounded"
        />
      </div>

      <div className="overflow-x-auto shadow rounded-lg border border-gray-200">
        <table className="min-w-full table-fixed border-collapse text-sm border border-gray-300">
          <thead className="bg-gray-100">
            <tr>
              {[
                "ID",
                "Nama",
                "Profesi",
                "Spesialisasi",
                "No STR",
                "Aktif",
                "Aksi",
              ].map((h) => (
                <th
                  key={h}
                  className="border border-gray-300 px-4 py-2 text-left font-semibold text-gray-700"
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-white">
            {loading ? (
              <tr>
                <td
                  colSpan={7}
                  className="text-center py-10 text-gray-400 animate-pulse"
                >
                  ⏳ Memuat data...
                </td>
              </tr>
            ) : error ? (
              <tr>
                <td colSpan={7} className="text-center py-10 text-red-500">
                  {error}
                </td>
              </tr>
            ) : filteredData.length > 0 ? (
              filteredData.map((row) => (
                <tr
                  key={row.FN_nakes_id}
                  className="hover:bg-gray-50 transition"
                >
                  <td className="border border-gray-300 px-4 py-2">
                    {row.FN_nakes_id}
                  </td>
                  <td className="border border-gray-300 px-4 py-2">
                    {row.FS_nama_lengkap}
                  </td>
                  <td className="border border-gray-300 px-4 py-2">
                    {profesiList.find((p) => p.kode === row.FS_profesi_kode)
                      ?.nama ?? row.FS_profesi_kode}
                  </td>
                  <td className="border border-gray-300 px-4 py-2">
                    {spesialisasiList.find(
                      (s) => s.kode === row.FS_spesialisasi_kode
                    )?.nama ?? row.FS_spesialisasi_kode}
                  </td>
                  <td className="border border-gray-300 px-4 py-2">
                    {row.FS_no_str ?? "-"}
                  </td>
                  <td className="border border-gray-300 px-4 py-2 text-center">
                    <input
                      type="checkbox"
                      checked={row.FB_aktif}
                      disabled={!isAdmin}
                      onChange={(e) =>
                        handleToggleAktif(row.FN_nakes_id, e.target.checked)
                      }
                    />
                  </td>
                  <td className="border border-gray-300 px-4 py-2 text-center">
                    {isAdmin && (
                      <button
                        onClick={() => handleDelete(row.FN_nakes_id)}
                        className="text-red-600 hover:underline"
                      >
                        🗑️ Hapus
                      </button>
                    )}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={7} className="text-center text-gray-400 py-10">
                  😕 Data tidak ditemukan
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Modal Tambah */}
      {showModal && isAdmin && (
        <div className="fixed inset-0 backdrop-blur-sm bg-transparent flex justify-center items-center z-[9999] animate-[fadeIn_0.3s_ease-out]">
          <div className="bg-white p-6 rounded-lg w-full max-w-lg max-h-[90vh] flex flex-col overflow-y-auto shadow-2xl animate-[slideUp_0.3s_ease-out]">
            <h2 className="text-xl font-semibold mb-4">
              ➕ Tambah Tenaga Kesehatan
            </h2>
            <div className="space-y-2">
              <input
                type="text"
                placeholder="Nama Lengkap"
                value={formData.FS_nama_lengkap ?? ""}
                onChange={(e) =>
                  setFormData({ ...formData, FS_nama_lengkap: e.target.value })
                }
                className="w-full border border-gray-300 p-2 rounded"
              />

              {/* PROFESI */}
              <select
                value={formData.FS_profesi_kode ?? ""}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    FS_profesi_kode: e.target.value,
                  })
                }
                disabled={profesiList.length === 0}
                className="w-full border border-gray-300 p-2 rounded"
              >
                <option key="default-profesi" value="">
                  -- Pilih Profesi --
                </option>
                {profesiList.map((p, idx) => (
                  <option key={p.kode || `profesi-${idx}`} value={p.kode}>
                    {p.nama || "Tanpa Nama"}
                  </option>
                ))}
              </select>

              {/* SPESIALISASI */}
              <select
                value={formData.FS_spesialisasi_kode ?? ""}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    FS_spesialisasi_kode: e.target.value,
                  })
                }
                disabled={spesialisasiList.length === 0}
                className="w-full border border-gray-300 p-2 rounded"
              >
                <option key="default-spesialisasi" value="">
                  -- Pilih Spesialisasi --
                </option>
                {spesialisasiList.map((s, idx) => (
                  <option key={s.kode || `spesialisasi-${idx}`} value={s.kode}>
                    {s.nama || "Tanpa Nama"}
                  </option>
                ))}
              </select>

              <input
                type="text"
                placeholder="Nomor STR"
                value={formData.FS_no_str ?? ""}
                onChange={(e) =>
                  setFormData({ ...formData, FS_no_str: e.target.value })
                }
                className="w-full border border-gray-300 p-2 rounded"
              />

              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={formData.FB_aktif ?? true}
                  onChange={(e) =>
                    setFormData({ ...formData, FB_aktif: e.target.checked })
                  }
                />
                <span>Aktif</span>
              </label>
            </div>

            <div className="flex justify-between mt-4">
              <button
                onClick={() => setShowModal(false)}
                className="px-4 py-2 bg-gray-300 rounded"
              >
                Batal
              </button>
              <button
                onClick={handleSave}
                className="px-4 py-2 bg-blue-600 text-white rounded"
              >
                💾 Simpan
              </button>
            </div>
          </div>
        </div>
      )}

      <style>
        {`
          @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
          @keyframes slideUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
        `}
      </style>
    </div>
  );
}
