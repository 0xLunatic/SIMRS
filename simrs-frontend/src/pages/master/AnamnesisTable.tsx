import {
  useState,
  useEffect,
  useMemo,
  useCallback,
  type FormEvent,
} from "react";
import axios from "axios";
import {
  FaExclamationTriangle,
  FaSave,
  FaSpinner,
  FaUser,
  FaFileMedicalAlt,
  FaSearch,
  FaCheckCircle,
  FaMapMarkerAlt,
  FaVenusMars,
  FaTimesCircle,
  FaChevronRight,
  FaEdit,
} from "react-icons/fa";

// ==========================================================
// 1. INTERFACE/MODEL DATA
// ==========================================================

interface Pasien {
  FN_pasien_id: number;
  FS_no_rm: string;
  FS_nik: string;
  FS_nama_lengkap: string;
  alamat_lengkap: string;
  jenis_kelamin: string;
  FD_tanggal_lahir: string;
}

interface MasterQuestion {
  FN_pertanyaan_id: number;
  FS_kategori: string;
  FS_pertanyaan: string;
  FS_kode_snomed: string;
  FS_kode_loinc: string;
  FS_kode_pertanyaan: string;
}

interface StructuredAnswer {
  FN_jawaban_id: number;
  FN_pertanyaan_id: number;
  FS_label: string;
  FS_definisi: string;
  FS_level: string;
  // 🆕 UPDATE: Menambahkan field FN_snomed_id sesuai permintaan
  FN_snomed_id?: number | string;
  FS_kode_snomed?: string; // Opsional: tetap disimpan jika backend mengirim format ini juga
}

interface AnamnesisAnswer {
  FN_pertanyaan_id: number;
  FN_jawaban_id?: number;
  FS_keterangan: string;
}

interface MasterDataPayload {
  FN_pasien_id: number;
  FN_tenaga_kesehatan_id: number;
}

interface FullAnamnesisPayload {
  master_data: MasterDataPayload;
  detail_data: { [kategori: string]: AnamnesisAnswer[] };
}

interface NakesProfile {
  FN_tenaga_kesehatan_id: number;
  FS_nama_lengkap: string;
  username: string;
  FS_username: string;
  role: string;
}

interface StoredAnswer {
  jawabanId: number | null;
  keterangan: string;
}

// ==========================================================
// 2. UTILITY & API SETUP
// ==========================================================
const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:3000/api/";

const API_MASTER_SYNC_URL = `${API_BASE_URL}anamnesis/master/sync`;
const API_ANAMNESIS_FULL_URL = `${API_BASE_URL}anamnesis/full`;
const API_PASIEN_URL = `${API_BASE_URL}pasien`;

const groupQuestions = (questions: MasterQuestion[]) => {
  return questions.reduce((acc, question) => {
    const category = question.FS_kategori;
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(question);
    return acc;
  }, {} as Record<string, MasterQuestion[]>);
};

const groupStructuredAnswers = (answers: StructuredAnswer[]) => {
  return answers.reduce((acc, answer) => {
    const qId = answer.FN_pertanyaan_id.toString();
    if (!acc[qId]) {
      acc[qId] = [];
    }
    acc[qId].push(answer);
    return acc;
  }, {} as Record<string, StructuredAnswer[]>);
};

const calculateAge = (dobString: string): number => {
  const dob = new Date(dobString);
  const now = new Date();
  let age = now.getFullYear() - dob.getFullYear();
  const monthDiff = now.getMonth() - dob.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && now.getDate() < dob.getDate())) {
    age--;
  }
  return age;
};

// ==========================================================
// 3. KOMPONEN MODAL KATEGORI
// ==========================================================

interface AnamnesisCategoryModalProps {
  category: string;
  questions: MasterQuestion[];
  currentAnswers: Record<string, StoredAnswer>;
  onSave: (category: string, newAnswers: Record<string, StoredAnswer>) => void;
  onClose: () => void;
  structuredAnswersMap: Record<string, StructuredAnswer[]>;
}

interface LocalAnswer {
  jawabanId: number | null;
  keterangan: string;
}

