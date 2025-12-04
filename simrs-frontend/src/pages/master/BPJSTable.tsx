import React, { useState, useEffect, useRef, useMemo } from "react";
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
// INTERFACES (SESUAI BACKEND PATHWAY)
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

interface PathwayRecord {
  FN_pathway_id: number;
  FD_tanggal_penyusunan: string;
  FS_catatan_umum: string;
  FS_nama_lengkap: string;
  FS_nama_pathway?: string;
  FS_deskripsi_pathway?: string;
  FS_no_rm?: string; // Optional field
  FS_kebijakan_rs?: string;
  forecasting_items?: any[];
}

interface PayloadPathway {
  pasien_id: number;
  nakes_id: number;
  nama_pathway: string;
  deskripsi_pathway: string;
  kebijakan_rs: string;
  catatan_umum: string;
  forecasting_items: {
    icd10_id: number;
    tindakan_id: number;
    komponen_biaya: string;
    perhitungan_tarif: number;
    catatan_forecast: string;
  }[];
}

// ==========================================
// 2. COMPONENT: SEARCHABLE SELECTS
// ==========================================

interface SelectProps {
  label: string;
  valueId: string | number;
  onSelect: (item: any) => void;
}

// A. Select ICD-10
const Icd10Select = ({ label, valueId, onSelect }: SelectProps) => {
  const [options, setOptions] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetch = async () => {
      setLoading(true);
      try {
        const res = await api.get("soap/icd10");
        if (res.data && res.data.data) setOptions(res.data.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, []);

  // 🔍 LOGIKA BARU: Cari opsi yang dipilih untuk menampilkan ID
  const selectedOption = useMemo(() => {
    return options.find((opt) => String(opt.FN_icd10_id) === String(valueId));
  }, [options, valueId]);

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    const item = options.find((opt) => String(opt.FN_icd10_id) === val);
    onSelect(item || { FN_icd10_id: 0, FS_kode_icd10: "" });
  };

  return (
    <div className="w-full">
      <label className="block text-xs font-bold text-gray-600 mb-1">
        {label}
      </label>
      <div className="relative">
        <select
          className="w-full border border-gray-300 p-2.5 rounded text-sm focus:ring-2 focus:ring-indigo-500 outline-none bg-white cursor-pointer transition shadow-sm hover:border-indigo-300"
          value={valueId ? String(valueId) : "0"}
          onChange={handleChange}
          disabled={loading}
        >
          <option value="0">
            {loading ? "Memuat..." : "-- Pilih Diagnosa --"}
          </option>
          {options.map((opt) => (
            <option key={opt.FN_icd10_id} value={opt.FN_icd10_id}>
              {opt.FS_kode_icd10} - {opt.FS_deskripsi}
            </option>
          ))}
        </select>
      </div>

      {/* 🆕 TAMPILAN ICD ID DI BAWAH DROPDOWN */}
      {selectedOption && selectedOption.FN_icd10_id !== 0 && (
        <div className="mt-1.5 animate-[fadeIn_0.3s]">
          <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-pink-100 text-pink-700 border border-pink-200 shadow-sm">
            ICD-10 ID: {selectedOption.FN_icd10_id}
          </span>
        </div>
      )}
    </div>
  );
};

// B. Select Tindakan
const TindakanSelect = ({ label, valueId, onSelect }: SelectProps) => {
  const [options, setOptions] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");

  useEffect(() => {
    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await api.get("bpjs/tindakan", {
          params: { keyword: search },
        });
        if (res.data && res.data.data) setOptions(res.data.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [search]);

  // 🔍 LOGIKA BARU: Cari opsi yang dipilih untuk menampilkan ID
  const selectedOption = useMemo(() => {
    return options.find(
      (opt) => String(opt.FN_tindakan_id) === String(valueId)
    );
  }, [options, valueId]);

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    const item = options.find((opt) => String(opt.FN_tindakan_id) === val);
    onSelect(item || { FN_tindakan_id: 0, FS_nama_tindakan: "" });
  };

  return (
    <div className="w-full">
      <label className="block text-xs font-bold text-gray-600 mb-1">
        {label}
      </label>
      <input
        type="text"
        placeholder="Cari tindakan..."
        className="w-full text-xs border border-gray-200 rounded p-1.5 mb-1 focus:outline-none focus:border-indigo-500 transition"
        onChange={(e) => setSearch(e.target.value)}
      />
      <select
        className="w-full border border-gray-300 p-2.5 rounded text-sm focus:ring-2 focus:ring-indigo-500 outline-none bg-white cursor-pointer transition shadow-sm hover:border-indigo-300"
        value={valueId ? String(valueId) : "0"}
        onChange={handleChange}
        disabled={loading}
      >
        <option value="0">
          {loading ? "Mencari..." : "-- Pilih Tindakan --"}
        </option>
        {options.map((opt) => (
          <option key={opt.FN_tindakan_id} value={opt.FN_tindakan_id}>
            {opt.FS_nama_tindakan}
          </option>
        ))}
      </select>

      {/* 🆕 TAMPILAN TINDAKAN ID DI BAWAH DROPDOWN */}
      {selectedOption && selectedOption.FN_tindakan_id !== 0 && (
        <div className="mt-1.5 animate-[fadeIn_0.3s]">
          <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-purple-100 text-purple-700 border border-purple-200 shadow-sm">
            Tindakan ID: {selectedOption.FN_tindakan_id}
          </span>
        </div>
      )}
    </div>
  );
};

// ==========================================
// 3. COMPONENT: FORM MODAL (UPDATED LOGIC)
// ==========================================

const BPJSFormModal = ({
  isOpen,
  onClose,
  onSubmit,
  initialData,
  pasienId,
  nakesId,
  loading,
}: any) => {
  // State Header
  const [header, setHeader] = useState({
    nama_pathway: "",
    deskripsi_pathway: "",
    kebijakan_rs: "",
    catatan_umum: "",
  });

  // State Items (Forecasting)
  const [items, setItems] = useState<any[]>([
    { icd10_id: 0, tindakan_id: 0, biaya: "", tarif: 0, catatan: "" },
  ]);

  useEffect(() => {
    if (isOpen) {
      if (initialData) {
        // Populate Data Edit
        setHeader({
          nama_pathway: initialData.FS_nama_pathway || "",
          deskripsi_pathway: initialData.FS_deskripsi_pathway || "",
          kebijakan_rs: initialData.FS_kebijakan_rs || "",
          catatan_umum: initialData.FS_catatan_umum || "",
        });

        if (initialData.forecasting_items) {
          setItems(
            initialData.forecasting_items.map((x: any) => ({
              icd10_id: x.FN_icd10cm_id || x.FN_icd10_id, // Handle potential inconsistent naming
              tindakan_id: x.FN_tindakan_id,
              biaya: x.FS_komponen_biaya,
              tarif: x.FS_perhitungan_tarif,
              catatan: x.FS_catatan_forecast,
            }))
          );
        }
      } else {
        // Reset Create
        setHeader({
          nama_pathway: "",
          deskripsi_pathway: "",
          kebijakan_rs: "",
          catatan_umum: "",
        });
        setItems([
          { icd10_id: 0, tindakan_id: 0, biaya: "", tarif: 0, catatan: "" },
        ]);
      }
    }
  }, [isOpen, initialData]);

  // Handlers
  const updateItem = (index: number, field: string, value: any) => {
    const newItems = [...items];
    newItems[index] = { ...newItems[index], [field]: value };
    setItems(newItems);
  };

  const addItem = () => {
    setItems([
      ...items,
      { icd10_id: 0, tindakan_id: 0, biaya: "", tarif: 0, catatan: "" },
    ]);
  };

  const removeItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const handleSubmit = () => {
    if (!header.nama_pathway) return alert("Nama Pathway harus diisi");

    const payload: PayloadPathway = {
      pasien_id: pasienId,
      nakes_id: nakesId,
      nama_pathway: header.nama_pathway,
      deskripsi_pathway: header.deskripsi_pathway,
      kebijakan_rs: header.kebijakan_rs,
      catatan_umum: header.catatan_umum,
      forecasting_items: items
        .map((i) => ({
          icd10_id: i.icd10_id,
          tindakan_id: i.tindakan_id,
          komponen_biaya: i.biaya,
          perhitungan_tarif: Number(i.tarif), // Ensure number format
          catatan_forecast: i.catatan,
        }))
        .filter((i) => i.tindakan_id !== 0),
    };
    onSubmit(payload);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50 backdrop-blur-[2px] bg-white/30 p-4 animate-[fadeIn_0.2s]">
      <div className="bg-white w-full max-w-5xl max-h-[90vh] rounded-xl flex flex-col shadow-2xl border border-gray-200 ring-1 ring-gray-100">
        {/* Header Modal */}
        <div className="p-5 border-b flex justify-between items-center bg-gray-50 rounded-t-xl sticky top-0 z-10">
          <div>
            <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
              {initialData
                ? "✏️ Edit Clinical Pathway"
                : "📝 Buat Pathway Baru"}
            </h2>
            <p className="text-xs text-gray-500 mt-1">
              Perencanaan kendali mutu dan biaya (Forecasting BPJS)
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
          {/* Section 1: Header Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-blue-50/50 p-4 rounded-lg border border-blue-100">
            <div className="col-span-1 md:col-span-2">
              <label className="text-xs font-bold text-gray-500 uppercase">
                Nama Clinical Pathway
              </label>
              <input
                className="w-full mt-1 border border-blue-200 p-2.5 rounded text-sm focus:ring-2 focus:ring-blue-400 outline-none"
                placeholder="Contoh: CP Katarak Senilis (ODC)"
                value={header.nama_pathway}
                onChange={(e) =>
                  setHeader({ ...header, nama_pathway: e.target.value })
                }
              />
            </div>
            <div>
              <label className="text-xs font-bold text-gray-500 uppercase">
                Deskripsi / Protokol
              </label>
              <textarea
                className="w-full mt-1 border border-blue-200 p-2.5 rounded text-sm focus:ring-2 focus:ring-blue-400 outline-none"
                rows={2}
                placeholder="Penjelasan singkat..."
                value={header.deskripsi_pathway}
                onChange={(e) =>
                  setHeader({ ...header, deskripsi_pathway: e.target.value })
                }
              />
            </div>
            <div>
              <label className="text-xs font-bold text-gray-500 uppercase">
                Kebijakan RS / SK
              </label>
              <textarea
                className="w-full mt-1 border border-blue-200 p-2.5 rounded text-sm focus:ring-2 focus:ring-blue-400 outline-none"
                rows={2}
                placeholder="SK Direktur..."
                value={header.kebijakan_rs}
                onChange={(e) =>
                  setHeader({ ...header, kebijakan_rs: e.target.value })
                }
              />
            </div>
            <div className="col-span-1 md:col-span-2">
              <label className="text-xs font-bold text-gray-500 uppercase">
                Catatan Umum Pasien
              </label>
              <input
                className="w-full mt-1 border border-blue-200 p-2.5 rounded text-sm focus:ring-2 focus:ring-blue-400 outline-none"
                placeholder="Kondisi pasien saat masuk..."
                value={header.catatan_umum}
                onChange={(e) =>
                  setHeader({ ...header, catatan_umum: e.target.value })
                }
              />
            </div>
          </div>

          {/* Section 2: Forecasting Items (Replacing Bedah/Non-Bedah) */}
          <div className="border border-gray-200 rounded-lg p-5 shadow-sm bg-white">
            <div className="flex justify-between items-center mb-4 pb-2 border-b border-gray-100">
              <h3 className="font-bold text-indigo-700 flex items-center gap-2 text-lg">
                <span className="bg-indigo-100 p-1 rounded">💰</span> Rincian
                Biaya & Tindakan
              </h3>
              <button
                onClick={addItem}
                className="text-xs bg-indigo-600 text-white px-3 py-1.5 rounded hover:bg-indigo-700 font-medium transition shadow-sm"
              >
                + Tambah Item
              </button>
            </div>

            {items.map((item, idx) => (
              <div
                key={idx}
                className="grid grid-cols-1 md:grid-cols-12 gap-4 mb-4 bg-gray-50/50 p-4 rounded-lg border border-gray-100 group hover:border-indigo-200 transition"
              >
                <div className="md:col-span-4">
                  <Icd10Select
                    label="Diagnosa (ICD-10)"
                    valueId={item.icd10_id}
                    onSelect={(val) =>
                      updateItem(idx, "icd10_id", val.FN_icd10_id)
                    }
                  />
                </div>
                <div className="md:col-span-4">
                  <TindakanSelect
                    label="Tindakan / Prosedur"
                    valueId={item.tindakan_id}
                    onSelect={(val) =>
                      updateItem(idx, "tindakan_id", val.FN_tindakan_id)
                    }
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-xs font-bold text-gray-600 mb-1">
                    Tarif (Rp)
                  </label>
                  <input
                    type="number"
                    className="w-full border border-gray-300 p-2.5 rounded text-sm font-mono focus:ring-2 focus:ring-indigo-500 outline-none"
                    value={item.tarif}
                    onChange={(e) => updateItem(idx, "tarif", e.target.value)}
                  />
                </div>
                <div className="md:col-span-1 flex items-end justify-center pb-1">
                  <button
                    onClick={() => removeItem(idx)}
                    className="text-gray-400 hover:text-red-500 hover:bg-red-50 p-2 rounded transition"
                  >
                    🗑️
                  </button>
                </div>

                {/* Baris Kedua untuk Catatan */}
                <div className="md:col-span-6">
                  <label className="block text-xs font-bold text-gray-600 mb-1">
                    Komponen Biaya
                  </label>
                  <input
                    className="w-full border border-gray-300 p-2 rounded text-sm"
                    placeholder="Jasa Medis / BHP / Obat"
                    value={item.biaya}
                    onChange={(e) => updateItem(idx, "biaya", e.target.value)}
                  />
                </div>
                <div className="md:col-span-6">
                  <label className="block text-xs font-bold text-gray-600 mb-1">
                    Catatan Tambahan
                  </label>
                  <input
                    className="w-full border border-gray-300 p-2 rounded text-sm italic"
                    placeholder="Detail keterangan..."
                    value={item.catatan}
                    onChange={(e) => updateItem(idx, "catatan", e.target.value)}
                  />
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
              "Simpan Pathway"
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

const BPJSDetailModal = ({ isOpen, onClose, data, loading }: any) => {
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
              📄 Detail Pathway
            </h2>
            <p className="text-xs text-gray-500 mt-1">
              ID Transaksi: #{data?.FN_pathway_id || "-"}
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
                <h3 className="text-lg font-bold text-blue-800 mb-2">
                  {data.FS_nama_pathway}
                </h3>
                <p className="text-blue-600 italic mb-3">
                  {data.FS_deskripsi_pathway}
                </p>
                <div className="grid grid-cols-2 gap-2">
                  <p>
                    <strong>Pasien:</strong> {data.FS_nama_lengkap} (
                    {data.FS_no_rm})
                  </p>
                  <p>
                    <strong>Tanggal:</strong>{" "}
                    {formatDate(data.FD_tanggal_penyusunan)}
                  </p>
                  <p className="col-span-2">
                    <strong>Kebijakan:</strong> {data.FS_kebijakan_rs}
                  </p>
                  <p className="col-span-2">
                    <strong>Catatan Umum:</strong> {data.FS_catatan_umum || "-"}
                  </p>
                </div>
              </div>

              {/* Rincian Forecasting */}
              <div className="border rounded-lg overflow-hidden">
                <div className="bg-indigo-50 px-4 py-2 border-b border-indigo-100">
                  <h3 className="font-bold text-indigo-800 text-sm">
                    💰 Rincian Biaya & Tindakan
                  </h3>
                </div>
                {data.forecasting_items?.length > 0 ? (
                  <table className="w-full text-sm text-left">
                    <thead className="bg-gray-50 text-gray-600 border-b">
                      <tr>
                        <th className="px-4 py-2">ICD-10</th>
                        <th className="px-4 py-2">Tindakan</th>
                        <th className="px-4 py-2">Komponen</th>
                        <th className="px-4 py-2 text-right">Tarif</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {data.forecasting_items.map((item: any, idx: number) => (
                        <tr key={idx} className="hover:bg-gray-50">
                          <td className="px-4 py-2">
                            <div className="font-bold">
                              {item.FS_kode_icd10}
                            </div>
                            <div className="text-xs text-gray-500">
                              {item.deskripsi_icd}
                            </div>
                            {/* 🆕 MENAMPILKAN ID DI DETAIL */}
                            {item.FN_icd10cm_id && (
                              <span className="inline-block mt-1 text-[9px] bg-pink-100 text-pink-700 px-1 rounded border border-pink-200">
                                ID: {item.FN_icd10cm_id}
                              </span>
                            )}
                          </td>
                          <td className="px-4 py-2 font-medium">
                            {item.FS_nama_tindakan}
                            {/* 🆕 MENAMPILKAN ID DI DETAIL */}
                            {item.FN_tindakan_id && (
                              <div className="mt-1">
                                <span className="inline-block text-[9px] bg-purple-100 text-purple-700 px-1 rounded border border-purple-200">
                                  ID: {item.FN_tindakan_id}
                                </span>
                              </div>
                            )}
                          </td>
                          <td className="px-4 py-2">
                            {item.FS_komponen_biaya}
                          </td>
                          <td className="px-4 py-2 text-right font-mono font-bold">
                            Rp{" "}
                            {Number(item.FS_perhitungan_tarif).toLocaleString(
                              "id-ID"
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot className="bg-gray-50 font-bold text-gray-700">
                      <tr>
                        <td colSpan={3} className="px-4 py-2 text-right">
                          Total Estimasi:
                        </td>
                        <td className="px-4 py-2 text-right text-indigo-700">
                          Rp{" "}
                          {data.forecasting_items
                            .reduce(
                              (a: any, b: any) =>
                                a + Number(b.FS_perhitungan_tarif),
                              0
                            )
                            .toLocaleString("id-ID")}
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                ) : (
                  <p className="p-4 text-sm text-gray-400 italic text-center">
                    Tidak ada rincian.
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

const BPJSPage = () => {
  const [nakesProfile, setNakesProfile] = useState<NakesProfile | null>(null);
  const [isNakesLoaded, setIsNakesLoaded] = useState(false);
  const token = localStorage.getItem("token");

  const [searchTerm, setSearchTerm] = useState("");
  const [loadingSearch, setLoadingSearch] = useState(false);
  const [pasienList, setPasienList] = useState<Pasien[]>([]);
  const [selectedPasien, setSelectedPasien] = useState<Pasien | null>(null);
  const [showDropdown, setShowDropdown] = useState(false);
  const [recordList, setRecordList] = useState<PathwayRecord[]>([]);
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
      // Mock Profile jika endpoint auth belum ada
      setNakesProfile({
        FN_tenaga_kesehatan_id: 1,
        FS_nama_lengkap: "Dr. Admin",
        role: "Dokter",
      });
      setIsNakesLoaded(true);
    };
    fetchProfile();
  }, [token]);

  // 2. Search Pasien (Gunakan Endpoint Pathway Helper)
  useEffect(() => {
    const delayFn = setTimeout(async () => {
      if (searchTerm.length >= 3 && !selectedPasien) {
        setLoadingSearch(true);
        try {
          const res = await api.get(`bpjs/pasien`, {
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
      // ✅ Panggil API History Pathway
      const res = await api.get(`bpjs/history/${pasienId}`);
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
      const res = await api.get(`bpjs/${id}`);
      if (res.data.status) {
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
      const res = await api.get(`bpjs/${id}`);
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
    if (!confirm("Hapus data pathway ini?")) return;
    try {
      await api.delete(`bpjs/${id}`);
      if (selectedPasien) fetchRecordList(selectedPasien.FN_pasien_id);
    } catch (err) {
      alert("Gagal hapus");
    }
  };

  const handleFormSubmit = async (payload: PayloadPathway) => {
    setLoadingSubmit(true);
    try {
      if (isEditing && editingId) {
        await api.put(`bpjs/${editingId}`, payload);
      } else {
        await api.post(`bpjs`, payload);
      }
      setShowFormModal(false);
      alert("Data berhasil disimpan");
      if (selectedPasien) fetchRecordList(selectedPasien.FN_pasien_id);
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
              <span className="text-3xl">🩺</span> Clinical Pathway
            </h1>
            <p className="text-sm text-gray-500 pl-11">
              Perencanaan Biaya & Tindakan (Forecasting BPJS)
            </p>
          </div>
          <div className="flex items-center gap-3 bg-indigo-50 px-4 py-2 rounded-lg border border-indigo-200">
            <div className="bg-indigo-600 text-white rounded-full h-10 w-10 flex items-center justify-center font-bold shadow-md">
              {nakesProfile ? nakesProfile.FS_nama_lengkap.charAt(0) : "?"}
            </div>
            <div className="text-sm">
              <p className="font-bold text-indigo-900">
                {isNakesLoaded ? nakesProfile?.FS_nama_lengkap : "Memuat..."}
              </p>
              <p className="text-indigo-600 text-xs">{nakesProfile?.role}</p>
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
              <span className="text-xl">➕</span> Buat Pathway
            </button>
          </div>
        )}

        {/* Table History */}
        {selectedPasien && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="p-4 border-b bg-gray-50 flex justify-between items-center">
              <h3 className="font-bold text-gray-700 flex items-center gap-2">
                <span>📋</span> Riwayat Pathway
              </h3>
              <button
                onClick={() => fetchRecordList(selectedPasien.FN_pasien_id)}
                className="text-sm text-indigo-600 hover:text-indigo-800 flex items-center gap-1 font-medium px-3 py-1 rounded hover:bg-indigo-50 transition"
              >
                🔄 Refresh Data
              </button>
            </div>
            <table className="w-full text-left">
              <thead className="bg-gray-100 text-gray-600 text-xs uppercase tracking-wider font-semibold">
                <tr>
                  <th className="p-4">Tanggal</th>
                  <th className="p-4">Nama Pathway</th>
                  <th className="p-4">Catatan Umum</th>
                  <th className="p-4 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {loadingList ? (
                  <tr>
                    <td colSpan={5} className="p-12 text-center text-gray-500">
                      <div className="flex flex-col items-center gap-3">
                        <div className="animate-spin h-6 w-6 border-2 border-indigo-500 border-t-transparent rounded-full"></div>
                        Memuat riwayat...
                      </div>
                    </td>
                  </tr>
                ) : recordList.length === 0 ? (
                  <tr>
                    <td
                      colSpan={5}
                      className="p-12 text-center text-gray-400 bg-gray-50/50"
                    >
                      <span className="text-4xl block mb-2">📭</span>Belum ada
                      data pathway.
                    </td>
                  </tr>
                ) : (
                  recordList.map((rec) => (
                    <tr
                      key={rec.FN_pathway_id}
                      className="hover:bg-indigo-50/30 transition group"
                    >
                      <td className="p-4">
                        <div className="font-bold text-gray-800">
                          {new Date(
                            rec.FD_tanggal_penyusunan
                          ).toLocaleDateString("id-ID")}
                        </div>
                        <div className="text-xs text-gray-500 mt-1">
                          {new Date(
                            rec.FD_tanggal_penyusunan
                          ).toLocaleTimeString("id-ID")}{" "}
                          WIB
                        </div>
                      </td>
                      <td className="p-4 font-medium text-indigo-700">
                        {rec.FS_nama_pathway || "-"}
                      </td>
                      <td className="p-4 text-sm text-gray-600 max-w-xs truncate">
                        {rec.FS_catatan_umum}
                      </td>

                      <td className="p-4 text-right">
                        <button
                          onClick={() => handleViewDetail(rec.FN_pathway_id)}
                          className="text-blue-600 hover:underline font-medium text-sm"
                        >
                          Detail
                        </button>
                        <button
                          onClick={() => handleEdit(rec.FN_pathway_id)}
                          className="text-amber-600 hover:underline font-medium text-sm ml-3"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(rec.FN_pathway_id)}
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
        <BPJSFormModal
          isOpen={showFormModal}
          onClose={() => setShowFormModal(false)}
          onSubmit={handleFormSubmit}
          initialData={isEditing ? detailData : null}
          pasienId={selectedPasien?.FN_pasien_id}
          nakesId={nakesProfile?.FN_tenaga_kesehatan_id}
          loading={loadingSubmit}
        />
        <BPJSDetailModal
          isOpen={showDetailModal}
          onClose={() => setShowDetailModal(false)}
          data={detailData}
          loading={loadingDetail}
        />
      </div>
    </div>
  );
};

export default BPJSPage;
