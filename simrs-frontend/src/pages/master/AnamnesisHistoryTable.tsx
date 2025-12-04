import React, {
  useState,
  type FormEvent,
  type ChangeEvent,
  useEffect,
  useRef,
} from "react";
import axios from "axios";

// --- URL API ---
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
const ANAMNESIS_BASE_ENDPOINT = `${API_BASE_URL}anamnesis`;

// --- INTERFACES (Definisi Tipe Data) ---

// Data flat dari API Search (tetap sama)
interface AnamnesisFlatRecord {
  FN_pasien_id: number;
  Pasien_Nama: string;
  Pasien_NoRM: string;
  FN_anamnesis_id: number;
  FD_tanggal_anamnesis: string;
  FT_waktu_input: string;
  FN_tenaga_kesehatan_id: number;
  Keluhan_Keterangan: string | null;
  RiwayatPenyakit_Keterangan: string | null;
}

// Data detail Anamnesis (tetap sama)
interface AnamnesisDetailItem {
  Kategori: string;
  FN_anamnesis_id: number;
  FS_pertanyaan: string;
  FS_keterangan: string | null;
  Jawaban_Label: string | null;
}

// Data Master Anamnesis (tetap sama)
interface AnamnesisMaster {
  FN_anamnesis_id: number;
  FD_tanggal_anamnesis: string;
  FT_waktu_input: string;
  Pasien_Nama: string;
  Pasien_NoRM: string;
  Nakes_Nama: string;
}

// Data lengkap 1 Riwayat Anamnesis (tetap sama)
interface FullAnamnesisData {
  master: AnamnesisMaster;
  allDetails: AnamnesisDetailItem[];
}

// **NEW INTERFACE:** Data yang dikelompokkan berdasarkan Pasien untuk tampilan hasil
interface GroupedAnamnesis {
  FN_pasien_id: number;
  Pasien_Nama: string;
  Pasien_NoRM: string;
  // Daftar semua ID Anamnesis untuk pasien ini
  anamnesis_ids: AnamnesisFlatRecord[];
}

// --- FUNGSI HELPER ---

// Fungsi untuk mengelompokkan detail berdasarkan Kategori (Tetap sama)
const groupDetails = (details: AnamnesisDetailItem[]) => {
  return details.reduce<{ [key: string]: AnamnesisDetailItem[] }>(
    (acc, detail) => {
      const category = detail.Kategori;
      if (!acc[category]) {
        acc[category] = [];
      }
      acc[category].push(detail);
      return acc;
    },
    {}
  );
};

// Fungsi pengelompokan baru: dari list flat menjadi list grouped by Pasien ID
const groupAnamnesisByPatient = (
  records: AnamnesisFlatRecord[]
): GroupedAnamnesis[] => {
  const patientMap = new Map<number, GroupedAnamnesis>();

  records.forEach((record) => {
    const { FN_pasien_id, Pasien_Nama, Pasien_NoRM } = record;

    if (!patientMap.has(FN_pasien_id)) {
      patientMap.set(FN_pasien_id, {
        FN_pasien_id,
        Pasien_Nama,
        Pasien_NoRM,
        anamnesis_ids: [],
      });
    }
    // Tambahkan record ke daftar anamnesis IDs untuk pasien tersebut
    patientMap.get(FN_pasien_id)?.anamnesis_ids.push(record);
  });

  return Array.from(patientMap.values());
};

// Fungsi format tanggal (Tetap sama)
const formatDate = (dateString: string) => {
  if (!dateString) return "-";
  try {
    const date = new Date(dateString);
    const isFullDate = dateString.includes("T") || dateString.includes(" ");
    return date.toLocaleDateString("id-ID", {
      year: "numeric",
      month: isFullDate ? "short" : "numeric",
      day: "numeric",
      ...(isFullDate && { hour: "2-digit", minute: "2-digit" }),
    });
  } catch {
    return dateString;
  }
};

// -------------------------------------------------------------
// 💡 MAIN COMPONENT: AnamnesisPasienView
// -------------------------------------------------------------

