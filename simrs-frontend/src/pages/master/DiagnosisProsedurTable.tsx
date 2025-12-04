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
  FN_diagnosis_prosedur_id: number;
  FN_pasien_id: number;
  FD_tanggal_diagnosis: string;
  FB_is_final: boolean;
}

interface PayloadRecord {
  pasien_id: number;
  nakes_id: number;
  is_final: boolean;
  diagnosa_kerja: any[];
  diagnosa_banding: any[];
  diagnosa_akhir: any[];
  prosedur: any[];
}

// ==========================================
// 2. COMPONENT: REFERENCE SELECT (DROPDOWN SELECT)
// ==========================================

interface ReferenceSelectProps {
  label: string;
  apiType: "snomed" | "icd10" | "icd9" | "cpt";
  category?: string; // Khusus SNOMED (Diagnosis/Prosedur)
  valueId: number;
  onSelect: (item: any) => void;
}

const ReferenceSelect = ({
  label,
  apiType,
  category,
  valueId,
  onSelect,
}: ReferenceSelectProps) => {
  const [options, setOptions] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  // FETCH DATA SAAT MOUNT
  useEffect(() => {
    const fetchOptions = async () => {
      setLoading(true);
      try {
        // AUTO-DETECT CATEGORY Logic
        let targetCategory = category;
        if (!targetCategory) {
          if (apiType === "icd10") targetCategory = "Diagnosis";
          else if (apiType === "icd9" || apiType === "cpt")
            targetCategory = "Prosedur";
        }

        const res = await api.get("diagnosis-prosedur/search", {
          params: {
            type: apiType,
            q: "",
            category: targetCategory,
          },
        });
        setOptions(res.data.data || []);
      } catch (err) {
        console.error(`Gagal load dropdown ${label}`, err);
      } finally {
        setLoading(false);
      }
    };
    fetchOptions();
  }, [apiType, category]);

  // Helper untuk Value Option
  const getValue = (opt: any) => {
    if (apiType === "snomed") return opt.FN_snomed_id;
    if (apiType === "icd10") return opt.FN_icd10_id;
    if (apiType === "icd9") return opt.FN_icd9cm_id;
    if (apiType === "cpt") return opt.FN_cpt_id;
    return 0;
  };

  // Helper untuk Label Tampilan
  const renderLabel = (opt: any) => {
    if (apiType === "snomed") return opt.FS_term_indonesia || opt.FS_fsn_term;
    if (apiType === "icd10")
      return `[${opt.FS_kode_icd10}] ${opt.FS_deskripsi}`;
    if (apiType === "icd9")
      return `[${opt.FS_kode_icd9cm}] ${opt.FS_deskripsi}`;
    if (apiType === "cpt") return `[${opt.FS_kode_cpt}] ${opt.FS_deskripsi}`;
    return "Unknown";
  };

  // 🔍 CARI OPSI YANG SEDANG DIPILIH UNTUK MENAMPILKAN DETAIL ID
  const selectedOption = useMemo(() => {
    return options.find((opt) => getValue(opt) === valueId);
  }, [options, valueId, apiType]);

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedVal = e.target.value;
    // Cari object asli dari array options
    const selectedItem = options.find(
      (opt) => String(getValue(opt)) === selectedVal
    );
    onSelect(selectedItem || null);
  };

  return (
    <div className="w-full">
      <label className="block text-xs font-bold text-gray-600 mb-1">
        {label}
      </label>
      <div className="relative">
        <select
          className="w-full border border-gray-300 p-2.5 rounded text-sm focus:ring-2 focus:ring-indigo-500 outline-none bg-white appearance-none cursor-pointer transition shadow-sm hover:border-indigo-300"
          value={valueId || 0}
          onChange={handleChange}
          disabled={loading}
        >
          <option value="0">
            {loading ? "Memuat data..." : "-- Pilih Opsi --"}
          </option>
          {!loading &&
            options.map((opt, idx) => (
              <option key={idx} value={getValue(opt)}>
                {renderLabel(opt)}
              </option>
            ))}
        </select>

        {/* Ikon Panah Dropdown */}
        <div className="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none">
          <svg
            className="w-4 h-4 text-gray-500"
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

      {/* 🆕 MENAMPILKAN BADGE ID/KODE DI BAWAH DROPDOWN */}
      {selectedOption && (
        <div className="mt-1.5 animate-[fadeIn_0.3s]">
          {apiType === "snomed" && (
            <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-100 text-indigo-700 border border-indigo-200">
              SNOMED ID: {selectedOption.FN_snomed_id}
            </span>
          )}
          {apiType === "icd10" && (
            <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-green-100 text-green-700 border border-green-200">
              ICD-10 Code: {selectedOption.FS_kode_icd10}
            </span>
          )}
          {apiType === "icd9" && (
            <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-blue-100 text-blue-700 border border-blue-200">
              ICD-9 Code: {selectedOption.FS_kode_icd9cm}
            </span>
          )}
          {apiType === "cpt" && (
            <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-purple-100 text-purple-700 border border-purple-200">
              CPT Code: {selectedOption.FS_kode_cpt}
            </span>
          )}
        </div>
      )}
    </div>
  );
};