const AnamnesisCategoryModal: React.FC<AnamnesisCategoryModalProps> = ({
  category,
  questions,
  currentAnswers,
  onSave,
  onClose,
  structuredAnswersMap,
}) => {
  const initialLocalAnswers = useMemo(() => {
    return questions.reduce((acc, q) => {
      const idString = q.FN_pertanyaan_id.toString();
      acc[idString] = {
        jawabanId: currentAnswers[idString]?.jawabanId || null,
        keterangan: currentAnswers[idString]?.keterangan || "",
      };
      return acc;
    }, {} as Record<string, LocalAnswer>);
  }, [questions, currentAnswers]);

  const [localAnswers, setLocalAnswers] = useState(initialLocalAnswers);

  useEffect(() => {
    setLocalAnswers(initialLocalAnswers);
  }, [initialLocalAnswers]);

  const handleJawabanIdChange = (idString: string, value: string) => {
    const parsedId = value ? parseInt(value, 10) : null;
    setLocalAnswers((prev) => ({
      ...prev,
      [idString]: { ...prev[idString], jawabanId: parsedId },
    }));
  };

  const handleKeteranganChange = (idString: string, value: string) => {
    setLocalAnswers((prev) => ({
      ...prev,
      [idString]: { ...prev[idString], keterangan: value },
    }));
  };

  const filledCount = useMemo(() => {
    return Object.values(localAnswers).filter(
      (val) => val.jawabanId !== null || val.keterangan.trim() !== ""
    ).length;
  }, [localAnswers]);

  const handleSaveAndClose = () => {
    const newAnswers: Record<string, StoredAnswer> = {};
    for (const [idString, local] of Object.entries(localAnswers)) {
      if (local.jawabanId !== null || local.keterangan.trim() !== "") {
        newAnswers[idString] = {
          jawabanId: local.jawabanId,
          keterangan: local.keterangan.trim(),
        };
      }
    }
    onSave(category, newAnswers);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black bg-opacity-70 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-5xl w-full max-h-[90vh] overflow-y-auto transform transition-all duration-300 scale-100">
        <header className="sticky top-0 bg-blue-700 text-white p-5 rounded-t-xl flex justify-between items-center shadow-lg">
          <h3 className="text-xl font-bold">
            Detail: {category.replace(/_/g, " ").toUpperCase()}
          </h3>
          <button
            onClick={onClose}
            className="p-2 bg-blue-600 rounded-full hover:bg-blue-800 transition"
            aria-label="Tutup Modal"
          >
            <FaTimesCircle className="h-5 w-5" />
          </button>
        </header>

        <div className="p-6 grid grid-cols-1 lg:grid-cols-2 gap-6">
          {questions.map((q) => {
            const questionIdString = q.FN_pertanyaan_id.toString();
            const uniqueInputId = `modal-input-${category}-${questionIdString}`;
            const currentAnswer = localAnswers[questionIdString];
            const availableAnswers =
              structuredAnswersMap[questionIdString] || [];
            const isStructured = availableAnswers.length > 0;

            // 🔍 LOGIC: Mencari objek jawaban yang sedang dipilih berdasarkan ID
            const selectedAnswerObj = availableAnswers.find(
              (a) => a.FN_jawaban_id === currentAnswer.jawabanId
            );

            return (
              <div
                key={questionIdString}
                className="question-item p-4 border border-gray-200 rounded-lg shadow-md bg-gray-50 h-full flex flex-col justify-between"
              >
                <div>
                  <label
                    htmlFor={uniqueInputId}
                    className="block text-base font-semibold text-gray-800 mb-3 leading-snug border-b pb-2"
                  >
                    {q.FS_pertanyaan}
                  </label>
                  <div
                    className={`
                            grid gap-4 
                            ${
                              isStructured
                                ? "grid-cols-1 sm:grid-cols-2"
                                : "grid-cols-1"
                            }
                        `}
                  >
                    {/* 1. INPUT JAWABAN TERSTRUKTUR (DROPDOWN) */}
                    {isStructured && (
                      <div className="dropdown-col flex flex-col">
                        <label className="block text-sm font-medium text-blue-600 mb-1">
                          Pilih Jawaban:
                        </label>
                        <select
                          id={uniqueInputId + "-select"}
                          value={currentAnswer.jawabanId || ""}
                          onChange={(e) =>
                            handleJawabanIdChange(
                              questionIdString,
                              e.target.value
                            )
                          }
                          className="w-full border border-blue-300 p-2 rounded-lg text-sm focus:ring-blue-500 focus:border-blue-500 transition shadow-inner"
                        >
                          <option value="">-- Pilih Jawaban --</option>
                          {availableAnswers.map((answer) => (
                            <option
                              key={answer.FN_jawaban_id}
                              value={answer.FN_jawaban_id}
                              title={
                                answer.FS_definisi
                                  ? `Definisi: ${answer.FS_definisi}`
                                  : ""
                              }
                            >
                              {answer.FS_label}
                            </option>
                          ))}
                        </select>

                        {/* ✅ UPDATE: MENAMPILKAN FN_snomed_id JIKA TERSEDIA */}
                        {selectedAnswerObj &&
                          selectedAnswerObj.FN_snomed_id && (
                            <p className="mt-1 text-xs text-gray-500 font-medium">
                              SNOMED ID:{" "}
                              <span className="text-gray-800 font-mono font-bold bg-gray-100 px-1 rounded">
                                {selectedAnswerObj.FN_snomed_id}
                              </span>
                            </p>
                          )}
                      </div>
                    )}

                    {/* 2. INPUT KETERANGAN TAMBAHAN (TEXTAREA) */}
                    <div className="textarea-col">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Keterangan Tambahan:
                      </label>
                      <textarea
                        id={uniqueInputId + "-textarea"}
                        rows={isStructured ? 3 : 2}
                        placeholder="Detail atau observasi..."
                        value={currentAnswer.keterangan}
                        onChange={(e) =>
                          handleKeteranganChange(
                            questionIdString,
                            e.target.value
                          )
                        }
                        className="w-full border border-gray-300 p-2 rounded-lg text-sm focus:ring-blue-500 focus:border-blue-500 transition shadow-inner resize-y"
                      />
                    </div>
                  </div>
                </div>

                <small className="text-xs text-gray-500 mt-3 pt-2 border-t flex justify-between">
                  <span>
                    SNOMED (Q):
                    <span className="font-semibold ml-1">
                      {q.FS_kode_snomed}
                    </span>
                  </span>
                  <span>
                    LOINC:
                    <span className="font-semibold ml-1">
                      {q.FS_kode_loinc}
                    </span>
                  </span>
                </small>
              </div>
            );
          })}
        </div>

        <footer className="sticky bottom-0 bg-gray-100 p-4 rounded-b-xl border-t border-gray-200 shadow-inner flex justify-between items-center">
          <span className="text-sm font-medium text-gray-600">
            **{filledCount}** dari **{questions.length}** Pertanyaan diisi.
          </span>
          <button
            type="button"
            onClick={handleSaveAndClose}
            className="px-6 py-2 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 transition shadow-md flex items-center gap-2"
          >
            <FaSave /> Simpan & Tutup
          </button>
        </footer>
      </div>
    </div>
  );
};

