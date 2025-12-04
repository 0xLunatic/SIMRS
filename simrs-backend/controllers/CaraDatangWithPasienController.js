import CaraDatangWithPasienService from "../services/CaraDatangWithPasienService.js";

export const getAllCaraDatangWithPasien = async (req, res) => {
  try {
    const data = await CaraDatangWithPasienService.getAll();
    res.json(data);
  } catch (err) {
    console.error("Error:", err);
    res
      .status(500)
      .json({ message: "Gagal memuat data cara datang dan pasien" });
  }
};
