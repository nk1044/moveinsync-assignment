import React, { useState } from "react";
import { useUser } from "../store/zustand";

export default function RecommendBooking({ onAssigned, api }) {
  const { user } = useUser();
  const [num, setNum] = useState(2);
  const [floor, setFloor] = useState("");
  const [candidates, setCandidates] = useState([]);
  const [fromTime, setFromTime] = useState("");
  const [toTime, setToTime] = useState("");

  const getRecommendations = async () => {
    try {
      const res = await api.recommendRooms({
        numberOfPeople: num,
        preferredFloor: floor || undefined,
      });
      setCandidates(res);
    } catch (err) {
      console.error(err);
      alert("Failed to fetch recommendations");
    }
  };

  const book = async (candidate) => {
    if (!user?._id) {
      alert("You must be logged in to book a room");
      return;
    }

    const payload = {
      fromTime: fromTime || new Date().toISOString(),
      toTime: toTime || new Date(Date.now() + 60 * 60 * 1000).toISOString(),
      numberOfPeople: num,
      organizer: user._id, // ✅ use store user id
      preferredFloor: floor || undefined,
    };

    try {
      await api.assignRoom(payload);
      alert("Booked!");
      setCandidates([]);
      if (onAssigned) onAssigned();
    } catch (err) {
      console.error(err);
      alert("Failed to book room");
    }
  };

  return (
    <div>
      <h4>Recommend & Book</h4>
      <div>
        <input
          type="number"
          value={num}
          onChange={(e) => setNum(e.target.value)}
        />{" "}
        people
        <input
          placeholder="preferred floor"
          value={floor}
          onChange={(e) => setFloor(e.target.value)}
          style={{ marginLeft: 8 }}
        />
        <button onClick={getRecommendations}>Get Suggestions</button>
      </div>
      <div style={{ marginTop: 8 }}>
        <label>From</label>{" "}
        <input
          type="datetime-local"
          value={fromTime}
          onChange={(e) => setFromTime(e.target.value)}
        />
        <label>To</label>{" "}
        <input
          type="datetime-local"
          value={toTime}
          onChange={(e) => setToTime(e.target.value)}
        />
      </div>

      <ul>
        {candidates.map((c) => (
          <li key={c._id}>
            {c.roomNumber} - seats {c.availableSeats} floor {c.floor}
            <button onClick={() => book(c)}>Book</button>
          </li>
        ))}
      </ul>
    </div>
  );
}
