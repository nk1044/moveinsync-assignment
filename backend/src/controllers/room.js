import Room from "../models/room.js";
import Meeting from "../models/meeting.js";
import mongoose from "mongoose";


const versionOf = (room) => (room && room.updatedAt) ? new Date(room.updatedAt).toISOString() : null;

const createRoom = async (req, res) => {
  try {
    const { roomNumber, floor, availableSeats } = req.body;
    if (!roomNumber || floor == null || availableSeats == null) {
      return res.status(400).json({ message: "roomNumber, floor and availableSeats required" });
    }
    const exists = await Room.findOne({ roomNumber });
    if (exists) return res.status(400).json({ message: "Room already exists" });

    const room = new Room({ roomNumber, floor, availableSeats });
    await room.save();
    res.set("ETag", versionOf(room));
    return res.status(201).json({ message: "Room created", room, version: versionOf(room) });
  } catch (e) {
    return res.status(500).json({ message: "Error creating room", error: e.message });
  }
};

const getAllRooms = async (req, res) => {
  try {
    const rooms = await Room.find().sort({ floor: 1, roomNumber: 1 });
    return res.json({ message: "Rooms fetched", rooms });
  } catch (e) {
    return res.status(500).json({ message: "Error fetching rooms", error: e.message });
  }
};

const updateRoom = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) return res.status(400).json({ message: "Invalid id" });

    const clientVersion = req.header("If-Match"); // should be ISO string of updatedAt
    const room = await Room.findById(id);
    if (!room) return res.status(404).json({ message: "Room not found" });

    const serverVersion = versionOf(room);

    // If client version present and mismatches server -> conflict
    if (clientVersion && clientVersion !== serverVersion) {
      // propose a simple merge: prefer numeric fields from client if larger seats, else server
      const proposed = {
        roomNumber: req.body.roomNumber ?? room.roomNumber,
        floor: req.body.floor ?? room.floor,
        availableSeats: req.body.availableSeats != null ? Math.max(room.availableSeats, req.body.availableSeats) : room.availableSeats
      };
      return res.status(409).json({
        message: "Version conflict",
        server: { room, version: serverVersion },
        proposed,
      });
    }

    // Apply changes
    const { roomNumber, floor, availableSeats } = req.body;
    if (roomNumber !== undefined) room.roomNumber = roomNumber;
    if (floor !== undefined) room.floor = floor;
    if (availableSeats !== undefined) room.availableSeats = availableSeats;

    // save
    await room.save();
    res.set("ETag", versionOf(room));
    req.io?.emit("rooms:updated", { type: "UPDATED", roomId: room._id });
    return res.json({ message: "Room updated", room, version: versionOf(room) });
  } catch (e) {
    return res.status(500).json({ message: "Error updating room", error: e.message });
  }
};


const deleteRoom = async (req, res) => {
  try {
    const { id } = req.params;
    const room = await Room.findByIdAndDelete(id);
    if (!room) return res.status(404).json({ message: "Room not found" });
    req.io?.emit("rooms:updated", { type: "DELETED", roomId: id });
    return res.json({ message: "Room deleted" });
  } catch (e) {
    return res.status(500).json({ message: "Error deleting room", error: e.message });
  }
};

function toUTC(dateString) {
  const d = new Date(dateString);
  return new Date(Date.UTC(
    d.getUTCFullYear(),
    d.getUTCMonth(),
    d.getUTCDate(),
    d.getUTCHours(),
    d.getUTCMinutes(),
    d.getUTCSeconds(),
    d.getUTCMilliseconds()
  ));
}

const recommendRooms = async (req, res) => {
  try {
    console.log('Recommend rooms called');
    const { numberOfPeople, preferredFloor, fromTime, toTime } = req.body;
    console.log(numberOfPeople, preferredFloor, fromTime, toTime);
    
    if (!numberOfPeople || !fromTime || !toTime) {
      return res.status(400).json({ message: "all fields are required" });
    }

    const num = Number(numberOfPeople);
    const prefFloor = preferredFloor != null ? Number(preferredFloor) : null;

    const startTime = fromTime ? toUTC(fromTime) : null;
    const endTime = toTime ? toUTC(toTime) : null;

    // 1. Get all rooms
    let roomsQuery = { availableSeats: { $gte: num } };
    if (prefFloor != null) {
      roomsQuery.floor = prefFloor;
    }

    const allRooms = await Room.find(roomsQuery);
    console.log('valid rooms:- ', allRooms.length);
    
    let candidates = [];

    for (const room of allRooms) {
      const overlap = await Meeting.findOne({
        room: room._id,
        startTime: { $lt: endTime },
        endTime: { $gt: startTime },
      });
      
      if (!overlap) {
        candidates.push(room);
      }else{
        console.log(`Room ${room.roomNumber} is booked from ${overlap.startTime} to ${overlap.endTime}`);
      }
    }

    return res.json({
      message: "Recommendations",
      candidates,
    });
  } catch (e) {
    console.error("Error recommending rooms:", e);
    return res
      .status(500)
      .json({ message: "Error recommending rooms", error: e.message });
  }
};


const assignRoom = async (req, res) => {
  try {
    const { roomId, fromTime, toTime, organizer } = req.body;

    if (!roomId || !fromTime || !toTime || !organizer) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    const startTime = toUTC(new Date(fromTime));
    const endTime = toUTC(new Date(toTime));

    if (startTime >= endTime) {
      return res.status(400).json({ message: "Invalid meeting time range" });
    }
    const room = await Room.findById(roomId);
    if (!room) {
      return res.status(404).json({ message: "Room not found" });
    }

    const overlap = await Meeting.findOne({
      room: roomId,
      startTime: { $lt: endTime },
      endTime: { $gt: startTime },
    });

    if (overlap) {
      return res.status(409).json({
        message: "Room is already booked for the given time",
        conflict: {
          meetingId: overlap._id,
          startTime: overlap.startTime,
          endTime: overlap.endTime,
        },
      });
    }

    const meeting = await Meeting.create({
      room: roomId,
      organizer,
      startTime,
      endTime,
    });

    return res.status(201).json({
      message: "Room assigned successfully",
      roomId: room._id,
      roomNumber: room.roomNumber,
      floor: room.floor,
      meetingId: meeting._id,
      startTime,
      endTime,
    });
  } catch (error) {
    console.error("Error assigning room:", error);
    return res.status(500).json({ message: "Server error", error: error.message });
  }
};



const getAvailableRooms = async (num, prefFloor, startTime, endTime) => {
  const roomQuery = { capacity: { $gte: num } };
  if (prefFloor !== null) {
    roomQuery.floor = prefFloor;
  }
  const rooms = await Room.find(roomQuery).sort({ updatedAt: 1 });
  if (!startTime || !endTime) {
    return rooms;
  }
  const availableRooms = [];
  for (const room of rooms) {
    const overlap = await Meeting.findOne({
      room: room._id,
      startTime: { $lt: endTime },
      endTime: { $gt: startTime },
    });

    if (!overlap) {
      availableRooms.push(room);
    }
  }

  return availableRooms;
};


export {
  createRoom,
  getAllRooms,
  updateRoom,
  deleteRoom,
  recommendRooms,
  assignRoom
};