// ==========================================================
// 4. KOMPONEN UTAMA: AnamnesisPage
// ==========================================================

export default function AnamnesisPage() {
  const [masterQuestions, setMasterQuestions] = useState<MasterQuestion[]>([]);
  const [structuredAnswers, setStructuredAnswers] = useState<
    StructuredAnswer[]
  >([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [activePasien, setActivePasien] = useState<Pasien | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [allPasienData, setAllPasienData] = useState<Pasien[]>([]);
  const [searchResults, setSearchResults] = useState<Pasien[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [nakesProfile, setNakesProfile] = useState<NakesProfile | null>(null);

  const [answers, setAnswers] = useState<
    Record<string, Record<string, StoredAnswer>>
  >({});

  const [openModalCategory, setOpenModalCategory] = useState<string | null>(
    null
  );

  const [submissionMessage, setSubmissionMessage] = useState<string | null>(
    null
  );
  const [isSaving, setIsSaving] = useState(false);

  const token =
    localStorage.getItem("token") || sessionStorage.getItem("token");

  // --- LOGIC FETCH DATA ---

  const fetchNakesProfile = useCallback(async () => {
    if (!token) {
      setError("Token tidak ditemukan. Mohon login.");
      setLoading(false);
      return;
    }

    try {
      const res = await axios.get(`${API_BASE_URL}auth/profile`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const profileData: NakesProfile = {
        FN_tenaga_kesehatan_id:
          res.data.FN_tenaga_kesehatan_id || res.data.id || 0,
        FS_nama_lengkap:
          res.data.nama_lengkap || res.data.name || "Nakes Tidak Dikenal",
        username: res.data.username || "",
        FS_username: res.data.username || "",
        role: res.data.role || "unknown",
      };

      setNakesProfile(profileData);
      localStorage.setItem("user", JSON.stringify(profileData));
      setError(null);
    } catch (err: any) {
      console.error(
        "Gagal fetching profile:",
        err.response?.data || err.message
      );
      setError("Gagal memuat profil Nakes. Token mungkin kedaluwarsa.");
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      sessionStorage.removeItem("token");
      setNakesProfile(null);
    }
  }, [token]);

  const fetchAllPasien = useCallback(async () => {
    if (!token) return;

    setIsSearching(true);
    try {
      const response = await axios.get(API_PASIEN_URL, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const patientData: Pasien[] = response.data.data || response.data;
      setAllPasienData(patientData);
    } catch (err) {
      console.error("Fetch Pasien Error:", err);
      setError("Gagal memuat data pasien.");
      setAllPasienData([]);
    } finally {
      setIsSearching(false);
    }
  }, [token]);

  useEffect(() => {
    const fetchData = async () => {
      await fetchNakesProfile();

      try {
        const response = await axios.get(API_MASTER_SYNC_URL, {
          headers: { Authorization: `Bearer ${token}` },
        });

        const syncData = response.data.data || response.data;
        const fetchedQuestions: MasterQuestion[] = syncData.questions || [];
        const fetchedStructuredAnswers: StructuredAnswer[] =
          syncData.structuredAnswers || [];

        const preparedQuestions: MasterQuestion[] = fetchedQuestions.map(
          (q: any, index: number) => {
            const questionId = q.FN_pertanyaan_id || q.id || index + 1;

            const apiCode = q.FS_kode_pertanyaan;
            const snomedBase =
              q.FS_kode_snomed?.replace(/\.\*/g, "") || "SNOMED_MISSING";
            const uniqueFallbackCode = `${snomedBase}_${index}`;
            const finalCode =
              apiCode && apiCode !== "CODE_MISSING"
                ? apiCode
                : uniqueFallbackCode;

            return {
              ...q,
              FN_pertanyaan_id: questionId,
              FS_kode_pertanyaan: finalCode,
            };
          }
        );

        setMasterQuestions(preparedQuestions);
        setStructuredAnswers(fetchedStructuredAnswers);
      } catch (err) {
        console.error("Fetch Sync Data Error:", err);
        setError(
          "Gagal memuat data master (Pertanyaan & Jawaban Terstruktur)."
        );
      }

      await fetchAllPasien();

      setLoading(false);
    };
    fetchData();
  }, [token, fetchAllPasien, fetchNakesProfile]);

  useEffect(() => {
    const handler = setTimeout(() => {
      if (searchTerm.trim().length > 2) {
        const lowerQuery = searchTerm.toLowerCase();
        const filtered = allPasienData.filter(
          (p) =>
            p.FS_nama_lengkap.toLowerCase().includes(lowerQuery) ||
            p.FS_no_rm.toLowerCase().includes(lowerQuery) ||
            p.FS_nik.toLowerCase().includes(lowerQuery) ||
            p.alamat_lengkap.toLowerCase().includes(lowerQuery)
        );
        setSearchResults(filtered);
      } else {
        searchResults.length > 0 && setSearchResults([]);
      }
    }, 300);
    return () => clearTimeout(handler);
  }, [searchTerm, allPasienData, searchResults.length]);

  // --- END LOGIC FETCH DATA ---

  const groupedQuestions = useMemo(() => {
    return groupQuestions(masterQuestions);
  }, [masterQuestions]);

  const structuredAnswersMap = useMemo(() => {
    return groupStructuredAnswers(structuredAnswers);
  }, [structuredAnswers]);

  const getFilledCategories = useCallback(() => {
    return Object.entries(answers)
      .filter(([_, codedAnswers]) =>
        Object.values(codedAnswers).some(
          (val) => val.jawabanId !== null || val.keterangan.trim() !== ""
        )
      )
      .map(([category]) => category);
  }, [answers]);

  const handleAnswerSave = useCallback(
    (category: string, newAnswers: Record<string, StoredAnswer>) => {
      setAnswers((prevAnswers) => ({
        ...prevAnswers,
        [category]: newAnswers,
      }));
    },
    []
  );

  const buildPayload = (): FullAnamnesisPayload => {
    const detailData: { [kategori: string]: AnamnesisAnswer[] } = {};

    for (const [category, codedAnswers] of Object.entries(answers)) {
      const cleanCategory = category.replace(/[\s\t]+/g, "_").toUpperCase();
      const answersArray: AnamnesisAnswer[] = [];

      for (const [idString, storedAnswer] of Object.entries(codedAnswers)) {
        const parsedId = parseInt(idString, 10);
        const hasAnswer =
          (storedAnswer.jawabanId !== null && storedAnswer.jawabanId > 0) ||
          storedAnswer.keterangan.trim() !== "";

        if (hasAnswer && !isNaN(parsedId) && parsedId > 0) {
          answersArray.push({
            FN_pertanyaan_id: parsedId,
            FN_jawaban_id: storedAnswer.jawabanId || 0,
            FS_keterangan: storedAnswer.keterangan.trim(),
          });
        }
      }

      if (answersArray.length > 0) {
        const mappedTableName = `${cleanCategory}`;
        detailData[mappedTableName] = answersArray;
      }
    }

    const pasienId = activePasien?.FN_pasien_id ?? 0;
    const nakesId = nakesProfile?.FN_tenaga_kesehatan_id ?? 0;

    return {
      master_data: {
        FN_pasien_id: pasienId,
        FN_tenaga_kesehatan_id: nakesId,
      },
      detail_data: detailData,
    };
  };

  const isFormReady = useMemo(() => {
    return !!activePasien && !!nakesProfile;
  }, [activePasien, nakesProfile]);

  const totalFilledCategories = useMemo(
    () => getFilledCategories().length,
    [getFilledCategories]
  );

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSubmissionMessage(null);

    if (!isFormReady) {
      setSubmissionMessage("❌ Pasien atau data Nakes belum valid.");
      return;
    }

    const payload = buildPayload();

    if (Object.keys(payload.detail_data).length === 0) {
      setSubmissionMessage(
        "⚠️ Tidak ada data anamnesis yang diisi. Mohon isi minimal satu kategori."
      );
      return;
    }

    setIsSaving(true);
    console.group("➡️ Anamnesis API Request Debug");
    console.log("URL Endpoint:", API_ANAMNESIS_FULL_URL);
    console.log("Payload yang Dikirim:", JSON.stringify(payload, null, 2));
    console.groupEnd();

    try {
      const response = await axios.post(API_ANAMNESIS_FULL_URL, payload, {
        headers: { Authorization: `Bearer ${token}` },
      });

      setSubmissionMessage(
        `✅ Data Anamnesis berhasil disimpan! ID Anamnesis: ${
          response.data.FN_anamnesis_id || response.data.message || "N/A"
        }`
      );
      setAnswers({});
      setActivePasien(null);
      setSearchTerm("");
      setSearchResults([]);
    } catch (err: any) {
      console.error("❌ Submission Error:", err.response || err.message || err);

      const errorMessage =
        axios.isAxiosError(err) && err.response?.data?.message
          ? err.response.data.message
          : "Gagal menyimpan data anamnesis. Cek koneksi API dan format data.";
      setSubmissionMessage(`❌ ${errorMessage}`);
    } finally {
      setIsSaving(false);
    }
  };

  // --- RENDERING ERROR/LOADING ---

  if (loading || (nakesProfile === null && !error))
    return (
      <div className="flex flex-col justify-center items-center py-20 text-blue-600 bg-gray-50 min-h-screen">
        <FaSpinner className="inline mr-3 h-10 w-10 animate-spin" />
        <span className="text-2xl font-medium mt-4">Memuat data...</span>
      </div>
    );

  if (error)
    return (
      <div className="p-8 m-8 bg-red-100 text-red-700 rounded-xl shadow-lg border border-red-300">
        <FaExclamationTriangle className="inline mr-3 h-5 w-5" />
        <span className="font-semibold text-lg">Error Fatal:</span> {error}
      </div>
    );

  if (!nakesProfile) {
    return (
      <div className="p-8 m-8 bg-yellow-100 text-yellow-700 rounded-xl shadow-lg border border-yellow-300">
        <FaExclamationTriangle className="inline mr-3 h-5 w-5" />
        <span className="font-semibold text-lg">Perhatian:</span> Gagal memuat
        data profil Nakes dan tidak ada error spesifik. Mohon coba **refresh**
        atau **login ulang**.
      </div>
    );
  }

  // --- RENDERING BAGIAN LIST KATEGORI ---

  const renderCategoryList = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {Object.entries(groupedQuestions).map(([category, questions]) => {
        const categoryKey = category;
        const isFilled = getFilledCategories().includes(categoryKey);
        const totalAnswersInCategory = Object.values(
          answers[categoryKey] || {}
        ).filter(
          (val) => val.jawabanId !== null || val.keterangan.trim() !== ""
        ).length;

        return (
          <div
            key={categoryKey}
            onClick={() => setOpenModalCategory(categoryKey)}
            className={`p-5 rounded-xl shadow-lg cursor-pointer transition transform hover:scale-[1.02] 
            ${
              isFilled
                ? "bg-green-100 border-2 border-green-500"
                : "bg-white border border-gray-300"
            }`}
          >
            <h4
              className={`font-bold text-lg mb-2 flex justify-between items-center ${
                isFilled ? "text-green-800" : "text-blue-700"
              }`}
            >
              {categoryKey.replace(/_/g, " ").toUpperCase()}
              <FaChevronRight className="text-gray-400" />
            </h4>
            <div className="text-sm text-gray-600">
              <p>
                Total Pertanyaan:
                <span className="font-semibold">{questions.length}</span>
              </p>
              <p
                className={`font-semibold ${
                  isFilled ? "text-green-600" : "text-gray-500"
                }`}
              >
                {isFilled
                  ? `Sudah Diisi: ${totalAnswersInCategory} Jawaban`
                  : "Belum Diisi"}
              </p>
            </div>
            <div className="mt-3 text-xs text-blue-500 flex items-center gap-1 font-medium">
              <FaEdit /> Klik untuk Mengisi Detail
            </div>
          </div>
        );
      })}
    </div>
  );

  // --- RENDERING UTAMA ---

  return (
    <div className="max-w-5xl mx-auto p-4 sm:p-6 lg:p-8 bg-gray-50 min-h-screen">
      <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 border-b-4 border-blue-600 pb-4 bg-white p-5 rounded-xl shadow-2xl">
        <h2 className="text-3xl font-extrabold text-blue-700 flex items-center gap-3 mb-2 sm:mb-0">
          <FaFileMedicalAlt className="text-4xl" /> Formulir Anamnesis (Modal
          UX)
        </h2>
        <div className="text-sm font-medium text-gray-600 bg-gray-100 px-4 py-2 rounded-full shadow-inner">
          Nakes ID:
          <span className="font-bold">
            {nakesProfile.FN_tenaga_kesehatan_id}
          </span>
          ({nakesProfile.FS_nama_lengkap})
        </div>
      </header>

      {submissionMessage && (
        <div
          className={`p-4 mb-6 rounded-xl font-medium shadow-xl ${
            submissionMessage.startsWith("✅")
              ? "bg-green-100 text-green-800 border border-green-500"
              : submissionMessage.startsWith("⚠️")
              ? "bg-yellow-100 text-yellow-800 border border-yellow-500"
              : "bg-red-100 text-red-800 border border-red-500"
          }`}
          role="alert"
        >
          {submissionMessage}
        </div>
      )}

      {/* --- BAGIAN PENCARIAN & SELEKSI PASIEN --- */}
      <section className="mb-8 p-6 bg-white rounded-xl shadow-2xl border border-blue-300">
        <h3 className="text-xl font-bold text-blue-600 mb-4 flex items-center gap-2 border-b pb-2">
          <FaUser />
          {activePasien ? "Detail Pasien" : "Pilih Pasien Target"}
        </h3>
        {activePasien ? (
          <div className="p-4 bg-green-50 border border-green-300 rounded-lg flex justify-between items-start">
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-3">
                <FaCheckCircle className="text-green-500 text-2xl" />
                <span className="text-lg font-bold text-green-700">
                  Pasien Terpilih:
                </span>
                <span className="text-lg font-semibold text-gray-800">
                  {activePasien.FS_nama_lengkap} (Usia:
                  {calculateAge(activePasien.FD_tanggal_lahir)} th)
                </span>
              </div>
              <div className="ml-9 text-sm text-gray-700 space-y-1">
                <p>
                  <span className="font-semibold">Nomor RM:</span>
                  {activePasien.FS_no_rm}
                </p>
                <p>
                  <FaVenusMars className="inline mr-1 text-gray-500" />
                  <span className="font-semibold">Jenis Kelamin:</span>
                  {activePasien.jenis_kelamin}
                </p>
                <p>
                  <FaMapMarkerAlt className="inline mr-1 text-gray-500" />
                  <span className="font-semibold">Alamat:</span>
                  {activePasien.alamat_lengkap}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => {
                setActivePasien(null);
                setAnswers({});
                setSubmissionMessage(null);
              }}
              className="px-3 py-1 bg-red-500 text-white text-sm rounded-full hover:bg-red-600 transition flex items-center gap-1 shadow-md"
            >
              <FaTimesCircle /> Ganti
            </button>
          </div>
        ) : (
          <>
            {/* Search Input */}
            <div className="relative mb-4">
              <input
                type="text"
                placeholder="Cari Pasien (Nama, No. RM, atau NIK)..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full border border-gray-300 p-3 pl-10 rounded-xl focus:ring-blue-500 focus:border-blue-500 transition shadow-inner"
                disabled={isSearching}
              />
              <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            </div>

            {/* Search Results */}
            {!isSearching &&
              searchTerm.length > 2 &&
              searchResults.length > 0 && (
                <div className="space-y-2 max-h-80 overflow-y-auto border p-4 rounded-xl bg-blue-50 shadow-inner">
                  {searchResults.map((pasien) => (
                    <div
                      key={pasien.FN_pasien_id}
                      className="p-4 bg-white rounded-lg shadow-sm hover:bg-blue-100 cursor-pointer transition border border-gray-200"
                      onClick={() => {
                        setActivePasien(pasien);
                        setSearchResults([]);
                        setSubmissionMessage(null);
                      }}
                    >
                      <span className="font-bold text-lg text-blue-700">
                        {pasien.FS_nama_lengkap}
                      </span>
                      <span className="text-sm font-semibold bg-gray-200 px-2 py-0.5 rounded-full ml-2">
                        RM: {pasien.FS_no_rm}
                      </span>
                    </div>
                  ))}
                </div>
              )}

            {/* Not Found */}
            {!isSearching &&
              searchTerm.length > 2 &&
              searchResults.length === 0 && (
                <p className="text-center text-red-500 p-4 border border-red-200 rounded-lg bg-red-50">
                  <span className="font-semibold">"{searchTerm}"</span> tidak
                  ditemukan.
                </p>
              )}
          </>
        )}
      </section>

      {/* --- FORM ANAMNESIS (LIST KATEGORI) --- */}
      {activePasien && (
        <form onSubmit={handleSubmit} className="mt-8">
          <h3 className="text-2xl font-extrabold text-gray-800 mb-6 flex items-center gap-3">
            <FaFileMedicalAlt /> Daftar Kategori Anamnesis
          </h3>
          {renderCategoryList()}

          {/* Tombol Submit */}
          <button
            type="submit"
            disabled={isSaving || !isFormReady || totalFilledCategories === 0}
            className="w-full flex items-center justify-center gap-3 px-6 py-3 mt-10 bg-green-600 text-white text-xl font-bold rounded-xl shadow-2xl hover:bg-green-700 transition duration-200 disabled:bg-gray-400 disabled:shadow-none"
          >
            {isSaving ? (
              <>
                <FaSpinner className="animate-spin h-5 w-5" /> Menyimpan (
                {totalFilledCategories} Kategori)...
              </>
            ) : (
              <>
                <FaSave className="h-6 w-6" /> SIMPAN ({totalFilledCategories}{" "}
                Kategori) REKAM MEDIS
              </>
            )}
          </button>

          {!isSaving && totalFilledCategories === 0 && (
            <p className="text-center text-sm text-red-500 mt-2">
              Minimal satu kategori anamnesis harus diisi untuk menyimpan.
            </p>
          )}
        </form>
      )}

      {/* --- MODAL RENDERING --- */}
      {openModalCategory && groupedQuestions[openModalCategory] && (
        <AnamnesisCategoryModal
          category={openModalCategory}
          questions={groupedQuestions[openModalCategory]}
          currentAnswers={answers[openModalCategory] || {}}
          onSave={handleAnswerSave}
          onClose={() => setOpenModalCategory(null)}
          structuredAnswersMap={structuredAnswersMap}
        />
      )}
    </div>
  );
}
