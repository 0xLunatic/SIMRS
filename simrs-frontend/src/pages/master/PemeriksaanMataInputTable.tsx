import React, {
  useState,
  useEffect,
  useCallback,
  useMemo,
  type FormEvent,
  type JSX,
} from "react";
import axios from "axios";

// =======================================================
// 📚 1. INTERFACES
// =======================================================

interface MasterInput {
  FN_pasien_id: number;
  FN_tenaga_kesehatan_id: number;
  FD_tanggal_pemeriksaan: string; // Format YYYY-MM-DD
}

interface VisusInput {
  FN_loinc_id: number; // Dipilih dari Dropdown LOINC VISUS
  FS_visus_od: string;
  FS_visus_os: string;
  FS_koreksi: string;
  FS_keterangan_tambahan?: string;
}

interface TIOInput {
  FN_loinc_id: number; // Dipilih dari Dropdown LOINC TIO
  FS_tio_od: string;
  FS_tio_os: string;
  FS_metode_pengukuran: string;
  FS_keterangan_tambahan?: string;
}

interface LensaInput {
  FN_snomed_id: number; // Dipilih dari Dropdown SNOMED LENSA
  FS_temuan_lensa_od: string;
  FS_temuan_lensa_os: string;
  FS_keterangan_tambahan?: string;
}

// Data Body Lengkap yang dikirim ke API
interface PemeriksaanLengkapData {
  master: MasterInput;
  detail_visus?: VisusInput;
  detail_tio?: TIOInput;
  detail_lensa?: LensaInput;
}

// Interface untuk Pasien yang dipilih
interface Pasien {
  FN_pasien_id: number;
  FS_nama_lengkap: string;
  FS_no_rm: string;
}

// Interface untuk Profil Nakes (Tenaga Kesehatan)
interface NakesProfile {
  FN_tenaga_kesehatan_id: number;
  FS_nama_lengkap: string;
  username: string;
  FS_username: string;
  role: string;
}

// Interface untuk data LOINC yang difilter
interface LoincOption {
  ID: number;
  Kode: string;
  Deskripsi: string;
  Komponen: string;
}

// Interface untuk data SNOMED yang difilter
interface SnomedOption {
  ID: number;
  FS_term_indonesia: string;
  FSN_Term: string;
}

// =======================================================
// 🌐 2. KONFIGURASI API & NILAI DEFAULT
// =======================================================

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
const API_PEMERIKSAAN_LENGKAP = `${API_BASE_URL}pemeriksaan/lengkap`;
const API_PASIEN_SEARCH = `${API_BASE_URL}pasien/search`;
const API_NAKES_PROFILE = `${API_BASE_URL}auth/profile`;

const API_MASTER_LOINC = `${API_BASE_URL}pemeriksaan/master/loinc`;
const API_MASTER_SNOMED = `${API_BASE_URL}pemeriksaan/master/snomed`;

// --- NILAI DEFAULT UNTUK RESET FORM ---
const initialMaster: MasterInput = {
  FN_pasien_id: 0,
  FN_tenaga_kesehatan_id: 0,
  FD_tanggal_pemeriksaan: new Date().toISOString().split("T")[0],
};

const initialVisus: VisusInput = {
  FN_loinc_id: 0,
  FS_visus_od: "",
  FS_visus_os: "",
  FS_koreksi: "",
  FS_keterangan_tambahan: "",
};

const initialTIO: TIOInput = {
  FN_loinc_id: 0,
  FS_tio_od: "",
  FS_tio_os: "",
  FS_metode_pengukuran: "",
  FS_keterangan_tambahan: "",
};

const initialLensa: LensaInput = {
  FN_snomed_id: 0,
  FS_temuan_lensa_od: "",
  FS_temuan_lensa_os: "",
  FS_keterangan_tambahan: "",
};

