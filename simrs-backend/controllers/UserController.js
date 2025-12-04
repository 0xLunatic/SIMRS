import userService from "../services/UserService.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
dotenv.config();

const JWT_SECRET = process.env.JWT_SECRET;
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN;

// 🧩 LOGIN
export const loginUser = async (req, res) => {
  const { username, password } = req.body;
  try {
    const user = await userService.findByUsername(username);
    if (!user || !user.FB_aktif)
      return res
        .status(401)
        .json({ message: "Username tidak ditemukan atau nonaktif" });

    const valid = await bcrypt.compare(password, user.FS_password_hash);
    if (!valid) return res.status(401).json({ message: "Password salah" });

    const token = jwt.sign(
      {
        user_id: user.FN_user_id,
        username: user.FS_username,
        role: user.FS_role,
        FN_tenaga_kesehatan_id: user.FN_tenaga_kesehatan_id,
      },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );

    res.json({
      success: true,
      token,
      user: {
        id: user.FN_user_id,
        username: user.FS_username,
        role: user.FS_role,
        nama_lengkap: user.FS_nama_lengkap,
        FN_tenaga_kesehatan_id: user.FN_tenaga_kesehatan_id,
      },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Terjadi kesalahan server" });
  }
};

// 👤 GET PROFILE DARI TOKEN
export const getProfile = async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader)
      return res.status(401).json({ message: "Token tidak ada" });

    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, JWT_SECRET);
    const user = await userService.getById(decoded.user_id);
    if (!user) return res.status(404).json({ message: "User tidak ditemukan" });

    res.json({
      id: user.FN_user_id,
      username: user.FS_username,
      nama_lengkap: user.FS_nama_lengkap,
      role: user.FS_role,
      FN_tenaga_kesehatan_id: user.FN_tenaga_kesehatan_id,
    });
  } catch (err) {
    console.error(err);
    res.status(401).json({ message: "Token tidak valid atau kedaluwarsa" });
  }
};

// ➕ CREATE USER
export const createUser = async (req, res) => {
  try {
    // Menangkap FN_tenaga_kesehatan_id
    const { username, password, nama_lengkap, role, FN_tenaga_kesehatan_id } =
      req.body;

    if (!username || !password || !nama_lengkap || !role)
      return res.status(400).json({ message: "Data tidak lengkap" });

    const existing = await userService.findByUsername(username);
    if (existing)
      return res.status(400).json({ message: "Username sudah digunakan" });

    const result = await userService.create({
      username,
      password,
      nama_lengkap,
      role, // Mapping nama field ke service (Service mengharapkan 'tenaga_kesehatan_id')
      tenaga_kesehatan_id: FN_tenaga_kesehatan_id || null,
    });
    res.json(result);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Gagal membuat user" });
  }
};

// 📋 GET ALL USERS
export const getAllUsers = async (req, res) => {
  try {
    const users = await userService.getAll();
    res.json(users);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Gagal mengambil data user" });
  }
};

// 🔍 GET USER BY ID
export const getUserById = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = parseInt(id, 10);
    if (isNaN(userId))
      return res.status(400).json({ message: "ID user tidak valid" });

    const user = await userService.getById(userId);
    if (!user) return res.status(404).json({ message: "User tidak ditemukan" });
    res.json(user);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Gagal mengambil data user" });
  }
};

// 🆕 CONTROLLER BARU: Ambil data Nakes berdasarkan FN_tenaga_kesehatan_id yang terikat di User ID
export const getNakesByUserId = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = parseInt(id, 10);
    if (isNaN(userId))
      return res.status(400).json({ message: "ID user tidak valid" }); // 1. Ambil data user

    const user = await userService.getById(userId);
    if (!user) return res.status(404).json({ message: "User tidak ditemukan" });

    const nakesId = user.FN_tenaga_kesehatan_id; // 2. Cek jika user tidak terikat dengan Nakes ID

    if (!nakesId) {
      return res.status(404).json({
        message: "User ini tidak terikat dengan ID Tenaga Kesehatan manapun",
      });
    } // 3. Ambil data Nakes

    const nakes = await userService.getTenagaKesehatanById(nakesId);

    if (!nakes) {
      return res.status(404).json({
        message: `Data Tenaga Kesehatan (ID: ${nakesId}) tidak ditemukan atau tidak aktif`,
      });
    }

    res.json(nakes);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Gagal mengambil data Tenaga Kesehatan" });
  }
};

// ✏️ UPDATE USER
export const updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = parseInt(id, 10);
    if (isNaN(userId))
      return res.status(400).json({ message: "ID user tidak valid" }); // 🔑 PERBAIKAN DI SINI: Destructure FN_tenaga_kesehatan_id

    const { nama_lengkap, role, aktif, FN_tenaga_kesehatan_id } = req.body;
    const result = await userService.update(userId, {
      nama_lengkap,
      role,
      aktif, // Mapping kembali ke 'tenaga_kesehatan_id' yang diharapkan oleh service
      tenaga_kesehatan_id: FN_tenaga_kesehatan_id,
    });
    res.json(result);
  } catch (err) {
    console.error(err); // Jika error berasal dari 'throw new Error("Tidak ada field untuk diupdate")'
    res.status(400).json({ message: err.message });
  }
};

// 🔐 CHANGE PASSWORD
export const changePassword = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = parseInt(id, 10);
    if (isNaN(userId))
      return res.status(400).json({ message: "ID user tidak valid" });

    const { newPassword } = req.body;
    if (!newPassword)
      return res.status(400).json({ message: "Password baru harus diisi" });

    const result = await userService.changePassword(userId, newPassword);
    res.json(result);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Gagal mengganti password" });
  }
};

// 🗑️ DELETE USER
export const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = parseInt(id, 10);
    if (isNaN(userId))
      return res.status(400).json({ message: "ID user tidak valid" });

    const result = await userService.remove(userId);
    res.json(result);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Gagal menghapus user" });
  }
};