const AnamnesisPasienView: React.FC = () => {
  const [keyword, setKeyword] = useState("");
  // State untuk menyimpan hasil pencarian yang sudah dikelompokkan
  const [groupedResults, setGroupedResults] = useState<GroupedAnamnesis[]>([]);
  const [loadingSearch, setLoadingSearch] = useState(false);

  // State untuk menyimpan DETAIL dari MULTIPLE Anamnesis yang dipilih
  const [selectedAnamnesisDetails, setSelectedAnamnesisDetails] = useState<
    FullAnamnesisData[]
  >([]);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [errorStatus, setErrorStatus] = useState<string | null>(null);

  const debounceTimer = useRef<number | null>(null);

  // --- FUNGSI PENCARIAN ANAMNESIS ---
  const executeSearch = async (searchKeyword: string) => {
    if (searchKeyword.trim() === "" || searchKeyword.trim().length < 2) {
      setGroupedResults([]);
      return;
    }

    setLoadingSearch(true);
    setErrorStatus(null);
    setGroupedResults([]);
    setSelectedAnamnesisDetails([]); // Clear detail view

    try {
      const response = await axios.get<{
        success: boolean;
        data: AnamnesisFlatRecord[];
      }>(`${ANAMNESIS_BASE_ENDPOINT}/pasien/search?q=${searchKeyword}`);

      const flatRecords = response.data.data;
      // Mengelompokkan hasil flat sebelum disimpan ke state
      const grouped = groupAnamnesisByPatient(flatRecords);
      setGroupedResults(grouped);
    } catch (err) {
      console.error("Search Anamnesis failed:", err);
      setErrorStatus("Gagal melakukan pencarian riwayat anamnesis.");
    } finally {
      setLoadingSearch(false);
    }
  };

  // --- Debounce Effect untuk Auto-Search (tetap sama) ---
  useEffect(() => {
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
    }

    if (keyword.trim().length >= 2) {
      debounceTimer.current = setTimeout(() => {
        executeSearch(keyword);
      }, 500) as unknown as number;
    } else {
      setGroupedResults([]);
      setSelectedAnamnesisDetails([]);
    }

    return () => {
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current);
      }
    };
  }, [keyword]);

  // Handle input change
  const handleKeywordChange = (e: ChangeEvent<HTMLInputElement>) => {
    setKeyword(e.target.value);
  };

  // Handle form submit (fallback)
  const handleSearchSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    executeSearch(keyword);
  };

  // --- FUNGSI MENGAMBIL DETAIL LENGKAP MULTIPLE ANAMNESIS ID ---
  const handleViewAnamnesisDetails = async (records: AnamnesisFlatRecord[]) => {
    setLoadingDetail(true);
    setGroupedResults([]); // Sembunyikan daftar riwayat
    setSelectedAnamnesisDetails([]);
    setErrorStatus(null);

    try {
      // Ambil hanya list ID yang unik dan urutkan berdasarkan waktu input
      const idsToFetch = records
        .map((r) => r.FN_anamnesis_id)
        .filter((value, index, self) => self.indexOf(value) === index)
        .sort((a, b) => b - a); // Urutkan dari yang terbaru (ID terbesar)

      const detailPromises = idsToFetch.map((id) =>
        axios.get<{ success: boolean; data: FullAnamnesisData | null }>(
          `${ANAMNESIS_BASE_ENDPOINT}/${id}`
        )
      );

      const responses = await Promise.all(detailPromises);

      const details: FullAnamnesisData[] = responses
        .map((res) => res.data.data)
        .filter((data): data is FullAnamnesisData => data !== null); // Hanya ambil data yang sukses

      setSelectedAnamnesisDetails(details);

      if (details.length === 0) {
        setErrorStatus(
          `Gagal memuat detail. ${idsToFetch.length} ID dicoba, 0 berhasil.`
        );
      }
    } catch (err) {
      console.error("Fetch Anamnesis Detail failed:", err);
      setErrorStatus(
        `Gagal memuat detail Anamnesis. Terjadi kesalahan jaringan/server.`
      );
    } finally {
      setLoadingDetail(false);
    }
  };

  return (
    <div className="p-4 sm:p-6 bg-gray-50 min-h-screen">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold text-center text-indigo-700 mb-6">
          <span role="img" aria-label="form">
            📝
          </span>{" "}
          Riwayat Anamnesis Pasien
        </h1>

        {/* ------------------------------------- */}
        {/* 1. SECTION PENCARIAN RIWAYAT ANAMNESIS */}
        {/* ------------------------------------- */}
        <div className="p-4 bg-white shadow-md rounded-lg mb-4 border border-gray-200">
          <h3 className="text-base font-semibold mb-3 text-indigo-600">
            🔍 Cari Pasien (Nama/No. RM)
          </h3>
          <form onSubmit={handleSearchSubmit} className="flex gap-2 mb-3">
            <input
              type="text"
              value={keyword}
              onChange={handleKeywordChange}
              placeholder="Masukkan Nama atau No. RM"
              className="flex-grow p-2 text-sm border border-gray-300 rounded focus:ring-indigo-500 focus:border-indigo-500"
            />
            <button
              type="submit"
              disabled={loadingSearch}
              className="px-4 py-2 text-sm bg-indigo-600 text-white font-semibold rounded hover:bg-indigo-700 disabled:bg-indigo-300 transition-colors"
            >
              {loadingSearch ? "Mencari..." : "Cari"}
            </button>
          </form>

          {/* Daftar Hasil Pencarian Pasien */}
          {loadingSearch && keyword.length >= 2 && (
            <p className="p-2 text-sm text-center text-indigo-700 italic">
              ...Sedang mencari riwayat...
            </p>
          )}

          {groupedResults.length > 0 && !loadingSearch && (
            <div className="border border-gray-200 rounded max-h-56 overflow-y-auto mt-4">
              <div className="p-2 text-sm font-semibold bg-indigo-50 text-indigo-700 border-b sticky top-0">
                Ditemukan {groupedResults.length} Pasien dengan Riwayat
                Anamnesis
              </div>
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50 sticky top-0">
                  <tr>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                      Pasien
                    </th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase w-32">
                      Jumlah Riwayat
                    </th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase w-16">
                      Aksi
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {groupedResults.map((group) => (
                    <tr
                      key={group.FN_pasien_id} // Kunci unik adalah Pasien ID
                      className="hover:bg-indigo-50 transition-colors"
                    >
                      <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-900">
                        <p className="font-medium">{group.Pasien_Nama}</p>
                        <p className="text-xs text-gray-500">
                          RM: {group.Pasien_NoRM}
                        </p>
                      </td>
                      <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-600 font-bold">
                        {group.anamnesis_ids.length} Riwayat
                      </td>
                      <td className="px-3 py-2 whitespace-nowrap text-right text-sm font-medium">
                        <button
                          // Mengirimkan list record flat ke handler detail
                          onClick={() =>
                            handleViewAnamnesisDetails(group.anamnesis_ids)
                          }
                          className="text-xs px-3 py-1 bg-green-500 text-white rounded hover:bg-green-600 transition-colors"
                        >
                          Lihat Semua
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {groupedResults.length === 0 &&
            keyword.trim().length >= 2 &&
            !loadingSearch && (
              <p className="text-gray-500 text-sm mt-3">
                Tidak ditemukan pasien dengan riwayat anamnesis yang cocok.
              </p>
            )}
        </div>

        {/* ------------------------------------- */}
        {/* 2. SECTION TAMPILAN DETAIL ANAMNESIS (Multiple Card View) */}
        {/* ------------------------------------- */}

        {/* Status Error/Loading */}
        {errorStatus && (
          <div className="p-3 bg-red-100 text-red-800 rounded-lg mb-4 text-sm font-medium border border-red-300">
            ❌ Error: **{errorStatus}**
          </div>
        )}

        {loadingDetail && (
          <div className="p-3 text-center bg-blue-100 text-blue-800 rounded-lg mb-4 text-sm font-medium border border-blue-300">
            ⏳ Memuat{" "}
            {selectedAnamnesisDetails.length > 0
              ? selectedAnamnesisDetails.length
              : ""}{" "}
            data Detail Anamnesis...
          </div>
        )}

        {/* Tampilkan Data Anamnesis dalam Multiple Card */}
        {!loadingDetail && selectedAnamnesisDetails.length > 0 && (
          <div className="mt-6">
            <h2 className="text-xl font-bold text-indigo-700 mb-4">
              Riwayat Lengkap Pasien (
              {selectedAnamnesisDetails[0].master.Pasien_Nama})
            </h2>

            {selectedAnamnesisDetails.map((anamnesisData, index) => {
              const groupedDetails = groupDetails(anamnesisData.allDetails);

              return (
                <div
                  key={anamnesisData.master.FN_anamnesis_id}
                  className="bg-white shadow-xl rounded-lg overflow-hidden border border-indigo-200 mb-6"
                >
                  {/* Card Header */}
                  <header
                    className={`p-3 text-white flex justify-between items-center ${
                      index === 0 ? "bg-green-600" : "bg-indigo-600"
                    }`}
                  >
                    <h3 className="text-lg font-bold">
                      {index === 0 ? "✅ TERKINI" : `Riwayat #${index + 1}`}
                    </h3>
                    <p className="text-sm font-medium">
                      ID: {anamnesisData.master.FN_anamnesis_id}
                    </p>
                  </header>

                  <div className="p-4 sm:p-6">
                    {/* --- MASTER DATA --- */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-1 text-sm mb-4 border-b pb-2">
                      <p>
                        <strong className="text-gray-700">
                          Tanggal & Waktu:
                        </strong>{" "}
                        {formatDate(anamnesisData.master.FD_tanggal_anamnesis)}{" "}
                        Pkl. {anamnesisData.master.FT_waktu_input}
                      </p>
                      <p>
                        <strong className="text-gray-700">
                          Tenaga Kesehatan:
                        </strong>{" "}
                        {anamnesisData.master.Nakes_Nama}
                      </p>
                    </div>

                    {/* --- DETAIL DATA (GROUPED) --- */}
                    <h4 className="text-md font-semibold text-indigo-700 mb-3">
                      Detail Pemeriksaan ({anamnesisData.allDetails.length}{" "}
                      item)
                    </h4>

                    {anamnesisData.allDetails.length === 0 ? (
                      <p className="text-gray-500 italic text-sm">
                        Tidak ada detail anamnesis yang terekam.
                      </p>
                    ) : (
                      Object.keys(groupedDetails).map((category) => (
                        <div
                          key={category}
                          className="mb-4 p-3 border border-gray-100 rounded-md bg-gray-50"
                        >
                          <h5 className="text-sm font-bold text-gray-800 mb-2 uppercase border-b pb-1">
                            {category.replace(/_/g, " ")}
                          </h5>
                          {groupedDetails[category].map((detail) => (
                            <div
                              key={`${category}-${detail.FS_pertanyaan}`}
                              className="pl-3 py-1 border-l-2 border-l-green-500 mb-2 text-sm"
                            >
                              <p className="font-medium text-gray-700">
                                Q: {detail.FS_pertanyaan}
                              </p>
                              {detail.Jawaban_Label || detail.FS_keterangan ? (
                                <p className="text-green-600 ml-1 mt-0.5">
                                  <span className="font-bold text-gray-900">
                                    A:
                                  </span>{" "}
                                  {detail.Jawaban_Label}
                                  {detail.FS_keterangan && (
                                    <span className="text-gray-600 italic text-xs ml-2">
                                      (Ket: {detail.FS_keterangan})
                                    </span>
                                  )}
                                </p>
                              ) : (
                                <p className="text-gray-400 italic ml-1 mt-0.5 text-xs">
                                  (Tidak ada jawaban terekam)
                                </p>
                              )}
                            </div>
                          ))}
                        </div>
                      ))
                    )}
                  </div>
                </div>
              );
            })}

            {/* Tombol kembali ke hasil pencarian setelah melihat detail */}
            <div className="text-center mt-6">
              <button
                onClick={() => {
                  setSelectedAnamnesisDetails([]); // Hapus detail
                  executeSearch(keyword); // Tampilkan hasil pencarian terakhir
                }}
                className="px-4 py-2 text-sm bg-gray-500 text-white font-semibold rounded hover:bg-gray-600 transition-colors"
              >
                Kembali ke Hasil Pencarian
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AnamnesisPasienView;
