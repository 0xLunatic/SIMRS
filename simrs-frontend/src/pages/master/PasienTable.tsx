import { useEffect, useState } from "react";
import axios from "axios";

// ----- TYPES -----
// 💡 MODIFIKASI: Menambahkan FN_cara_datang_id dan cara_datang
interface PasienItem {
  FN_pasien_id: number;
  FS_no_rm: string;
  FS_nik: string;
  FS_nama_lengkap: string;
  FS_nama_panggilan?: string;
  FS_gelar_depan?: string;
  FS_gelar_belakang?: string;
  FS_jenis_kelamin_kode?: string;
  FD_tanggal_lahir?: string;
  FS_tempat_lahir?: string;
  FS_status_perkawinan_kode?: string;
  FS_agama_kode?: string;
  FS_pekerjaan_kode?: string;
  FS_golongan_darah?: string;
  FS_telepon?: string;
  FS_email?: string;
  FS_kontak_darurat_nama?: string;
  FS_kontak_darurat_telp?: string;
  FB_aktif?: boolean;
  FN_alamat_id?: number;
  FN_cara_datang_id?: number; // 💡 Kolom Baru

  // relasi tampil
  alamat_lengkap?: string;
  kode_wilayah_bps?: string;
  tipe_alamat?: string;
  jenis_kelamin?: string;
  status_perkawinan?: string;
  agama?: string;
  pekerjaan?: string;
  cara_datang?: string; // 💡 Kolom Baru (Deskripsi)

  // detail alamat (opsional)
  FS_alamat_lengkap?: string;
  FS_desa_kelurahan?: string;
  FS_kecamatan?: string;
  FS_kabupaten_kota?: string;
  FS_provinsi?: string;
  FS_kode_pos?: string;
  FS_kode_wilayah_bps?: string;
  FS_tipe_alamat?: string;
}

interface AlamatItem {
  id: number;
  FS_alamat_lengkap?: string;
  FS_desa_kelurahan?: string;
  FS_kecamatan?: string;
  FS_kabupaten_kota?: string;
  FS_provinsi?: string;
  FS_kode_pos?: string;
  FS_kode_wilayah_bps?: string;
  FS_tipe_alamat?: string;
}

interface OptionItem {
  kode: string;
  deskripsi: string;
}

// 💡 NEW TYPE: Untuk master Cara Datang
interface CaraDatangItem {
  FN_cara_datang_id: number;
  FS_nama_cara_datang: string;
}