// =======================================================
// 🔎 3. CUSTOM HOOK: PASIEN SEARCH
// =======================================================
const usePasienSearch = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState<Pasien[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);

  const searchPasien = useCallback(async (name: string) => {
    if (name.length < 3) {
      setSearchResults([]);
      setSearchError(null);
      return;
    }

    setSearchLoading(true);
    setSearchError(null);
    try {
      const res = await axios.get(API_PASIEN_SEARCH, {
        params: { keyword: name },
      });

      setSearchResults(res.data.data);
    } catch (err) {
      console.error("Pasien Search Error:", err);
      let errorMsg = "Gagal mencari pasien. Cek koneksi atau endpoint.";
      if (
        axios.isAxiosError(err) &&
        err.response &&
        err.response.data &&
        err.response.data.message
      ) {
        errorMsg = err.response.data.message;
      }
      setSearchError(errorMsg);
      setSearchResults([]);
    } finally {
      setSearchLoading(false);
    }
  }, []);

  // Debounce untuk menunda pencarian
  useEffect(() => {
    const handler = setTimeout(() => {
      searchPasien(searchTerm);
    }, 300);

    return () => {
      clearTimeout(handler);
    };
  }, [searchTerm, searchPasien]);

  return {
    searchTerm,
    setSearchTerm,
    searchResults,
    searchLoading,
    searchError,
  };
};

