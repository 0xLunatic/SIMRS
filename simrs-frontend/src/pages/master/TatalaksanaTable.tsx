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
  FN_tatalaksana_id: number;
  FN_pasien_id: number;
  FD_tanggal_rencana: string;
  FS_catatan_umum: string;
  FS_nama_lengkap: string;
}

interface PayloadTatalaksana {
  pasien_id: number;
  nakes_id: number;
  catatan_umum: string;
  bedah: any[];
  non_bedah: any[];
  edukasi: any[];
}

// ==========================================
// 2. COMPONENT: SNOMED SELECT (DROPDOWN PILIHAN)
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
        const res = await api.get("tatalaksana/refs/snomed", {
          params: { category: category },
        });
        setOptions(res.data.data || []);
      } catch (err) {
        console.error("Gagal load opsi dropdown", err);
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
            {loading ? "Memuat data..." : "-- Pilih Opsi --"}
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
// 3. COMPONENT: FORM MODAL (UI MATCHED)
// ==========================================

const TatalaksanaFormModal = ({
  isOpen,
  onClose,
  onSubmit,
  initialData,
  pasienId,
  nakesId,
  loading,
}: any) => {
  const [formData, setFormData] = useState<PayloadTatalaksana>({
    pasien_id: pasienId,
    nakes_id: nakesId,
    catatan_umum: "",
    bedah: [],
    non_bedah: [],
    edukasi: [],
  });

  useEffect(() => {
    if (isOpen) {
      if (initialData) {
        setFormData({
          pasien_id: initialData.FN_pasien_id,
          nakes_id: initialData.FN_tenaga_kesehatan_id,
          catatan_umum: initialData.FS_catatan_umum || "",
          bedah: (initialData.detail_bedah || []).map((d: any) => ({
            snomed_id: d.FN_snomed_id,
            rencana: d.FS_rencana,
            keterangan: d.FS_keterangan_tambahan,
          })),
          non_bedah: (initialData.detail_non_bedah || []).map((d: any) => ({
            snomed_id: d.FN_snomed_id,
            rencana: d.FS_rencana,
            keterangan: d.FS_keterangan_tambahan,
          })),
          edukasi: (initialData.detail_edukasi || []).map((d: any) => ({
            snomed_id: d.FN_snomed_id,
            topik: d.FS_topik,
            instruksi: d.FS_instruksi,
          })),
        });
      } else {
        setFormData({
          pasien_id: pasienId,
          nakes_id: nakesId,
          catatan_umum: "",
          bedah: [],
          non_bedah: [],
          edukasi: [],
        });
      }
    }
  }, [isOpen, initialData, pasienId, nakesId]);

  const addItem = (field: "bedah" | "non_bedah" | "edukasi", newItem: any) => {
    setFormData((prev) => ({ ...prev, [field]: [...prev[field], newItem] }));
  };

  const removeItem = (
    field: "bedah" | "non_bedah" | "edukasi",
    index: number
  ) => {
    setFormData((prev) => ({
      ...prev,
      [field]: prev[field].filter((_, i) => i !== index),
    }));
  };

  const updateItem = (
    field: "bedah" | "non_bedah" | "edukasi",
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

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50 backdrop-blur-[2px] bg-white/30 p-4 animate-[fadeIn_0.2s]">
      <div className="bg-white w-full max-w-5xl max-h-[90vh] rounded-xl flex flex-col shadow-2xl border border-gray-200 ring-1 ring-gray-100">
        {/* Header */}
        <div className="p-5 border-b flex justify-between items-center bg-gray-50 rounded-t-xl sticky top-0 z-10">
          <div>
            <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
              {initialData ? "✏️ Edit Tatalaksana" : "📝 Buat Tatalaksana Baru"}
            </h2>
            <p className="text-xs text-gray-500 mt-1">
              Lengkapi rencana tindakan, terapi, dan edukasi pasien.
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
                Catatan Umum / Ringkasan Klinis
              </label>
              <textarea
                className="w-full mt-1 border border-blue-200 p-2.5 rounded text-sm bg-white focus:ring-2 focus:ring-blue-400 outline-none"
                rows={2}
                placeholder="Contoh: Pasien didiagnosa Katarak Senilis Imatur OD..."
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

          {/* Bedah */}
          <div className="border border-gray-200 rounded-lg p-5 shadow-sm bg-white">
            <div className="flex justify-between items-center mb-4 pb-2 border-b border-gray-100">
              <h3 className="font-bold text-indigo-700 flex items-center gap-2 text-lg">
                <span className="bg-indigo-100 p-1 rounded">🔪</span>{" "}
                Tatalaksana Bedah
              </h3>
              <button
                onClick={() =>
                  addItem("bedah", {
                    snomed_id: 0,
                    rencana: "",
                    keterangan: "",
                  })
                }
                className="text-xs bg-indigo-600 text-white px-3 py-1.5 rounded hover:bg-indigo-700 font-medium transition shadow-sm"
              >
                + Tambah Baris
              </button>
            </div>
            {formData.bedah.map((item, idx) => (
              <div
                key={idx}
                className="grid grid-cols-1 md:grid-cols-12 gap-4 mb-4 bg-gray-50/50 p-4 rounded-lg border border-gray-100 group hover:border-indigo-200 transition"
              >
                <div className="md:col-span-5">
                  <SnomedSelect
                    label="Prosedur Bedah (Pilih)"
                    category="Tindakan Bedah"
                    valueId={item.snomed_id}
                    onSelect={(val) => {
                      updateItem("bedah", idx, "snomed_id", val.FN_snomed_id);
                      if (val.FN_snomed_id !== 0) {
                        updateItem(
                          "bedah",
                          idx,
                          "rencana",
                          val.FS_term_indonesia || val.FS_fsn_term
                        );
                      }
                    }}
                  />
                </div>
                <div className="md:col-span-4">
                  <label className="block text-xs font-bold text-gray-600 mb-1">
                    Rencana Tindakan
                  </label>
                  <input
                    type="text"
                    className="w-full border border-gray-300 p-2.5 rounded text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                    value={item.rencana}
                    onChange={(e) =>
                      updateItem("bedah", idx, "rencana", e.target.value)
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
                    value={item.keterangan}
                    onChange={(e) =>
                      updateItem("bedah", idx, "keterangan", e.target.value)
                    }
                  />
                </div>
                <div className="md:col-span-1 flex items-end justify-center pb-1">
                  <button
                    onClick={() => removeItem("bedah", idx)}
                    className="text-gray-400 hover:text-red-500 hover:bg-red-50 p-2 rounded transition"
                  >
                    🗑️
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Non-Bedah */}
          <div className="border border-gray-200 rounded-lg p-5 shadow-sm bg-white">
            <div className="flex justify-between items-center mb-4 pb-2 border-b border-gray-100">
              <h3 className="font-bold text-orange-700 flex items-center gap-2 text-lg">
                <span className="bg-orange-100 p-1 rounded">💊</span>{" "}
                Tatalaksana Non-Bedah
              </h3>
              <button
                onClick={() =>
                  addItem("non_bedah", {
                    snomed_id: 0,
                    rencana: "",
                    keterangan: "",
                  })
                }
                className="text-xs bg-orange-600 text-white px-3 py-1.5 rounded hover:bg-orange-700 font-medium transition shadow-sm"
              >
                + Tambah Baris
              </button>
            </div>
            {formData.non_bedah.map((item, idx) => (
              <div
                key={idx}
                className="grid grid-cols-1 md:grid-cols-12 gap-4 mb-4 bg-gray-50/50 p-4 rounded-lg border border-gray-100 group hover:border-orange-200 transition"
              >
                <div className="md:col-span-5">
                  <SnomedSelect
                    label="Terapi/Obat (Pilih)"
                    category="Tindakan Non Bedah"
                    valueId={item.snomed_id}
                    onSelect={(val) => {
                      updateItem(
                        "non_bedah",
                        idx,
                        "snomed_id",
                        val.FN_snomed_id
                      );
                      if (val.FN_snomed_id !== 0) {
                        updateItem(
                          "non_bedah",
                          idx,
                          "rencana",
                          val.FS_term_indonesia || val.FS_fsn_term
                        );
                      }
                    }}
                  />
                </div>
                <div className="md:col-span-4">
                  <label className="block text-xs font-bold text-gray-600 mb-1">
                    Rencana Terapi
                  </label>
                  <input
                    type="text"
                    className="w-full border border-gray-300 p-2.5 rounded text-sm focus:ring-2 focus:ring-orange-500 outline-none"
                    value={item.rencana}
                    onChange={(e) =>
                      updateItem("non_bedah", idx, "rencana", e.target.value)
                    }
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-xs font-bold text-gray-600 mb-1">
                    Dosis/Ket.
                  </label>
                  <input
                    type="text"
                    className="w-full border border-gray-300 p-2.5 rounded text-sm focus:ring-2 focus:ring-orange-500 outline-none"
                    value={item.keterangan}
                    onChange={(e) =>
                      updateItem("non_bedah", idx, "keterangan", e.target.value)
                    }
                  />
                </div>
                <div className="md:col-span-1 flex items-end justify-center pb-1">
                  <button
                    onClick={() => removeItem("non_bedah", idx)}
                    className="text-gray-400 hover:text-red-500 hover:bg-red-50 p-2 rounded transition"
                  >
                    🗑️
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Edukasi */}
          <div className="border border-gray-200 rounded-lg p-5 shadow-sm bg-white">
            <div className="flex justify-between items-center mb-4 pb-2 border-b border-gray-100">
              <h3 className="font-bold text-green-700 flex items-center gap-2 text-lg">
                <span className="bg-green-100 p-1 rounded">🗣️</span> Edukasi
                Pasien
              </h3>
              <button
                onClick={() =>
                  addItem("edukasi", {
                    snomed_id: 0,
                    topik: "",
                    instruksi: "",
                  })
                }
                className="text-xs bg-green-600 text-white px-3 py-1.5 rounded hover:bg-green-700 font-medium transition shadow-sm"
              >
                + Tambah Baris
              </button>
            </div>
            {formData.edukasi.map((item, idx) => (
              <div
                key={idx}
                className="grid grid-cols-1 md:grid-cols-12 gap-4 mb-4 bg-gray-50/50 p-4 rounded-lg border border-gray-100 group hover:border-green-200 transition"
              >
                <div className="md:col-span-5">
                  <SnomedSelect
                    label="Topik Edukasi (Pilih)"
                    category="Edukasi"
                    valueId={item.snomed_id}
                    onSelect={(val) => {
                      updateItem("edukasi", idx, "snomed_id", val.FN_snomed_id);
                      if (val.FN_snomed_id !== 0) {
                        updateItem(
                          "edukasi",
                          idx,
                          "topik",
                          val.FS_term_indonesia || val.FS_fsn_term
                        );
                      }
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
                    value={item.topik}
                    onChange={(e) =>
                      updateItem("edukasi", idx, "topik", e.target.value)
                    }
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-xs font-bold text-gray-600 mb-1">
                    Instruksi Detail
                  </label>
                  <input
                    type="text"
                    className="w-full border border-gray-300 p-2.5 rounded text-sm focus:ring-2 focus:ring-green-500 outline-none"
                    value={item.instruksi}
                    onChange={(e) =>
                      updateItem("edukasi", idx, "instruksi", e.target.value)
                    }
                  />
                </div>
                <div className="md:col-span-1 flex items-end justify-center pb-1">
                  <button
                    onClick={() => removeItem("edukasi", idx)}
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
            onClick={() => onSubmit(formData)}
            disabled={loading}
            className="px-6 py-2.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 font-bold shadow-md hover:shadow-lg transition flex items-center gap-2"
          >
            {loading ? (
              <span className="animate-spin h-4 w-4 border-2 border-white rounded-full border-t-transparent"></span>
            ) : (
              "Simpan Tatalaksana"
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

// ==========================================
// 4. COMPONENT: DETAIL MODAL (PRETTY UI)
// ==========================================

const TatalaksanaDetailModal = ({ isOpen, onClose, data, loading }: any) => {
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
              📄 Detail Tatalaksana
            </h2>
            <p className="text-xs text-gray-500 mt-1">
              ID Transaksi: #{data?.FN_tatalaksana_id || "-"}
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
                  <strong>Tanggal Rencana:</strong>{" "}
                  {formatDate(data.FD_tanggal_rencana)}
                </p>
                <p>
                  <strong>Catatan Umum:</strong> {data.FS_catatan_umum || "-"}
                </p>
              </div>

              {/* Bedah */}
              <div className="border rounded-lg overflow-hidden">
                <div className="bg-indigo-50 px-4 py-2 border-b border-indigo-100">
                  <h3 className="font-bold text-indigo-800 text-sm">
                    🔪 Tatalaksana Bedah
                  </h3>
                </div>
                {data.detail_bedah?.length > 0 ? (
                  <table className="w-full text-sm text-left">
                    <thead className="bg-gray-50 text-gray-600 border-b">
                      <tr>
                        <th className="px-4 py-2 w-1/3">Prosedur (SNOMED)</th>
                        <th className="px-4 py-2 w-1/3">Rencana</th>
                        <th className="px-4 py-2 w-1/3">Keterangan</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {data.detail_bedah.map((item: any, idx: number) => (
                        <tr key={idx} className="hover:bg-gray-50">
                          <td className="px-4 py-2 font-medium text-gray-800">
                            {item.FS_term_indonesia || item.FS_fsn_term || "-"}
                            {item.FN_snomed_id && (
                              <div className="mt-1">
                                <span className="text-[10px] bg-indigo-100 text-indigo-700 px-1.5 py-0.5 rounded font-mono">
                                  ID: {item.FN_snomed_id}
                                </span>
                              </div>
                            )}
                          </td>
                          <td className="px-4 py-2">{item.FS_rencana}</td>
                          <td className="px-4 py-2 text-gray-500">
                            {item.FS_keterangan_tambahan}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  <p className="p-4 text-sm text-gray-400 italic text-center">
                    Tidak ada data.
                  </p>
                )}
              </div>

              {/* Non Bedah */}
              <div className="border rounded-lg overflow-hidden">
                <div className="bg-orange-50 px-4 py-2 border-b border-orange-100">
                  <h3 className="font-bold text-orange-800 text-sm">
                    💊 Tatalaksana Non-Bedah
                  </h3>
                </div>
                {data.detail_non_bedah?.length > 0 ? (
                  <table className="w-full text-sm text-left">
                    <thead className="bg-gray-50 text-gray-600 border-b">
                      <tr>
                        <th className="px-4 py-2 w-1/3">Terapi (SNOMED)</th>
                        <th className="px-4 py-2 w-1/3">Rencana</th>
                        <th className="px-4 py-2 w-1/3">Dosis/Ket</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {data.detail_non_bedah.map((item: any, idx: number) => (
                        <tr key={idx} className="hover:bg-gray-50">
                          <td className="px-4 py-2 font-medium text-gray-800">
                            {item.FS_term_indonesia || item.FS_fsn_term || "-"}
                            {item.FN_snomed_id && (
                              <div className="mt-1">
                                <span className="text-[10px] bg-orange-100 text-orange-700 px-1.5 py-0.5 rounded font-mono">
                                  ID: {item.FN_snomed_id}
                                </span>
                              </div>
                            )}
                          </td>
                          <td className="px-4 py-2">{item.FS_rencana}</td>
                          <td className="px-4 py-2 text-gray-500">
                            {item.FS_keterangan_tambahan}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  <p className="p-4 text-sm text-gray-400 italic text-center">
                    Tidak ada data.
                  </p>
                )}
              </div>

              {/* Edukasi */}
              <div className="border rounded-lg overflow-hidden">
                <div className="bg-green-50 px-4 py-2 border-b border-green-100">
                  <h3 className="font-bold text-green-800 text-sm">
                    🗣️ Edukasi Pasien
                  </h3>
                </div>
                {data.detail_edukasi?.length > 0 ? (
                  <table className="w-full text-sm text-left">
                    <thead className="bg-gray-50 text-gray-600 border-b">
                      <tr>
                        <th className="px-4 py-2 w-1/3">Topik (SNOMED)</th>
                        <th className="px-4 py-2 w-1/3">Topik Utama</th>
                        <th className="px-4 py-2 w-1/3">Instruksi</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {data.detail_edukasi.map((item: any, idx: number) => (
                        <tr key={idx} className="hover:bg-gray-50">
                          <td className="px-4 py-2 font-medium text-gray-800">
                            {item.FS_term_indonesia || item.FS_fsn_term || "-"}
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
                            {item.FS_instruksi}
                          </td>
                        </tr>
                      ))}
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

const TatalaksanaPage = () => {
  const [nakesProfile, setNakesProfile] = useState<NakesProfile | null>(null);
  const [isNakesLoaded, setIsNakesLoaded] = useState(false);
  const token = localStorage.getItem("token");

  const [searchTerm, setSearchTerm] = useState("");
  const [loadingSearch, setLoadingSearch] = useState(false);
  const [pasienList, setPasienList] = useState<Pasien[]>([]);
  const [selectedPasien, setSelectedPasien] = useState<Pasien | null>(null);
  const [showDropdown, setShowDropdown] = useState(false);
  const [recordList, setRecordList] = useState<HeaderRecord[]>([]);
  const [loadingList, setLoadingList] = useState(false);

  const [showFormModal, setShowFormModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [detailData, setDetailData] = useState<any | null>(null);
  const [loadingSubmit, setLoadingSubmit] = useState(false);

  // Detail Modal
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

  // 2. Search Pasien Logic (Copied from MedicalRecordPage)
  useEffect(() => {
    const delayFn = setTimeout(async () => {
      if (searchTerm.length >= 3 && !selectedPasien) {
        setLoadingSearch(true);
        try {
          // Menggunakan endpoint yang sama dengan MedicalRecordPage
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

  const handleSelectPasien = (p: Pasien) => {
    setSelectedPasien(p);
    setSearchTerm(p.FS_nama_lengkap);
    setShowDropdown(false);
    fetchRecordList(p.FS_nama_lengkap);
  };

  const handleClearSearch = () => {
    setSearchTerm("");
    setSelectedPasien(null);
    setRecordList([]);
    setPasienList([]);
  };

  const fetchRecordList = async (nama: string) => {
    setLoadingList(true);
    try {
      const res = await api.get(`tatalaksana`, { params: { nama } });
      setRecordList(res.data.data || []);
    } catch (err) {
      console.error(err);
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
      const res = await api.get(`tatalaksana/${id}`);
      if (res.data.status) {
        setDetailData(res.data.data);
        setIsEditing(true);
        setEditingId(id);
        setShowFormModal(true);
      }
    } catch (err) {
      console.error(err);
      alert("Gagal ambil data");
    }
  };

  const handleViewDetail = async (id: number) => {
    setShowDetailModal(true);
    setLoadingDetail(true);
    try {
      const res = await api.get(`tatalaksana/${id}`);
      if (res.data.status) {
        setDetailData(res.data.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingDetail(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Hapus data tatalaksana ini?")) return;
    try {
      await api.delete(`tatalaksana/${id}`);
      if (selectedPasien) fetchRecordList(selectedPasien.FS_nama_lengkap);
    } catch (err) {
      alert("Gagal hapus");
    }
  };

  const handleFormSubmit = async (payload: PayloadTatalaksana) => {
    setLoadingSubmit(true);
    try {
      if (isEditing && editingId) {
        await api.put(`tatalaksana/${editingId}`, payload);
      } else {
        await api.post(`tatalaksana`, payload);
      }
      setShowFormModal(false);
      if (selectedPasien) fetchRecordList(selectedPasien.FS_nama_lengkap);
    } catch (error: any) {
      alert(error.message);
    } finally {
      setLoadingSubmit(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6 font-sans text-gray-800">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center bg-white p-4 rounded-xl shadow-sm border border-indigo-100 mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
              <span className="text-3xl">🩺</span> Tatalaksana Pasien
            </h1>
            <p className="text-sm text-gray-500 pl-11">
              Bedah, Non-Bedah & Edukasi
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

        {/* Search Bar */}
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

        {/* Info Pasien & Button */}
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
              <span className="text-xl">➕</span> Buat Tatalaksana
            </button>
          </div>
        )}

        {/* Table History */}
        {selectedPasien && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="p-4 border-b bg-gray-50 flex justify-between items-center">
              <h3 className="font-bold text-gray-700 flex items-center gap-2">
                <span>📋</span> Riwayat Tatalaksana
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
                  <th className="p-4">Tanggal Rencana</th>
                  <th className="p-4">Catatan Umum</th>
                  <th className="p-4 text-center">ID</th>
                  <th className="p-4 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {loadingList ? (
                  <tr>
                    <td colSpan={4} className="p-12 text-center text-gray-500">
                      <div className="flex flex-col items-center gap-3">
                        <div className="animate-spin h-6 w-6 border-2 border-indigo-500 border-t-transparent rounded-full"></div>
                        Memuat riwayat...
                      </div>
                    </td>
                  </tr>
                ) : recordList.length === 0 ? (
                  <tr>
                    <td
                      colSpan={4}
                      className="p-12 text-center text-gray-400 bg-gray-50/50"
                    >
                      <span className="text-4xl block mb-2">📭</span>Belum ada
                      data tatalaksana untuk pasien ini.
                    </td>
                  </tr>
                ) : (
                  recordList.map((rec) => (
                    <tr
                      key={rec.FN_tatalaksana_id}
                      className="hover:bg-indigo-50/30 transition group"
                    >
                      <td className="p-4">
                        <div className="font-bold text-gray-800">
                          {new Date(rec.FD_tanggal_rencana).toLocaleDateString(
                            "id-ID"
                          )}
                        </div>
                        <div className="text-xs text-gray-500 mt-1">
                          🕒{" "}
                          {new Date(rec.FD_tanggal_rencana).toLocaleTimeString(
                            "id-ID"
                          )}{" "}
                          WIB
                        </div>
                      </td>
                      <td className="p-4 text-sm text-gray-600">
                        {rec.FS_catatan_umum}
                      </td>
                      <td className="p-4 text-center text-xs font-mono text-gray-500">
                        #{rec.FN_tatalaksana_id}
                      </td>
                      <td className="p-4 text-right">
                        <button
                          onClick={() =>
                            handleViewDetail(rec.FN_tatalaksana_id)
                          }
                          className="text-blue-600 hover:underline font-medium text-sm"
                        >
                          Detail
                        </button>
                        <button
                          onClick={() => handleEdit(rec.FN_tatalaksana_id)}
                          className="text-amber-600 hover:underline font-medium text-sm ml-3"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(rec.FN_tatalaksana_id)}
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

        {/* Modals */}
        <TatalaksanaFormModal
          isOpen={showFormModal}
          onClose={() => setShowFormModal(false)}
          onSubmit={handleFormSubmit}
          initialData={isEditing ? detailData : null}
          pasienId={selectedPasien?.FN_pasien_id}
          nakesId={nakesProfile?.FN_tenaga_kesehatan_id}
          loading={loadingSubmit}
        />
        <TatalaksanaDetailModal
          isOpen={showDetailModal}
          onClose={() => setShowDetailModal(false)}
          data={detailData}
          loading={loadingDetail}
        />
      </div>
    </div>
  );
};

export default TatalaksanaPage;
