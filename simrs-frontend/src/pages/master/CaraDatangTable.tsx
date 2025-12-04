import { useEffect, useState } from "react";
import axios from "axios";

// 📚 Interface Data (PasienItem Dihilangkan)
interface CaraDatangItem {
  FN_cara_datang_id: number;
  FS_nama_cara_datang: string;
  FS_keterangan: string;
  FS_kode_snomed_ct?: string;
  FB_aktif: boolean;
  FD_created_at?: string;
  FD_updated_at?: string;
  // Properti pasien dihilangkan
}

// Interface untuk state Modal/Form
interface FormDataState {
  FN_cara_datang_id?: number; // Untuk Edit
  FS_nama_cara_datang?: string;
  FS_keterangan?: string;
  FS_kode_snomed_ct?: string;
  FB_aktif: boolean;
}

export default function CaraDatangMaster() {
  const [data, setData] = useState<CaraDatangItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState<FormDataState>({ FB_aktif: true });
  const [searchTerm, setSearchTerm] = useState("");

  // Total kolom yang ditampilkan di tabel sekarang 6 (ID, Nama, Keterangan, SNOMED, Aktif, Aksi)
  const COL_SPAN = 6;

  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
  // 🔹 API URL dikembalikan ke endpoint dasar master: 'cara-datang'
  const API_URL = `${API_BASE_URL}cara-datang`;
  const token =
    localStorage.getItem("token") || sessionStorage.getItem("token");

  // --- 🔄 FETCH DATA (READ) ---
  const fetchData = async () => {
    setLoading(true);
    try {
      // Menggunakan endpoint dasar untuk mendapatkan semua data Cara Datang
      const res = await axios.get<CaraDatangItem[]>(API_URL, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setData(res.data ?? []);
      setError(null);
    } catch (err) {
      console.error("Fetch error:", err);
      setError("Gagal memuat data Master Cara Datang");
      setData([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // --- 📝 HANDLER FORM & SAVE (CREATE/UPDATE) ---
  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleSave = async () => {
    if (!formData.FS_nama_cara_datang) {
      alert("Nama Cara Datang wajib diisi");
      return;
    }

    const payload = {
      FS_nama_cara_datang: formData.FS_nama_cara_datang,
      FS_keterangan: formData.FS_keterangan || "",
      FS_kode_snomed_ct: formData.FS_kode_snomed_ct || null,
      FB_aktif: formData.FB_aktif ?? true,
    };

    try {
      if (isEditing && formData.FN_cara_datang_id) {
        // UPDATE (PUT/PATCH)
        await axios.put(`${API_URL}/${formData.FN_cara_datang_id}`, payload, {
          headers: { Authorization: `Bearer ${token}` },
        });
      } else {
        // CREATE (POST)
        await axios.post(API_URL, payload, {
          headers: { Authorization: `Bearer ${token}` },
        });
      }

      setShowModal(false);
      setFormData({ FB_aktif: true });
      fetchData(); // Muat ulang data
    } catch (err) {
      console.error("Gagal menyimpan data:", err);
      alert("Gagal menyimpan data Cara Datang. Periksa konsol untuk detail.");
    }
  };

  // --- ✏️ HANDLER EDIT ---
  const handleEdit = (row: CaraDatangItem) => {
    setFormData({
      FN_cara_datang_id: row.FN_cara_datang_id,
      FS_nama_cara_datang: row.FS_nama_cara_datang,
      FS_keterangan: row.FS_keterangan,
      FS_kode_snomed_ct: row.FS_kode_snomed_ct,
      FB_aktif: row.FB_aktif,
    });
    setIsEditing(true);
    setShowModal(true);
  };

  // --- 🗑️ HANDLER DELETE ---
  const handleDelete = async (id: number) => {
    if (!confirm("Yakin ingin menghapus data ini?")) return;
    try {
      await axios.delete(`${API_URL}/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      fetchData();
    } catch {
      alert(
        "Gagal menghapus data. Kemungkinan data ini digunakan oleh tabel lain."
      );
    }
  };

  // --- 🔍 FILTER DATA ---
  const filteredData = data.filter((row) =>
    [row.FS_nama_cara_datang, row.FS_keterangan ?? ""].some((f) =>
      f.toLowerCase().includes(searchTerm.toLowerCase())
    )
  );

  return (
    <div className="p-6">
      {/* HEADER */}
      <div className="flex justify-between items-center mb-4 flex-wrap gap-2">
        <h1 className="text-2xl font-bold text-gray-800">
          🏥 Master Cara Datang
        </h1>
        <button
          onClick={() => {
            setFormData({ FB_aktif: true }); // Reset form
            setIsEditing(false);
            setShowModal(true);
          }}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg shadow hover:bg-blue-700 transition"
        >
          ➕ Tambah Data
        </button>
      </div>

      {/* SEARCH */}
      <div className="mb-3">
        <input
          type="text"
          placeholder="Cari nama atau keterangan cara datang..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full border border-gray-300 p-2 rounded focus:ring focus:ring-blue-200"
        />
      </div>

      {/* TABLE */}
      <div className="overflow-hidden shadow-lg rounded-lg border border-gray-200">
        <table className="w-full text-sm text-left border-collapse">
          <thead className="bg-blue-50 border-b border-gray-300">
            <tr className="text-gray-700 font-semibold text-sm">
              <th className="px-3 py-3 border-r w-12 text-center">ID</th>
              <th className="px-3 py-3 border-r">Nama Cara Datang</th>
              <th className="px-3 py-3 border-r">Keterangan</th>
              <th className="px-3 py-3 border-r">Kode SNOMED</th>
              <th className="px-3 py-3 border-r text-center">Aktif</th>
              <th className="px-3 py-3 text-center w-24">Aksi</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td
                  colSpan={COL_SPAN}
                  className="text-center py-8 text-gray-400"
                >
                  ⏳ Memuat data...
                </td>
              </tr>
            ) : error ? (
              <tr>
                <td
                  colSpan={COL_SPAN}
                  className="text-center py-8 text-red-500"
                >
                  {error}
                </td>
              </tr>
            ) : filteredData.length > 0 ? (
              filteredData.map((row) => (
                <tr
                  key={row.FN_cara_datang_id}
                  className="hover:bg-blue-50 cursor-pointer"
                >
                  <td className="border-t px-3 py-2 text-center font-medium">
                    {row.FN_cara_datang_id}
                  </td>
                  <td className="border-t px-3 py-2 truncate">
                    {row.FS_nama_cara_datang}
                  </td>
                  <td className="border-t px-3 py-2 truncate">
                    {row.FS_keterangan || "-"}
                  </td>
                  <td className="border-t px-3 py-2 truncate">
                    {row.FS_kode_snomed_ct || "-"}
                  </td>
                  <td className="border-t px-3 py-2 text-center">
                    {row.FB_aktif ? "✅" : "❌"}
                  </td>
                  <td className="border-t px-3 py-2 text-center space-x-2">
                    <button
                      onClick={() => handleEdit(row)}
                      className="text-yellow-600 hover:text-yellow-800 transition"
                      title="Edit"
                    >
                      ✏️
                    </button>
                    <button
                      onClick={() => handleDelete(row.FN_cara_datang_id)}
                      className="text-red-600 hover:text-red-800 transition"
                      title="Hapus"
                    >
                      🗑️
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td
                  colSpan={COL_SPAN}
                  className="text-center py-8 text-gray-400 border-t"
                >
                  😕 Tidak ada data Cara Datang ditemukan.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* --- MODAL TAMBAH/EDIT --- */}
      {showModal && (
        <div className="fixed inset-0 backdrop-blur-sm bg-gray-900 bg-opacity-30 flex justify-center items-center z-[9999]">
          <div className="bg-white p-6 rounded-lg w-full max-w-lg max-h-[90vh] flex flex-col overflow-y-auto shadow-2xl animate-[slideUp_0.3s_ease-out]">
            <h2 className="text-xl font-semibold mb-4">
              {isEditing ? "✏️ Edit" : "➕ Tambah"} Cara Datang
            </h2>

            <div className="space-y-3">
              <input
                type="text"
                name="FS_nama_cara_datang"
                placeholder="Nama Cara Datang *"
                value={formData.FS_nama_cara_datang ?? ""}
                onChange={handleFormChange}
                className="w-full border border-gray-300 p-2 rounded focus:ring focus:ring-blue-200"
              />

              <input
                type="text"
                name="FS_keterangan"
                placeholder="Keterangan"
                value={formData.FS_keterangan ?? ""}
                onChange={handleFormChange}
                className="w-full border border-gray-300 p-2 rounded focus:ring focus:ring-blue-200"
              />

              <input
                type="text"
                name="FS_kode_snomed_ct"
                placeholder="Kode SNOMED (opsional)"
                value={formData.FS_kode_snomed_ct ?? ""}
                onChange={handleFormChange}
                className="w-full border border-gray-300 p-2 rounded focus:ring focus:ring-blue-200"
              />

              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  name="FB_aktif"
                  checked={formData.FB_aktif}
                  onChange={handleFormChange}
                />
                <span>Aktif</span>
              </label>
            </div>

            <div className="flex justify-end mt-5 gap-2">
              <button
                onClick={() => setShowModal(false)}
                className="px-4 py-2 bg-gray-300 rounded hover:bg-gray-400"
              >
                Batal
              </button>
              <button
                onClick={handleSave}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                💾 {isEditing ? "Simpan Perubahan" : "Simpan"}
              </button>
            </div>
          </div>
        </div>
      )}

      <style>
        {`
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        `}
      </style>
    </div>
  );
}
