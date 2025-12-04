import React, { useState, useEffect } from "react";
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
// 2. INTERFACES
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

interface SoapRecord {
  FN_soap_id: number;
  FD_tanggal_pencatatan: string;
  FS_nama_lengkap: string;
  FS_catatan_subjective: string;
  FS_catatan_objective: string;
  FS_catatan_assessment: string;
  FS_catatan_plan: string;

  // ID Columns (Display Purpose)
  snomed_subjective?: number;
  snomed_objective?: number;
  snomed_assessment_name?: string;
  icd_assessment_code?: string;
  snomed_plan_name?: string;
}

// Payload Update (Sesuai Backend)
interface PayloadSoap {
  pasien_id: number;
  nakes_id: number;

  subjective: string;
  snomed_subjective?: number | null;

  objective: string;
  snomed_objective?: number | null;

  assessment: string;
  snomed_assessment?: number | null;
  icd_assessment?: number | null;

  plan: string;
  snomed_plan?: number | null;
}

interface SelectProps {
  label: string;
  valueId?: string | number | null;
  onSelect: (item: any) => void;
  category?: string;
  placeholder?: string;
}

// ==========================================
// 3. COMPONENT: SNOMED SELECT (DYNAMIC)
// ==========================================

const SnomedSelect = ({
  label,
  valueId,
  onSelect,
  category,
  placeholder,
}: SelectProps) => {
  const [options, setOptions] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");

  useEffect(() => {
    const fetchSnomed = async () => {
      setLoading(true);
      try {
        const res = await api.get("soap/snomed", {
          params: { category: category, keyword: search },
        });
        if (res.data && res.data.data) {
          setOptions(res.data.data);
        }
      } catch (err) {
        console.error(`Gagal load SNOMED (${category})`, err);
      } finally {
        setLoading(false);
      }
    };

    const timer = setTimeout(() => {
      fetchSnomed();
    }, 500); // Debounce search

    return () => clearTimeout(timer);
  }, [category, search]);

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    const item = options.find((opt) => String(opt.FN_snomed_id) === val);
    onSelect(item || null);
  };

  return (
    <div className="w-full mb-2">
      <label className="block text-xs font-bold text-gray-600 mb-1 flex justify-between items-center">
        <span>{label}</span>
        {valueId && valueId !== 0 ? (
          <span className="text-[10px] bg-indigo-100 text-indigo-700 px-1 rounded">
            ID: {valueId}
          </span>
        ) : null}
      </label>
      <div className="relative">
        <select
          className="w-full border border-gray-300 p-2.5 rounded text-sm focus:ring-2 focus:ring-orange-500 outline-none bg-white cursor-pointer"
          value={valueId ? String(valueId) : "0"}
          onChange={handleChange}
        >
          <option value="0">
            {loading ? "Memuat..." : placeholder || "-- Pilih --"}
          </option>
          {options.map((opt) => (
            <option key={opt.FN_snomed_id} value={String(opt.FN_snomed_id)}>
              {opt.FS_term_indonesia || opt.FS_fsn_term}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
};

// ==========================================
// 4. COMPONENT: ICD10 SELECT
// ==========================================

const Icd10Select = ({ label, valueId, onSelect }: SelectProps) => {
  const [options, setOptions] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchIcd = async () => {
      setLoading(true);
      try {
        const res = await api.get("soap/icd10", {
          params: { category: "SOAP Assessment" },
        });
        if (res.data && res.data.data) {
          setOptions(res.data.data);
        }
      } catch (err) {
        console.error("Gagal load ICD10", err);
      } finally {
        setLoading(false);
      }
    };
    fetchIcd();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    const item = options.find((opt) => String(opt.FN_icd10_id) === val);
    onSelect(item || null);
  };

  return (
    <div className="w-full mb-2">
      <label className="block text-xs font-bold text-gray-600 mb-1 flex justify-between items-center">
        <span>{label}</span>
        {valueId && valueId !== 0 ? (
          <span className="text-[10px] bg-teal-100 text-teal-700 px-1 rounded">
            ID: {valueId}
          </span>
        ) : null}
      </label>
      <div className="relative">
        <select
          className="w-full border border-gray-300 p-2.5 rounded text-sm focus:ring-2 focus:ring-orange-500 outline-none bg-white cursor-pointer"
          value={valueId ? String(valueId) : "0"}
          onChange={handleChange}
          disabled={loading}
        >
          <option value="0">
            {loading ? "Memuat..." : "-- Pilih Kode (ICD-10) --"}
          </option>
          {options.map((opt) => (
            <option key={opt.FN_icd10_id} value={String(opt.FN_icd10_id)}>
              [{opt.FS_kode_icd10}] {opt.FS_deskripsi}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
};

// ==========================================
// 5. FORM MODAL
// ==========================================

const SoapFormModal = ({
  isOpen,
  onClose,
  onSubmit,
  initialData,
  pasienId,
  nakesId,
  loading,
}: any) => {
  // State Form
  const [formData, setFormData] = useState({
    subjective: "",
    snomed_subjective: 0,

    objective: "",
    snomed_objective: 0,

    assessment: "",
    snomed_assessment: 0,
    icd_assessment: 0,

    plan: "",
    snomed_plan: 0,
  });

  useEffect(() => {
    if (isOpen) {
      if (initialData) {
        // Edit Mode: Load data
        setFormData({
          subjective: initialData.FS_catatan_subjective || "",
          snomed_subjective: initialData.snomed_subjective || 0,

          objective: initialData.FS_catatan_objective || "",
          snomed_objective: initialData.snomed_objective || 0,

          assessment: initialData.FS_catatan_assessment || "",
          snomed_assessment: initialData.snomed_assessment || 0,
          icd_assessment: initialData.icd_assessment || 0,

          plan: initialData.FS_catatan_plan || "",
          snomed_plan: initialData.snomed_plan || 0,
        });
      } else {
        // Create Mode: Reset
        setFormData({
          subjective: "",
          snomed_subjective: 0,
          objective: "",
          snomed_objective: 0,
          assessment: "",
          snomed_assessment: 0,
          icd_assessment: 0,
          plan: "",
          snomed_plan: 0,
        });
      }
    }
  }, [isOpen, initialData]);

  // LOGIC MODIFIED: Only Set ID, Do NOT Append Text
  const handleSelectId = (fieldId: string, item: any) => {
    if (!item) {
      setFormData((prev) => ({ ...prev, [fieldId]: 0 }));
      return;
    }

    // Hanya simpan ID, tidak menyentuh field text
    setFormData((prev: any) => ({
      ...prev,
      [fieldId]: item.FN_snomed_id || item.FN_icd10_id,
    }));
  };

  const handleSubmit = () => {
    const payload: PayloadSoap = {
      pasien_id: pasienId,
      nakes_id: nakesId,

      subjective: formData.subjective,
      snomed_subjective:
        formData.snomed_subjective === 0 ? null : formData.snomed_subjective,

      objective: formData.objective,
      snomed_objective:
        formData.snomed_objective === 0 ? null : formData.snomed_objective,

      assessment: formData.assessment,
      snomed_assessment:
        formData.snomed_assessment === 0 ? null : formData.snomed_assessment,
      icd_assessment:
        formData.icd_assessment === 0 ? null : formData.icd_assessment,

      plan: formData.plan,
      snomed_plan: formData.snomed_plan === 0 ? null : formData.snomed_plan,
    };
    onSubmit(payload);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-[fadeIn_0.2s]">
      <div className="bg-white w-full max-w-5xl max-h-[90vh] rounded-xl flex flex-col shadow-2xl border border-gray-100">
        {/* Header Modal */}
        <div className="p-5 border-b flex justify-between items-center bg-gray-50 rounded-t-xl sticky top-0 z-10">
          <div>
            <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
              {initialData ? "✏️ Edit SOAP" : "📝 Catat SOAP"}
            </h2>
            <p className="text-xs text-gray-500 mt-1">
              Lengkapi form rekam medis di bawah ini.
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-red-500 text-3xl font-bold"
          >
            &times;
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-white scrollbar-thin">
          {/* === GRID S & O === */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* SUBJECTIVE */}
            <div className="bg-blue-50/50 p-4 rounded-lg border border-blue-100">
              <label className="text-sm font-bold text-blue-800 uppercase flex items-center gap-2 mb-2">
                <span className="bg-blue-200 px-2 rounded">S</span> Subjective
              </label>

              {/* Dropdown S (ID ONLY) */}
              <SnomedSelect
                label="Referensi Keluhan (SNOMED ID)"
                category="SOAP Subjective"
                valueId={formData.snomed_subjective}
                onSelect={(item) => handleSelectId("snomed_subjective", item)}
              />

              <label className="text-xs font-bold text-gray-600 mt-2 block">
                Catatan Keluhan (Text Manual):
              </label>
              <textarea
                className="w-full border border-blue-200 p-3 rounded text-sm focus:ring-2 focus:ring-blue-400 outline-none"
                rows={4}
                placeholder="Ketikan keluhan pasien disini..."
                value={formData.subjective}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    subjective: e.target.value,
                  }))
                }
              />
            </div>

            {/* OBJECTIVE */}
            <div className="bg-indigo-50/50 p-4 rounded-lg border border-indigo-100">
              <label className="text-sm font-bold text-indigo-800 uppercase flex items-center gap-2 mb-2">
                <span className="bg-indigo-200 px-2 rounded">O</span> Objective
              </label>

              {/* Dropdown O (ID ONLY) */}
              <SnomedSelect
                label="Referensi Temuan (SNOMED ID)"
                category="SOAP Objective"
                valueId={formData.snomed_objective}
                onSelect={(item) => handleSelectId("snomed_objective", item)}
              />

              <label className="text-xs font-bold text-gray-600 mt-2 block">
                Catatan Pemeriksaan (Text Manual):
              </label>
              <textarea
                className="w-full border border-indigo-200 p-3 rounded text-sm focus:ring-2 focus:ring-indigo-400 outline-none"
                rows={4}
                placeholder="Hasil pemeriksaan fisik/lab..."
                value={formData.objective}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    objective: e.target.value,
                  }))
                }
              />
            </div>
          </div>

          {/* === ASSESSMENT === */}
          <div className="bg-orange-50/50 p-4 rounded-lg border border-orange-100">
            <label className="text-sm font-bold text-orange-800 uppercase flex items-center gap-2 mb-4">
              <span className="bg-orange-200 px-2 rounded">A</span> Assessment
              (Diagnosa)
            </label>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-3">
              {/* Dropdown A (SNOMED) - ID ONLY */}
              <SnomedSelect
                label="Diagnosa Klinis (SNOMED ID)"
                category="SOAP Assessment"
                valueId={formData.snomed_assessment}
                onSelect={(item) => handleSelectId("snomed_assessment", item)}
              />

              {/* Dropdown A (ICD-10) - ID ONLY */}
              <Icd10Select
                label="Kode Klaim (ICD-10 ID)"
                valueId={formData.icd_assessment}
                onSelect={(item) => handleSelectId("icd_assessment", item)}
              />
            </div>

            <label className="text-xs font-bold text-gray-600 block">
              Catatan Diagnosa Dokter (Text Manual):
            </label>
            <textarea
              className="w-full border border-gray-300 p-2.5 rounded text-sm focus:ring-2 focus:ring-orange-500 outline-none"
              rows={2}
              placeholder="Analisa dokter secara naratif..."
              value={formData.assessment}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, assessment: e.target.value }))
              }
            />
          </div>

          {/* === PLAN === */}
          <div className="bg-green-50/50 p-4 rounded-lg border border-green-100">
            <label className="text-sm font-bold text-green-800 uppercase flex items-center gap-2 mb-2">
              <span className="bg-green-200 px-2 rounded">P</span> Plan
              (Tatalaksana)
            </label>

            {/* Dropdown P - ID ONLY */}
            <SnomedSelect
              label="Prosedur/Tindakan (SNOMED ID)"
              category="SOAP Plan"
              valueId={formData.snomed_plan}
              onSelect={(item) => handleSelectId("snomed_plan", item)}
            />

            <label className="text-xs font-bold text-gray-600 mt-2 block">
              Catatan Rencana Pengobatan (Text Manual):
            </label>
            <textarea
              className="w-full border border-green-200 p-3 rounded text-sm focus:ring-2 focus:ring-green-400 outline-none"
              rows={3}
              placeholder="Resep, edukasi, rujukan..."
              value={formData.plan}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, plan: e.target.value }))
              }
            />
          </div>
        </div>

        <div className="p-5 border-t bg-white flex justify-end gap-3 rounded-b-xl">
          <button
            onClick={onClose}
            className="px-5 py-2.5 text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg font-medium"
          >
            Batal
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="px-6 py-2.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-bold"
          >
            {loading ? "Menyimpan..." : "Simpan SOAP"}
          </button>
        </div>
      </div>
    </div>
  );
};

