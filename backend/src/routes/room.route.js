import express from "express";
import { createRoom, updateRoom, deleteRoom,getAllRooms } from "../controllers/room.js";
import {assignRoom} from "../controllers/meeting.js";

const router = express.Router();

router.post("/", createRoom);
router.put("/:id", updateRoom);       
router.delete("/:id", deleteRoom);    
router.get("/", getAllRooms);  

router.post("/get-free-room",assignRoom);

export default router;
