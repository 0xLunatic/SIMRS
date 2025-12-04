import PathwayService from "../services/BPJSService.js";

// --- HELPER SEARCH ---

export const searchPasien = async (req, res) => {
  try {
    const { keyword } = req.query;
    if (!keyword) return res.json({ status: "success", data: [] });
    const data = await PathwayService.searchPasien(keyword);
    res.json({ status: "success", count: data.length, data });
  } catch (error) {
    res.status(500).json({ status: "error", message: error.message });
  }
};

// controllers/PathwayController.js

export const searchTindakan = async (req, res) => {
  try {
    const { keyword } = req.query;

    const searchKey = keyword || "";

    const data = await PathwayService.searchTindakan(searchKey);
    res.json({ status: "success", count: data.length, data });
  } catch (error) {
    res.status(500).json({ status: "error", message: error.message });
  }
};
// --- CRUD ---

export const createPathway = async (req, res) => {
  try {
    const result = await PathwayService.createPathway(req.body);
    res.status(201).json({ status: "success", ...result });
  } catch (error) {
    res.status(500).json({ status: "error", message: error.message });
  }
};

export const getHistory = async (req, res) => {
  try {
    const data = await PathwayService.getPathwayHistory(req.params.pasienId);
    if (!data || data.length === 0) {
      return res.status(404).json({
        status: "not_found",
        message: "Belum ada history pathway",
        data: [],
      });
    }
    res.json({ status: "success", data });
  } catch (error) {
    res.status(500).json({ status: "error", message: error.message });
  }
};

export const getDetail = async (req, res) => {
  try {
    const data = await PathwayService.getPathwayDetail(req.params.pathwayId);
    if (!data)
      return res
        .status(404)
        .json({ status: "not_found", message: "Data pathway tidak ditemukan" });
    res.json({ status: "success", data });
  } catch (error) {
    res.status(500).json({ status: "error", message: error.message });
  }
};

export const updatePathway = async (req, res) => {
  try {
    const result = await PathwayService.updatePathway(
      req.params.pathwayId,
      req.body
    );
    res.json({ status: "success", ...result });
  } catch (error) {
    res.status(500).json({ status: "error", message: error.message });
  }
};

export const deletePathway = async (req, res) => {
  try {
    const result = await PathwayService.deletePathway(req.params.pathwayId);
    res.json({ status: "success", ...result });
  } catch (error) {
    res.status(500).json({ status: "error", message: error.message });
  }
};
