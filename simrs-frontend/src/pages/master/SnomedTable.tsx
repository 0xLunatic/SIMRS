import { useEffect, useState } from "react";
import axios from "axios";

interface SnomedItem {
  FN_snomed_id: number;
  FS_fsn_term: string;
  FS_term_indonesia: string;
  FS_deskripsi?: string;
  FS_kategori_konsep?: string;
  FS_tipe_konsep?: string;
}

export default function SnomedTable() {
  const [data, setData] = useState<SnomedItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [editItem, setEditItem] = useState<SnomedItem | null>(null);
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [searchTerm, setSearchTerm] = useState("");

  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
  const API_URL = `${API_BASE_URL}snomed`;

  // 🔹 Ambil data SNOMED
  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await axios.get<{ data: SnomedItem[] }>(API_URL);
      setData(res.data.data ?? []);
    } catch (err) {
      console.error("Fetch error:", err);
      setError("Gagal memuat data SNOMED");
      setData([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // 🔹 Simpan data
  const handleSave = async () => {
    try {
      if (editItem) {
        await axios.put(`${API_URL}/${editItem.FN_snomed_id}`, formData);
      } else {
        await axios.post(API_URL, formData);
      }
      setShowModal(false);
      setFormData({});
      setEditItem(null);
      fetchData();
    } catch {
      alert("Gagal menyimpan data");
    }
  };

  // 🔹 Hapus data
  const handleDelete = async (id: number) => {
    if (!confirm("Yakin ingin menghapus data ini?")) return;
    try {
      await axios.delete(`${API_URL}/${id}`);
      fetchData();
    } catch {
      alert("Gagal menghapus data");
    }
  };

  // 🔹 Filter pencarian
  const filteredData = (data ?? []).filter((row) =>
    [
      row.FS_fsn_term ?? "",
      row.FS_term_indonesia ?? "",
      row.FS_kategori_konsep ?? "",
      row.FS_tipe_konsep ?? "",
      row.FS_deskripsi ?? "",
    ].some((f) => f.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="p-6">
      {/* HEADER */}
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold text-gray-800">📋 Data SNOMED</h1>
        <button
          onClick={() => {
            setEditItem(null);
            setFormData({});
            setShowModal(true);
          }}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition"
        >
          ➕ Tambah Data
        </button>
      </div>

      {/* SEARCH */}
      <div className="mb-3">
        <input
          type="text"
          placeholder="Cari data..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full border border-gray-300 p-2 rounded"
        />
      </div>

      {/* TABLE (fit screen) */}
      <div className="shadow rounded-lg border overflow-hidden">
        <table className="w-full table-auto text-xs">
          <thead className="bg-blue-50 text-gray-700">
            <tr>
              <th className="border px-2 py-2 w-[5%] text-left">ID</th>
              <th className="border px-2 py-2 w-[25%] text-left">Term (EN)</th>
              <th className="border px-2 py-2 w-[25%] text-left">Term (ID)</th>
              <th className="border px-2 py-2 w-[20%] text-left">Deskripsi</th>
              <th className="border px-2 py-2 w-[10%] text-left">Kategori</th>
              <th className="border px-2 py-2 w-[10%] text-left">Tipe</th>
              <th className="border px-2 py-2 w-[5%] text-center">Aksi</th>
            </tr>
          </thead>

          <tbody className="bg-white">
            {loading ? (
              <tr>
                <td
                  colSpan={7}
                  className="text-center text-gray-400 py-10 animate-pulse"
                >
                  ⏳ Memuat data...
                </td>
              </tr>
            ) : error ? (
              <tr>
                <td colSpan={7} className="text-center text-red-500 py-10">
                  {error}
                </td>
              </tr>
            ) : filteredData.length > 0 ? (
              filteredData.map((row) => (
                <tr
                  key={row.FN_snomed_id}
                  className="hover:bg-gray-50 transition"
                >
                  <td className="border px-2 py-1 text-gray-700">
                    {row.FN_snomed_id}
                  </td>
                  <td
                    className="border px-2 py-1 truncate max-w-[180px]"
                    title={row.FS_fsn_term}
                  >
                    {row.FS_fsn_term}
                  </td>
                  <td
                    className="border px-2 py-1 truncate max-w-[180px]"
                    title={row.FS_term_indonesia}
                  >
                    {row.FS_term_indonesia}
                  </td>
                  <td
                    className="border px-2 py-1 truncate max-w-[200px]"
                    title={row.FS_deskripsi ?? "-"}
                  >
                    {row.FS_deskripsi ?? "-"}
                  </td>
                  <td className="border px-2 py-1 truncate text-gray-700">
                    {row.FS_kategori_konsep ?? "-"}
                  </td>
                  <td className="border px-2 py-1 truncate text-gray-700">
                    {row.FS_tipe_konsep ?? "-"}
                  </td>
                  <td className="border px-2 py-1 text-center space-x-1">
                    <button
                      onClick={() => {
                        setEditItem(row);
                        setFormData({ ...row });
                        setShowModal(true);
                      }}
                      className="text-yellow-600 hover:underline text-sm"
                    >
                      ✏️
                    </button>
                    <button
                      onClick={() => handleDelete(row.FN_snomed_id)}
                      className="text-red-600 hover:underline text-sm"
                    >
                      🗑️
                    </button>
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

      {/* MODAL DENGAN BLUR SMOOTH */}
      {showModal && (
        <div
          className="fixed inset-0 backdrop-blur-sm bg-transparent flex justify-center items-center z-[9999] 
                     animate-[fadeIn_0.3s_ease-out]"
        >
          <div
            className="bg-white p-6 rounded-lg w-full max-w-lg max-h-[90vh] flex flex-col overflow-y-auto shadow-2xl 
                          animate-[slideUp_0.3s_ease-out]"
          >
            <h2 className="text-xl font-semibold mb-4">
              {editItem ? "✏️ Edit Data SNOMED" : "➕ Tambah Data SNOMED"}
            </h2>

            <div className="space-y-2">
              <input
                type="number"
                placeholder="ID SNOMED"
                value={formData.FN_snomed_id ?? ""}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    FN_snomed_id: Number(e.target.value),
                  })
                }
                className="w-full border border-gray-300 p-2 rounded"
                disabled={!!editItem}
              />

              {[
                "FS_fsn_term",
                "FS_term_indonesia",
                "FS_deskripsi",
                "FS_kategori_konsep",
                "FS_tipe_konsep",
              ].map((field) => (
                <input
                  key={field}
                  type="text"
                  placeholder={field.replace("FS_", "").replace(/_/g, " ")}
                  value={formData[field] ?? ""}
                  onChange={(e) =>
                    setFormData({ ...formData, [field]: e.target.value })
                  }
                  className="w-full border border-gray-300 p-2 rounded"
                />
              ))}
            </div>

            <div className="flex justify-between mt-4">
              <button
                onClick={() => setShowModal(false)}
                className="px-4 py-2 bg-gray-300 rounded hover:bg-gray-400 transition"
              >
                Batal
              </button>
              <button
                onClick={handleSave}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition"
              >
                💾 Simpan
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Animasi Keyframes */}
      <style>
        {`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        `}
      </style>
    </div>
  );
}
