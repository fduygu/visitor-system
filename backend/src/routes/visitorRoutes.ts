import express from "express";
import {
  createVisitor,
  getVisitors,
  exitVisitor,
  getVisitorByTc,
} from "../controllers/visitorController";
import { authMiddleware } from "../middlewares/authMiddleware";

const router = express.Router();

router.get("/by-tc/:tcNo", authMiddleware, getVisitorByTc);
router.post("/", authMiddleware, createVisitor);
router.get("/", authMiddleware, getVisitors);
router.put("/exit/:id", authMiddleware, exitVisitor);

export default router;