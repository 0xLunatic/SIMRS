import { useEffect, useState } from "react";
import axios from "axios";

// Interface untuk Data User (diperluas)
interface UserItem {
  FN_user_id: number;
  FS_username: string;
  FS_nama_lengkap: string;
  FS_role: string;
  FB_aktif: boolean;
  // ✅ FIELD BARU: Harus ditambahkan ke hasil API /auth
  FN_tenaga_kesehatan_id: number | null;
  // ✅ FIELD BARU (Opsional, jika API user sudah melakukan JOIN)
  FS_nama_nakes?: string;
}

// Interface untuk Data Tenaga Kesehatan
interface NakesItem {
  FN_tenaga_kesehatan_id: number;
  FS_nama_lengkap: string; // Nama yang akan muncul di dropdown
  FS_gelar_depan: string | null;
  FS_gelar_belakang: string | null;
  // ... kolom lainnya (dapat diabaikan jika hanya butuh ID dan Nama)
}

// Menambahkan field FN_tenaga_kesehatan_id ke payload
interface UserPayload {
  // ... (sama seperti sebelumnya)
  username: string;
  nama_lengkap: string;
  role: string;
  password?: string; // Optional saat update
  aktif: boolean;
  // ✅ FIELD BARU
  FN_tenaga_kesehatan_id?: number | null;
}

const ROLES = [
  "KEUANGAN",
  "FARMASI",
  "PENDAFTARAN",
  "PERAWAT",
  "DOKTER",
  "ADMIN",
] as const;

