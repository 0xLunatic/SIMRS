import React, { useState, type FormEvent, type ChangeEvent } from "react";
import axios from "axios";

// =======================================================
// 1. DEFINISI INTERFACE (TIPE DATA)
// =======================================================

// Definisikan struktur data hasil pemeriksaan mata yang dikirim dari backend
interface PemeriksaanData {
  // Master Pasien & Pemeriksaan
  FN_pemeriksaan_mata_id: number;
  FD_tanggal_pemeriksaan: string;
  FN_pasien_id: number;
  FS_no_rm: string;
  FS_nama_lengkap: string;
  FS_jenis_kelamin_kode: string;
  FD_tanggal_lahir: string;
  FS_telepon: string;

  // Detail Visus
  FS_visus_od: string | null;
  FS_visus_os: string | null;
  FS_koreksi: string | null;
  Visus_Component: string | null;

  // Detail TIO
  FS_tio_od: string | null;
  FS_tio_os: string | null;
  FS_metode_pengukuran: string | null;

  // Detail Lensa
  FS_temuan_lensa_od: string | null;
  FS_temuan_lensa_os: string | null;
  Lensa_Term: string | null;
}

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

const PemeriksaanSearch = () => {
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [results, setResults] = useState<PemeriksaanData[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Total kolom di tabel utama
  const COL_SPAN = 6;

  // Handler untuk perubahan input
  const handleSearchTermChange = (e: ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };

  // Handler untuk pengiriman form
  const handleSearch = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!searchTerm.trim()) {
      setResults([]);
      setError("Masukkan **nama pasien** untuk memulai pencarian.");
      return;
    }

    setIsLoading(true);
    setError(null);
    setResults([]);

    try {
      const response = await axios.get<PemeriksaanData[]>(
        `${API_BASE_URL}pemeriksaan/search`,
        {
          params: {
            nama: searchTerm,
          },
        }
      );

      setResults(response.data);
      if (response.data.length === 0) {
        setError(
          `Tidak ditemukan data pemeriksaan untuk pasien "${searchTerm}".`
        );
      }
    } catch (err: unknown) {
      console.error("API Error:", err);

      if (axios.isAxiosError(err) && err.response) {
        const message = (err.response.data as { message: string }).message;
        setError(
          message || `Data tidak ditemukan untuk pasien "${searchTerm}".`
        );
      } else {
        setError("Terjadi kesalahan saat mengambil data dari server.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  // 🔍 Filter Data (Definisi 'filteredData' yang hilang)
  // Karena data sudah difilter di backend berdasarkan 'searchTerm',
  // kita cukup menggunakan 'results'. Namun, jika Anda ingin mencari lagi
  // di sisi klien (misalnya berdasarkan ID setelah hasil muncul),
  // Anda bisa menggunakan logika seperti ini:
  const filteredData = results.filter((row) =>
    [row.FS_nama_lengkap, row.FS_no_rm].some((f) =>
      f.toLowerCase().includes(searchTerm.toLowerCase())
    )
  );

  return (
    <div className="p-6">
      {/* HEADER */}
      <div className="flex justify-between items-center mb-4 flex-wrap gap-2">
        <h1 className="text-2xl font-bold text-gray-800">
          🔎 Pencarian Riwayat Pemeriksaan Mata
        </h1>
      </div>

      {/* SEARCH FORM */}
      <form
        onSubmit={handleSearch}
        className="flex gap-4 mb-6 p-4 bg-white rounded-lg shadow border"
      >
        <input
          type="text"
          value={searchTerm}
          onChange={handleSearchTermChange}
          placeholder="Masukkan Nama Pasien (mis: Budi Santoso)"
          className="flex-grow p-3 border border-gray-300 rounded focus:ring focus:ring-indigo-200"
        />
        <button
          type="submit"
          className="px-6 py-3 bg-indigo-600 text-white font-semibold rounded-lg shadow hover:bg-indigo-700 transition duration-150 disabled:bg-indigo-300"
          disabled={isLoading}
        >
          {isLoading ? "Mencari..." : "Cari Data"}
        </button>
      </form>

      {/* TABLE & STATUS */}
      <div className="overflow-hidden shadow-lg rounded-lg border border-gray-200">
        <table className="w-full text-sm text-left border-collapse">
          <thead className="bg-blue-50 border-b border-gray-300">
            <tr className="text-gray-700 font-semibold text-xs uppercase tracking-wider">
              <th className="px-3 py-3 border-r w-16">Tgl.</th>
              <th className="px-3 py-3 border-r">Pasien (No. RM)</th>
              <th className="px-3 py-3 border-r">Visus (OD/OS)</th>
              <th className="px-3 py-3 border-r">TIO (OD/OS)</th>
              <th className="px-3 py-3 border-r">Lensa Temuan</th>
              <th className="px-3 py-3 w-16 text-center">ID Px.</th>
            </tr>
          </thead>
          <tbody>
            {/* ⏳ Loading State */}
            {isLoading ? (
              <tr>
                <td
                  colSpan={COL_SPAN}
                  className="text-center py-8 text-gray-400"
                >
                  ⏳ Memuat data riwayat, harap tunggu...
                </td>
              </tr>
            ) : /* ❌ Error State */
            error ? (
              <tr>
                <td
                  colSpan={COL_SPAN}
                  className="text-center py-8 text-red-600 bg-red-50 font-medium"
                >
                  {error}
                </td>
              </tr>
            ) : /* ✅ Results / Empty State */
            // Menggunakan filteredData yang sudah didefinisikan
            filteredData.length > 0 ? (
              filteredData.map((data: PemeriksaanData, index: number) => (
                <tr
                  key={data.FN_pemeriksaan_mata_id}
                  className={`hover:bg-gray-50 transition ${
                    index % 2 === 0 ? "bg-white" : "bg-gray-50"
                  }`}
                >
                  <td className="border-t px-3 py-2 whitespace-nowrap text-xs text-gray-900">
                    {/* Format tanggal */}
                    {new Date(data.FD_tanggal_pemeriksaan).toLocaleDateString(
                      "id-ID"
                    )}
                  </td>
                  <td className="border-t px-3 py-2 whitespace-nowrap">
                    <div className="font-medium text-gray-900">
                      {data.FS_nama_lengkap}
                    </div>
                    <div className="text-xs text-gray-500">
                      {data.FS_no_rm} | {data.FS_jenis_kelamin_kode}
                    </div>
                  </td>
                  <td className="border-t px-3 py-2 whitespace-nowrap text-xs text-gray-900">
                    OD: **{data.FS_visus_od || "-"}** / OS: **
                    {data.FS_visus_os || "-"}**
                    {data.FS_koreksi && (
                      <div className="text-xs text-indigo-500">
                        Koreksi: {data.FS_koreksi}
                      </div>
                    )}
                  </td>
                  <td className="border-t px-3 py-2 whitespace-nowrap text-xs text-gray-900">
                    OD: {data.FS_tio_od || "-"} / OS: {data.FS_tio_os || "-"}
                    <div className="text-xs text-gray-500">
                      ({data.FS_metode_pengukuran})
                    </div>
                  </td>
                  <td className="border-t px-3 py-2 whitespace-normal text-xs text-gray-900 max-w-xs">
                    {data.FS_temuan_lensa_od || data.FS_temuan_lensa_os ? (
                      <>
                        {data.FS_temuan_lensa_od &&
                          `OD: ${data.FS_temuan_lensa_od} `}
                        {data.FS_temuan_lensa_os &&
                          `OS: ${data.FS_temuan_lensa_os}`}
                        {data.Lensa_Term && (
                          <div className="text-xs text-gray-500 italic">
                            ({data.Lensa_Term})
                          </div>
                        )}
                      </>
                    ) : (
                      "-"
                    )}
                  </td>
                  <td className="border-t px-3 py-2 text-center whitespace-nowrap text-xs text-gray-400 font-mono">
                    {data.FN_pemeriksaan_mata_id}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td
                  colSpan={COL_SPAN}
                  className="text-center py-8 text-gray-500 border-t"
                >
                  😕 Tidak ada riwayat pemeriksaan yang ditemukan.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default PemeriksaanSearch;
