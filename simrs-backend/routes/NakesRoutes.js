// routes/NakesRoute.js
import express from "express";
import NakesController from "../controllers/NakesController.js";

const router = express.Router();

router.get("/", NakesController.getAll);
router.get("/:id", NakesController.getById);
router.post("/", NakesController.create);
router.put("/:id", NakesController.update);
router.delete("/:id", NakesController.delete);

export default router;