export default function UserTable() {
  const [data, setData] = useState<UserItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState<Partial<UserPayload>>({});
  const [searchTerm, setSearchTerm] = useState("");
  // ✅ STATE BARU untuk data Nakes
  const [nakesList, setNakesList] = useState<NakesItem[]>([]);
  const [loadingNakes, setLoadingNakes] = useState(true);

  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
  const API_USER_URL = `${API_BASE_URL}auth`; // Ubah nama variabel agar lebih jelas
  // ✅ ASUMSI ENDPOINT BARU untuk Tenaga Kesehatan
  const API_NAKES_URL = `${API_BASE_URL}nakes`;

  // ... (Kode untuk token dan isAdmin)
  const token =
    localStorage.getItem("token") || sessionStorage.getItem("token");

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

  // 💡 Helper untuk format nama Nakes dengan gelar
  const formatNakesName = (nakes: NakesItem) => {
    const gelarDepan = nakes.FS_gelar_depan ? nakes.FS_gelar_depan + " " : "";
    const gelarBelakang = nakes.FS_gelar_belakang
      ? ", " + nakes.FS_gelar_belakang
      : "";
    return `${gelarDepan}${nakes.FS_nama_lengkap}${gelarBelakang}`;
  };

  // 🔄 Ambil data user
  const fetchData = async () => {
    setLoading(true);
    try {
      // NOTE: API /auth harus mengembalikan FN_tenaga_kesehatan_id
      const res = await axios.get<UserItem[]>(API_USER_URL, {
        headers: { Authorization: `Bearer ${token}` },
      });
      // ✅ Tambahkan logic untuk me-map nama Nakes jika API user tidak langsung menyediakannya
      const mappedData = res.data.map((user) => {
        const nakes = nakesList.find(
          (n) => n.FN_tenaga_kesehatan_id === user.FN_tenaga_kesehatan_id
        );
        return {
          ...user,
          FS_nama_nakes: nakes ? formatNakesName(nakes) : "-",
        };
      });
      setData(mappedData ?? []);
      setError(null);
    } catch (err) {
      console.error("Fetch error:", err);
      setError("Gagal memuat data user");
      setData([]);
    } finally {
      setLoading(false);
    }
  };

  // 🔄 Ambil data Nakes
  const fetchNakesList = async () => {
    setLoadingNakes(true);
    try {
      // ASUMSI: API ini mengembalikan array penuh Tenaga Kesehatan
      const res = await axios.get<NakesItem[]>(API_NAKES_URL, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setNakesList(res.data ?? []);
    } catch (err) {
      console.error("Fetch Nakes error:", err);
    } finally {
      setLoadingNakes(false);
    }
  };

  useEffect(() => {
    // 1. Ambil data Nakes terlebih dahulu
    fetchNakesList();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!loadingNakes) {
      fetchData(); // Panggil fetchData setelah nakesList selesai dimuat
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loadingNakes]);

  // ➕ Tambah user
  const handleSave = async () => {
    // ... (logic validasi yang sama)
    if (
      !formData.username ||
      !formData.nama_lengkap ||
      !formData.role ||
      !formData.password
    ) {
      alert("Username, nama lengkap, role, dan password wajib diisi");
      return;
    }

    // Konversi FN_tenaga_kesehatan_id ke number, atau null jika string kosong (dari input teks)
    let nakesIdValue: number | null = null;
    if (formData.FN_tenaga_kesehatan_id !== undefined) {
      // Jika value = 0 (opsi 'Tidak Terikat') atau null, biarkan null.
      // Jika string, konversi ke number. Jika number (> 0), gunakan.
      const id = String(formData.FN_tenaga_kesehatan_id);

      if (id && Number(id) > 0) {
        nakesIdValue = Number(id);
      }
    }

    // Perhatikan: formData.FN_tenaga_kesehatan_id sekarang sudah berupa ID Nakes yang dipilih dari dropdown
    // Jika dropdown mengirim string ID, pastikan konversi ke Number.
    // Jika dropdown di set ke null/0 untuk "Tidak Terikat", pastikan terkirim null/0.

    const payload: UserPayload = {
      username: formData.username,
      nama_lengkap: formData.nama_lengkap,
      role: formData.role,
      password: formData.password,
      aktif: formData.aktif ?? true,
      // ✅ KIRIM FIELD BARU
      FN_tenaga_kesehatan_id: nakesIdValue,
    };

    try {
      await axios.post(API_USER_URL, payload, {
        // Ganti API_URL menjadi API_USER_URL
        headers: { Authorization: `Bearer ${token}` },
      });
      setShowModal(false);
      setFormData({});
      fetchData();
    } catch (err: any) {
      console.error("Gagal menyimpan user:", err.response?.data ?? err);
      alert("Gagal menyimpan user. Cek console untuk detail.");
    }
  };

  // 🗑️ Hapus user
  const handleDelete = async (id: number) => {
    if (!confirm("Yakin ingin menghapus user ini?")) return;
    try {
      await axios.delete(`${API_USER_URL}/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      fetchData();
    } catch {
      alert("Gagal menghapus data");
    }
  };

  // 🔄 Handle Update Role and Active Status
  const handleUpdate = async (
    id: number,
    field: keyof UserPayload,
    value: any
  ) => {
    if (!isAdmin) return;
    const payload: Partial<UserPayload> = { [field]: value };

    // Khusus untuk Nakes ID, jika value adalah string kosong atau 0, kirim null
    if (field === "FN_tenaga_kesehatan_id") {
      let nakesIdUpdate: number | null = null;
      const idVal = String(value);

      if (idVal && Number(idVal) > 0) {
        nakesIdUpdate = Number(idVal);
      }
      payload.FN_tenaga_kesehatan_id = nakesIdUpdate;
    }

    try {
      await axios.put(`${API_USER_URL}/${id}`, payload, {
        headers: { Authorization: `Bearer ${token}` },
      });
      fetchData();
    } catch (error) {
      console.error(`Gagal mengubah ${field}:`, error);
      alert(`Gagal mengubah ${field}.`);
    }
  };

  // 🔍 Filter data
  const filteredData = data.filter((row) =>
    [
      row.FS_username,
      row.FS_nama_lengkap,
      row.FS_role,
      row.FS_nama_nakes ?? "",
    ].some((f) => f.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="p-6">
      {/* HEADER */}
      <div className="flex justify-between items-center mb-4 flex-wrap gap-2">
        <h1 className="text-2xl font-bold text-gray-800">
          👤 Data User (SIMRS)
        </h1>
        {isAdmin && (
          <button
            onClick={() => {
              // Set nilai awal untuk form baru
              setFormData({
                aktif: true,
                FN_tenaga_kesehatan_id: null, // Set default null
              });
              setShowModal(true);
            }}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg shadow hover:bg-blue-700 transition"
          >
            ➕ Tambah User
          </button>
        )}
      </div>

      {/* SEARCH */}
      <div className="mb-3">
        <input
          type="text"
          placeholder="Cari user (Username, Nama Lengkap, Role, atau Nakes)..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full border border-gray-300 p-2 rounded focus:ring focus:ring-blue-200"
        />
      </div>

      {/* TABLE ala SNOMED */}
      <div className="overflow-x-auto shadow-lg rounded-lg border border-gray-200">
        <table className="min-w-full text-sm text-left border-collapse">
          <thead className="bg-blue-50 border-b border-gray-300">
            <tr className="text-gray-700 font-semibold text-sm">
              <th className="px-3 py-3 border-r w-12 text-center">ID</th>
              <th className="px-3 py-3 border-r">Username</th>
              <th className="px-3 py-3 border-r">Nama Lengkap</th>
              <th className="px-3 py-3 border-r">Role</th>
              {/* ✅ KOLOM BARU */}
              <th className="px-3 py-3 border-r">Nakes ID</th>
              <th className="px-3 py-3 border-r">Nama Tenaga Kesehatan</th>
              <th className="px-3 py-3 border-r text-center">Aktif</th>
              <th className="px-3 py-3 text-center">Aksi</th>
            </tr>
          </thead>

          <tbody>
            {loading || loadingNakes ? (
              <tr>
                <td colSpan={8} className="text-center py-8 text-gray-400">
                  ⏳ Memuat data user dan Nakes...
                </td>
              </tr>
            ) : error ? (
              <tr>
                <td colSpan={8} className="text-center py-8 text-red-500">
                  {error}
                </td>
              </tr>
            ) : filteredData.length > 0 ? (
              filteredData.map((row) => (
                <tr
                  key={row.FN_user_id}
                  className="hover:bg-blue-50 transition"
                >
                  <td className="border-t px-3 py-2 text-center font-medium">
                    {row.FN_user_id}
                  </td>
                  <td className="border-t px-3 py-2 truncate">
                    {row.FS_username}
                  </td>
                  <td className="border-t px-3 py-2 truncate">
                    {row.FS_nama_lengkap}
                  </td>
                  <td className="border-t px-3 py-2">
                    <select
                      value={row.FS_role}
                      onChange={(e) =>
                        handleUpdate(row.FN_user_id, "role", e.target.value)
                      }
                      className="border border-gray-300 rounded px-2 py-1 w-full bg-white"
                      disabled={!isAdmin}
                    >
                      {ROLES.map((role) => (
                        <option key={role} value={role}>
                          {role}
                        </option>
                      ))}
                    </select>
                  </td>
                  {/* ✅ DATA BARU: Nakes ID (dengan dropdown untuk update, menampilkan Nama & ID) */}
                  <td className="border-t px-3 py-2">
                    <select
                      value={row.FN_tenaga_kesehatan_id ?? 0} // Gunakan 0 untuk 'Tidak Terikat'
                      onChange={(e) =>
                        handleUpdate(
                          row.FN_user_id,
                          "FN_tenaga_kesehatan_id",
                          e.target.value
                        )
                      }
                      className="border border-gray-300 rounded px-2 py-1 w-full bg-white text-xs"
                      disabled={!isAdmin || loadingNakes}
                    >
                      <option value={0}>0 (Tidak Terikat)</option>
                      {nakesList.map((nakes) => (
                        <option
                          key={nakes.FN_tenaga_kesehatan_id}
                          value={nakes.FN_tenaga_kesehatan_id}
                        >
                          {formatNakesName(nakes)} (ID:{" "}
                          {nakes.FN_tenaga_kesehatan_id})
                        </option>
                      ))}
                    </select>
                  </td>
                  {/* ✅ DATA BARU: Nama Nakes */}
                  <td className="border-t px-3 py-2 text-xs truncate max-w-xs">
                    {row.FS_nama_nakes}
                  </td>
                  <td className="border-t px-3 py-2 text-center">
                    <input
                      type="checkbox"
                      checked={row.FB_aktif}
                      disabled={!isAdmin}
                      onChange={(e) =>
                        handleUpdate(row.FN_user_id, "aktif", e.target.checked)
                      }
                    />
                  </td>
                  <td className="border-t px-3 py-2 text-center">
                    {isAdmin && (
                      <button
                        onClick={() => handleDelete(row.FN_user_id)}
                        className="text-red-600 hover:text-red-800 transition"
                      >
                        🗑️
                      </button>
                    )}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td
                  colSpan={8}
                  className="text-center py-8 text-gray-400 border-t"
                >
                  😕 Data tidak ditemukan
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* MODAL TAMBAH USER */}
      {showModal && isAdmin && (
        <div
          className="fixed inset-0 backdrop-blur-sm bg-transparent flex justify-center items-center z-[9999] 
					                    animate-[fadeIn_0.3s_ease-out]"
        >
          <div
            className="bg-white p-6 rounded-lg w-full max-w-lg max-h-[90vh] flex flex-col overflow-y-auto shadow-2xl 
					                            animate-[slideUp_0.3s_ease-out]"
          >
            <h2 className="text-xl font-semibold mb-4">{"➕ Tambah User"}</h2>
            <div className="space-y-3">
              {/* Username */}
              <input
                type="text"
                placeholder="Username"
                value={formData.username ?? ""}
                onChange={(e) =>
                  setFormData({ ...formData, username: e.target.value })
                }
                className="w-full border border-gray-300 p-2 rounded"
              />
              {/* Nama Lengkap */}
              <input
                type="text"
                placeholder="Nama Lengkap User"
                value={formData.nama_lengkap ?? ""}
                onChange={(e) =>
                  setFormData({ ...formData, nama_lengkap: e.target.value })
                }
                className="w-full border border-gray-300 p-2 rounded"
              />
              {/* Role */}
              <select
                value={formData.role ?? ""}
                onChange={(e) =>
                  setFormData({ ...formData, role: e.target.value })
                }
                className="w-full border border-gray-300 p-2 rounded"
              >
                <option value="" disabled>
                  Pilih Role
                </option>
                {ROLES.map((role) => (
                  <option key={role} value={role}>
                    {role}
                  </option>
                ))}
              </select>
              {/* Password */}
              <input
                type="password"
                placeholder="Password"
                value={formData.password ?? ""}
                onChange={(e) =>
                  setFormData({ ...formData, password: e.target.value })
                }
                className="w-full border border-gray-300 p-2 rounded"
              />

              {/* ✅ INPUT BARU: FN_tenaga_kesehatan_id (Dropdown) */}
              <select
                value={formData.FN_tenaga_kesehatan_id ?? 0} // Gunakan 0 untuk "Tidak Terikat"
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    FN_tenaga_kesehatan_id: Number(e.target.value) || null,
                  })
                }
                className="w-full border border-gray-300 p-2 rounded"
                disabled={loadingNakes}
              >
                <option value={0}>
                  --- Pilih Tenaga Kesehatan (Opsional) ---
                </option>
                {loadingNakes ? (
                  <option value={0} disabled>
                    Memuat data Nakes...
                  </option>
                ) : (
                  nakesList.map((nakes) => (
                    <option
                      key={nakes.FN_tenaga_kesehatan_id}
                      value={nakes.FN_tenaga_kesehatan_id}
                    >
                      {formatNakesName(nakes)} (ID:{" "}
                      {nakes.FN_tenaga_kesehatan_id})
                    </option>
                  ))
                )}
              </select>

              {/* Status Aktif */}
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={formData.aktif ?? true}
                  onChange={(e) =>
                    setFormData({ ...formData, aktif: e.target.checked })
                  }
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
