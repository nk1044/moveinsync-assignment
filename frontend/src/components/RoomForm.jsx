import React, { useState, useEffect } from "react";

export default function RoomForm({ onCreate, initial, ifMatch, onSubmit, onCancel }) {
  const [roomNumber, setRoomNumber] = useState(initial?.roomNumber || "");
  const [floor, setFloor] = useState(initial?.floor || 1);
  const [availableSeats, setAvailableSeats] = useState(initial?.availableSeats || 2);

  useEffect(() => {
    setRoomNumber(initial?.roomNumber || "");
    setFloor(initial?.floor || 1);
    setAvailableSeats(initial?.availableSeats || 2);
  }, [initial]);

  const handleCreate = () => {
    const payload = { roomNumber, floor: Number(floor), availableSeats: Number(availableSeats) };
    if (onCreate) onCreate(payload);
  };

  const handleUpdate = () => {
    const payload = { roomNumber, floor: Number(floor), availableSeats: Number(availableSeats) };
    if (onSubmit) onSubmit(payload, ifMatch);
  };

  return (
    <div style={{border:"1px solid #ddd", padding:12}}>
      <div>
        <label>Room Number</label><br/>
        <input value={roomNumber} onChange={e=>setRoomNumber(e.target.value)} />
      </div>
      <div>
        <label>Floor</label><br/>
        <input type="number" value={floor} onChange={e=>setFloor(e.target.value)} />
      </div>
      <div>
        <label>Available Seats</label><br/>
        <input type="number" value={availableSeats} onChange={e=>setAvailableSeats(e.target.value)} />
      </div>
      <div style={{marginTop:8}}>
        {initial ? (
          <>
            <button onClick={handleUpdate}>Save</button>
            <button onClick={onCancel}>Cancel</button>
          </>
        ) : (
          <button onClick={handleCreate}>Create Room</button>
        )}
      </div>
    </div>
  );
}