// ==========================================
// 3. COMPONENT: RECORD FORM MODAL
// ==========================================

const DiagnosisProsedurFormModal = ({
  isOpen,
  onClose,
  onSubmit,
  initialData,
  pasienId,
  nakesId,
  loading,
}: any) => {
  const [formData, setFormData] = useState<PayloadRecord>({
    pasien_id: pasienId,
    nakes_id: nakesId,
    is_final: false,
    diagnosa_kerja: [],
    diagnosa_banding: [],
    diagnosa_akhir: [],
    prosedur: [],
  });

  useEffect(() => {
    if (isOpen) {
      if (initialData) {
        // Mode Edit
        setFormData({
          pasien_id: initialData.header.FN_pasien_id,
          nakes_id: initialData.header.FN_tenaga_kesehatan_id,
          is_final: initialData.header.FB_is_final,
          diagnosa_kerja: initialData.diagnosa_kerja.map((d: any) => ({
            snomed_id: d.FN_snomed_id,
            deskripsi: d.deskripsi_dokter,
            keterangan: d.FS_keterangan_tambahan,
          })),
          diagnosa_banding: initialData.diagnosa_banding.map((d: any) => ({
            snomed_id: d.FN_snomed_id,
            deskripsi: d.deskripsi_dokter,
            keterangan: d.FS_keterangan_tambahan,
          })),
          diagnosa_akhir: initialData.diagnosa_akhir.map((d: any) => ({
            icd10_id: d.FN_icd10_id,
            deskripsi: d.deskripsi_dokter,
            keterangan: d.FS_keterangan_tambahan,
          })),
          prosedur: initialData.prosedur.map((d: any) => ({
            snomed_id: d.FN_snomed_id,
            icd9_id: d.FN_icd9cm_id,
            cpt_id: d.FN_cpt_id,
            nama_prosedur: d.deskripsi_dokter,
            keterangan: d.FS_keterangan_tambahan,
          })),
        });
      } else {
        // Mode Create
        setFormData({
          pasien_id: pasienId,
          nakes_id: nakesId,
          is_final: false,
          diagnosa_kerja: [],
          diagnosa_banding: [],
          diagnosa_akhir: [],
          prosedur: [],
        });
      }
    }
  }, [isOpen, initialData, pasienId, nakesId]);

  const addItem = (field: keyof PayloadRecord, newItem: any) => {
    setFormData((prev) => ({
      ...prev,
      [field]: [...(prev[field] as any[]), newItem],
    }));
  };

  const removeItem = (field: keyof PayloadRecord, index: number) => {
    setFormData((prev) => ({
      ...prev,
      [field]: (prev[field] as any[]).filter((_, i) => i !== index),
    }));
  };

  const updateItem = (
    field: keyof PayloadRecord,
    index: number,
    key: string,
    val: any
  ) => {
    setFormData((prev) => {
      const newArr = [...(prev[field] as any[])];
      newArr[index] = { ...newArr[index], [key]: val };
      return { ...prev, [field]: newArr };
    });
  };

  if (!isOpen) return null;

  return (
    // 🆕 MODAL STYLE UPDATE: Backdrop Blur & Transparan (Tidak Gelap Pekat)
    <div className="fixed inset-0 flex items-center justify-center z-50 backdrop-blur-[2px] bg-white/30 p-4 animate-[fadeIn_0.2s]">
      {/* Container Modal dengan Shadow Tebal agar kontras */}
      <div className="bg-white w-full max-w-5xl max-h-[90vh] rounded-xl flex flex-col shadow-2xl border border-gray-200 ring-1 ring-gray-100">
        {/* Header */}
        <div className="p-5 border-b flex justify-between items-center bg-gray-50 rounded-t-xl sticky top-0 z-10">
          <div>
            <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
              {initialData ? "✏️ Edit Rekam Medis" : "📝 Buat Rekam Medis Baru"}
            </h2>
            <p className="text-xs text-gray-500 mt-1">
              Lengkapi data diagnosis dan prosedur.
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-red-500 text-2xl font-bold leading-none w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-200 transition"
          >
            &times;
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-8 bg-white scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
          <div className="grid grid-cols-2 gap-4 bg-blue-50/50 p-4 rounded-lg border border-blue-100">
            <div>
              <label className="text-xs font-bold text-gray-500 uppercase">
                Dokter
              </label>
              <div className="text-sm font-bold text-gray-800">
                ID: {formData.nakes_id}
              </div>
            </div>
            <div>
              <label className="text-xs font-bold text-gray-500 uppercase">
                Status
              </label>
              <select
                className="w-full mt-1 border border-blue-200 p-1.5 rounded text-sm bg-white cursor-pointer"
                value={formData.is_final ? "true" : "false"}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    is_final: e.target.value === "true",
                  })
                }
              >
                <option value="false">📝 Draft</option>
                <option value="true">✅ Final</option>
              </select>
            </div>
          </div>

          {/* 1. DIAGNOSIS KERJA */}
          <div className="border border-gray-200 rounded-lg p-5 shadow-sm bg-white">
            <div className="flex justify-between items-center mb-4 pb-2 border-b border-gray-100">
              <h3 className="font-bold text-indigo-700 flex items-center gap-2 text-lg">
                <span className="bg-indigo-100 p-1 rounded">🩺</span> Diagnosis
                Kerja
              </h3>
              <button
                onClick={() =>
                  addItem("diagnosa_kerja", {
                    snomed_id: 0,
                    deskripsi: "",
                    keterangan: "",
                  })
                }
                className="text-xs bg-indigo-600 text-white px-3 py-1.5 rounded hover:bg-indigo-700 font-medium transition shadow-sm"
              >
                + Tambah
              </button>
            </div>
            {formData.diagnosa_kerja.map((item, idx) => (
              <div
                key={idx}
                className="grid grid-cols-1 md:grid-cols-12 gap-4 mb-4 bg-gray-50/50 p-4 rounded-lg border border-gray-100 group hover:border-indigo-200 transition"
              >
                <div className="md:col-span-5">
                  <ReferenceSelect
                    label="Pilih Diagnosis (SNOMED)"
                    apiType="snomed"
                    category="Diagnosis"
                    valueId={item.snomed_id}
                    onSelect={(val) => {
                      if (val) {
                        updateItem(
                          "diagnosa_kerja",
                          idx,
                          "snomed_id",
                          val.FN_snomed_id
                        );
                        updateItem(
                          "diagnosa_kerja",
                          idx,
                          "deskripsi",
                          val.FS_term_indonesia || val.FS_fsn_term
                        );
                      } else {
                        updateItem("diagnosa_kerja", idx, "snomed_id", 0);
                      }
                    }}
                  />
                </div>
                <div className="md:col-span-4">
                  <label className="block text-xs font-bold text-gray-600 mb-1">
                    Keterangan Klinis (Dokter)
                  </label>
                  <input
                    type="text"
                    className="w-full border border-gray-300 p-2.5 rounded text-sm focus:ring-1 focus:ring-indigo-500"
                    value={item.deskripsi}
                    onChange={(e) =>
                      updateItem(
                        "diagnosa_kerja",
                        idx,
                        "deskripsi",
                        e.target.value
                      )
                    }
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-xs font-bold text-gray-600 mb-1">
                    Catatan
                  </label>
                  <input
                    type="text"
                    className="w-full border border-gray-300 p-2.5 rounded text-sm focus:ring-1 focus:ring-indigo-500"
                    value={item.keterangan}
                    onChange={(e) =>
                      updateItem(
                        "diagnosa_kerja",
                        idx,
                        "keterangan",
                        e.target.value
                      )
                    }
                  />
                </div>
                <div className="md:col-span-1 flex items-end justify-center pb-1">
                  <button
                    onClick={() => removeItem("diagnosa_kerja", idx)}
                    className="text-gray-400 hover:text-red-500 p-2 transition"
                  >
                    🗑️
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* 2. DIAGNOSIS BANDING */}
          <div className="border border-gray-200 rounded-lg p-5 shadow-sm bg-white">
            <div className="flex justify-between items-center mb-4 pb-2 border-b border-gray-100">
              <h3 className="font-bold text-orange-700 flex items-center gap-2 text-lg">
                <span className="bg-orange-100 p-1 rounded">⚖️</span> Diagnosis
                Banding
              </h3>
              <button
                onClick={() =>
                  addItem("diagnosa_banding", {
                    snomed_id: 0,
                    deskripsi: "",
                    keterangan: "",
                  })
                }
                className="text-xs bg-orange-600 text-white px-3 py-1.5 rounded hover:bg-orange-700 font-medium transition shadow-sm"
              >
                + Tambah
              </button>
            </div>
            {formData.diagnosa_banding.map((item, idx) => (
              <div
                key={idx}
                className="grid grid-cols-1 md:grid-cols-12 gap-4 mb-4 bg-gray-50/50 p-4 rounded-lg border border-gray-100 group hover:border-orange-200 transition"
              >
                <div className="md:col-span-5">
                  <ReferenceSelect
                    label="Pilih Diagnosis (SNOMED)"
                    apiType="snomed"
                    category="Diagnosis"
                    valueId={item.snomed_id}
                    onSelect={(val) => {
                      if (val) {
                        updateItem(
                          "diagnosa_banding",
                          idx,
                          "snomed_id",
                          val.FN_snomed_id
                        );
                        updateItem(
                          "diagnosa_banding",
                          idx,
                          "deskripsi",
                          val.FS_term_indonesia || val.FS_fsn_term
                        );
                      } else {
                        updateItem("diagnosa_banding", idx, "snomed_id", 0);
                      }
                    }}
                  />
                </div>
                <div className="md:col-span-4">
                  <label className="block text-xs font-bold text-gray-600 mb-1">
                    Deskripsi
                  </label>
                  <input
                    type="text"
                    className="w-full border border-gray-300 p-2.5 rounded text-sm focus:ring-1 focus:ring-orange-500"
                    value={item.deskripsi}
                    onChange={(e) =>
                      updateItem(
                        "diagnosa_banding",
                        idx,
                        "deskripsi",
                        e.target.value
                      )
                    }
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-xs font-bold text-gray-600 mb-1">
                    Catatan
                  </label>
                  <input
                    type="text"
                    className="w-full border border-gray-300 p-2.5 rounded text-sm focus:ring-1 focus:ring-orange-500"
                    value={item.keterangan}
                    onChange={(e) =>
                      updateItem(
                        "diagnosa_banding",
                        idx,
                        "keterangan",
                        e.target.value
                      )
                    }
                  />
                </div>
                <div className="md:col-span-1 flex items-end justify-center pb-1">
                  <button
                    onClick={() => removeItem("diagnosa_banding", idx)}
                    className="text-gray-400 hover:text-red-500 p-2 transition"
                  >
                    🗑️
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* 3. DIAGNOSIS AKHIR (ICD-10) */}
          <div className="border border-gray-200 rounded-lg p-5 shadow-sm bg-white">
            <div className="flex justify-between items-center mb-4 pb-2 border-b border-gray-100">
              <h3 className="font-bold text-green-700 flex items-center gap-2 text-lg">
                <span className="bg-green-100 p-1 rounded">🏁</span> Diagnosis
                Akhir (ICD-10)
              </h3>
              <button
                onClick={() =>
                  addItem("diagnosa_akhir", {
                    icd10_id: 0,
                    deskripsi: "",
                    keterangan: "",
                  })
                }
                className="text-xs bg-green-600 text-white px-3 py-1.5 rounded hover:bg-green-700 font-medium transition shadow-sm"
              >
                + Tambah
              </button>
            </div>
            {formData.diagnosa_akhir.map((item, idx) => (
              <div
                key={idx}
                className="grid grid-cols-1 md:grid-cols-12 gap-4 mb-4 bg-gray-50/50 p-4 rounded-lg border border-gray-100 group hover:border-green-200 transition"
              >
                <div className="md:col-span-5">
                  <ReferenceSelect
                    label="Pilih Kode ICD-10"
                    apiType="icd10"
                    valueId={item.icd10_id}
                    onSelect={(val) => {
                      if (val) {
                        updateItem(
                          "diagnosa_akhir",
                          idx,
                          "icd10_id",
                          val.FN_icd10_id
                        );
                        updateItem(
                          "diagnosa_akhir",
                          idx,
                          "deskripsi",
                          val.FS_deskripsi
                        );
                      } else {
                        updateItem("diagnosa_akhir", idx, "icd10_id", 0);
                      }
                    }}
                  />
                </div>
                <div className="md:col-span-4">
                  <label className="block text-xs font-bold text-gray-600 mb-1">
                    Diagnosis Klinis
                  </label>
                  <input
                    type="text"
                    className="w-full border border-gray-300 p-2.5 rounded text-sm focus:ring-1 focus:ring-green-500"
                    value={item.deskripsi}
                    onChange={(e) =>
                      updateItem(
                        "diagnosa_akhir",
                        idx,
                        "deskripsi",
                        e.target.value
                      )
                    }
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-xs font-bold text-gray-600 mb-1">
                    Catatan
                  </label>
                  <input
                    type="text"
                    className="w-full border border-gray-300 p-2.5 rounded text-sm focus:ring-1 focus:ring-green-500"
                    value={item.keterangan}
                    onChange={(e) =>
                      updateItem(
                        "diagnosa_akhir",
                        idx,
                        "keterangan",
                        e.target.value
                      )
                    }
                  />
                </div>
                <div className="md:col-span-1 flex items-end justify-center pb-1">
                  <button
                    onClick={() => removeItem("diagnosa_akhir", idx)}
                    className="text-gray-400 hover:text-red-500 p-2 transition"
                  >
                    🗑️
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* 4. PROSEDUR */}
          <div className="border border-gray-200 rounded-lg p-5 shadow-sm bg-white">
            <div className="flex justify-between items-center mb-4 pb-2 border-b border-gray-100">
              <h3 className="font-bold text-blue-700 flex items-center gap-2 text-lg">
                <span className="bg-blue-100 p-1 rounded">🛠️</span> Prosedur &
                Tindakan
              </h3>
              <button
                onClick={() =>
                  addItem("prosedur", { nama_prosedur: "", keterangan: "" })
                }
                className="text-xs bg-blue-600 text-white px-3 py-1.5 rounded hover:bg-blue-700 font-medium transition shadow-sm"
              >
                + Tambah
              </button>
            </div>
            {formData.prosedur.map((item, idx) => (
              <div
                key={idx}
                className="bg-gray-50/50 p-4 rounded-lg border border-gray-100 mb-4 group hover:border-blue-200 transition"
              >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-3">
                  {/* ICD-9 */}
                  <ReferenceSelect
                    label="Pilih ICD-9 CM (Prosedur)"
                    apiType="icd9"
                    valueId={item.icd9_id}
                    onSelect={(val) => {
                      if (val) {
                        updateItem(
                          "prosedur",
                          idx,
                          "icd9_id",
                          val.FN_icd9cm_id
                        );
                        if (!item.nama_prosedur)
                          updateItem(
                            "prosedur",
                            idx,
                            "nama_prosedur",
                            val.FS_deskripsi
                          );
                      } else {
                        updateItem("prosedur", idx, "icd9_id", 0);
                      }
                    }}
                  />
                  {/* CPT */}
                  <ReferenceSelect
                    label="Pilih CPT (Billing)"
                    apiType="cpt"
                    valueId={item.cpt_id}
                    onSelect={(val) => {
                      if (val)
                        updateItem("prosedur", idx, "cpt_id", val.FN_cpt_id);
                      else updateItem("prosedur", idx, "cpt_id", 0);
                    }}
                  />
                </div>
                {/* SNOMED Prosedur */}
                <div className="mb-3">
                  <ReferenceSelect
                    label="Pilih SNOMED CT (Prosedur)"
                    apiType="snomed"
                    category="Prosedur"
                    valueId={item.snomed_id}
                    onSelect={(val) => {
                      if (val) {
                        updateItem(
                          "prosedur",
                          idx,
                          "snomed_id",
                          val.FN_snomed_id
                        );
                        if (!item.nama_prosedur)
                          updateItem(
                            "prosedur",
                            idx,
                            "nama_prosedur",
                            val.FS_term_indonesia || val.FS_fsn_term
                          );
                      } else {
                        updateItem("prosedur", idx, "snomed_id", 0);
                      }
                    }}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                  <div className="md:col-span-8">
                    <label className="block text-xs font-bold text-gray-600 mb-1">
                      Nama Tindakan (Manual)
                    </label>
                    <input
                      type="text"
                      className="w-full border border-gray-300 p-2.5 rounded text-sm focus:ring-1 focus:ring-blue-500"
                      value={item.nama_prosedur}
                      onChange={(e) =>
                        updateItem(
                          "prosedur",
                          idx,
                          "nama_prosedur",
                          e.target.value
                        )
                      }
                    />
                  </div>
                  <div className="md:col-span-3">
                    <label className="block text-xs font-bold text-gray-600 mb-1">
                      Catatan
                    </label>
                    <input
                      type="text"
                      className="w-full border border-gray-300 p-2.5 rounded text-sm focus:ring-1 focus:ring-blue-500"
                      value={item.keterangan}
                      onChange={(e) =>
                        updateItem(
                          "prosedur",
                          idx,
                          "keterangan",
                          e.target.value
                        )
                      }
                    />
                  </div>
                  <div className="md:col-span-1 flex items-end justify-center pb-1">
                    <button
                      onClick={() => removeItem("prosedur", idx)}
                      className="text-gray-400 hover:text-red-500 p-2 transition"
                    >
                      🗑️
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
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
              "Simpan Rekam Medis"
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

// ==========================================
// 4. COMPONENT: RECORD DETAIL MODAL (Tidak Berubah)
// ==========================================

const RecordDetailModal = ({ isOpen, onClose, data, loading }: any) => {
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
      className="fixed inset-0 flex items-center justify-center z-50 bg-black/60 backdrop-blur-sm p-4 animate-[fadeIn_0.2s]"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl border border-gray-100"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Modal */}
        <div className="p-5 border-b flex justify-between items-center bg-gray-50 sticky top-0 z-10">
          <div>
            <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
              📄 Detail Rekam Medis
            </h2>
            <p className="text-xs text-gray-500 mt-1">
              ID Transaksi: #{data?.header?.FN_diagnosis_prosedur_id || "-"}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-red-500 text-3xl font-bold leading-none transition"
          >
            &times;
          </button>
        </div>

        {/* Body Modal */}
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
              {/* 1. Informasi Umum */}
              <div className="bg-blue-50/50 p-4 rounded-lg border border-blue-100 grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <p className="text-xs font-bold text-gray-500 uppercase">
                    Pasien
                  </p>
                  <p className="font-semibold text-gray-800">
                    {data.header?.nama_pasien}
                  </p>
                  <p className="text-xs text-gray-600 font-mono">
                    RM: {data.header?.FS_no_rm}
                  </p>
                </div>
                <div>
                  <p className="text-xs font-bold text-gray-500 uppercase">
                    Tanggal Periksa
                  </p>
                  <p className="font-semibold text-gray-800">
                    {formatDate(data.header?.FD_tanggal_diagnosis)}
                  </p>
                </div>
                <div>
                  <p className="text-xs font-bold text-gray-500 uppercase">
                    Status
                  </p>
                  <span
                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      data.header?.FB_is_final
                        ? "bg-green-100 text-green-800"
                        : "bg-yellow-100 text-yellow-800"
                    }`}
                  >
                    {data.header?.FB_is_final ? "✅ FINAL" : "📝 DRAFT"}
                  </span>
                </div>
              </div>

              {/* 2. Diagnosis Kerja */}
              <div className="border rounded-lg overflow-hidden">
                <div className="bg-indigo-50 px-4 py-2 border-b border-indigo-100">
                  <h3 className="font-bold text-indigo-800 text-sm">
                    🩺 Diagnosis Kerja
                  </h3>
                </div>
                {data.diagnosa_kerja?.length > 0 ? (
                  <table className="w-full text-sm text-left">
                    <thead className="bg-gray-50 text-gray-600 border-b">
                      <tr>
                        <th className="px-4 py-2 w-1/3">Diagnosis (SNOMED)</th>
                        <th className="px-4 py-2 w-1/3">Deskripsi Dokter</th>
                        <th className="px-4 py-2 w-1/3">Keterangan</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {data.diagnosa_kerja.map((item: any, idx: number) => (
                        <tr key={idx} className="hover:bg-gray-50">
                          <td className="px-4 py-2 font-medium text-gray-800">
                            {item.FS_term_indonesia || item.FS_fsn_term || "-"}
                          </td>
                          <td className="px-4 py-2">
                            {item.deskripsi_dokter || "-"}
                          </td>
                          <td className="px-4 py-2 text-gray-500">
                            {item.FS_keterangan_tambahan || "-"}
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

              {/* 3. Diagnosis Banding */}
              <div className="border rounded-lg overflow-hidden">
                <div className="bg-orange-50 px-4 py-2 border-b border-orange-100">
                  <h3 className="font-bold text-orange-800 text-sm">
                    ⚖️ Diagnosis Banding
                  </h3>
                </div>
                {data.diagnosa_banding?.length > 0 ? (
                  <table className="w-full text-sm text-left">
                    <thead className="bg-gray-50 text-gray-600 border-b">
                      <tr>
                        <th className="px-4 py-2 w-1/3">Diagnosis (SNOMED)</th>
                        <th className="px-4 py-2 w-1/3">Deskripsi Dokter</th>
                        <th className="px-4 py-2 w-1/3">Keterangan</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {data.diagnosa_banding.map((item: any, idx: number) => (
                        <tr key={idx} className="hover:bg-gray-50">
                          <td className="px-4 py-2 font-medium text-gray-800">
                            {item.FS_term_indonesia || item.FS_fsn_term || "-"}
                          </td>
                          <td className="px-4 py-2">
                            {item.deskripsi_dokter || "-"}
                          </td>
                          <td className="px-4 py-2 text-gray-500">
                            {item.FS_keterangan_tambahan || "-"}
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

              {/* 4. Diagnosis Akhir (ICD-10) */}
              <div className="border rounded-lg overflow-hidden">
                <div className="bg-green-50 px-4 py-2 border-b border-green-100">
                  <h3 className="font-bold text-green-800 text-sm">
                    🏁 Diagnosis Akhir (ICD-10)
                  </h3>
                </div>
                {data.diagnosa_akhir?.length > 0 ? (
                  <table className="w-full text-sm text-left">
                    <thead className="bg-gray-50 text-gray-600 border-b">
                      <tr>
                        <th className="px-4 py-2 w-1/4">Kode ICD-10</th>
                        <th className="px-4 py-2 w-1/4">Deskripsi ICD</th>
                        <th className="px-4 py-2 w-1/4">Diagnosis Klinis</th>
                        <th className="px-4 py-2 w-1/4">Keterangan</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {data.diagnosa_akhir.map((item: any, idx: number) => (
                        <tr key={idx} className="hover:bg-gray-50">
                          <td className="px-4 py-2 font-mono font-bold text-green-700">
                            {item.FS_kode_icd10 || "-"}
                          </td>
                          <td className="px-4 py-2">
                            {item.icd10_desc || "-"}
                          </td>
                          <td className="px-4 py-2 font-medium">
                            {item.deskripsi_dokter || "-"}
                          </td>
                          <td className="px-4 py-2 text-gray-500">
                            {item.FS_keterangan_tambahan || "-"}
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

              {/* 5. Prosedur */}
              <div className="border rounded-lg overflow-hidden">
                <div className="bg-blue-50 px-4 py-2 border-b border-blue-100">
                  <h3 className="font-bold text-blue-800 text-sm">
                    🛠️ Prosedur & Tindakan
                  </h3>
                </div>
                {data.prosedur?.length > 0 ? (
                  <table className="w-full text-sm text-left">
                    <thead className="bg-gray-50 text-gray-600 border-b">
                      <tr>
                        <th className="px-4 py-2 w-1/4">Nama Tindakan</th>
                        <th className="px-4 py-2 w-1/4">Kode Referensi</th>
                        <th className="px-4 py-2 w-1/4">Deskripsi Referensi</th>
                        <th className="px-4 py-2 w-1/4">Keterangan</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {data.prosedur.map((item: any, idx: number) => (
                        <tr key={idx} className="hover:bg-gray-50">
                          <td className="px-4 py-2 font-bold text-gray-800">
                            {item.deskripsi_dokter || "-"}
                          </td>
                          <td className="px-4 py-2">
                            <div className="flex flex-col gap-1">
                              {item.FS_kode_icd9cm && (
                                <span className="bg-blue-100 text-blue-800 px-1.5 py-0.5 rounded text-[10px] font-mono w-fit">
                                  ICD9: {item.FS_kode_icd9cm}
                                </span>
                              )}
                              {item.FS_kode_cpt && (
                                <span className="bg-purple-100 text-purple-800 px-1.5 py-0.5 rounded text-[10px] font-mono w-fit">
                                  CPT: {item.FS_kode_cpt}
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="px-4 py-2 text-xs text-gray-600">
                            {item.icd9_desc ||
                              item.cpt_desc ||
                              item.snomed_desc ||
                              "-"}
                          </td>
                          <td className="px-4 py-2 text-gray-500">
                            {item.FS_keterangan_tambahan || "-"}
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

        {/* Footer Modal */}
        <div className="p-4 border-t bg-gray-50 flex justify-end">
          <button
            onClick={onClose}
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2.5 rounded-lg font-bold shadow-sm transition"
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

const MedicalRecordPage = () => {
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
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [loadingDetail, setLoadingDetail] = useState(false);

  const searchWrapperRef = useRef<HTMLDivElement>(null);

  const fetchNakesProfile = useCallback(async () => {
    setIsNakesLoaded(false);
    if (!token) {
      setIsNakesLoaded(true);
      return;
    }
    try {
      const res = await api.get(`auth/profile`);
      setNakesProfile({
        FN_tenaga_kesehatan_id:
          res.data.FN_tenaga_kesehatan_id || res.data.id || 0,
        FS_nama_lengkap: res.data.nama_lengkap || res.data.name,
        role: res.data.role,
      });
    } catch (err) {
      console.error("Profile Error", err);
    } finally {
      setIsNakesLoaded(true);
    }
  }, [token]);

  useEffect(() => {
    fetchNakesProfile();
  }, [fetchNakesProfile]);

  useEffect(() => {
    const delayFn = setTimeout(async () => {
      if (searchTerm.length >= 3 && !selectedPasien) {
        setLoadingSearch(true);
        try {
          const res = await api.get(`diagnosis-prosedur/pasien/search`, {
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
    fetchRecordList(p.FN_pasien_id);
  };

  const handleClearSearch = () => {
    setSearchTerm("");
    setSelectedPasien(null);
    setRecordList([]);
    setPasienList([]);
  };

  const fetchRecordList = async (pasienId: number) => {
    setLoadingList(true);
    try {
      const res = await api.get(`diagnosis-prosedur/history/${pasienId}`);
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
    setLoadingList(true);
    try {
      const res = await api.get(`diagnosis-prosedur/record/${id}`);
      if (res.data.success) {
        setDetailData(res.data.data);
        setIsEditing(true);
        setEditingId(id);
        setShowFormModal(true);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingList(false);
    }
  };

  const handleViewDetail = async (id: number) => {
    setShowDetailModal(true);
    setLoadingDetail(true);
    try {
      const res = await api.get(`diagnosis-prosedur/record/${id}`);
      setDetailData(res.data.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingDetail(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Hapus data?")) return;
    try {
      await api.delete(`diagnosis-prosedur/delete/${id}`);
      if (selectedPasien) fetchRecordList(selectedPasien.FN_pasien_id);
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleFormSubmit = async (payload: PayloadRecord) => {
    setLoadingSubmit(true);
    try {
      if (isEditing && editingId) {
        await api.put(`diagnosis-prosedur/update/${editingId}`, payload);
      } else {
        await api.post(`diagnosis-prosedur/create`, payload);
      }
      setShowFormModal(false);
      if (selectedPasien) fetchRecordList(selectedPasien.FN_pasien_id);
    } catch (error: any) {
      alert("Gagal: " + (error.response?.data?.message || error.message));
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
              <span className="text-3xl">🏥</span> Diagnosis & Prosedur
            </h1>
            <p className="text-sm text-gray-500 pl-11">
              Modul Rekam Medis Mata
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
                    : "Nakes Tidak Ditemukan"
                  : "Memuat..."}
              </p>
              <p className="text-indigo-600 text-xs">
                ID: {nakesProfile?.FN_tenaga_kesehatan_id || "-"}
              </p>
            </div>
          </div>
        </div>

        {/* Search Bar */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
          <div className="relative" ref={searchWrapperRef}>
            <label className="block text-sm font-bold text-gray-700 mb-2">
              Cari Pasien
            </label>
            <div className="relative">
              <input
                type="text"
                className="block w-full pl-10 pr-10 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
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
                      className="text-gray-400 hover:text-red-500"
                    >
                      ✕
                    </button>
                  )
                )}
              </div>
            </div>
            {showDropdown && (
              <div className="absolute z-20 w-full mt-2 bg-white rounded-lg shadow-xl border max-h-60 overflow-y-auto">
                {pasienList.length > 0
                  ? pasienList.map((p) => (
                      <li
                        key={p.FN_pasien_id}
                        onClick={() => handleSelectPasien(p)}
                        className="px-4 py-3 hover:bg-indigo-50 cursor-pointer flex justify-between items-center border-b last:border-0"
                      >
                        <div>
                          <p className="font-bold text-gray-800">
                            {p.FS_nama_lengkap}
                          </p>
                          <p className="text-xs text-gray-500">
                            RM: {p.FS_no_rm}
                          </p>
                        </div>
                        <span className="text-xs text-indigo-600 font-medium">
                          Pilih ➔
                        </span>
                      </li>
                    ))
                  : !loadingSearch && (
                      <div className="p-4 text-center text-gray-500">
                        Pasien tidak ditemukan.
                      </div>
                    )}
              </div>
            )}
          </div>
        </div>

        {/* Info Pasien */}
        {selectedPasien && (
          <div className="flex justify-between items-center mb-6 animate-[fadeIn_0.3s]">
            <div className="bg-indigo-50 p-4 rounded-lg border border-indigo-200 flex items-center gap-4">
              <div className="text-2xl bg-white p-2 rounded-full shadow-sm">
                👤
              </div>
              <div>
                <h2 className="text-lg font-bold text-gray-800">
                  {selectedPasien.FS_nama_lengkap}
                </h2>
                <p className="text-sm text-indigo-700 font-mono">
                  RM: {selectedPasien.FS_no_rm}
                </p>
              </div>
            </div>
            <button
              onClick={handleCreateNew}
              className="bg-emerald-500 hover:bg-emerald-600 text-white px-6 py-3 rounded-lg shadow-md font-bold flex items-center gap-2 transition hover:-translate-y-0.5"
            >
              <span>➕</span> Buat Baru
            </button>
          </div>
        )}

        {/* Table */}
        {selectedPasien && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="p-4 border-b bg-gray-50 flex justify-between items-center">
              <h3 className="font-bold text-gray-700 flex items-center gap-2">
                <span>📋</span> Riwayat Transaksi
              </h3>
              <button
                onClick={() => fetchRecordList(selectedPasien.FN_pasien_id)}
                className="text-sm text-indigo-600 hover:text-indigo-800 font-medium flex items-center gap-1"
              >
                🔄 Refresh
              </button>
            </div>
            <table className="w-full text-left">
              <thead className="bg-gray-100 text-gray-600 text-xs uppercase tracking-wider font-semibold">
                <tr>
                  <th className="p-4">Tanggal</th>
                  <th className="p-4 text-center">Status</th>
                  <th className="p-4 text-center">ID</th>
                  <th className="p-4 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {loadingList ? (
                  <tr>
                    <td colSpan={4} className="p-8 text-center text-gray-500">
                      Loading...
                    </td>
                  </tr>
                ) : recordList.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="p-8 text-center text-gray-400">
                      Belum ada data.
                    </td>
                  </tr>
                ) : (
                  recordList.map((rec) => (
                    <tr
                      key={rec.FN_diagnosis_prosedur_id}
                      className="hover:bg-indigo-50 transition"
                    >
                      <td className="p-4">
                        <div className="font-bold text-gray-800">
                          {new Date(
                            rec.FD_tanggal_diagnosis
                          ).toLocaleDateString("id-ID")}
                        </div>
                        <div className="text-xs text-gray-500 mt-1">
                          🕒{" "}
                          {new Date(
                            rec.FD_tanggal_diagnosis
                          ).toLocaleTimeString("id-ID")}
                        </div>
                      </td>
                      <td className="p-4 text-center">
                        <span
                          className={`px-2 py-1 rounded text-xs font-bold ${
                            rec.FB_is_final
                              ? "bg-green-100 text-green-700"
                              : "bg-yellow-100 text-yellow-700"
                          }`}
                        >
                          {rec.FB_is_final ? "FINAL" : "DRAFT"}
                        </span>
                      </td>
                      <td className="p-4 text-center text-xs font-mono text-gray-500">
                        #{rec.FN_diagnosis_prosedur_id}
                      </td>
                      <td className="p-4 text-right space-x-2">
                        <button
                          onClick={() =>
                            handleViewDetail(rec.FN_diagnosis_prosedur_id)
                          }
                          className="text-blue-600 hover:underline font-medium text-sm"
                        >
                          Detail
                        </button>
                        <button
                          onClick={() =>
                            handleEdit(rec.FN_diagnosis_prosedur_id)
                          }
                          className="text-amber-600 hover:underline font-medium text-sm"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() =>
                            handleDelete(rec.FN_diagnosis_prosedur_id)
                          }
                          className="text-red-600 hover:underline font-medium text-sm"
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

        <DiagnosisProsedurFormModal
          isOpen={showFormModal}
          onClose={() => setShowFormModal(false)}
          onSubmit={handleFormSubmit}
          initialData={isEditing ? detailData : null}
          pasienId={selectedPasien?.FN_pasien_id || 0}
          nakesId={nakesProfile?.FN_tenaga_kesehatan_id || 0}
          loading={loadingSubmit}
        />

        <RecordDetailModal
          isOpen={showDetailModal}
          onClose={() => setShowDetailModal(false)}
          data={detailData}
          loading={loadingDetail}
        />
      </div>
    </div>
  );
};

export default MedicalRecordPage;