// ----- COMPONENT -----
export default function PasienTable() {
  const [data, setData] = useState<PasienItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [editItem, setEditItem] = useState<PasienItem | null>(null);
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState(0);

  const [jenisKelaminOptions, setJenisKelaminOptions] = useState<OptionItem[]>(
    []
  );
  const [statusPerkawinanOptions, setStatusPerkawinanOptions] = useState<
    OptionItem[]
  >([]);
  const [agamaOptions, setAgamaOptions] = useState<OptionItem[]>([]);
  const [pekerjaanOptions, setPekerjaanOptions] = useState<OptionItem[]>([]);
  const [alamatOptions, setAlamatOptions] = useState<AlamatItem[]>([]);
  // 💡 NEW STATE: Untuk Cara Datang
  const [caraDatangOptions, setCaraDatangOptions] = useState<CaraDatangItem[]>(
    []
  );

  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
  const API_PASIEN = `${API_BASE_URL}pasien`;
  const API_ALAMAT = `${API_BASE_URL}master/alamat`;

  // ----- FETCH MASTER DATA -----
  const fetchOptions = async () => {
    try {
      // 💡 MODIFIKASI: Menambahkan fetch master cara datang
      const [jkRes, spRes, agRes, pkRes, cdRes] = await Promise.all([
        axios.get(`${API_BASE_URL}master/jenis_kelamin`),
        axios.get(`${API_BASE_URL}master/status_perkawinan`),
        axios.get(`${API_BASE_URL}master/agama`),
        axios.get(`${API_BASE_URL}master/pekerjaan`),
        axios.get(`${API_BASE_URL}cara-datang`),
      ]);
      setJenisKelaminOptions(jkRes.data || []);
      setStatusPerkawinanOptions(spRes.data || []);
      setAgamaOptions(agRes.data || []);
      setPekerjaanOptions(pkRes.data || []);
      // 💡 SET STATE BARU
      setCaraDatangOptions(cdRes.data || []);
    } catch (err) {
      console.error("Fetch options error:", err);
    }
  };

  // Robust fetchAlamat: terima response yang pakai FN_alamat_id atau id
  const fetchAlamat = async () => {
    try {
      const res = await axios.get(API_ALAMAT);
      const raw: any[] = res.data || [];

      const alamat: AlamatItem[] = raw.map((a: any) => {
        // dukung berbagai bentuk respons: FN_alamat_id atau id
        const rawId = a.FN_alamat_id ?? a.id ?? a.FN_alamat_id;
        const idNum = Number(rawId) || 0;
        return {
          id: idNum,
          FS_alamat_lengkap:
            a.FS_alamat_lengkap ?? a.alamat_lengkap ?? a.FS_alamat ?? "",
          FS_desa_kelurahan: a.FS_desa_kelurahan ?? a.desa_kelurahan ?? "",
          FS_kecamatan: a.FS_kecamatan ?? a.kecamatan ?? "",
          FS_kabupaten_kota:
            a.FS_kabupaten_kota ?? a.kabupaten_kota ?? a.kota ?? "",
          FS_provinsi: a.FS_provinsi ?? a.provinsi ?? "",
          FS_kode_pos: a.FS_kode_pos ?? a.kode_pos ?? a.FS_kodepos ?? "",
          FS_kode_wilayah_bps:
            a.FS_kode_wilayah_bps ?? a.kode_wilayah_bps ?? "",
          FS_tipe_alamat: a.FS_tipe_alamat ?? a.tipe_alamat ?? "",
        };
      });

      setAlamatOptions(alamat);
      return alamat;
    } catch (err) {
      console.error("Fetch alamat error:", err);
      setAlamatOptions([]);
      return [];
    }
  };

  // alamatList optional: kalau dikirim, pakai itu. kalau nggak, pakai state alamatOptions.
  const fetchData = async (alamatList?: AlamatItem[]) => {
    setLoading(true);
    try {
      const pasienRes = await axios.get<PasienItem[]>(API_PASIEN);
      const pasienData = pasienRes.data || [];
      const listToUse = alamatList ?? alamatOptions;

      const pasienWithAlamat = pasienData.map((p) => {
        // bandingkan secara numeric untuk menghindari string/number mismatch
        const alamat = listToUse.find(
          (a) => Number(a.id) === Number(p.FN_alamat_id)
        );

        return {
          ...p,
          FS_alamat_lengkap: alamat?.FS_alamat_lengkap || "",
          FS_desa_kelurahan: alamat?.FS_desa_kelurahan || "",
          FS_kecamatan: alamat?.FS_kecamatan || "",
          FS_kabupaten_kota: alamat?.FS_kabupaten_kota || "",
          FS_provinsi: alamat?.FS_provinsi || "",
          FS_kode_pos: alamat?.FS_kode_pos || "",
          FS_kode_wilayah_bps: alamat?.FS_kode_wilayah_bps || "",
          FS_tipe_alamat: alamat?.FS_tipe_alamat || "",
        } as PasienItem;
      });

      setData(pasienWithAlamat);
    } catch (err) {
      console.error("Fetch pasien error:", err);
      setError("Gagal memuat data pasien");
    } finally {
      setLoading(false);
    }
  };

  // Saat pertama kali load
  useEffect(() => {
    const init = async () => {
      await fetchOptions();
      const alamatList = await fetchAlamat();
      await fetchData(alamatList); // kirim agar tidak ada race
    };
    init();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ----- HANDLERS -----
  const handleEdit = (row: PasienItem) => {
    setEditItem(row);

    setFormData({
      ...row,
      // 💡 Tambahkan konversi FN_cara_datang_id ke string untuk input select
      FN_cara_datang_id: row.FN_cara_datang_id?.toString() || "",
      FS_alamat_lengkap: row.FS_alamat_lengkap ?? "",
      FS_desa_kelurahan: row.FS_desa_kelurahan ?? "",
      FS_kecamatan: row.FS_kecamatan ?? "",
      FS_kabupaten_kota: row.FS_kabupaten_kota ?? "",
      FS_provinsi: row.FS_provinsi ?? "",
      FS_kode_pos: row.FS_kode_pos ?? "",
      FS_kode_wilayah_bps: row.FS_kode_wilayah_bps ?? "",
      FS_tipe_alamat: row.FS_tipe_alamat ?? "",
    });

    setActiveTab(0);
    setShowModal(true);
  };

  const handleSave = async () => {
    try {
      // 💡 MODIFIKASI: Konversi FN_cara_datang_id kembali ke Number sebelum dikirim
      const dataToSend = { ...formData };
      if (dataToSend.FN_cara_datang_id) {
        dataToSend.FN_cara_datang_id = Number(dataToSend.FN_cara_datang_id);
      } else {
        delete dataToSend.FN_cara_datang_id;
      }

      if (editItem) {
        await axios.put(`${API_PASIEN}/${editItem.FN_pasien_id}`, dataToSend);
      } else {
        await axios.post(API_PASIEN, dataToSend);
      }
      setShowModal(false);
      setFormData({});
      setEditItem(null);

      // refresh alamat dulu, lalu fetch pasien dengan alamat terbaru
      const alamatList = await fetchAlamat();
      await fetchData(alamatList);
    } catch (err) {
      console.error("Gagal menyimpan:", err);
      alert("Gagal menyimpan data");
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Yakin ingin menghapus data ini?")) return;
    try {
      await axios.delete(`${API_PASIEN}/${id}`);
      const alamatList = await fetchAlamat();
      await fetchData(alamatList);
    } catch (err) {
      console.error("Gagal hapus:", err);
      alert("Gagal menghapus data");
    }
  };

  const filteredData = data.filter((row) =>
    [
      row.FS_no_rm,
      row.FS_nik,
      row.FS_nama_lengkap,
      row.alamat_lengkap,
      row.jenis_kelamin,
      row.status_perkawinan,
      row.agama,
      row.pekerjaan,
      row.cara_datang, // 💡 Tambahkan ke pencarian
    ]
      .filter(Boolean)
      .some((f) => f!.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  // ----- RENDER -----
  return (
    <div className="p-6 space-y-4">
      {/* HEADER */}
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">📋 Data Pasien</h1>
        <button
          onClick={() => {
            setEditItem(null);
            setFormData({});
            setShowModal(true);
          }}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md transition"
        >
          ➕ Tambah Data
        </button>
      </div>

      {/* SEARCH */}
      <input
        type="text"
        placeholder="Cari data pasien..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        className="w-full border p-2 rounded-md"
      />

      {/* TABLE */}
      <div className="shadow rounded-lg border overflow-hidden">
        <table className="w-full table-auto text-xs">
          <thead className="bg-blue-50 text-gray-700">
            <tr>
              <th className="border px-2 py-2 text-left w-[6%]">No RM</th>
              <th className="border px-2 py-2 text-left w-[8%]">NIK</th>
              <th className="border px-2 py-2 text-left w-[10%]">
                Nama Lengkap
              </th>
              <th className="border px-2 py-2 text-left w-[20%]">Alamat</th>
              <th className="border px-2 py-2 text-left w-[7%]">Cara Datang</th> 
              {/* 💡 Kolom Baru */}
              <th className="border px-2 py-2 text-left w-[6%]">
                Kode Wilayah
              </th>
              <th className="border px-2 py-2 text-left w-[5%]">Tipe</th>
              <th className="border px-2 py-2 text-left w-[5%]">JK</th>
              <th className="border px-2 py-2 text-left w-[5%]">Status</th>
              <th className="border px-2 py-2 text-left w-[5%]">Agama</th>
              <th className="border px-2 py-2 text-left w-[5%]">Pekerjaan</th>
              <th className="border px-2 py-2 text-center w-[5%]">Aksi</th>
            </tr>
          </thead>
          <tbody>
            {filteredData.length > 0 ? (
              filteredData.map((row) => {
                const alamat = alamatOptions.find(
                  (a) => Number(a.id) === Number(row.FN_alamat_id)
                );

                return (
                  <tr key={row.FN_pasien_id} className="hover:bg-gray-50">
                    <td className="border px-2 py-1 truncate">
                      {row.FS_no_rm}
                    </td>
                    <td className="border px-2 py-1 truncate">{row.FS_nik}</td>
                    <td className="border px-2 py-1 truncate">
                      {row.FS_nama_lengkap}
                    </td>

                    {/* Alamat fit in screen */}
                    <td
                      className="border px-2 py-1 truncate max-w-[200px]"
                      title={alamat?.FS_alamat_lengkap || row.FS_alamat_lengkap}
                    >
                      {alamat
                        ? `${alamat.FS_alamat_lengkap || ""}, ${
                            alamat.FS_desa_kelurahan || ""
                          }, ${alamat.FS_kecamatan || ""}`
                        : row.FS_alamat_lengkap || "-"}
                    </td>

                    {/* 💡 Tampilkan Cara Datang */}
                    <td className="border px-2 py-1 truncate">
                      {row.cara_datang ?? "-"}
                    </td>

                    <td className="border px-2 py-1 truncate">
                      {alamat?.FS_kode_wilayah_bps ?? "-"}
                    </td>
                    <td className="border px-2 py-1 truncate">
                      {alamat?.FS_tipe_alamat ?? "-"}
                    </td>
                    <td className="border px-2 py-1 truncate">
                      {row.jenis_kelamin ?? "-"}
                    </td>
                    <td className="border px-2 py-1 truncate">
                      {row.status_perkawinan ?? "-"}
                    </td>
                    <td className="border px-2 py-1 truncate">
                      {row.agama ?? "-"}
                    </td>
                    <td className="border px-2 py-1 truncate">
                      {row.pekerjaan ?? "-"}
                    </td>

                    <td className="border px-2 py-1 text-center">
                      <button
                        onClick={() => handleEdit(row)}
                        className="text-yellow-600 hover:underline text-sm"
                      >
                        ✏️
                      </button>
                      <button
                        onClick={() => handleDelete(row.FN_pasien_id)}
                        className="text-red-600 hover:underline text-sm ml-2"
                      >
                        🗑️
                      </button>
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td
                  colSpan={12} // 💡 MODIFIKASI: Jumlah kolom bertambah menjadi 12
                  className="border text-center text-gray-400 py-6"
                >
                  😕 Data tidak ditemukan
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* MODAL DENGAN BLUR SMOOTH */}
      {showModal && (
        <div
          className="fixed inset-0 backdrop-blur-sm bg-transparent flex justify-center items-center z-[9999] 
					                      animate-[fadeIn_0.3s_ease-out]"
        >
          <div
            className="bg-white p-6 rounded-lg w-full max-w-lg max-h-[90vh] flex flex-col overflow-y-auto shadow-2xl 
					                               animate-[slideUp_0.3s_ease-out]"
          >
            <h2 className="text-xl font-semibold mb-4">
              {editItem ? "✏️ Edit Data Pasien" : "➕ Tambah Data Pasien"}
            </h2>

            {/* TABS */}
            <div className="flex border-b mb-4">
              {["Data Diri", "Alamat", "Kontak"].map((tab, i) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(i)}
                  className={`flex-1 py-2 text-sm font-medium ${
                    activeTab === i
                      ? "border-b-2 border-blue-600 text-blue-600"
                      : "text-gray-500 hover:text-gray-700"
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>

            {/* TAB BODY */}
            <div className="space-y-2 flex-1">
              {activeTab === 0 && (
                <>
                  <input
                    type="text"
                    placeholder="No RM"
                    value={formData.FS_no_rm || ""}
                    onChange={(e) =>
                      setFormData({ ...formData, FS_no_rm: e.target.value })
                    }
                    className="w-full border p-2 rounded"
                  />
                  <input
                    type="text"
                    placeholder="NIK"
                    value={formData.FS_nik || ""}
                    onChange={(e) =>
                      setFormData({ ...formData, FS_nik: e.target.value })
                    }
                    className="w-full border p-2 rounded"
                  />
                  <input
                    type="text"
                    placeholder="Nama Lengkap"
                    value={formData.FS_nama_lengkap || ""}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        FS_nama_lengkap: e.target.value,
                      })
                    }
                    className="w-full border p-2 rounded"
                  />
                  <select
                    value={formData.FS_jenis_kelamin_kode || ""}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        FS_jenis_kelamin_kode: e.target.value,
                      })
                    }
                    className="w-full border p-2 rounded"
                  >
                    <option value="">-- Jenis Kelamin --</option>
                    {jenisKelaminOptions.map((o) => (
                      <option key={o.kode} value={o.kode}>
                        {o.deskripsi}
                      </option>
                    ))}
                  </select>
                  {/* 💡 INPUT BARU: FN_cara_datang_id */}
                  <select
                    value={formData.FN_cara_datang_id || ""}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        FN_cara_datang_id: e.target.value,
                      })
                    }
                    className="w-full border p-2 rounded"
                  >
                    <option value="">-- Cara Datang --</option>
                    {caraDatangOptions.map((o) => (
                      <option
                        key={o.FN_cara_datang_id}
                        value={o.FN_cara_datang_id.toString()}
                      >
                        {o.FS_nama_cara_datang}
                      </option>
                    ))}
                  </select>
                  {/* END 💡 INPUT BARU */}

                  <select
                    value={formData.FS_status_perkawinan_kode || ""}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        FS_status_perkawinan_kode: e.target.value,
                      })
                    }
                    className="w-full border p-2 rounded"
                  >
                    <option value="">-- Status Perkawinan --</option>
                    {statusPerkawinanOptions.map((o) => (
                      <option key={o.kode} value={o.kode}>
                        {o.deskripsi}
                      </option>
                    ))}
                  </select>
                  <select
                    value={formData.FS_agama_kode || ""}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        FS_agama_kode: e.target.value,
                      })
                    }
                    className="w-full border p-2 rounded"
                  >
                    <option value="">-- Agama --</option>
                    {agamaOptions.map((o) => (
                      <option key={o.kode} value={o.kode}>
                        {o.deskripsi}
                      </option>
                    ))}
                  </select>
                  <select
                    value={formData.FS_pekerjaan_kode || ""}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        FS_pekerjaan_kode: e.target.value,
                      })
                    }
                    className="w-full border p-2 rounded"
                  >
                    <option value="">-- Pekerjaan --</option>
                    {pekerjaanOptions.map((o) => (
                      <option key={o.kode} value={o.kode}>
                        {o.deskripsi}
                      </option>
                    ))}
                  </select>
                </>
              )}

              {activeTab === 1 && (
                <div className="grid grid-cols-2 gap-2">
                  {[
                    "FS_alamat_lengkap",
                    "FS_desa_kelurahan",
                    "FS_kecamatan",
                    "FS_kabupaten_kota",
                    "FS_provinsi",
                    "FS_kode_pos",
                    "FS_kode_wilayah_bps",
                    "FS_tipe_alamat",
                  ].map((f) => (
                    <input
                      key={f}
                      type="text"
                      placeholder={f.replace("FS_", "").replace(/_/g, " ")}
                      value={formData[f] || ""}
                      onChange={(e) =>
                        setFormData({ ...formData, [f]: e.target.value })
                      }
                      className="border p-2 rounded w-full"
                    />
                  ))}
                </div>
              )}

              {activeTab === 2 && (
                <>
                  {[
                    "FS_golongan_darah",
                    "FS_telepon",
                    "FS_email",
                    "FS_kontak_darurat_nama",
                    "FS_kontak_darurat_telp",
                  ].map((f) => (
                    <input
                      key={f}
                      type={f.includes("email") ? "email" : "text"}
                      placeholder={f.replace("FS_", "").replace(/_/g, " ")}
                      value={formData[f] || ""}
                      onChange={(e) =>
                        setFormData({ ...formData, [f]: e.target.value })
                      }
                      className="w-full border p-2 rounded"
                    />
                  ))}
                </>
              )}
            </div>

            {/* FOOTER */}
            <div className="flex justify-between mt-4">
              <button
                onClick={() => setShowModal(false)}
                className="px-4 py-2 bg-gray-300 rounded"
              >
                Batal
              </button>
              {activeTab > 0 && (
                <button
                  onClick={() => setActiveTab(activeTab - 1)}
                  className="px-4 py-2 bg-gray-200 rounded"
                >
                  ⬅️ Sebelumnya
                </button>
              )}
              {activeTab < 2 ? (
                <button
                  onClick={() => setActiveTab(activeTab + 1)}
                  className="px-4 py-2 bg-blue-200 rounded"
                >
                  Selanjutnya ➡️
                </button>
              ) : (
                <button
                  onClick={handleSave}
                  className="px-4 py-2 bg-blue-600 text-white rounded"
                >
                  💾 Simpan
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Animasi Keyframes */}
      <style>
        {`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        `}
      </style>
    </div>
  );
}
