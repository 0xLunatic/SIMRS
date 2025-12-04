import React, {
  useState,
  useEffect,
  useRef,
  useCallback,
  useMemo,
} from "react";
import axios from "axios";

// ==========================================
// 1. CONFIG & INTERFACES
// ==========================================
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
const API_NAKES_PROFILE = `${API_BASE_URL}auth/profile`;

interface NakesProfile {
  FN_tenaga_kesehatan_id: number;
  FS_nama_lengkap: string;
  username: string;
  FS_username: string;
  role: string;
}

interface Pasien {
  FN_pasien_id: number;
  FS_nama_lengkap: string;
  FS_no_rm: string;
}

interface HistoryItem {
  FN_pemeriksaan_penunjang_id: number;
  FD_tanggal_pemeriksaan: string;
  FB_is_final: boolean;
  tipe_pemeriksaan: "BIOMETRI" | "BSCAN" | "LAB" | "UNKNOWN";

  // Data detail
  FS_panjang_aksial?: string;
  FS_kekuatan_iol?: string;
  hasil_bscan?: string;
  FS_glukosa?: string;
  FS_leukosit?: string;

  // ID Loinc untuk edit
  bio_loinc?: number;
  lab_loinc?: number;
  bscan_loinc?: number;
}

// 🆕 UPDATE INTERFACE: Tambah FS_kode_snomed
interface LoincOption {
  FN_loinc_id: number;
  FS_kode_loinc: string;
  FS_deskripsi: string;
  FS_kode_snomed?: string; // Opsional jika backend mengirim snomed
}

// ==========================================
// 2. SUB-COMPONENT: MODAL FORM (CRUD)
// ==========================================

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  pasienId: number;
  pasienName: string;
  nakesId: number;
  editData?: any;
}

