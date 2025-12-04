import React, {
  useState,
  useEffect,
  useRef,
  useCallback,
  useMemo,
} from "react";
import axios from "axios";

// ==========================================
// 1. CONFIG & API INSTANCE
// ==========================================

const getBaseUrl = () => {
  let url = import.meta.env.VITE_API_BASE_URL || "http://localhost:3000/api";
  if (!url.endsWith("/")) url += "/";
  return url;
};

const api = axios.create({
  baseURL: getBaseUrl(),
});

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
  },
  (error) => Promise.reject(error)
);

// ==========================================
// INTERFACES
// ==========================================

interface NakesProfile {
  FN_tenaga_kesehatan_id: number;
  FS_nama_lengkap: string;
  role: string;
}

interface Pasien {
  FN_pasien_id: number;
  FS_nama_lengkap: string;
  FS_no_rm: string;
}

interface HeaderRecord {
  FN_edukasi_id: number;
  FN_pasien_id: number;
  FD_tanggal_edukasi: string;
  FS_catatan_umum: string;
  FS_nama_lengkap: string;
  FS_no_rm: string;
}

interface PayloadEdukasi {
  FN_pasien_id: number;
  FS_catatan_umum: string;
  penjelasan_penyakit: any[];
  persiapan_pra_bedah: any[];
  perawatan_pasca_bedah: any[];
}

// ==========================================
// 2. COMPONENT: SNOMED SELECT
// ==========================================

interface SnomedSelectProps {
  label: string;
  category: string;
  valueId: string | number;
  onSelect: (item: any) => void;
}

const SnomedSelect = ({
  label,
  category,
  valueId,
  onSelect,
}: SnomedSelectProps) => {
  const [options, setOptions] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchOptions = async () => {
      setLoading(true);
      try {
        const res = await api.get("snomed/search?", {
          params: { category },
        });
        setOptions(res.data.data || []);
      } catch (err) {
        setOptions([]);
      } finally {
        setLoading(false);
      }
    };
    fetchOptions();
  }, [category]);

  // 🔍 LOGIKA BARU: Cari opsi yang sedang dipilih untuk menampilkan ID
  const selectedOption = useMemo(() => {
    return options.find((opt) => String(opt.FN_snomed_id) === String(valueId));
  }, [options, valueId]);

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedVal = e.target.value;
    const selectedItem = options.find(
      (opt) => String(opt.FN_snomed_id) === selectedVal
    );
    if (selectedItem) {
      onSelect(selectedItem);
    } else {
      onSelect({ FN_snomed_id: 0, FS_fsn_term: "", FS_term_indonesia: "" });
    }
  };

  return (
    <div className="w-full">
      <label className="block text-xs font-bold text-gray-600 mb-1">
        {label}
      </label>
      <div className="relative">
        <select
          className="w-full border border-gray-300 p-2.5 rounded text-sm focus:ring-2 focus:ring-indigo-500 outline-none bg-white appearance-none cursor-pointer transition shadow-sm hover:border-indigo-300"
          value={valueId ? String(valueId) : "0"}
          onChange={handleChange}
          disabled={loading}
        >
          <option value="0">
            {loading ? "Memuat..." : "-- Pilih Opsi --"}
          </option>
          {!loading &&
            options.map((opt) => (
              <option key={opt.FN_snomed_id} value={String(opt.FN_snomed_id)}>
                {opt.FS_term_indonesia
                  ? opt.FS_term_indonesia
                  : opt.FS_fsn_term}
              </option>
            ))}
        </select>
        <div className="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none">
          <svg
            className="w-4 h-4 text-gray-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M19 9l-7 7-7-7"
            ></path>
          </svg>
        </div>
      </div>

      {/* 🆕 TAMPILAN SNOMED ID DI BAWAH DROPDOWN */}
      {selectedOption && selectedOption.FN_snomed_id !== 0 && (
        <div className="mt-1.5 animate-[fadeIn_0.3s]">
          <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-100 text-indigo-700 border border-indigo-200 shadow-sm">
            SNOMED ID: {selectedOption.FN_snomed_id}
          </span>
        </div>
      )}
    </div>
  );
};

// ==========================================
// 3. COMPONENT: FORM MODAL
// ==========================================

