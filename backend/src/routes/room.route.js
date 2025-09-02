import express from "express";
import {
  createRoom, getAllRooms, updateRoom, deleteRoom,
  recommendRooms, assignRoom
} from "../controllers/room.js";

const router = express.Router();

router.get("/", getAllRooms);
router.post("/", createRoom);
router.put("/:id", updateRoom);
router.delete("/:id", deleteRoom);

router.post("/recommend", recommendRooms);
router.post("/get-free-room", assignRoom);

export default router;
