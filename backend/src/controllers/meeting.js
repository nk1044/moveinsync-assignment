import Room from "../models/room.js";
import Meeting from "../models/meeting.js";

export const assignRoom = async (req, res) => {
  try {
    const { fromTime, toTime, numberOfPeople, organizer } = req.body;

    if (!fromTime || !toTime || !numberOfPeople || !organizer) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    const startTime = new Date(fromTime);
    const endTime = new Date(toTime);

    if (startTime >= endTime) {
      return res.status(400).json({ message: "Invalid meeting time range" });
    }

    const candidateRooms = await Room.find({
      availableSeats: { $gte: numberOfPeople },
    }).sort({ availableSeats: 1 }); 

    let chosenRoom = null;

    for (const room of candidateRooms) {
      const overlappingMeetings = await Meeting.findOne({
        room: room._id,
        $or: [
          { startTime: { $lt: endTime }, endTime: { $gt: startTime } },
        ],
      });

      if (!overlappingMeetings) {
        chosenRoom = room;
        break;
      }
    }

    if (!chosenRoom) {
      return res.status(404).json({ message: "No suitable room available for given time" });
    }

    const meeting = new Meeting({
      room: chosenRoom._id,
      organizer,
      startTime,
      endTime,
    });

    await meeting.save();

    return res.status(200).json({
      message: "Room assigned successfully",
      roomId: chosenRoom._id,
      roomNumber: chosenRoom.roomNumber,
      floor: chosenRoom.floor,
      meetingId: meeting._id,
      startTime,
      endTime,
    });

  } catch (error) {
    console.error("Error assigning room:", error);
    return res.status(500).json({ message: "Server error", error: error.message });
  }
}