const PemeriksaanFormModal = ({
  isOpen,
  onClose,
  onSuccess,
  pasienId,
  pasienName,
  nakesId,
  editData,
}: ModalProps) => {
  const [type, setType] = useState<"BIOMETRI" | "BSCAN" | "LAB">("BIOMETRI");
  const [tanggal, setTanggal] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [isFinal, setIsFinal] = useState(false);
  const [loading, setLoading] = useState(false);

  const [loincOptions, setLoincOptions] = useState<LoincOption[]>([]);
  const [loadingLoinc, setLoadingLoinc] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    loincId: 0,
    panjangAksial: "",
    kekuatanIol: "",
    indikasi: "",
    hasil: "",
    keterangan: "",
    glukosa: "",
    leukosit: "",
    koagulasi: "",
  });

  // Cari opsi yang sedang dipilih untuk menampilkan detail ID di bawah dropdown
  const selectedLoincOption = useMemo(() => {
    return loincOptions.find((opt) => opt.FN_loinc_id === formData.loincId);
  }, [loincOptions, formData.loincId]);

  // 1. EFEK: Fetch LOINC saat Tipe Berubah
  useEffect(() => {
    const fetchLoinc = async () => {
      setLoadingLoinc(true);
      try {
        const res = await axios.get(
          `${API_BASE_URL}pemeriksaan-penunjang/master/loinc`,
          {
            params: { category: type },
          }
        );

        const options = res.data || [];
        setLoincOptions(options);

        if (!editData && options.length > 0) {
          setFormData((prev) => ({ ...prev, loincId: options[0].FN_loinc_id }));
        }
      } catch (err) {
        console.error("Gagal load LOINC", err);
      } finally {
        setLoadingLoinc(false);
      }
    };

    fetchLoinc();
  }, [type]);

  // 2. EFEK: Populate Data saat Edit Mode
  useEffect(() => {
    if (editData) {
      setTanggal(editData.FD_tanggal_pemeriksaan.split("T")[0]);
      setIsFinal(editData.FB_is_final);

      if (editData.tipe_pemeriksaan === "BIOMETRI") {
        setType("BIOMETRI");
        setFormData((prev) => ({
          ...prev,
          loincId: editData.bio_loinc || 0,
          panjangAksial: editData.FS_panjang_aksial || "",
          kekuatanIol: editData.FS_kekuatan_iol || "",
        }));
      } else if (editData.tipe_pemeriksaan === "LAB") {
        setType("LAB");
        setFormData((prev) => ({
          ...prev,
          loincId: editData.lab_loinc || 0,
          glukosa: editData.FS_glukosa || "",
          leukosit: editData.FS_leukosit || "",
        }));
      } else if (editData.tipe_pemeriksaan === "BSCAN") {
        setType("BSCAN");
        setFormData((prev) => ({
          ...prev,
          loincId: editData.bscan_loinc || 0,
          hasil: editData.hasil_bscan || "",
        }));
      }
    } else {
      setFormData((prev) => ({
        ...prev,
        panjangAksial: "",
        kekuatanIol: "",
        indikasi: "",
        hasil: "",
        keterangan: "",
        glukosa: "",
        leukosit: "",
        koagulasi: "",
      }));
      setTanggal(new Date().toISOString().split("T")[0]);
    }
  }, [editData]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    if (!formData.loincId || formData.loincId === 0) {
      alert("Mohon pilih Jenis Pemeriksaan (Metode LOINC) terlebih dahulu.");
      setLoading(false);
      return;
    }

    const payload = {
      type,
      master: {
        FN_pasien_id: pasienId,
        FN_tenaga_kesehatan_id: nakesId,
        FD_tanggal_pemeriksaan: tanggal,
        FB_is_final: isFinal,
      },
      detail: formData,
    };

    try {
      if (editData) {
        await axios.put(
          `${API_BASE_URL}pemeriksaan-penunjang/${editData.FN_pemeriksaan_penunjang_id}`,
          payload
        );
      } else {
        await axios.post(`${API_BASE_URL}pemeriksaan-penunjang`, payload);
      }
      onSuccess();
      onClose();
    } catch (err) {
      alert("Gagal menyimpan data!");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    // 🆕 UPDATE CSS: Menghapus 'bg-black bg-opacity-50' agar background tidak gelap
    // Menggunakan backdrop-blur-sm tipis supaya teks belakang sedikit blur tapi tetap terang
    <div className="fixed inset-0 flex items-center justify-center z-50 backdrop-blur-[1px]">
      {/* Container Modal dengan shadow lebih tebal agar kontras dengan background terang */}
      <div className="bg-white rounded-xl w-full max-w-2xl p-6 shadow-2xl border border-gray-200 relative max-h-[90vh] overflow-y-auto ring-1 ring-gray-200">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-red-500 transition-colors bg-gray-50 rounded-full p-1"
        >
          ✕
        </button>
        <h2 className="text-xl font-bold text-gray-800 mb-1 flex items-center gap-2">
          {editData ? "✏️ Edit Pemeriksaan" : "➕ Tambah Pemeriksaan"}
        </h2>
        <p className="text-sm text-gray-500 mb-4 pb-2 border-b">
          Pasien:{" "}
          <span className="font-semibold text-indigo-600">{pasienName}</span>
        </p>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase text-gray-500 mb-1">
                Kategori
              </label>
              <select
                disabled={!!editData}
                value={type}
                onChange={(e) => setType(e.target.value as any)}
                className="w-full border border-gray-300 rounded-lg p-2.5 bg-gray-50 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition"
              >
                <option value="BIOMETRI">Biometri Mata</option>
                <option value="BSCAN">USG Mata (B-Scan)</option>
                <option value="LAB">Laboratorium</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold uppercase text-gray-500 mb-1">
                Tanggal
              </label>
              <input
                type="date"
                value={tanggal}
                onChange={(e) => setTanggal(e.target.value)}
                className="w-full border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-indigo-500 transition"
                required
              />
            </div>
          </div>

          {/* DROPDOWN LOINC (Metode Spesifik) */}
          <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
            <label className="block text-sm font-bold text-blue-800 mb-2">
              Metode / Jenis Spesifik (LOINC){" "}
              <span className="text-red-500">*</span>
            </label>
            <select
              value={formData.loincId}
              onChange={(e) =>
                setFormData({ ...formData, loincId: Number(e.target.value) })
              }
              className="w-full border border-blue-300 rounded-lg p-2.5 bg-white focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 shadow-sm"
              disabled={loadingLoinc}
              required
            >
              {loadingLoinc ? (
                <option value={0}>Memuat data LOINC...</option>
              ) : loincOptions.length === 0 ? (
                <option value={0}>
                  -- Tidak ada data LOINC untuk kategori ini --
                </option>
              ) : (
                loincOptions.map((opt) => (
                  // 🆕 UPDATE: Menampilkan LOINC dan SNOMED di text Option
                  <option key={opt.FN_loinc_id} value={opt.FN_loinc_id}>
                    [LOINC: {opt.FS_kode_loinc}]
                    {opt.FS_kode_snomed
                      ? ` [SNOMED: ${opt.FS_kode_snomed}] `
                      : " "}
                    - {opt.FS_deskripsi}
                  </option>
                ))
              )}
            </select>

            {/* 🆕 UPDATE: Menampilkan Badge ID di bawah dropdown setelah dipilih */}
            {selectedLoincOption && (
              <div className="mt-2 flex gap-2 text-xs">
                <span className="inline-flex items-center px-2 py-1 rounded bg-blue-200 text-blue-800 font-medium border border-blue-300">
                  LOINC: {selectedLoincOption.FS_kode_loinc}
                </span>
                {selectedLoincOption.FS_kode_snomed && (
                  <span className="inline-flex items-center px-2 py-1 rounded bg-indigo-200 text-indigo-800 font-medium border border-indigo-300">
                    SNOMED: {selectedLoincOption.FS_kode_snomed}
                  </span>
                )}
              </div>
            )}
          </div>

          <div className="border border-gray-200 p-4 rounded-lg bg-gray-50 space-y-4">
            <h3 className="font-bold text-gray-700 text-sm border-b border-gray-200 pb-2">
              📝 Input Detail Hasil
            </h3>

            {type === "BIOMETRI" && (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-medium text-gray-600 mb-1 block">
                    Panjang Aksial (mm)
                  </label>
                  <input
                    placeholder="Contoh: 23.5"
                    className="w-full border border-gray-300 p-2.5 rounded-lg focus:ring-indigo-500 focus:border-indigo-500"
                    value={formData.panjangAksial}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        panjangAksial: e.target.value,
                      })
                    }
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-600 mb-1 block">
                    Kekuatan IOL (Diopters)
                  </label>
                  <input
                    placeholder="Contoh: +21.0"
                    className="w-full border border-gray-300 p-2.5 rounded-lg focus:ring-indigo-500 focus:border-indigo-500"
                    value={formData.kekuatanIol}
                    onChange={(e) =>
                      setFormData({ ...formData, kekuatanIol: e.target.value })
                    }
                  />
                </div>
              </div>
            )}

            {type === "LAB" && (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-medium text-gray-600 mb-1 block">
                    Glukosa Darah (mg/dL)
                  </label>
                  <input
                    placeholder="Angka..."
                    className="w-full border border-gray-300 p-2.5 rounded-lg focus:ring-indigo-500 focus:border-indigo-500"
                    value={formData.glukosa}
                    onChange={(e) =>
                      setFormData({ ...formData, glukosa: e.target.value })
                    }
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-600 mb-1 block">
                    Leukosit (/uL)
                  </label>
                  <input
                    placeholder="Angka..."
                    className="w-full border border-gray-300 p-2.5 rounded-lg focus:ring-indigo-500 focus:border-indigo-500"
                    value={formData.leukosit}
                    onChange={(e) =>
                      setFormData({ ...formData, leukosit: e.target.value })
                    }
                  />
                </div>
              </div>
            )}

            <div>
              <label className="text-xs font-medium text-gray-600 mb-1 block">
                Hasil / Kesimpulan / Keterangan Tambahan
              </label>
              <textarea
                placeholder="Tulis hasil pemeriksaan atau temuan di sini..."
                className="w-full border border-gray-300 p-2.5 rounded-lg focus:ring-indigo-500 focus:border-indigo-500"
                rows={3}
                value={formData.hasil}
                onChange={(e) =>
                  setFormData({ ...formData, hasil: e.target.value })
                }
              ></textarea>
            </div>
          </div>

          <div className="flex items-center gap-2 bg-yellow-50 p-3 rounded-lg border border-yellow-100">
            <input
              type="checkbox"
              id="final"
              checked={isFinal}
              onChange={(e) => setIsFinal(e.target.checked)}
              className="h-5 w-5 text-indigo-600 rounded border-gray-300 focus:ring-indigo-500 cursor-pointer"
            />
            <label
              htmlFor="final"
              className="text-sm cursor-pointer font-medium text-gray-800"
            >
              Tandai sebagai <span className="font-bold">Final (Selesai)</span>
            </label>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 text-gray-700 bg-white border border-gray-300 hover:bg-gray-50 rounded-lg font-medium transition shadow-sm"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:bg-indigo-300 font-medium shadow-md transition transform active:scale-95"
            >
              {loading ? "Menyimpan..." : "Simpan Data"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// ==========================================
// 3. MAIN PAGE COMPONENT (Tidak Berubah Signifikan)
// ==========================================

const PemeriksaanPenunjangPage = () => {
  // --- AUTH & NAKES STATE ---
  const token = localStorage.getItem("token");
  const [nakesProfile, setNakesProfile] = useState<NakesProfile | null>(null);
  const [isNakesLoaded, setIsNakesLoaded] = useState(false);
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  // --- DATA STATE ---
  const [historyData, setHistoryData] = useState<HistoryItem[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  // --- SEARCH STATE ---
  const [searchTerm, setSearchTerm] = useState("");
  const [pasienList, setPasienList] = useState<Pasien[]>([]);
  const [selectedPasien, setSelectedPasien] = useState<Pasien | null>(null);
  const [loadingSearch, setLoadingSearch] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const searchWrapperRef = useRef<HTMLDivElement>(null);

  // --- MODAL STATE ---
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editData, setEditData] = useState<any>(null);

  // LOGIC FETCH (Sama seperti sebelumnya)
  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    window.location.reload();
  };

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

        if (nakesId === 0)
          throw new Error("ID Nakes 0. Cek format respons API.");

        setNakesProfile(profileData);
        localStorage.setItem("user", JSON.stringify(profileData));
        setMessage(null);
      } catch (err: any) {
        console.error("DEBUG: Gagal fetching profile:", err);
        if (!isFromStorage) {
          setMessage({ type: "error", text: "Gagal memuat profil Nakes." });
          handleLogout();
        }
      } finally {
        setIsNakesLoaded(true);
      }
    },
    [token]
  );

  useEffect(() => {
    const savedUser = localStorage.getItem("user");
    if (savedUser) {
      try {
        const user = JSON.parse(savedUser) as NakesProfile;
        if (user.FN_tenaga_kesehatan_id > 0) {
          setNakesProfile(user);
          setIsNakesLoaded(true);
          return;
        }
      } catch (e) {}
    }
    fetchNakesProfile(!!savedUser);
  }, [fetchNakesProfile]);

  // LOGIC SEARCH & HISTORY
  useEffect(() => {
    const delayDebounceFn = window.setTimeout(async () => {
      if (searchTerm.length >= 3 && !selectedPasien) {
        setLoadingSearch(true);
        try {
          const res = await axios.get(`${API_BASE_URL}pasien/search`, {
            params: { keyword: searchTerm },
          });
          setPasienList(res.data.data || []);
          setShowDropdown(true);
        } catch (error) {
          console.error("Search Fail", error);
        } finally {
          setLoadingSearch(false);
        }
      } else {
        setPasienList([]);
        if (!searchTerm) setShowDropdown(false);
      }
    }, 500);
    return () => clearTimeout(delayDebounceFn);
  }, [searchTerm, selectedPasien]);

  const fetchHistory = async (pasienId: number) => {
    setLoadingHistory(true);
    try {
      const res = await axios.get(
        `${API_BASE_URL}pemeriksaan-penunjang/pasien/${pasienId}`
      );
      setHistoryData(res.data.data || []);
    } catch (error) {
      console.error("History Fail", error);
    } finally {
      setLoadingHistory(false);
    }
  };

  const handleSelectPasien = (pasien: Pasien) => {
    setSelectedPasien(pasien);
    setSearchTerm(pasien.FS_nama_lengkap);
    setShowDropdown(false);
    fetchHistory(pasien.FN_pasien_id);
  };

  const handleClearSearch = () => {
    setSearchTerm("");
    setSelectedPasien(null);
    setHistoryData([]);
    setPasienList([]);
  };

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        searchWrapperRef.current &&
        !searchWrapperRef.current.contains(event.target as Node)
      ) {
        setShowDropdown(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [searchWrapperRef]);

  // LOGIC CRUD
  const handleDelete = async (id: number) => {
    if (!confirm("Yakin hapus data ini?")) return;
    try {
      await axios.delete(`${API_BASE_URL}pemeriksaan-penunjang/${id}`);
      if (selectedPasien) fetchHistory(selectedPasien.FN_pasien_id);
    } catch (err) {
      alert("Gagal menghapus data");
    }
  };

  const handleCreate = () => {
    if (!nakesProfile) {
      alert("Data Nakes belum termuat.");
      return;
    }
    setEditData(null);
    setIsModalOpen(true);
  };

  const handleEdit = (item: HistoryItem) => {
    if (!nakesProfile) {
      alert("Data Nakes belum termuat.");
      return;
    }
    setEditData(item);
    setIsModalOpen(true);
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return "-";
    return new Date(dateString).toLocaleDateString("id-ID", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  const renderHasilTemuan = (item: HistoryItem) => {
    switch (item.tipe_pemeriksaan) {
      case "BIOMETRI":
        return (
          <div className="text-sm">
            Axial: {item.FS_panjang_aksial}, IOL: {item.FS_kekuatan_iol}
          </div>
        );
      case "BSCAN":
        return <div className="text-sm italic">"{item.hasil_bscan}"</div>;
      case "LAB":
        return (
          <div className="text-sm">
            Gula: {item.FS_glukosa}, Leukosit: {item.FS_leukosit}
          </div>
        );
      default:
        return <span className="text-gray-400">-</span>;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6 font-sans text-gray-800">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* HEADER */}
        <div className="flex justify-between items-center bg-white p-4 rounded-xl shadow-sm border border-indigo-100">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">
              🏥 Pemeriksaan Penunjang
            </h1>
            <p className="text-sm text-gray-500">Modul Rekam Medis Mata</p>
          </div>
          <div className="flex items-center gap-3 bg-indigo-50 px-4 py-2 rounded-lg border border-indigo-200">
            <div className="bg-indigo-600 text-white rounded-full h-10 w-10 flex items-center justify-center font-bold">
              {nakesProfile ? nakesProfile.FS_nama_lengkap.charAt(0) : "?"}
            </div>
            <div className="text-sm">
              <p className="font-bold text-indigo-900">
                {isNakesLoaded
                  ? nakesProfile
                    ? nakesProfile.FS_nama_lengkap
                    : "Nakes Tidak Ditemukan"
                  : "Memuat..."}
              </p>
              <p className="text-indigo-600 text-xs">
                ID Nakes: {nakesProfile?.FN_tenaga_kesehatan_id || "-"}
              </p>
            </div>
          </div>
        </div>

        {/* MESSAGE */}
        {message && (
          <div
            className={`p-4 rounded-lg ${
              message.type === "error"
                ? "bg-red-100 text-red-700"
                : "bg-green-100 text-green-700"
            }`}
          >
            {message.text}
          </div>
        )}

        {/* SEARCH BAR */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="relative" ref={searchWrapperRef}>
            <label className="block text-sm font-medium text-gray-500 mb-1">
              Cari Pasien (Nama / RM)
            </label>
            <div className="relative">
              <input
                type="text"
                className="block w-full pl-4 pr-10 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 transition outline-none"
                placeholder="Ketik minimal 3 huruf..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  if (selectedPasien) setSelectedPasien(null);
                }}
              />
              <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                {loadingSearch ? (
                  <div className="animate-spin h-5 w-5 border-2 border-indigo-500 border-t-transparent rounded-full"></div>
                ) : (
                  searchTerm && (
                    <button
                      onClick={handleClearSearch}
                      className="text-gray-400 hover:text-red-500"
                    >
                      ✕
                    </button>
                  )
                )}
              </div>
            </div>
            {showDropdown && (
              <div className="absolute z-20 w-full mt-1 bg-white rounded-lg shadow-xl border border-gray-200 max-h-60 overflow-y-auto">
                {pasienList.length > 0 ? (
                  <ul className="divide-y divide-gray-100">
                    {pasienList.map((p) => (
                      <li
                        key={p.FN_pasien_id}
                        onClick={() => handleSelectPasien(p)}
                        className="px-4 py-3 hover:bg-indigo-50 cursor-pointer flex justify-between group"
                      >
                        <div>
                          <p className="font-semibold text-gray-800">
                            {p.FS_nama_lengkap}
                          </p>
                          <p className="text-xs text-gray-500">
                            RM: {p.FS_no_rm}
                          </p>
                        </div>
                        <span className="text-xs text-gray-400 group-hover:text-indigo-600">
                          Pilih
                        </span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  !loadingSearch && (
                    <div className="p-4 text-center text-gray-500 text-sm">
                      Pasien tidak ditemukan.
                    </div>
                  )
                )}
              </div>
            )}
          </div>
        </div>

        {/* CONTENT */}
        {selectedPasien && (
          <div className="space-y-4">
            <div className="flex justify-between items-end">
              <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-4 flex gap-4 items-center">
                <div className="bg-white p-2 rounded-full shadow-sm text-2xl">
                  👤
                </div>
                <div>
                  <h2 className="text-lg font-bold text-gray-800">
                    {selectedPasien.FS_nama_lengkap}
                  </h2>
                  <p className="text-sm text-gray-600">
                    RM: <b>{selectedPasien.FS_no_rm}</b> | ID:{" "}
                    {selectedPasien.FN_pasien_id}
                  </p>
                </div>
              </div>
              <button
                onClick={handleCreate}
                disabled={!nakesProfile}
                className="bg-indigo-600 text-white px-5 py-3 rounded-lg hover:bg-indigo-700 shadow-sm font-medium flex items-center gap-2 disabled:bg-gray-400"
              >
                <span>➕ Tambah Pemeriksaan</span>
              </button>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              <table className="w-full text-left border-collapse">
                <thead className="bg-gray-50 text-gray-600 uppercase text-xs font-bold tracking-wider">
                  <tr>
                    <th className="p-4 border-b">Tanggal</th>
                    <th className="p-4 border-b">Tipe</th>
                    <th className="p-4 border-b">Hasil Temuan</th>
                    <th className="p-4 border-b text-center">Status</th>
                    <th className="p-4 border-b text-center">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {loadingHistory ? (
                    <tr>
                      <td
                        colSpan={5}
                        className="p-12 text-center text-gray-500"
                      >
                        Memuat data...
                      </td>
                    </tr>
                  ) : historyData.length === 0 ? (
                    <tr>
                      <td
                        colSpan={5}
                        className="p-12 text-center text-gray-500 italic"
                      >
                        Belum ada data.
                      </td>
                    </tr>
                  ) : (
                    historyData.map((item) => (
                      <tr
                        key={item.FN_pemeriksaan_penunjang_id}
                        className="hover:bg-gray-50 transition"
                      >
                        <td className="p-4 align-top">
                          <div className="font-medium text-gray-800">
                            {formatDate(item.FD_tanggal_pemeriksaan)}
                          </div>
                          <div className="text-xs text-gray-400 mt-1">
                            Ref #{item.FN_pemeriksaan_penunjang_id}
                          </div>
                        </td>
                        <td className="p-4 align-top">
                          <span className="px-2 py-1 rounded text-xs font-bold bg-gray-100 text-gray-700">
                            {item.tipe_pemeriksaan}
                          </span>
                        </td>
                        <td className="p-4 align-top">
                          {renderHasilTemuan(item)}
                        </td>
                        <td className="p-4 text-center align-top">
                          {item.FB_is_final ? (
                            <span className="text-green-600 bg-green-100 px-2 py-1 rounded text-xs">
                              Final
                            </span>
                          ) : (
                            <span className="text-yellow-600 bg-yellow-100 px-2 py-1 rounded text-xs">
                              Draft
                            </span>
                          )}
                        </td>
                        <td className="p-4 text-center align-top space-x-2">
                          <button
                            onClick={() => handleEdit(item)}
                            className="text-indigo-600 hover:underline text-sm font-medium"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() =>
                              handleDelete(item.FN_pemeriksaan_penunjang_id)
                            }
                            className="text-red-600 hover:underline text-sm font-medium"
                          >
                            Hapus
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* MODAL */}
        {selectedPasien && nakesProfile && (
          <PemeriksaanFormModal
            isOpen={isModalOpen}
            onClose={() => setIsModalOpen(false)}
            onSuccess={() => fetchHistory(selectedPasien.FN_pasien_id)}
            pasienId={selectedPasien.FN_pasien_id}
            pasienName={selectedPasien.FS_nama_lengkap}
            nakesId={nakesProfile.FN_tenaga_kesehatan_id}
            editData={editData}
          />
        )}
      </div>
    </div>
  );
};

export default PemeriksaanPenunjangPage;
