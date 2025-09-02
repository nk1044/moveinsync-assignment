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
    <div className="bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 min-h-screen p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Room Management</h1>
          <p className="text-gray-600">Manage conference rooms and bookings efficiently</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Left Column: Forms */}
          <div className="lg:col-span-1 flex flex-col gap-6">
            <div className="bg-white/80 backdrop-blur-sm p-6 rounded-2xl shadow-lg border border-white/50 hover:shadow-xl transition-all duration-300">
              <div className="flex items-center mb-4">
                <div className="w-10 h-10 bg-blue-500 rounded-xl flex items-center justify-center mr-3">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                </div>
                <h2 className="text-lg font-semibold text-gray-800">Add New Room</h2>
              </div>
              <RoomForm onCreate={onCreate} />
            </div>
            
            <div className="bg-white/80 backdrop-blur-sm p-6 rounded-2xl shadow-lg border border-white/50 hover:shadow-xl transition-all duration-300">
              <div className="flex items-center mb-4">
                <div className="w-10 h-10 bg-green-500 rounded-xl flex items-center justify-center mr-3">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                </div>
                <h2 className="text-lg font-semibold text-gray-800">Quick Booking</h2>
              </div>
              <RecommendBooking onAssigned={() => load()} />
            </div>
          </div>

          {/* Right Column: Table and Edit Form */}
          <div className="lg:col-span-2 flex flex-col gap-6">
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-white/50 overflow-hidden">
              <div className="p-6 border-b border-gray-100 bg-gradient-to-r from-gray-50 to-white">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="w-10 h-10 bg-purple-500 rounded-xl flex items-center justify-center mr-3">
                      <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="text-xl font-semibold text-gray-800">Room Directory</h3>
                      <p className="text-sm text-gray-500">{rooms.length} rooms available</p>
                    </div>
                  </div>
                  {loading && (
                    <div className="flex items-center text-sm text-gray-500">
                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-blue-500 border-t-transparent mr-2"></div>
                      Loading...
                    </div>
                  )}
                </div>
              </div>
              
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gradient-to-r from-gray-50 to-gray-100 border-b border-gray-200">
                    <tr>
                      <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">#</th>
                      <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Room</th>
                      <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Floor</th>
                      <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Capacity</th>
                      <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Last Updated</th>
                      <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {rooms.map((r, index) => (
                      <tr key={r._id} className="bg-white hover:bg-gradient-to-r hover:from-blue-50 hover:to-indigo-50 transition-all duration-200 group">
                        <td className="px-6 py-4 font-semibold text-gray-900">
                          <div className="flex items-center">
                            <span className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center text-xs font-bold group-hover:bg-blue-100 transition-colors">
                              {index + 1}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center">
                            <span className="font-medium text-gray-900">{r.roomNumber}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                            Floor {r.floor}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center">
                            <svg className="w-4 h-4 text-gray-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                            </svg>
                            <span className="font-medium text-gray-700">{r.availableSeats}</span>
                            <span className="text-gray-400 ml-1">seats</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-gray-500 text-xs">
                          {new Date(r.updatedAt).toLocaleDateString('en-US', { 
                            month: 'short', 
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => {
                                setSelected(r);
                                setEditingVersion(new Date(r.updatedAt).toISOString());
                              }}
                              className="inline-flex items-center px-3 py-1.5 rounded-lg text-xs font-medium text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 transition-all duration-200 hover:scale-105"
                            >
                              <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                              </svg>
                              Edit
                            </button>
                            <button 
                              onClick={() => onDelete(r._id)}
                              className="inline-flex items-center px-3 py-1.5 rounded-lg text-xs font-medium text-red-700 bg-red-50 hover:bg-red-100 border border-red-200 transition-all duration-200 hover:scale-105"
                            >
                              <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              
              {rooms.length === 0 && !loading && (
                <div className="text-center py-12">
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No rooms available</h3>
                  <p className="text-gray-500">Start by creating your first room using the form above.</p>
                </div>
              )}
            </div>

            {selected && (
              <div className="bg-white/90 backdrop-blur-sm p-6 rounded-2xl shadow-xl border border-white/50 transition-all duration-500 animate-in slide-in-from-bottom-4">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center">
                    <div className="w-10 h-10 bg-amber-500 rounded-xl flex items-center justify-center mr-3">
                      <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                    </div>
                    <div>
                      <h4 className="text-xl font-semibold text-gray-800">Edit Room {selected.roomNumber}</h4>
                      <p className="text-sm text-gray-500">Update room details and configuration</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setSelected(null)}
                    className="w-8 h-8 rounded-lg bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors"
                  >
                    <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
                <div className="border-t border-gray-100 pt-6">
                  <RoomForm
                    initial={selected}
                    ifMatch={editingVersion}
                    onSubmit={(body, ifMatch) => onEdit(selected._id, body, ifMatch)}
                    onCancel={() => setSelected(null)}
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>

  );
}