// ==========================================
// 6. DETAIL MODAL (VIEWER)
// ==========================================

const SoapDetailModal = ({ isOpen, onClose, data, loading }: any) => {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 flex items-center justify-center z-50 bg-black/60 backdrop-blur-sm p-4 animate-[fadeIn_0.2s]"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl border border-gray-100"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-5 border-b flex justify-between items-center bg-gray-50">
          <div>
            <h2 className="text-xl font-bold text-gray-800">
              📄 Detail CPPT (SOAP)
            </h2>
            <p className="text-xs text-gray-500 mt-1">
              ID: #{data?.FN_soap_id || "-"}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-red-500 text-3xl font-bold"
          >
            &times;
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-white scrollbar-thin">
          {loading ? (
            <p className="text-center p-10 text-gray-500">Memuat data...</p>
          ) : !data ? (
            <p className="text-center p-10 text-red-500">
              Data tidak ditemukan.
            </p>
          ) : (
            <div className="space-y-4">
              {/* S */}
              <div className="border border-blue-200 rounded-lg overflow-hidden">
                <div className="bg-blue-50 px-4 py-2 border-b border-blue-100 font-bold text-blue-800 text-sm flex justify-between">
                  <span>[S] SUBJECTIVE</span>
                  {data.snomed_subjective && (
                    <span className="text-[10px] bg-white px-1 rounded border">
                      Ref ID: {data.snomed_subjective}
                    </span>
                  )}
                </div>
                <div className="p-4 text-sm text-gray-700 whitespace-pre-line">
                  {data.FS_catatan_subjective || "-"}
                </div>
              </div>

              {/* O */}
              <div className="border border-indigo-200 rounded-lg overflow-hidden">
                <div className="bg-indigo-50 px-4 py-2 border-b border-indigo-100 font-bold text-indigo-800 text-sm flex justify-between">
                  <span>[O] OBJECTIVE</span>
                  {data.snomed_objective && (
                    <span className="text-[10px] bg-white px-1 rounded border">
                      Ref ID: {data.snomed_objective}
                    </span>
                  )}
                </div>
                <div className="p-4 text-sm text-gray-700 whitespace-pre-line">
                  {data.FS_catatan_objective || "-"}
                </div>
              </div>

              {/* A */}
              <div className="border border-orange-200 rounded-lg overflow-hidden">
                <div className="bg-orange-50 px-4 py-2 border-b border-orange-100 font-bold text-orange-800 text-sm">
                  [A] ASSESSMENT
                </div>
                <div className="p-4 text-sm text-gray-700">
                  <div className="flex gap-2 mb-3">
                    {data.snomed_assessment_name && (
                      <span className="bg-orange-100 text-orange-800 px-2 py-1 rounded text-xs font-bold border border-orange-200">
                        SNOMED: {data.snomed_assessment_name}
                      </span>
                    )}
                    {data.icd_assessment_code && (
                      <span className="bg-teal-100 text-teal-800 px-2 py-1 rounded text-xs font-bold border border-teal-200">
                        ICD-10: {data.icd_assessment_code}
                      </span>
                    )}
                  </div>
                  <p className="whitespace-pre-line border-t pt-2">
                    {data.FS_catatan_assessment || "-"}
                  </p>
                </div>
              </div>

              {/* P */}
              <div className="border border-green-200 rounded-lg overflow-hidden">
                <div className="bg-green-50 px-4 py-2 border-b border-green-100 font-bold text-green-800 text-sm flex justify-between">
                  <span>[P] PLAN</span>
                  {data.snomed_plan_name && (
                    <span className="text-[10px] bg-white px-1 rounded border overflow-hidden truncate max-w-[150px]">
                      {data.snomed_plan_name}
                    </span>
                  )}
                </div>
                <div className="p-4 text-sm text-gray-700 whitespace-pre-line">
                  {data.FS_catatan_plan || "-"}
                </div>
              </div>
            </div>
          )}
        </div>
        <div className="p-4 border-t bg-white flex justify-end">
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
// 7. MAIN PAGE
// ==========================================

const SoapPage = () => {
  const [nakesProfile, setNakesProfile] = useState<NakesProfile | null>(null);
  const token = localStorage.getItem("token");

  const [searchTerm, setSearchTerm] = useState("");
  const [loadingSearch, setLoadingSearch] = useState(false);
  const [pasienList, setPasienList] = useState<Pasien[]>([]);
  const [selectedPasien, setSelectedPasien] = useState<Pasien | null>(null);
  const [showDropdown, setShowDropdown] = useState(false);

  const [recordList, setRecordList] = useState<SoapRecord[]>([]);
  const [loadingList, setLoadingList] = useState(false);

  const [showFormModal, setShowFormModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [detailData, setDetailData] = useState<any | null>(null);
  const [loadingSubmit, setLoadingSubmit] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [loadingDetail, setLoadingDetail] = useState(false);

  useEffect(() => {
    setNakesProfile({
      FN_tenaga_kesehatan_id: 1,
      FS_nama_lengkap: "Dr. Fauzan",
      role: "Dokter Umum",
    });
  }, [token]);

  useEffect(() => {
    const delayFn = setTimeout(async () => {
      if (searchTerm.length >= 3 && !selectedPasien) {
        setLoadingSearch(true);
        try {
          const res = await api.get(`soap/pasien`, {
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
    setSelectedPasien(p);
    setSearchTerm(p.FS_nama_lengkap);
    setShowDropdown(false);
    fetchSoapList(p.FN_pasien_id);
  };

  const handleClearSearch = () => {
    setSearchTerm("");
    setSelectedPasien(null);
    setRecordList([]);
    setPasienList([]);
  };

  const fetchSoapList = async (pasienId: number) => {
    setLoadingList(true);
    try {
      const res = await api.get(`soap/history/${pasienId}`);
      setRecordList(res.data.data || []);
    } catch (err: any) {
      if (err.response?.status === 404) setRecordList([]);
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
    setLoadingDetail(true);
    try {
      const res = await api.get(`soap/${id}`);
      if (res.data.status === "success") {
        setDetailData(res.data.data);
        setIsEditing(true);
        setEditingId(id);
        setShowFormModal(true);
      }
    } catch (err) {
      alert("Gagal ambil data");
    } finally {
      setLoadingDetail(false);
    }
  };

  const handleViewDetail = async (id: number) => {
    setShowDetailModal(true);
    setLoadingDetail(true);
    try {
      const res = await api.get(`soap/${id}`);
      if (res.data.status === "success") {
        setDetailData(res.data.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingDetail(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Yakin hapus?")) return;
    try {
      const res = await api.delete(`soap/${id}`);
      if (res.data.status === "success") {
        alert("Terhapus");
        if (selectedPasien) fetchSoapList(selectedPasien.FN_pasien_id);
      }
    } catch (err) {
      alert("Gagal hapus");
    }
  };

  const handleFormSubmit = async (payload: PayloadSoap) => {
    setLoadingSubmit(true);
    try {
      let res;
      if (isEditing && editingId) {
        res = await api.put(`soap/${editingId}`, payload);
      } else {
        res = await api.post(`soap`, payload);
      }
      if (res.data.status === "success") {
        alert("Berhasil disimpan");
        setShowFormModal(false);
        if (selectedPasien) fetchSoapList(selectedPasien.FN_pasien_id);
      }
    } catch (error: any) {
      alert("Gagal simpan: " + error.message);
    } finally {
      setLoadingSubmit(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6 font-sans text-gray-800">
      <div className="max-w-6xl mx-auto">
        {/* HEADER */}
        <div className="flex justify-between items-center bg-white p-4 rounded-xl shadow-sm border border-indigo-100 mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
              <span className="text-3xl">🩺</span> Rekam Medis (CPPT)
            </h1>
            <p className="text-sm text-gray-500 pl-11">Catatan SOAP Pasien</p>
          </div>
          <div className="flex items-center gap-3 bg-indigo-50 px-4 py-2 rounded-lg border border-indigo-200">
            <div className="bg-indigo-600 text-white rounded-full h-10 w-10 flex items-center justify-center font-bold shadow-md">
              {nakesProfile?.FS_nama_lengkap.charAt(0)}
            </div>
            <div className="text-sm">
              <p className="font-bold text-indigo-900">
                {nakesProfile?.FS_nama_lengkap}
              </p>
              <p className="text-indigo-600 text-xs">{nakesProfile?.role}</p>
            </div>
          </div>
        </div>

        {/* SEARCH PASIEN */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
          <label className="block text-sm font-bold text-gray-700 mb-2">
            Cari Pasien (Nama)
          </label>
          <div className="relative">
            <input
              type="text"
              className="block w-full pl-10 pr-10 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none transition"
              placeholder="Ketik nama pasien..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                if (selectedPasien) setSelectedPasien(null);
              }}
            />
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
              🔍
            </div>
            {searchTerm && !loadingSearch && (
              <button
                onClick={handleClearSearch}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-red-500"
              >
                ✕
              </button>
            )}
            {showDropdown && (
              <div className="absolute z-20 w-full mt-2 bg-white rounded-lg shadow-xl border border-gray-100 max-h-60 overflow-y-auto">
                {pasienList.length > 0 ? (
                  <ul className="divide-y divide-gray-100">
                    {pasienList.map((p) => (
                      <li
                        key={p.FN_pasien_id}
                        onClick={() => handleSelectPasien(p)}
                        className="px-4 py-3 hover:bg-indigo-50 cursor-pointer flex justify-between items-center group"
                      >
                        <div>
                          <p className="font-semibold text-gray-800">
                            {p.FS_nama_lengkap}
                          </p>
                          <p className="text-xs text-gray-500">
                            RM: {p.FS_no_rm}
                          </p>
                        </div>
                      </li>
                    ))}
                  </ul>
                ) : (
                  !loadingSearch && (
                    <div className="p-4 text-center text-gray-500 text-sm">
                      Tidak ditemukan.
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
                <span className="bg-indigo-800/50 px-2 py-0.5 rounded text-xs font-mono text-indigo-100 border border-indigo-500/30">
                  RM: {selectedPasien.FS_no_rm}
                </span>
              </div>
            </div>
            <button
              onClick={handleCreateNew}
              className="bg-emerald-500 hover:bg-emerald-600 text-white px-6 py-4 rounded-xl shadow-lg font-bold flex items-center gap-2 transition transform hover:-translate-y-1"
            >
              <span className="text-xl">➕</span> Catat CPPT
            </button>
          </div>
        )}

        {/* LIST SOAP */}
        {selectedPasien && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="p-4 border-b bg-gray-50 flex justify-between items-center">
              <h3 className="font-bold text-gray-700 flex items-center gap-2">
                📋 Riwayat SOAP
              </h3>
              <button
                onClick={() => fetchSoapList(selectedPasien.FN_pasien_id)}
                className="text-sm text-indigo-600 hover:underline"
              >
                🔄 Refresh
              </button>
            </div>
            <table className="w-full text-left">
              <thead className="bg-gray-100 text-gray-600 text-xs uppercase font-semibold">
                <tr>
                  <th className="p-4">Tanggal</th>
                  <th className="p-4">Subjective</th>
                  <th className="p-4">Assessment</th>
                  <th className="p-4 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {loadingList ? (
                  <tr>
                    <td colSpan={4} className="p-8 text-center text-gray-500">
                      Memuat...
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
                      key={rec.FN_soap_id}
                      className="hover:bg-indigo-50/30 transition"
                    >
                      <td className="p-4 align-top">
                        <div className="font-bold text-gray-800">
                          {new Date(
                            rec.FD_tanggal_pencatatan
                          ).toLocaleDateString("id-ID")}
                        </div>
                        <div className="text-xs text-gray-500">
                          {new Date(
                            rec.FD_tanggal_pencatatan
                          ).toLocaleTimeString("id-ID")}
                        </div>
                      </td>
                      <td className="p-4 text-sm text-gray-600 align-top max-w-xs truncate">
                        {rec.FS_catatan_subjective || "-"}
                      </td>
                      <td className="p-4 text-sm text-gray-600 align-top">
                        {rec.snomed_assessment_name ? (
                          <span className="block font-bold text-orange-800 text-xs mb-1">
                            {rec.snomed_assessment_name}
                          </span>
                        ) : null}
                        {rec.icd_assessment_code ? (
                          <span className="inline-block bg-teal-100 text-teal-800 text-[10px] px-1 rounded font-mono mr-1">
                            {rec.icd_assessment_code}
                          </span>
                        ) : null}
                        <span className="text-gray-500 italic truncate block">
                          {rec.FS_catatan_assessment}
                        </span>
                      </td>
                      <td className="p-4 text-right align-top space-x-2">
                        <button
                          onClick={() => handleViewDetail(rec.FN_soap_id)}
                          className="text-blue-600 hover:underline text-sm font-medium"
                        >
                          Detail
                        </button>
                        <button
                          onClick={() => handleEdit(rec.FN_soap_id)}
                          className="text-amber-600 hover:underline text-sm font-medium"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(rec.FN_soap_id)}
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
        )}

        <SoapFormModal
          isOpen={showFormModal}
          onClose={() => setShowFormModal(false)}
          onSubmit={handleFormSubmit}
          initialData={isEditing ? detailData : null}
          pasienId={selectedPasien?.FN_pasien_id}
          nakesId={nakesProfile?.FN_tenaga_kesehatan_id}
          loading={loadingSubmit}
        />
        <SoapDetailModal
          isOpen={showDetailModal}
          onClose={() => setShowDetailModal(false)}
          data={detailData}
          loading={loadingDetail}
        />
      </div>
    </div>
  );
};

export default SoapPage;
