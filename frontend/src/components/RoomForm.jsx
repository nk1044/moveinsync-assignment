import React, { useState, useEffect } from "react";
import {toast} from "react-hot-toast";

export default function RoomForm({ onCreate, initial, ifMatch, onSubmit, onCancel }) {
  const [roomNumber, setRoomNumber] = useState(initial?.roomNumber || "");
  const [floor, setFloor] = useState(initial?.floor || 1);
  const [availableSeats, setAvailableSeats] = useState(initial?.availableSeats || 2);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setRoomNumber(initial?.roomNumber || "");
    setFloor(initial?.floor || 1);
    setAvailableSeats(initial?.availableSeats || 2);
  }, [initial]);

  const validateForm = () => {
    if (!roomNumber.trim()) {
      toast.error("Room number is required");
      return false;
    }
    if (floor < 1) {
      toast.error("Floor must be at least 1");
      return false;
    }
    if (availableSeats < 1) {
      toast.error("Available seats must be at least 1");
      return false;
    }
    return true;
  };

  const handleCreate = async () => {
    if (!validateForm()) return;

    setLoading(true);
    try {
      const payload = { 
        roomNumber: roomNumber.trim(), 
        floor: Number(floor), 
        availableSeats: Number(availableSeats) 
      };
      
      if (onCreate) {
        await onCreate(payload);
        toast.success("Room created successfully!");
        // Reset form
        setRoomNumber("");
        setFloor(1);
        setAvailableSeats(2);
      }
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || "Failed to create room");
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = async () => {
    if (!validateForm()) return;

    setLoading(true);
    try {
      const payload = { 
        roomNumber: roomNumber.trim(), 
        floor: Number(floor), 
        availableSeats: Number(availableSeats) 
      };
      
      if (onSubmit) {
        await onSubmit(payload, ifMatch);
        toast.success("Room updated successfully!");
      }
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || "Failed to update room");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Room Number
        </label>
        <input
          value={roomNumber}
          onChange={(e) => setRoomNumber(e.target.value)}
          placeholder="e.g., A101, Conference Room 1"
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Floor
          </label>
          <input
            type="number"
            min="1"
            value={floor}
            onChange={(e) => setFloor(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Capacity
          </label>
          <input
            type="number"
            min="1"
            value={availableSeats}
            onChange={(e) => setAvailableSeats(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
          />
        </div>
      </div>

      <div className="flex gap-2 pt-2">
        {initial ? (
          <>
            <button
              onClick={handleUpdate}
              disabled={loading}
              className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-medium py-2.5 px-4 rounded-lg transition-colors flex items-center justify-center"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2"></div>
                  Saving...
                </>
              ) : (
                "Save Changes"
              )}
            </button>
            <button
              onClick={onCancel}
              disabled={loading}
              className="px-4 py-2.5 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
          </>
        ) : (
          <button
            onClick={handleCreate}
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-medium py-2.5 px-4 rounded-lg transition-colors flex items-center justify-center"
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2"></div>
                Creating...
              </>
            ) : (
              "Create Room"
            )}
          </button>
        )}
      </div>
    </div>
  );
}