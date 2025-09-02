import React, { useEffect, useState } from "react";
import * as api from "../server/room";
import RoomForm from "../components/RoomForm";
import RecommendBooking from "../components/RecommendBooking";
import { queueMutation, flushQueue } from "../offline/queue";

export default function RoomsPage() {
  const [rooms, setRooms] = useState([]);
  const [selected, setSelected] = useState(null);
  const [editingVersion, setEditingVersion] = useState(null);
  const [loading, setLoading] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const data = await api.listRooms();
      setRooms(data);
    } catch (e) {
      console.error("Failed to load rooms", e);
    }
    setLoading(false);
  };

  useEffect(() => {
    load();

    // Try flushing queued operations when online
    const handleOnline = () => {
      flushQueue(async (mut) => {
        if (mut.type === "CREATE") {
          await api.createRoom(mut.body);
        } else if (mut.type === "UPDATE") {
          await api.updateRoom(mut.id, mut.body, mut.ifMatch);
        } else if (mut.type === "DELETE") {
          await api.deleteRoom(mut.id);
        }
      }).then(() => load());
    };

    window.addEventListener("online", handleOnline);
    return () => {
      window.removeEventListener("online", handleOnline);
    };
  }, []);

  const onCreate = async (payload) => {
    try {
      if (!navigator.onLine) {
        await queueMutation({ type: "CREATE", body: payload });
        alert("You are offline. Create queued.");
        return;
      }
      await api.createRoom(payload);
      await load();
    } catch (err) {
      alert("Create error: " + (err?.response?.data?.message || err.message));
    }
  };

  const onEdit = async (id, body, ifMatch) => {
    try {
      if (!navigator.onLine) {
        await queueMutation({ type: "UPDATE", id, body, ifMatch });
        alert("Offline: update queued.");
        return;
      }
      await api.updateRoom(id, body, ifMatch);
      await load();
      setSelected(null);
    } catch (err) {
      if (err.response?.status === 409) {
        const { server } = err.response.data;
        if (confirm("Conflict detected. Overwrite server state with your changes?")) {
          await onEdit(id, body, server.version);
        } else {
          await load();
        }
      } else {
        alert("Update error: " + (err?.response?.data?.message || err.message));
      }
    }
  };

  const onDelete = async (id) => {
    try {
      if (!navigator.onLine) {
        await queueMutation({ type: "DELETE", id });
        alert("Offline: delete queued.");
        return;
      }
      await api.deleteRoom(id);
      await load();
    } catch (err) {
      alert("Delete error: " + (err?.response?.data?.message || err.message));
    }
  };

  return (
    <div style={{ padding: 20 }}>
      <div style={{ display: "flex", gap: 20 }}>
        <div style={{ flex: 1 }}>
          <RoomForm onCreate={onCreate} />
          <hr />
          <RecommendBooking onAssigned={() => load()} />
        </div>
        <div style={{ flex: 2 }}>
          <h3>Rooms {loading ? "(loading...)" : ""}</h3>
          <table border="1" cellPadding="8" style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr>
                <th>#</th>
                <th>Room</th>
                <th>Floor</th>
                <th>Seats</th>
                <th>UpdatedAt</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {rooms.map((r) => (
                <tr key={r._id}>
                  <td>{r.roomNumber}</td>
                  <td>{r.roomNumber}</td>
                  <td>{r.floor}</td>
                  <td>{r.availableSeats}</td>
                  <td>{new Date(r.updatedAt).toLocaleString()}</td>
                  <td>
                    <button
                      onClick={() => {
                        setSelected(r);
                        setEditingVersion(new Date(r.updatedAt).toISOString());
                      }}
                    >
                      Edit
                    </button>
                    <button onClick={() => onDelete(r._id)}>Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {selected && (
            <div style={{ marginTop: 20 }}>
              <h4>Edit Room {selected.roomNumber}</h4>
              <RoomForm
                initial={selected}
                ifMatch={editingVersion}
                onSubmit={(body, ifMatch) => onEdit(selected._id, body, ifMatch)}
                onCancel={() => setSelected(null)}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
