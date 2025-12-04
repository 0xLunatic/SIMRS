// src/components/page/AnamnesisPage.tsx

import AnamnesisTable from "../../pages/master/AnamnesisTable";

export default function AnamnesisPage() {
  // ⚠️ PENTING: GANTI DUMMY ID INI
  // DUMMY_PASIEN_ID dan DUMMY_NAKES_ID HARUS DIAMBIL DARI URL PARAMETER atau CONTEXT/STATE.

  return (
    <div className="p-6">
      <AnamnesisTable />
    </div>
  );
}
