import express from "express";
import TatalaksanaController from "../controllers/TatalaksanaController.js";

const router = express.Router();

router.get("/", TatalaksanaController.getAll);
router.get("/:id", TatalaksanaController.getById);
router.post("/", TatalaksanaController.create);
router.delete("/:id", TatalaksanaController.delete);

router.get("/refs/snomed", TatalaksanaController.searchSnomed);

export default router;
