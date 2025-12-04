import SoapService from "../services/SoapService.js";

// --- SEARCH HELPERS ---
export const searchPasien = async (req, res) => {
  try {
    const { keyword } = req.query;
    if (!keyword)
      return res
        .status(400)
        .json({ status: "error", message: "Keyword kosong" });

    const data = await SoapService.searchPasien(keyword);
    if (!data || data.length === 0)
      return res.status(404).json({ status: "not_found", data: [] });

    res.json({ status: "success", count: data.length, data });
  } catch (error) {
    res.status(500).json({ status: "error", message: error.message });
  }
};

export const getSnomedCategories = async (req, res) => {
  try {
    const data = await SoapService.getSnomedCategories();
    res.json({ status: "success", data });
  } catch (error) {
    res.status(500).json({ status: "error", message: error.message });
  }
};

export const getSnomed = async (req, res) => {
  try {
    const { keyword, category } = req.query;
    const data = await SoapService.searchSnomed(keyword, category);

    // Return empty array instead of 404 for dropdowns often better for UX
    if (!data || data.length === 0)
      return res.json({ status: "success", count: 0, data: [] });

    res.json({ status: "success", count: data.length, data });
  } catch (error) {
    res.status(500).json({ status: "error", message: error.message });
  }
};

export const getIcd10 = async (req, res) => {
  try {
    const { keyword, category } = req.query;
    const data = await SoapService.searchIcd10(keyword, category);
    if (!data || data.length === 0)
      return res.json({ status: "success", count: 0, data: [] });

    res.json({ status: "success", count: data.length, data });
  } catch (error) {
    res.status(500).json({ status: "error", message: error.message });
  }
};

// --- CRUD SOAP ---

// 1. Create
export const createSoap = async (req, res) => {
  try {
    // Pastikan req.body memiliki field baru seperti:
    // snomed_subjective, snomed_assessment, dll.
    const result = await SoapService.createSoap(req.body);
    res
      .status(201)
      .json({ status: "success", message: "SOAP Created", ...result });
  } catch (error) {
    res.status(500).json({ status: "error", message: error.message });
  }
};

// 2. Read (History List)
export const getHistory = async (req, res) => {
  try {
    const data = await SoapService.getSoapHistoryByPasien(req.params.pasienId);
    if (!data || data.length === 0) {
      return res
        .status(404)
        .json({ status: "not_found", message: "Belum ada riwayat", data: [] });
    }
    res.json({ status: "success", data });
  } catch (error) {
    res.status(500).json({ status: "error", message: error.message });
  }
};

// 3. Read (Detail)
export const getDetail = async (req, res) => {
  try {
    const data = await SoapService.getSoapById(req.params.soapId);
    if (!data)
      return res
        .status(404)
        .json({ status: "not_found", message: "Data tidak ditemukan" });
    res.json({ status: "success", data });
  } catch (error) {
    res.status(500).json({ status: "error", message: error.message });
  }
};

// 4. Update
export const updateSoap = async (req, res) => {
  try {
    const { soapId } = req.params;
    await SoapService.updateSoap(soapId, req.body);
    res.json({ status: "success", message: "SOAP Updated" });
  } catch (error) {
    res.status(500).json({ status: "error", message: error.message });
  }
};

// 5. Delete
export const deleteSoap = async (req, res) => {
  try {
    await SoapService.deleteSoap(req.params.soapId);
    res.json({ status: "success", message: "SOAP Deleted" });
  } catch (error) {
    res.status(500).json({ status: "error", message: error.message });
  }
};
