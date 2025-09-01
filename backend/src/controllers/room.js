import Room from "../models/room.js";

export const createRoom = async (req, res) => {
  try {
    const { roomNumber, floor, availableSeats } = req.body;

    const existingRoom = await Room.findOne({ roomNumber });
    if (existingRoom) {
      return res.status(400).json({ message: "Room already exists" });
    }

    const room = new Room({ roomNumber, floor, availableSeats });
    await room.save();

    res.status(201).json({ message: "Room created successfully", room });
  } catch (error) {
    res.status(500).json({ message: "Error creating room", error: error.message });
  }
};


export const updateRoom = async (req, res) => {
  try {
    const { id } = req.params;
    const { roomNumber, floor, availableSeats } = req.body;

    const room = await Room.findById(id);
    if (!room) {
      return res.status(404).json({ message: "Room not found" });
    }

    if (room.isHold) {
      return res.status(423).json({ message: "Room is currently being edited. Please wait." });
    }

    room.isHold = true;
    await room.save();

    room.roomNumber = roomNumber ?? room.roomNumber;
    room.floor = floor ?? room.floor;
    room.availableSeats = availableSeats ?? room.availableSeats;

    await room.save();

    room.isHold = false;
    await room.save();

    res.json({ message: "Room updated successfully", room });
  } catch (error) {
    res.status(500).json({ message: "Error updating room", error: error.message });
  }
};


export const deleteRoom = async (req, res) => {
  try {
    const { id } = req.params;

    const room = await Room.findByIdAndDelete(id);

    if (!room) {
      return res.status(404).json({ message: "Room not found" });
    }

    res.json({ message: "Room deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Error deleting room", error: error.message });
  }
};


export const getAllRooms = async (req, res) => {
  try {
    const rooms = await Room.find();

    if (!rooms || rooms.length === 0) {
      return res.status(404).json({ message: "No rooms found" });
    }

    res.json({ message: "Rooms fetched successfully", rooms });
  } catch (error) {
    res.status(500).json({ message: "Error fetching rooms", error: error.message });
  }
};