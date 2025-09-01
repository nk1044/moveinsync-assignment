import mongoose from "mongoose";

const roomSchema = new mongoose.Schema(
  {
    roomNumber: { type: String, required: true, unique: true },
    floor: { type: Number, required: true },
    availableSeats: { type: Number, required: true, min: 1 },
    status :{}
  },
  { timestamps: true }
);

export default mongoose.model("Room", roomSchema);