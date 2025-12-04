import express from "express";
import {
  loginUser,
  getProfile,
  createUser,
  getAllUsers,
  getUserById,
  updateUser,
  changePassword,
  deleteUser,
  // 🆕 Tambahkan controller baru
  getNakesByUserId,
} from "../controllers/UserController.js";
import authMiddleware from "../middlewares/AuthMiddleware.js";

const router = express.Router();

router.post("/login", loginUser);
router.get("/profile", authMiddleware, getProfile);
router.post("/", createUser);
router.get("/", getAllUsers);
router.get("/:id", getUserById);

// 🆕 ROUTE BARU: Ambil data Nakes yang terikat pada User ID tertentu
router.get("/:id/nakes", getNakesByUserId);

router.put("/:id", updateUser);
router.put("/:id/password", changePassword);
router.delete("/:id", deleteUser);

export default router;