// =======================================================
// 🔎 4. CUSTOM HOOK: MASTER OPTIONS FETCH
// =======================================================
const useMasterOptions = <T extends LoincOption | SnomedOption>(
  type: "loinc" | "snomed",
  filterValue: string
) => {
  const [options, setOptions] = useState<T[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const token = localStorage.getItem("token");

  const fetchOptions = useCallback(async () => {
    if (!filterValue) return;

    const API_URL = type === "loinc" ? API_MASTER_LOINC : API_MASTER_SNOMED;
    const paramName = type === "loinc" ? "category" : "organ";

    setLoading(true);
    setError(null);
    try {
      const res = await axios.get(API_URL, {
        params: { [paramName]: filterValue },
        headers: { Authorization: token ? `Bearer ${token}` : "" },
      });
      setOptions(res.data as T[]);
    } catch (err) {
      console.error(`Fetch ${type} Options Error:`, err);
      let errorMsg = `Gagal memuat pilihan ${type} untuk ${filterValue}.`;
      if (axios.isAxiosError(err) && err.response && err.response.data) {
        errorMsg = err.response.data.message || errorMsg;
      }
      setError(errorMsg);
      setOptions([]);
    } finally {
      setLoading(false);
    }
  }, [type, filterValue, token]);

  useEffect(() => {
    fetchOptions();
  }, [fetchOptions]);

  return { options, loading, error };
};

// =======================================================
// 🏥 5. KOMPONEN UTAMA (PemeriksaanMataForm)
// =======================================================
const PemeriksaanMataForm = () => {
  const token = localStorage.getItem("token");

  // State Data Form
  const [master, setMaster] = useState<MasterInput>(initialMaster);
  const [visus, setVisus] = useState<VisusInput>(initialVisus);
  const [tio, setTio] = useState<TIOInput>(initialTIO);
  const [lensa, setLensa] = useState<LensaInput>(initialLensa);

  // State Pendukung
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);
  const [nakesProfile, setNakesProfile] = useState<NakesProfile | null>(null);
  const [selectedPasien, setSelectedPasien] = useState<Pasien | null>(null);
  const [isNakesLoaded, setIsNakesLoaded] = useState(false);

  // Custom Hook Pasien Search
  const {
    searchTerm,
    setSearchTerm,
    searchResults,
    searchLoading,
    searchError,
  } = usePasienSearch();

  // Custom Hooks Master Options
  const {
    options: visusOptions,
    loading: loadingVisus,
    error: errorVisus,
  } = useMasterOptions<LoincOption>("loinc", "VISUS");

  const {
    options: tioOptions,
    loading: loadingTio,
    error: errorTio,
  } = useMasterOptions<LoincOption>("loinc", "TIO");

  const {
    options: lensaOptions,
    loading: loadingLensa,
    error: errorLensa,
  } = useMasterOptions<SnomedOption>("snomed", "LENSA");

  // --- Logout & Fetch Nakes Profile ---
  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    sessionStorage.removeItem("token");
    setNakesProfile(null);
  };

  /**
   * Mengambil data profil Nakes dari API
   */
  const fetchNakesProfile = useCallback(
    async (isFromStorage: boolean = false) => {
      if (!token) {
        setMessage({
          type: "error",
          text: "Token tidak ditemukan. Mohon login.",
        });
        setIsNakesLoaded(true);
        return;
      }

      try {
        const res = await axios.get(API_NAKES_PROFILE, {
          headers: { Authorization: `Bearer ${token}` },
        });

        const nakesId = res.data.FN_tenaga_kesehatan_id || res.data.id || 0;

        const profileData: NakesProfile = {
          FN_tenaga_kesehatan_id: nakesId,
          FS_nama_lengkap:
            res.data.nama_lengkap || res.data.name || "Nakes Tidak Dikenal",
          username: res.data.username || "",
          FS_username: res.data.username || "",
          role: res.data.role || "unknown",
        };

        if (nakesId === 0) {
          throw new Error("ID Nakes 0. Cek format respons API.");
        }

        setNakesProfile(profileData);
        // UPDATE MASTER STATE DENGAN ID NAKES YANG DITEMUKAN
        setMaster((prev) => ({
          ...prev,
          FN_tenaga_kesehatan_id: profileData.FN_tenaga_kesehatan_id,
        }));
        localStorage.setItem("user", JSON.stringify(profileData));

        setMessage(null);
      } catch (err: any) {
        console.error(
          "DEBUG: Gagal fetching profile:",
          err.response?.data?.message || err.message,
          err
        );

        if (!isFromStorage) {
          setMessage({
            type: "error",
            text: `Gagal memuat profil Nakes. ${
              axios.isAxiosError(err) && err.response?.status === 401
                ? "Token kedaluwarsa/invalid. Mohon login ulang."
                : err.response?.data?.message ||
                  "Kesalahan koneksi atau format API."
            }`,
          });
          handleLogout();
        }
      } finally {
        setIsNakesLoaded(true);
      }
    },
    [token]
  );

  // EFEK: Ambil data Nakes saat komponen dimuat
  useEffect(() => {
    const savedUser = localStorage.getItem("user");

    if (savedUser) {
      try {
        const user = JSON.parse(savedUser) as NakesProfile;

        if (user.FN_tenaga_kesehatan_id > 0) {
          setNakesProfile(user);
          setMaster((prev) => ({
            ...prev,
            FN_tenaga_kesehatan_id: user.FN_tenaga_kesehatan_id,
          }));
          setIsNakesLoaded(true);
          return;
        }
      } catch (e) {
        // Lanjutkan ke fetch API
      }
    }

    fetchNakesProfile(!!savedUser);
  }, [fetchNakesProfile]);

  // --- Handlers ---

  const resetForm = () => {
    // Mempertahankan ID Nakes yang sudah dimuat
    setMaster((prev) => ({
      ...initialMaster,
      FN_tenaga_kesehatan_id: nakesProfile?.FN_tenaga_kesehatan_id || 0,
    }));
    setVisus(initialVisus);
    setTio(initialTIO);
    setLensa(initialLensa);
    setSelectedPasien(null);
    setSearchTerm("");
    setMessage(null);
  };

  /**
   * PERBAIKAN WARNING 6133: Mengganti setMaster menjadi update objek langsung
   */
  const handleMasterChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setMaster({
      ...master,
      [e.target.name]: e.target.value,
    });
  };

  const handleDetailChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >,
    setState: React.Dispatch<any>
  ) => {
    const { name, value } = e.target;

    setState((prevState: any) => {
      const newState = {
        ...prevState,
        [name]:
          name === "FN_loinc_id" || name === "FN_snomed_id"
            ? Number(value)
            : value,
      };

      // Logika spesifik untuk TIO: Mengisi FS_metode_pengukuran dari Deskripsi LOINC
      if (name === "FN_loinc_id" && setState === setTio) {
        const selectedTioOption = tioOptions.find(
          (opt) => opt.ID === Number(value)
        );
        newState.FS_metode_pengukuran = selectedTioOption
          ? selectedTioOption.Deskripsi
          : "";
      }

      return newState;
    });
  };

  const handleSelectPasien = (pasien: Pasien) => {
    setSelectedPasien(pasien);
    setMaster((prev) => ({ ...prev, FN_pasien_id: pasien.FN_pasien_id }));
    setSearchTerm(pasien.FS_nama_lengkap); // Menutup daftar hasil
  };

  // --- Submission Logic ---
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    // Validasi Pasien
    if (!selectedPasien) {
      setMessage({
        type: "error",
        text: "Pasien harus dipilih terlebih dahulu.",
      });
      setLoading(false);
      return;
    }

    // Validasi ID Nakes
    if (master.FN_tenaga_kesehatan_id === 0) {
      setMessage({
        type: "error",
        text: "ID Tenaga Kesehatan belum dimuat/valid. Mohon refresh atau login ulang.",
      });
      setLoading(false);
      return;
    }

    // Validasi Dropdown Penting (Minimal salah satu detail diisi)
    const isVisusFilled = visus.FS_visus_od.trim() || visus.FS_visus_os.trim();
    const isTioFilled = tio.FS_tio_od.trim() || tio.FS_tio_os.trim();
    const isLensaFilled =
      lensa.FS_temuan_lensa_od.trim() || lensa.FS_temuan_lensa_os.trim();

    if (isVisusFilled && visus.FN_loinc_id === 0) {
      setMessage({
        type: "error",
        text: "Jenis Pemeriksaan Visus harus dipilih jika data diisi.",
      });
      setLoading(false);
      return;
    }
    if (isTioFilled && tio.FN_loinc_id === 0) {
      setMessage({
        type: "error",
        text: "Metode Pengukuran TIO harus dipilih jika data diisi.",
      });
      setLoading(false);
      return;
    }
    if (isLensaFilled && lensa.FN_snomed_id === 0) {
      setMessage({
        type: "error",
        text: "Temuan Lensa harus dipilih jika data diisi.",
      });
      setLoading(false);
      return;
    }

    const postData: PemeriksaanLengkapData = {
      master: {
        ...master,
        FN_pasien_id: selectedPasien.FN_pasien_id,
      },
      // Hanya kirim detail yang memiliki data terisi (minimal 1 field)
      detail_visus: isVisusFilled ? visus : undefined,
      detail_tio: isTioFilled ? tio : undefined,
      detail_lensa: isLensaFilled ? lensa : undefined,
    };

    // Cek jika tidak ada detail yang diisi
    if (!isVisusFilled && !isTioFilled && !isLensaFilled) {
      setMessage({
        type: "error",
        text: "Anda harus mengisi minimal satu detail pemeriksaan (Visus, TIO, atau Lensa).",
      });
      setLoading(false);
      return;
    }

    try {
      const res = await axios.post(API_PEMERIKSAAN_LENGKAP, postData, {
        headers: {
          Authorization: token ? `Bearer ${token}` : "",
          "Content-Type": "application/json",
        },
      });

      setMessage({
        type: "success",
        text:
          res.data.message ||
          `Data pemeriksaan berhasil disimpan dengan ID: ${res.data.id}.`,
      });
      resetForm();
    } catch (err: unknown) {
      console.error("Submission Error:", err);
      let errorMsg = "Terjadi kesalahan saat menyimpan data.";

      if (axios.isAxiosError(err) && err.response) {
        errorMsg =
          err.response.data.message || err.response.data.error || errorMsg;
      }
      setMessage({ type: "error", text: errorMsg });
    } finally {
      setLoading(false);
    }
  };

  /**
   * Helper function untuk merender bagian form
   * PERBAIKAN ERROR 2739: Memastikan fields selalu berisi ReactElement dengan key
   */
  const renderSection = (
    title: string,
    fields: JSX.Element[],
    isDetail: boolean
  ): JSX.Element => (
    <div
      key={`section-${title.replace(/\s/g, "-")}`} // Tambahkan key unik pada container
      className={`p-4 rounded-lg border ${
        isDetail ? "border-indigo-200 bg-indigo-50" : "border-gray-300 bg-white"
      }`}
    >
      <h3 className="text-lg font-semibold text-indigo-700 mb-3">{title}</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">{fields}</div>
    </div>
  );

  const nakesInfo = useMemo(() => {
    if (!isNakesLoaded) return "Memuat profil Nakes...";
    if (!nakesProfile || nakesProfile.FN_tenaga_kesehatan_id === 0)
      return "ID Nakes Tidak Ditemukan. Mohon Login Ulang.";
    return `${nakesProfile.FS_nama_lengkap} (ID: ${nakesProfile.FN_tenaga_kesehatan_id})`;
  }, [nakesProfile, isNakesLoaded]);

  const isVisusLoincRequired = !!(
    visus.FS_visus_od.trim() || visus.FS_visus_os.trim()
  );
  const isTioLoincRequired = !!(tio.FS_tio_od.trim() || tio.FS_tio_os.trim());
  const isLensaSnomedRequired = !!(
    lensa.FS_temuan_lensa_od.trim() || lensa.FS_temuan_lensa_os.trim()
  );

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold text-gray-800 mb-6 border-b-2 border-indigo-500 pb-2">
        ➕ Input Pemeriksaan Mata Lengkap
      </h1>

      {/* Info Nakes dan Pasien */}
      <div className="mb-6 p-3 bg-blue-50 border border-blue-200 rounded-lg text-sm">
        <p className="font-medium text-blue-700">
          🧑‍⚕️ Tenaga Kesehatan: **{nakesInfo}**
        </p>
        <p
          className={`font-medium ${
            selectedPasien ? "text-green-700" : "text-red-700"
          }`}
        >
          👥 Pasien Dipilih:{" "}
          {selectedPasien
            ? `**${selectedPasien.FS_nama_lengkap}** (RM: ${selectedPasien.FS_no_rm}, ID: ${selectedPasien.FN_pasien_id})`
            : "Belum ada pasien yang dipilih"}
        </p>
      </div>

      {/* Pesan Status */}
      {message && (
        <div
          className={`p-4 mb-4 rounded-lg font-medium ${
            message.type === "success"
              ? "bg-green-100 text-green-700"
              : "bg-red-100 text-red-700"
          }`}
          role="alert"
        >
          {message.text}
        </div>
      )}

      {/* Pesan Error Dropdown Master */}
      {(errorVisus || errorTio || errorLensa) && (
        <div
          className="p-3 mb-4 rounded-lg font-medium bg-red-100 text-red-700 text-sm"
          role="alert"
        >
          ⚠️ Error memuat data referensi: {errorVisus || errorTio || errorLensa}
          . Mohon cek koneksi API Master.
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* ======================================================= */}
        {/* A. MASTER PEMERIKSAAN (Pencarian Pasien) */}
        {/* ======================================================= */}
        {renderSection(
          "A. Pemilihan Pasien & Data Master",
          [
            <div key="search_pasien" className="relative">
              <label className="block text-sm font-medium text-gray-700">
                Cari Nama Pasien <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="search_pasien"
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  if (
                    selectedPasien &&
                    e.target.value !== selectedPasien.FS_nama_lengkap
                  ) {
                    setSelectedPasien(null);
                    setMaster((prev) => ({ ...prev, FN_pasien_id: 0 }));
                  }
                }}
                placeholder="Min. 3 huruf nama pasien..."
                className={`mt-1 block w-full p-2 border ${
                  selectedPasien ? "border-green-500" : "border-red-500"
                } rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500`}
                required
              />

              {/* Hasil Pencarian Pasien */}
              {(searchResults.length > 0 || searchLoading || searchError) &&
                searchTerm.length >= 3 &&
                !selectedPasien && (
                  <ul className="absolute z-10 w-full bg-white border border-gray-300 rounded-md shadow-lg max-h-48 overflow-y-auto mt-1">
                    {searchLoading ? (
                      <li
                        className="p-2 text-center text-sm text-gray-500"
                        key="loading"
                      >
                        Mencari...
                      </li>
                    ) : searchError ? (
                      <li
                        className="p-2 text-center text-sm text-red-500"
                        key="error"
                      >
                        {searchError}
                      </li>
                    ) : searchResults.length === 0 ? (
                      <li
                        className="p-2 text-center text-sm text-gray-500"
                        key="not_found"
                      >
                        Pasien tidak ditemukan.
                      </li>
                    ) : (
                      searchResults.map((pasien) => (
                        <li
                          key={pasien.FN_pasien_id}
                          className="p-2 hover:bg-indigo-100 cursor-pointer text-sm border-b"
                          onClick={() => handleSelectPasien(pasien)}
                        >
                          {pasien.FS_nama_lengkap} (RM: {pasien.FS_no_rm})
                        </li>
                      ))
                    )}
                  </ul>
                )}
            </div>,

            <div key="tanggal">
              <label className="block text-sm font-medium text-gray-700">
                Tanggal Pemeriksaan (FD_tanggal_pemeriksaan){" "}
                <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                name="FD_tanggal_pemeriksaan"
                value={master.FD_tanggal_pemeriksaan}
                onChange={handleMasterChange}
                className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                required
              />
            </div>,

            <div key="pasien_id_display" className="col-span-1">
              <label className="block text-sm font-medium text-gray-700">
                ID Pasien (Internal)
              </label>
              <input
                type="number"
                name="FN_pasien_id"
                value={selectedPasien?.FN_pasien_id || 0}
                className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm bg-gray-100"
                readOnly
              />
            </div>,

            <div key="nakes_id_display" className="col-span-1">
              <label className="block text-sm font-medium text-gray-700">
                ID Nakes (Pemeriksa)
              </label>
              <input
                type="number"
                name="FN_tenaga_kesehatan_id"
                value={master.FN_tenaga_kesehatan_id || 0}
                className="mt-1 block w-full p-2 border border-gray-300 rounded-md bg-gray-100"
                readOnly
              />
            </div>,
          ],
          false
        )}

        <hr className="border-t-2 border-indigo-100" />

        {/* ======================================================= */}
        {/* B. DETAIL VISUS */}
        {/* ======================================================= */}
        {renderSection(
          "B. Detail Visus (Ketajaman Penglihatan)",
          [
            // PERBAIKAN ERROR 2322: Mengubah required={string} menjadi required={boolean}
            <div key="loinc_visus" className="col-span-2">
              <label className="block text-sm font-medium text-gray-700">
                Jenis Pemeriksaan Visus (FN_loinc_id)
                {isVisusLoincRequired && (
                  <span className="text-red-500"> *</span>
                )}
              </label>
              <select
                name="FN_loinc_id"
                value={visus.FN_loinc_id}
                onChange={(e) => handleDetailChange(e, setVisus)}
                className="mt-1 block w-full p-2 border border-indigo-500 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 bg-white"
                required={isVisusLoincRequired}
                disabled={loadingVisus}
              >
                <option value={0}>
                  {loadingVisus
                    ? "Memuat Pilihan..."
                    : "--- Pilih Jenis Pemeriksaan Visus ---"}
                </option>
                {visusOptions.map((opt) => (
                  <option key={opt.ID} value={opt.ID}>
                    {opt.Deskripsi} ({opt.Kode})
                  </option>
                ))}
              </select>
            </div>,

            <div key="visus_od">
              <label className="block text-sm font-medium text-gray-700">
                Visus Mata Kanan (FS_visus_od)
              </label>
              <input
                type="text"
                name="FS_visus_od"
                value={visus.FS_visus_od}
                onChange={(e) => handleDetailChange(e, setVisus)}
                placeholder="Contoh: 6/60 atau 20/200"
                className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>,
            <div key="visus_os">
              <label className="block text-sm font-medium text-gray-700">
                Visus Mata Kiri (FS_visus_os)
              </label>
              <input
                type="text"
                name="FS_visus_os"
                value={visus.FS_visus_os}
                onChange={(e) => handleDetailChange(e, setVisus)}
                placeholder="Contoh: 6/60 atau 20/200"
                className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>,
            <div key="koreksi" className="col-span-2">
              <label className="block text-sm font-medium text-gray-700">
                Koreksi (FS_koreksi)
              </label>
              <textarea
                name="FS_koreksi"
                value={visus.FS_koreksi}
                onChange={(e) => handleDetailChange(e, setVisus)}
                placeholder="Contoh: S-1.00 C-0.50 x 90 (OD)"
                rows={2}
                className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>,
          ],
          true
        )}

        {/* ======================================================= */}
        {/* C. DETAIL TEKANAN INTRAOKULAR (TIO) */}
        {/* ======================================================= */}
        {renderSection(
          "C. Detail TIO (Tekanan Bola Mata)",
          [
            // PERBAIKAN ERROR 2322: Mengubah required={string} menjadi required={boolean}
            <div key="loinc_tio" className="col-span-2">
              <label className="block text-sm font-medium text-gray-700">
                Metode Pengukuran TIO (FN_loinc_id)
                {isTioLoincRequired && <span className="text-red-500"> *</span>}
              </label>
              <select
                name="FN_loinc_id"
                value={tio.FN_loinc_id}
                onChange={(e) => handleDetailChange(e, setTio)}
                className="mt-1 block w-full p-2 border border-indigo-500 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 bg-white"
                required={isTioLoincRequired}
                disabled={loadingTio}
              >
                <option value={0}>
                  {loadingTio
                    ? "Memuat Pilihan..."
                    : "--- Pilih Metode Pengukuran TIO ---"}
                </option>
                {tioOptions.map((opt) => (
                  <option key={opt.ID} value={opt.ID}>
                    {opt.Deskripsi} ({opt.Kode})
                  </option>
                ))}
              </select>
            </div>,

            <div key="tio_od">
              <label className="block text-sm font-medium text-gray-700">
                TIO Mata Kanan (FS_tio_od)
              </label>
              <input
                type="text"
                name="FS_tio_od"
                value={tio.FS_tio_od}
                onChange={(e) => handleDetailChange(e, setTio)}
                placeholder="Contoh: 15 mmHg"
                className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>,
            <div key="tio_os">
              <label className="block text-sm font-medium text-gray-700">
                TIO Mata Kiri (FS_tio_os)
              </label>
              <input
                type="text"
                name="FS_tio_os"
                value={tio.FS_tio_os}
                onChange={(e) => handleDetailChange(e, setTio)}
                placeholder="Contoh: 16 mmHg"
                className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>,
            <div key="metode" className="col-span-2">
              <label className="block text-sm font-medium text-gray-700">
                Metode Pengukuran (Otomatis)
              </label>
              <input
                type="text"
                name="FS_metode_pengukuran"
                value={tio.FS_metode_pengukuran}
                className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm bg-gray-100"
                readOnly
              />
            </div>,
          ],
          true
        )}

        {/* ======================================================= */}
        {/* D. DETAIL LENSA */}
        {/* ======================================================= */}
        {renderSection(
          "D. Detail Lensa",
          [
            // PERBAIKAN ERROR 2322: Mengubah required={string} menjadi required={boolean}
            <div key="snomed_lensa_select" className="col-span-2">
              <label className="block text-sm font-medium text-gray-700">
                Temuan Lensa (FN_snomed_id)
                {isLensaSnomedRequired && (
                  <span className="text-red-500"> *</span>
                )}
              </label>
              <select
                name="FN_snomed_id"
                value={lensa.FN_snomed_id}
                onChange={(e) => handleDetailChange(e, setLensa)}
                className="mt-1 block w-full p-2 border border-indigo-500 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 bg-white"
                required={isLensaSnomedRequired}
                disabled={loadingLensa}
              >
                <option value={0}>
                  {loadingLensa
                    ? "Memuat Pilihan..."
                    : "--- Pilih Temuan Lensa ---"}
                </option>
                {lensaOptions.map((opt) => (
                  <option key={opt.ID} value={opt.ID}>
                    {opt.FS_term_indonesia}
                  </option>
                ))}
              </select>
            </div>,

            <div key="lensa_od">
              <label className="block text-sm font-medium text-gray-700">
                Keterangan Lensa Mata Kanan (FS_temuan_lensa_od)
              </label>
              <input
                type="text"
                name="FS_temuan_lensa_od"
                value={lensa.FS_temuan_lensa_od}
                onChange={(e) => handleDetailChange(e, setLensa)}
                placeholder="Contoh: Derajat Kekeruhan"
                className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>,
            <div key="lensa_os">
              <label className="block text-sm font-medium text-gray-700">
                Keterangan Lensa Mata Kiri (FS_temuan_lensa_os)
              </label>
              <input
                type="text"
                name="FS_temuan_lensa_os"
                value={lensa.FS_temuan_lensa_os}
                onChange={(e) => handleDetailChange(e, setLensa)}
                placeholder="Contoh: Derajat Kekeruhan"
                className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>,
          ],
          true
        )}

        {/* ======================================================= */}
        {/* TOMBOL SUBMIT */}
        {/* ======================================================= */}
        <div className="pt-4">
          <button
            type="submit"
            className="w-full py-3 px-6 bg-indigo-600 text-white font-semibold rounded-lg shadow-md hover:bg-indigo-700 transition duration-150 disabled:bg-indigo-300"
            disabled={
              loading ||
              !isNakesLoaded ||
              !selectedPasien ||
              master.FN_tenaga_kesehatan_id === 0 ||
              (isVisusLoincRequired && visus.FN_loinc_id === 0) || // Validasi Dropdown Wajib (jika field diisi)
              (isTioLoincRequired && tio.FN_loinc_id === 0) ||
              (isLensaSnomedRequired && lensa.FN_snomed_id === 0) ||
              // Tambahkan validasi agar minimal satu detail terisi
              (!isVisusLoincRequired &&
                !isTioLoincRequired &&
                !isLensaSnomedRequired)
            }
          >
            {loading
              ? "Menyimpan Data..."
              : !isNakesLoaded
              ? "Memuat Profil Nakes..."
              : "💾 Simpan Pemeriksaan Lengkap"}
          </button>
        </div>
      </form>
    </div>
  );
};

export default PemeriksaanMataForm;
