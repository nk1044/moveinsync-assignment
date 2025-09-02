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

const recommendRooms = async (req, res) => {
  try {
    const { numberOfPeople, preferredFloor } = req.body;
    if (!numberOfPeople) return res.status(400).json({ message: "numberOfPeople required" });

    const num = Number(numberOfPeople);
    const prefFloor = preferredFloor != null ? Number(preferredFloor) : null;

    // basic candidate filtering
    let candidates = await Room.find({ availableSeats: { $gte: num } }).lean();

    // score and sort
    candidates = candidates.map(r => ({
      ...r,
      capacityDelta: r.availableSeats - num,
      proximityScore: prefFloor !== null ? (r.floor === prefFloor ? 1 : 0) : 0,
      recentScore: new Date(r.updatedAt).getTime()
    })).sort((a, b) => {
      if (a.capacityDelta !== b.capacityDelta) return a.capacityDelta - b.capacityDelta;
      if (a.proximityScore !== b.proximityScore) return b.proximityScore - a.proximityScore;
      return b.recentScore - a.recentScore;
    });

    return res.json({ message: "Recommendations", candidates: candidates.slice(0, 10) });
  } catch (e) {
    return res.status(500).json({ message: "Error recommending rooms", error: e.message });
  }
};


const assignRoom = async (req, res) => {
  try {
    const { fromTime, toTime, numberOfPeople, organizer, preferredFloor } = req.body;
    if (!fromTime || !toTime || !numberOfPeople || !organizer) {
      return res.status(400).json({ message: "Missing fields" });
    }

    const startTime = new Date(fromTime);
    const endTime = new Date(toTime);
    if (startTime >= endTime) return res.status(400).json({ message: "Invalid time range" });

    // get candidates sorted by recommendation logic
    const recRes = await recommendRooms({ body: { numberOfPeople, preferredFloor } }, { json: (x)=>x });
    const candidates = recRes.candidates;

    let chosen = null;

    for (const c of candidates) {
      const overlap = await Meeting.findOne({
        room: c._id,
        $or: [
          { startTime: { $lt: endTime }, endTime: { $gt: startTime } }
        ]
      });
      if (!overlap) { chosen = c; break; }
    }

    if (!chosen) return res.status(404).json({ message: "No suitable room available for given time" });

    const meeting = new Meeting({ room: chosen._id, organizer, startTime, endTime });
    await meeting.save();

    // update room updatedAt to indicate recent booking (no other fields changed)
    await Room.findByIdAndUpdate(chosen._id, { $set: { updatedAt: new Date() } });

    req.io?.emit("rooms:updated", { type: "BOOKED", roomId: chosen._id, meetingId: meeting._id });

    return res.status(200).json({
      message: "Room assigned",
      roomId: chosen._id,
      roomNumber: chosen.roomNumber,
      floor: chosen.floor,
      meetingId: meeting._id,
      startTime,
      endTime
    });
  } catch (e) {
    return res.status(500).json({ message: "Server error", error: e.message });
  }
};


export {
  createRoom,
  getAllRooms,
  updateRoom,
  deleteRoom,
  recommendRooms,
  assignRoom
};