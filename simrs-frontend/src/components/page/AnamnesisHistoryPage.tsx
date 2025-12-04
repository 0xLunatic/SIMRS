// src/components/page/AnamnesisPage.tsx

import AnamnesisHistoryTable from "../../pages/master/AnamnesisHistoryTable";

export default function AnamnesisHistoryPage() {
  // ⚠️ PENTING: GANTI DUMMY ID INI
  // DUMMY_PASIEN_ID dan DUMMY_NAKES_ID HARUS DIAMBIL DARI URL PARAMETER atau CONTEXT/STATE.

  return (
    <div className="p-6">
      <AnamnesisHistoryTable />
    </div>
  );
}
