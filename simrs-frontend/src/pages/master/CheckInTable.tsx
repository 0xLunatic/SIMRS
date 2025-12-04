import { useEffect, useState } from "react";
import axios from "axios";

// 📚 Interface Data
interface PasienItem {
  FN_pasien_id: number;
  FS_no_rm: string;
  FS_nama_lengkap: string;
  FS_nik: string;
  FS_telepon: string;
  FS_email: string;
}

interface CaraDatangItem {
  FN_cara_datang_id: number;
  FS_nama_cara_datang: string;
  FS_keterangan: string;
  FS_kode_snomed_ct?: string;
  FB_aktif: boolean;
  FD_created_at?: string;
  FD_updated_at?: string;
  pasien?: PasienItem[]; // Data Pasien yang datang dengan cara ini
}

export default function CaraDatangPasienView() {
  const [data, setData] = useState<CaraDatangItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");

  // Total kolom yang ditampilkan di tabel utama sekarang 5 (ID, Nama, Keterangan, SNOMED, Jumlah Pasien)
  const COL_SPAN = 5;

  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
  const API_URL = `${API_BASE_URL}cara-datang-pasien`;
  const token =
    localStorage.getItem("token") || sessionStorage.getItem("token");

  // 🔄 Fetch Data
  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await axios.get<CaraDatangItem[]>(API_URL, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setData(res.data ?? []);
      setError(null);
    } catch (err) {
      console.error("Fetch error:", err);
      setError("Gagal memuat data Cara Datang & Pasien");
      setData([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // 🔍 Filter Data
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
          👀 Detail Cara Datang & Pasien Check-in
        </h1>
      </div>

      {/* SEARCH */}
      <div className="mb-3">
        <input
          type="text"
          placeholder="Cari cara datang..."
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
              {/* Kolom 'Aktif' dihilangkan */}
              <th className="px-3 py-3 text-center">Jumlah Pasien</th>
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
                <>
                  <tr
                    key={row.FN_cara_datang_id}
                    className="hover:bg-blue-50 cursor-default"
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
                    {/* Data 'Aktif' dihilangkan dari baris */}
                    <td className="border-t px-3 py-2 text-center font-bold">
                      {row.pasien?.length ?? 0}
                    </td>
                  </tr>

                  {/* ⬇️ Sub-table Pasien (Check-in) */}
                  {row.pasien && row.pasien.length > 0 && (
                    <tr>
                      <td
                        colSpan={COL_SPAN}
                        className="bg-gray-50 border-t p-3"
                      >
                        <h4 className="font-semibold text-gray-700 mb-2">
                          Daftar Pasien Check-in ({row.pasien.length})
                        </h4>
                        <table className="w-full text-xs border border-gray-300 rounded">
                          <thead className="bg-gray-100">
                            <tr>
                              <th className="px-2 py-1 border w-[10%]">
                                No RM
                              </th>
                              <th className="px-2 py-1 border w-[30%]">
                                Nama Lengkap
                              </th>
                              <th className="px-2 py-1 border w-[20%]">NIK</th>
                              <th className="px-2 py-1 border w-[20%]">
                                Telepon
                              </th>
                              <th className="px-2 py-1 border w-[20%]">
                                Email
                              </th>
                            </tr>
                          </thead>
                          <tbody>
                            {row.pasien.map((p) => (
                              <tr
                                key={p.FN_pasien_id}
                                className="hover:bg-white"
                              >
                                <td className="border px-2 py-1 font-mono">
                                  {p.FS_no_rm}
                                </td>
                                <td className="border px-2 py-1">
                                  {p.FS_nama_lengkap}
                                </td>
                                <td className="border px-2 py-1">{p.FS_nik}</td>
                                <td className="border px-2 py-1">
                                  {p.FS_telepon}
                                </td>
                                <td className="border px-2 py-1">
                                  {p.FS_email}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </td>
                    </tr>
                  )}
                </>
              ))
            ) : (
              <tr>
                <td
                  colSpan={COL_SPAN}
                  className="text-center py-8 text-gray-400 border-t"
                >
                  😕 Tidak ada data cara datang atau pasien check-in.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Modal dihilangkan */}
    </div>
  );
}