const EdukasiFormModal = ({
  isOpen,
  onClose,
  onSubmit,
  initialData,
  pasienId,
  loading,
}: any) => {
  const [formData, setFormData] = useState({
    catatan_umum: "",
    pra_bedah: [] as any[],
    penjelasan: [] as any[],
    pasca_bedah: [] as any[],
  });

  useEffect(() => {
    if (isOpen) {
      if (initialData) {
        setFormData({
          catatan_umum: initialData.FS_catatan_umum || "",
          pra_bedah: (initialData.persiapan_pra_bedah || []).map((d: any) => ({
            snomed_id: d.FN_snomed_id,
            col1: d.FS_topik,
            col2: d.FS_keterangan,
          })),
          penjelasan: (initialData.penjelasan_penyakit || []).map((d: any) => ({
            snomed_id: d.FN_snomed_id,
            col1: d.FS_topik,
            col2: d.FS_keterangan,
          })),
          pasca_bedah: (initialData.perawatan_pasca_bedah || []).map(
            (d: any) => ({
              snomed_id: d.FN_snomed_id,
              col1: d.FS_topik,
              col2: d.FS_keterangan,
            })
          ),
        });
      } else {
        setFormData({
          catatan_umum: "",
          pra_bedah: [],
          penjelasan: [],
          pasca_bedah: [],
        });
      }
    }
  }, [isOpen, initialData]);

  const addItem = (field: "pra_bedah" | "penjelasan" | "pasca_bedah") => {
    setFormData((prev) => ({
      ...prev,
      [field]: [...prev[field], { snomed_id: 0, col1: "", col2: "" }],
    }));
  };

  const removeItem = (
    field: "pra_bedah" | "penjelasan" | "pasca_bedah",
    index: number
  ) => {
    setFormData((prev) => ({
      ...prev,
      [field]: prev[field].filter((_, i) => i !== index),
    }));
  };

  const updateItem = (
    field: "pra_bedah" | "penjelasan" | "pasca_bedah",
    index: number,
    key: string,
    val: any
  ) => {
    setFormData((prev) => {
      const newArr = [...prev[field]];
      newArr[index] = { ...newArr[index], [key]: val };
      return { ...prev, [field]: newArr };
    });
  };

  const handleSubmit = () => {
    const payload: PayloadEdukasi = {
      FN_pasien_id: pasienId,
      FS_catatan_umum: formData.catatan_umum,
      persiapan_pra_bedah: formData.pra_bedah.map((x) => ({
        FN_snomed_id: x.snomed_id,
        FS_topik: x.col1,
        FS_keterangan: x.col2,
      })),
      penjelasan_penyakit: formData.penjelasan.map((x) => ({
        FN_snomed_id: x.snomed_id,
        FS_topik: x.col1,
        FS_keterangan: x.col2,
      })),
      perawatan_pasca_bedah: formData.pasca_bedah.map((x) => ({
        FN_snomed_id: x.snomed_id,
        FS_topik: x.col1,
        FS_keterangan: x.col2,
      })),
    };
    onSubmit(payload);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50 backdrop-blur-[2px] bg-white/30 p-4 animate-[fadeIn_0.2s]">
      <div className="bg-white w-full max-w-5xl max-h-[90vh] rounded-xl flex flex-col shadow-2xl border border-gray-200 ring-1 ring-gray-100">
        <div className="p-5 border-b flex justify-between items-center bg-gray-50 rounded-t-xl sticky top-0 z-10">
          <div>
            <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
              {initialData ? "✏️ Edit Data Edukasi" : "📝 Catat Edukasi Baru"}
            </h2>
            <p className="text-xs text-gray-500 mt-1">
              Lengkapi data edukasi pasien (Penyakit, Pra & Pasca Bedah).
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-red-500 text-2xl font-bold leading-none w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-200 transition"
          >
            &times;
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-8 bg-white scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
          <div className="grid grid-cols-1 gap-4 bg-blue-50/50 p-4 rounded-lg border border-blue-100">
            <div>
              <label className="text-xs font-bold text-gray-500 uppercase">
                Catatan Umum Edukasi
              </label>
              <textarea
                className="w-full mt-1 border border-blue-200 p-2.5 rounded text-sm bg-white focus:ring-2 focus:ring-blue-400 outline-none"
                rows={2}
                placeholder="Contoh: Pasien dan keluarga mengerti penjelasan..."
                value={formData.catatan_umum}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    catatan_umum: e.target.value,
                  }))
                }
              />
            </div>
          </div>

          {/* PRA BEDAH (UNGU) */}
          <div className="border border-gray-200 rounded-lg p-5 shadow-sm bg-white">
            <div className="flex justify-between items-center mb-4 pb-2 border-b border-gray-100">
              <h3 className="font-bold text-indigo-700 flex items-center gap-2 text-lg">
                <span className="bg-indigo-100 p-1 rounded">🔪</span> Persiapan
                Pra-Bedah
              </h3>
              <button
                onClick={() => addItem("pra_bedah")}
                className="text-xs bg-indigo-600 text-white px-3 py-1.5 rounded hover:bg-indigo-700 font-medium transition shadow-sm"
              >
                + Tambah Baris
              </button>
            </div>
            {formData.pra_bedah.map((item, idx) => (
              <div
                key={idx}
                className="grid grid-cols-1 md:grid-cols-12 gap-4 mb-4 bg-gray-50/50 p-4 rounded-lg border border-gray-100 group hover:border-indigo-200 transition"
              >
                <div className="md:col-span-5">
                  <SnomedSelect
                    label="Topik (Pilih)"
                    category="Edukasi Pra Bedah"
                    valueId={item.snomed_id}
                    onSelect={(val) => {
                      updateItem(
                        "pra_bedah",
                        idx,
                        "snomed_id",
                        val.FN_snomed_id
                      );
                      if (val.FN_snomed_id !== 0)
                        updateItem(
                          "pra_bedah",
                          idx,
                          "col1",
                          val.FS_term_indonesia || val.FS_fsn_term
                        );
                    }}
                  />
                </div>
                <div className="md:col-span-4">
                  <label className="block text-xs font-bold text-gray-600 mb-1">
                    Topik Utama
                  </label>
                  <input
                    type="text"
                    className="w-full border border-gray-300 p-2.5 rounded text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                    value={item.col1}
                    onChange={(e) =>
                      updateItem("pra_bedah", idx, "col1", e.target.value)
                    }
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-xs font-bold text-gray-600 mb-1">
                    Keterangan
                  </label>
                  <input
                    type="text"
                    className="w-full border border-gray-300 p-2.5 rounded text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                    value={item.col2}
                    onChange={(e) =>
                      updateItem("pra_bedah", idx, "col2", e.target.value)
                    }
                  />
                </div>
                <div className="md:col-span-1 flex items-end justify-center pb-1">
                  <button
                    onClick={() => removeItem("pra_bedah", idx)}
                    className="text-gray-400 hover:text-red-500 hover:bg-red-50 p-2 rounded transition"
                  >
                    🗑️
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* PENJELASAN PENYAKIT (ORANGE) */}
          <div className="border border-gray-200 rounded-lg p-5 shadow-sm bg-white">
            <div className="flex justify-between items-center mb-4 pb-2 border-b border-gray-100">
              <h3 className="font-bold text-orange-700 flex items-center gap-2 text-lg">
                <span className="bg-orange-100 p-1 rounded">💊</span> Penjelasan
                Penyakit
              </h3>
              <button
                onClick={() => addItem("penjelasan")}
                className="text-xs bg-orange-600 text-white px-3 py-1.5 rounded hover:bg-orange-700 font-medium transition shadow-sm"
              >
                + Tambah Baris
              </button>
            </div>
            {formData.penjelasan.map((item, idx) => (
              <div
                key={idx}
                className="grid grid-cols-1 md:grid-cols-12 gap-4 mb-4 bg-gray-50/50 p-4 rounded-lg border border-gray-100 group hover:border-orange-200 transition"
              >
                <div className="md:col-span-5">
                  <SnomedSelect
                    label="Topik (Pilih)"
                    category="Edukasi Penyakit"
                    valueId={item.snomed_id}
                    onSelect={(val) => {
                      updateItem(
                        "penjelasan",
                        idx,
                        "snomed_id",
                        val.FN_snomed_id
                      );
                      if (val.FN_snomed_id !== 0)
                        updateItem(
                          "penjelasan",
                          idx,
                          "col1",
                          val.FS_term_indonesia || val.FS_fsn_term
                        );
                    }}
                  />
                </div>
                <div className="md:col-span-4">
                  <label className="block text-xs font-bold text-gray-600 mb-1">
                    Topik Utama
                  </label>
                  <input
                    type="text"
                    className="w-full border border-gray-300 p-2.5 rounded text-sm focus:ring-2 focus:ring-orange-500 outline-none"
                    value={item.col1}
                    onChange={(e) =>
                      updateItem("penjelasan", idx, "col1", e.target.value)
                    }
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-xs font-bold text-gray-600 mb-1">
                    Keterangan
                  </label>
                  <input
                    type="text"
                    className="w-full border border-gray-300 p-2.5 rounded text-sm focus:ring-2 focus:ring-orange-500 outline-none"
                    value={item.col2}
                    onChange={(e) =>
                      updateItem("penjelasan", idx, "col2", e.target.value)
                    }
                  />
                </div>
                <div className="md:col-span-1 flex items-end justify-center pb-1">
                  <button
                    onClick={() => removeItem("penjelasan", idx)}
                    className="text-gray-400 hover:text-red-500 hover:bg-red-50 p-2 rounded transition"
                  >
                    🗑️
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* PASCA BEDAH (HIJAU) */}
          <div className="border border-gray-200 rounded-lg p-5 shadow-sm bg-white">
            <div className="flex justify-between items-center mb-4 pb-2 border-b border-gray-100">
              <h3 className="font-bold text-green-700 flex items-center gap-2 text-lg">
                <span className="bg-green-100 p-1 rounded">🗣️</span> Perawatan
                Pasca-Bedah
              </h3>
              <button
                onClick={() => addItem("pasca_bedah")}
                className="text-xs bg-green-600 text-white px-3 py-1.5 rounded hover:bg-green-700 font-medium transition shadow-sm"
              >
                + Tambah Baris
              </button>
            </div>
            {formData.pasca_bedah.map((item, idx) => (
              <div
                key={idx}
                className="grid grid-cols-1 md:grid-cols-12 gap-4 mb-4 bg-gray-50/50 p-4 rounded-lg border border-gray-100 group hover:border-green-200 transition"
              >
                <div className="md:col-span-5">
                  <SnomedSelect
                    label="Topik (Pilih)"
                    category="Edukasi Pasca Bedah"
                    valueId={item.snomed_id}
                    onSelect={(val) => {
                      updateItem(
                        "pasca_bedah",
                        idx,
                        "snomed_id",
                        val.FN_snomed_id
                      );
                      if (val.FN_snomed_id !== 0)
                        updateItem(
                          "pasca_bedah",
                          idx,
                          "col1",
                          val.FS_term_indonesia || val.FS_fsn_term
                        );
                    }}
                  />
                </div>
                <div className="md:col-span-4">
                  <label className="block text-xs font-bold text-gray-600 mb-1">
                    Topik Utama
                  </label>
                  <input
                    type="text"
                    className="w-full border border-gray-300 p-2.5 rounded text-sm focus:ring-2 focus:ring-green-500 outline-none"
                    value={item.col1}
                    onChange={(e) =>
                      updateItem("pasca_bedah", idx, "col1", e.target.value)
                    }
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-xs font-bold text-gray-600 mb-1">
                    Instruksi/Keterangan
                  </label>
                  <input
                    type="text"
                    className="w-full border border-gray-300 p-2.5 rounded text-sm focus:ring-2 focus:ring-green-500 outline-none"
                    value={item.col2}
                    onChange={(e) =>
                      updateItem("pasca_bedah", idx, "col2", e.target.value)
                    }
                  />
                </div>
                <div className="md:col-span-1 flex items-end justify-center pb-1">
                  <button
                    onClick={() => removeItem("pasca_bedah", idx)}
                    className="text-gray-400 hover:text-red-500 hover:bg-red-50 p-2 rounded transition"
                  >
                    🗑️
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="p-5 border-t bg-white flex justify-end gap-3 rounded-b-xl sticky bottom-0 z-10">
          <button
            onClick={onClose}
            className="px-5 py-2.5 text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg font-medium transition"
          >
            Batal
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="px-6 py-2.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 font-bold shadow-md hover:shadow-lg transition flex items-center gap-2"
          >
            {loading ? (
              <span className="animate-spin h-4 w-4 border-2 border-white rounded-full border-t-transparent"></span>
            ) : (
              "Simpan Edukasi"
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

// ==========================================
// 4. COMPONENT: DETAIL MODAL
// ==========================================

const EdukasiDetailModal = ({ isOpen, onClose, data, loading }: any) => {
  if (!isOpen) return null;

  const formatDate = (dateString: string) => {
    if (!dateString) return "-";
    return new Date(dateString).toLocaleString("id-ID", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div
      className="fixed inset-0 flex items-center justify-center z-50 backdrop-blur-[2px] bg-white/30 p-4 animate-[fadeIn_0.2s]"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl border border-gray-200 ring-1 ring-gray-100"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-5 border-b flex justify-between items-center bg-gray-50 sticky top-0 z-10">
          <div>
            <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
              📄 Detail Edukasi
            </h2>
            <p className="text-xs text-gray-500 mt-1">
              ID Transaksi: #{data?.FN_edukasi_id || "-"}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-red-500 text-3xl font-bold leading-none transition"
          >
            &times;
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-white scrollbar-thin">
          {loading ? (
            <div className="flex flex-col items-center justify-center h-40 gap-3 text-gray-500">
              <div className="animate-spin h-8 w-8 border-4 border-indigo-500 border-t-transparent rounded-full"></div>
              <p>Memuat data...</p>
            </div>
          ) : !data ? (
            <p className="text-center text-red-500">Data tidak ditemukan.</p>
          ) : (
            <>
              {/* Info Umum */}
              <div className="bg-blue-50 p-4 rounded-lg border border-blue-100 text-sm">
                <p>
                  <strong>Pasien:</strong> {data.FS_nama_lengkap} (
                  {data.FS_no_rm})
                </p>
                <p>
                  <strong>Tanggal Edukasi:</strong>{" "}
                  {formatDate(data.FD_tanggal_edukasi)}
                </p>
                <p>
                  <strong>Catatan Umum:</strong> {data.FS_catatan_umum || "-"}
                </p>
              </div>

              {/* UI Ungu */}
              <div className="border rounded-lg overflow-hidden">
                <div className="bg-indigo-50 px-4 py-2 border-b border-indigo-100">
                  <h3 className="font-bold text-indigo-800 text-sm">
                    🔪 Persiapan Pra-Bedah
                  </h3>
                </div>
                {data.persiapan_pra_bedah?.length > 0 ? (
                  <table className="w-full text-sm text-left">
                    <thead className="bg-gray-50 text-gray-600 border-b">
                      <tr>
                        <th className="px-4 py-2 w-1/3">Topik (SNOMED)</th>
                        <th className="px-4 py-2 w-1/3">Topik Utama</th>
                        <th className="px-4 py-2 w-1/3">Keterangan</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {data.persiapan_pra_bedah.map(
                        (item: any, idx: number) => (
                          <tr key={idx} className="hover:bg-gray-50">
                            <td className="px-4 py-2 font-medium text-gray-800">
                              {item.FS_term_indonesia ||
                                item.FS_fsn_term ||
                                "-"}
                              {item.FN_snomed_id && (
                                <div className="mt-1">
                                  <span className="text-[10px] bg-indigo-100 text-indigo-700 px-1.5 py-0.5 rounded font-mono">
                                    ID: {item.FN_snomed_id}
                                  </span>
                                </div>
                              )}
                            </td>
                            <td className="px-4 py-2">{item.FS_topik}</td>
                            <td className="px-4 py-2 text-gray-500">
                              {item.FS_keterangan}
                            </td>
                          </tr>
                        )
                      )}
                    </tbody>
                  </table>
                ) : (
                  <p className="p-4 text-sm text-gray-400 italic text-center">
                    Tidak ada data.
                  </p>
                )}
              </div>

              {/* UI Orange */}
              <div className="border rounded-lg overflow-hidden">
                <div className="bg-orange-50 px-4 py-2 border-b border-orange-100">
                  <h3 className="font-bold text-orange-800 text-sm">
                    💊 Penjelasan Penyakit
                  </h3>
                </div>
                {data.penjelasan_penyakit?.length > 0 ? (
                  <table className="w-full text-sm text-left">
                    <thead className="bg-gray-50 text-gray-600 border-b">
                      <tr>
                        <th className="px-4 py-2 w-1/3">Topik (SNOMED)</th>
                        <th className="px-4 py-2 w-1/3">Topik Utama</th>
                        <th className="px-4 py-2 w-1/3">Keterangan</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {data.penjelasan_penyakit.map(
                        (item: any, idx: number) => (
                          <tr key={idx} className="hover:bg-gray-50">
                            <td className="px-4 py-2 font-medium text-gray-800">
                              {item.FS_term_indonesia ||
                                item.FS_fsn_term ||
                                "-"}
                              {item.FN_snomed_id && (
                                <div className="mt-1">
                                  <span className="text-[10px] bg-orange-100 text-orange-700 px-1.5 py-0.5 rounded font-mono">
                                    ID: {item.FN_snomed_id}
                                  </span>
                                </div>
                              )}
                            </td>
                            <td className="px-4 py-2">{item.FS_topik}</td>
                            <td className="px-4 py-2 text-gray-500">
                              {item.FS_keterangan}
                            </td>
                          </tr>
                        )
                      )}
                    </tbody>
                  </table>
                ) : (
                  <p className="p-4 text-sm text-gray-400 italic text-center">
                    Tidak ada data.
                  </p>
                )}
              </div>

              {/* UI Hijau */}
              <div className="border rounded-lg overflow-hidden">
                <div className="bg-green-50 px-4 py-2 border-b border-green-100">
                  <h3 className="font-bold text-green-800 text-sm">
                    🗣️ Perawatan Pasca-Bedah
                  </h3>
                </div>
                {data.perawatan_pasca_bedah?.length > 0 ? (
                  <table className="w-full text-sm text-left">
                    <thead className="bg-gray-50 text-gray-600 border-b">
                      <tr>
                        <th className="px-4 py-2 w-1/3">Topik (SNOMED)</th>
                        <th className="px-4 py-2 w-1/3">Topik Utama</th>
                        <th className="px-4 py-2 w-1/3">Instruksi</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {data.perawatan_pasca_bedah.map(
                        (item: any, idx: number) => (
                          <tr key={idx} className="hover:bg-gray-50">
                            <td className="px-4 py-2 font-medium text-gray-800">
                              {item.FS_term_indonesia ||
                                item.FS_fsn_term ||
                                "-"}
                              {item.FN_snomed_id && (
                                <div className="mt-1">
                                  <span className="text-[10px] bg-green-100 text-green-700 px-1.5 py-0.5 rounded font-mono">
                                    ID: {item.FN_snomed_id}
                                  </span>
                                </div>
                              )}
                            </td>
                            <td className="px-4 py-2">{item.FS_topik}</td>
                            <td className="px-4 py-2 text-gray-500">
                              {item.FS_keterangan}
                            </td>
                          </tr>
                        )
                      )}
                    </tbody>
                  </table>
                ) : (
                  <p className="p-4 text-sm text-gray-400 italic text-center">
                    Tidak ada data.
                  </p>
                )}
              </div>
            </>
          )}
        </div>
        <div className="p-4 border-t bg-gray-50 flex justify-end">
          <button
            onClick={onClose}
            className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded font-medium"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
};

// ==========================================
// 5. MAIN PAGE COMPONENT
// ==========================================

const EdukasiPage = () => {
  const [nakesProfile, setNakesProfile] = useState<NakesProfile | null>(null);
  const [isNakesLoaded, setIsNakesLoaded] = useState(false);
  const token = localStorage.getItem("token");

  const [searchTerm, setSearchTerm] = useState("");
  const [loadingSearch, setLoadingSearch] = useState(false);
  const [pasienList, setPasienList] = useState<Pasien[]>([]);
  const [selectedPasien, setSelectedPasien] = useState<Pasien | null>(null);
  const [showDropdown, setShowDropdown] = useState(false);

  // State Record List
  const [recordList, setRecordList] = useState<HeaderRecord[]>([]);
  const [loadingList, setLoadingList] = useState(false);

  // Modal States
  const [showFormModal, setShowFormModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [detailData, setDetailData] = useState<any | null>(null);
  const [loadingSubmit, setLoadingSubmit] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [loadingDetail, setLoadingDetail] = useState(false);

  const searchWrapperRef = useRef<HTMLDivElement>(null);

  // 1. Fetch Profile
  useEffect(() => {
    const fetchProfile = async () => {
      if (!token) return;
      try {
        const res = await api.get(`auth/profile`);
        setNakesProfile({
          FN_tenaga_kesehatan_id:
            res.data.FN_tenaga_kesehatan_id || res.data.id,
          FS_nama_lengkap: res.data.nama_lengkap || res.data.name,
          role: res.data.role,
        });
      } catch (err) {
        console.error(err);
      } finally {
        setIsNakesLoaded(true);
      }
    };
    fetchProfile();
  }, [token]);

  // 2. Search Pasien
  useEffect(() => {
    const delayFn = setTimeout(async () => {
      if (searchTerm.length >= 3 && !selectedPasien) {
        setLoadingSearch(true);
        try {
          const res = await api.get(`pasien/search`, {
            params: { keyword: searchTerm },
          });
          setPasienList(res.data.data || []);
          setShowDropdown(true);
        } catch (err) {
          console.error(err);
        } finally {
          setLoadingSearch(false);
        }
      } else {
        setPasienList([]);
        if (!searchTerm) setShowDropdown(false);
      }
    }, 500);
    return () => clearTimeout(delayFn);
  }, [searchTerm, selectedPasien]);

  const handleSelectPasien = (p: any) => {
    console.log("👤 Pasien Dipilih (Raw Object):", p);
    const namaPasien =
      p.FS_nama_lengkap || p.fs_nama_lengkap || p.nama_lengkap || "";
    const idPasien = p.FN_pasien_id || p.fn_pasien_id || p.id;
    const noRM = p.FS_no_rm || p.fs_no_rm || p.no_rm;

    if (!namaPasien) {
      alert("Error: Nama pasien tidak ditemukan dalam data (Cek Console)");
      return;
    }

    const pasienFixed: Pasien = {
      FN_pasien_id: idPasien,
      FS_nama_lengkap: namaPasien,
      FS_no_rm: noRM,
    };

    setSelectedPasien(pasienFixed);
    setSearchTerm(namaPasien);
    setShowDropdown(false);
    fetchRecordList(namaPasien);
  };

  const handleClearSearch = () => {
    setSearchTerm("");
    setSelectedPasien(null);
    setRecordList([]);
    setPasienList([]);
  };

  const fetchRecordList = async (nama: string) => {
    if (!nama || nama.trim() === "") {
      setRecordList([]);
      return;
    }

    setLoadingList(true);
    try {
      const res = await api.get(`edukasi`, {
        params: { nama: nama },
      });

      const rawData = res.data.data || [];
      const cleanData: HeaderRecord[] = rawData.map((item: any) => ({
        FN_edukasi_id:
          item.FN_edukasi_id ?? item.fn_edukasi_id ?? item.FN_EDUKASI_ID,
        FN_pasien_id: item.FN_pasien_id ?? item.fn_pasien_id,
        FS_nama_lengkap: item.FS_nama_lengkap ?? item.fs_nama_lengkap,
        FS_no_rm: item.FS_no_rm ?? item.fs_no_rm ?? "-",
        FD_tanggal_edukasi: item.FD_tanggal_edukasi ?? item.fd_tanggal_edukasi,
        FS_catatan_umum: item.FS_catatan_umum ?? item.fs_catatan_umum ?? "",
      }));

      setRecordList(cleanData);
    } catch (err) {
      console.error("Error Fetching:", err);
      setRecordList([]);
    } finally {
      setLoadingList(false);
    }
  };

  const handleCreateNew = () => {
    if (!selectedPasien) return alert("Pilih pasien dulu!");
    setDetailData(null);
    setIsEditing(false);
    setEditingId(null);
    setShowFormModal(true);
  };

  const handleEdit = async (id: number) => {
    try {
      const res = await api.get(`edukasi/${id}`);
      if (res.data.success) {
        setDetailData(res.data.data);
        setIsEditing(true);
        setEditingId(id);
        setShowFormModal(true);
      }
    } catch (err) {
      alert("Gagal ambil data");
    }
  };

  const handleViewDetail = async (id: number) => {
    setShowDetailModal(true);
    setLoadingDetail(true);
    try {
      const res = await api.get(`edukasi/${id}`);
      if (res.data.success) {
        setDetailData(res.data.data);
      }
    } catch (err) {
      console.error("Gagal ambil detail:", err);
    } finally {
      setLoadingDetail(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Yakin ingin menghapus data edukasi ini secara permanen?"))
      return;

    try {
      const res = await api.delete(`edukasi/${id}`);
      if (res.data && res.data.success) {
        alert(`✅ ${res.data.message}`);
        const namaRefresh = selectedPasien?.FS_nama_lengkap || searchTerm;
        if (namaRefresh) fetchRecordList(namaRefresh);
      } else {
        throw new Error(res.data?.message || "Gagal menghapus data");
      }
    } catch (err: any) {
      console.error("Delete Error:", err);
      const msg =
        err.response?.data?.message ||
        err.message ||
        "Terjadi kesalahan server";
      alert(`❌ Gagal hapus: ${msg}`);
    }
  };

  const handleFormSubmit = async (payload: PayloadEdukasi) => {
    setLoadingSubmit(true);
    try {
      let res;
      if (isEditing && editingId) {
        res = await api.put(`edukasi/${editingId}`, payload);
      } else {
        res = await api.post(`edukasi`, payload);
      }

      if (res.data && res.data.success) {
        alert(`✅ ${res.data.message}`);
        setShowFormModal(false);
        const namaRefresh = selectedPasien?.FS_nama_lengkap || searchTerm;
        if (namaRefresh) fetchRecordList(namaRefresh);
      } else {
        throw new Error(res.data?.message || "Gagal menyimpan data");
      }
    } catch (error: any) {
      console.error("Submit Error:", error);
      const msg =
        error.response?.data?.message ||
        error.message ||
        "Terjadi kesalahan server";
      alert(`❌ Gagal simpan: ${msg}`);
    } finally {
      setLoadingSubmit(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6 font-sans text-gray-800">
      <div className="max-w-6xl mx-auto">
        {/* Header & Search UI */}
        <div className="flex justify-between items-center bg-white p-4 rounded-xl shadow-sm border border-indigo-100 mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
              <span className="text-3xl">🩺</span> Edukasi Pasien
            </h1>
            <p className="text-sm text-gray-500 pl-11">
              Penyakit, Pra & Pasca Bedah
            </p>
          </div>
          <div className="flex items-center gap-3 bg-indigo-50 px-4 py-2 rounded-lg border border-indigo-200">
            <div className="bg-indigo-600 text-white rounded-full h-10 w-10 flex items-center justify-center font-bold shadow-md">
              {nakesProfile ? nakesProfile.FS_nama_lengkap.charAt(0) : "?"}
            </div>
            <div className="text-sm">
              <p className="font-bold text-indigo-900">
                {isNakesLoaded
                  ? nakesProfile
                    ? nakesProfile.FS_nama_lengkap
                    : "Nakes Tidak Dikenal"
                  : "Memuat..."}
              </p>
              <p className="text-indigo-600 text-xs">
                ID Nakes: {nakesProfile?.FN_tenaga_kesehatan_id || "-"}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
          <div className="relative" ref={searchWrapperRef}>
            <label className="block text-sm font-bold text-gray-700 mb-2">
              Cari Pasien (Nama / RM)
            </label>
            <div className="relative">
              <input
                type="text"
                className="block w-full pl-10 pr-10 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition shadow-sm outline-none"
                placeholder="Ketik minimal 3 huruf..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  if (selectedPasien) setSelectedPasien(null);
                }}
              />
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <span className="text-gray-400 text-lg">🔍</span>
              </div>
              <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                {loadingSearch ? (
                  <div className="animate-spin h-5 w-5 border-2 border-indigo-500 border-t-transparent rounded-full"></div>
                ) : (
                  searchTerm && (
                    <button
                      onClick={handleClearSearch}
                      className="text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-full p-1 transition"
                    >
                      ✕
                    </button>
                  )
                )}
              </div>
            </div>
            {showDropdown && (
              <div className="absolute z-20 w-full mt-2 bg-white rounded-lg shadow-xl border border-gray-100 max-h-60 overflow-y-auto ring-1 ring-black ring-opacity-5">
                {pasienList.length > 0 ? (
                  <ul className="divide-y divide-gray-100">
                    {pasienList.map((p) => (
                      <li
                        key={p.FN_pasien_id}
                        onClick={() => handleSelectPasien(p)}
                        className="px-4 py-3 hover:bg-indigo-50 cursor-pointer flex justify-between items-center group transition"
                      >
                        <div>
                          <p className="font-semibold text-gray-800 group-hover:text-indigo-700">
                            {p.FS_nama_lengkap}
                          </p>
                          <p className="text-xs text-gray-500 font-mono mt-0.5">
                            RM:{" "}
                            <span className="bg-gray-100 px-1 py-0.5 rounded text-gray-600">
                              {p.FS_no_rm}
                            </span>
                          </p>
                        </div>
                        <span className="text-xs text-indigo-400 opacity-0 group-hover:opacity-100 transition transform translate-x-2 group-hover:translate-x-0 font-medium">
                          Pilih Pasien ➔
                        </span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  !loadingSearch && (
                    <div className="p-8 text-center text-gray-500 text-sm flex flex-col items-center">
                      <span className="text-2xl mb-2">🤷‍♂️</span>Pasien tidak
                      ditemukan.
                    </div>
                  )
                )}
              </div>
            )}
          </div>
        </div>

        {selectedPasien && (
          <div className="flex justify-between items-center animate-[fadeIn_0.3s] mt-6 mb-6">
            <div className="bg-indigo-600 text-white p-4 rounded-xl shadow-md flex items-center gap-4 flex-1 mr-4 border border-indigo-700">
              <div className="bg-white/20 backdrop-blur-sm text-white h-12 w-12 rounded-full flex items-center justify-center font-bold text-xl border border-white/30">
                👤
              </div>
              <div>
                <h2 className="text-lg font-bold">
                  {selectedPasien.FS_nama_lengkap}
                </h2>
                <div className="flex items-center gap-2 mt-1">
                  <span className="bg-indigo-800/50 px-2 py-0.5 rounded text-xs font-mono text-indigo-100 border border-indigo-500/30">
                    RM: {selectedPasien.FS_no_rm}
                  </span>
                </div>
              </div>
            </div>
            <button
              onClick={handleCreateNew}
              className="bg-emerald-500 hover:bg-emerald-600 text-white px-6 py-4 rounded-xl shadow-lg shadow-emerald-200 font-bold flex items-center gap-2 transition transform hover:-translate-y-1 hover:shadow-xl border-b-4 border-emerald-700 active:border-b-0 active:translate-y-0"
            >
              <span className="text-xl">➕</span> Catat Edukasi
            </button>
          </div>
        )}

        {/* TABLE REKAP */}
        {selectedPasien && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="p-4 border-b bg-gray-50 flex justify-between items-center">
              <h3 className="font-bold text-gray-700 flex items-center gap-2">
                <span>📋</span> Riwayat Edukasi
              </h3>
              <button
                onClick={() => fetchRecordList(selectedPasien.FS_nama_lengkap)}
                className="text-sm text-indigo-600 hover:text-indigo-800 flex items-center gap-1 font-medium px-3 py-1 rounded hover:bg-indigo-50 transition"
              >
                🔄 Refresh Data
              </button>
            </div>
            <table className="w-full text-left">
              <thead className="bg-gray-100 text-gray-600 text-xs uppercase tracking-wider font-semibold">
                <tr>
                  <th className="p-4">Tanggal Edukasi</th>
                  <th className="p-4">Catatan Umum</th>
                  <th className="p-4 text-center">ID</th>
                  <th className="p-4 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {loadingList ? (
                  <tr>
                    <td colSpan={4} className="p-12 text-center text-gray-500">
                      Memuat riwayat...
                    </td>
                  </tr>
                ) : recordList.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="p-12 text-center text-gray-400">
                      Belum ada data edukasi.
                    </td>
                  </tr>
                ) : (
                  recordList.map((rec) => (
                    <tr
                      key={rec.FN_edukasi_id}
                      className="hover:bg-indigo-50/30 transition group"
                    >
                      <td className="p-4">
                        <div className="font-bold text-gray-800">
                          {new Date(rec.FD_tanggal_edukasi).toLocaleDateString(
                            "id-ID"
                          )}
                        </div>
                        <div className="text-xs text-gray-500 mt-1">
                          🕒{" "}
                          {new Date(rec.FD_tanggal_edukasi).toLocaleTimeString(
                            "id-ID"
                          )}{" "}
                          WIB
                        </div>
                      </td>
                      <td className="p-4 text-sm text-gray-600">
                        {rec.FS_catatan_umum}
                      </td>
                      <td className="p-4 text-center text-xs font-mono text-gray-500">
                        #{rec.FN_edukasi_id}
                      </td>
                      <td className="p-4 text-right">
                        <button
                          onClick={() => handleViewDetail(rec.FN_edukasi_id)}
                          className="text-blue-600 hover:underline font-medium text-sm"
                        >
                          Detail
                        </button>
                        <button
                          onClick={() => handleEdit(rec.FN_edukasi_id)}
                          className="text-amber-600 hover:underline font-medium text-sm ml-3"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(rec.FN_edukasi_id)}
                          className="text-red-600 hover:underline font-medium text-sm ml-3"
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
        )}

        <EdukasiFormModal
          isOpen={showFormModal}
          onClose={() => setShowFormModal(false)}
          onSubmit={handleFormSubmit}
          initialData={isEditing ? detailData : null}
          pasienId={selectedPasien?.FN_pasien_id}
          loading={loadingSubmit}
        />
        <EdukasiDetailModal
          isOpen={showDetailModal}
          onClose={() => setShowDetailModal(false)}
          data={detailData}
          loading={loadingDetail}
        />
      </div>
    </div>
  );
};

export default EdukasiPage;
