import React, { useState, useEffect } from "react";
import { toast } from "react-hot-toast";
import { useUser } from "../store/zustand";
import { recommendRooms, assignRoom } from '../server/room';
import room from "../../../backend/src/models/room";


export default function RecommendBooking({ onAssigned }) {
  const { user } = useUser();
  const [num, setNum] = useState(2);
  const [floor, setFloor] = useState("");
  const [candidates, setCandidates] = useState([]);
  const [fromTime, setFromTime] = useState("");
  const [toTime, setToTime] = useState("");
  const [loading, setLoading] = useState(false);

  const getRecommendations = async () => {
    if (num < 1) {
      toast.error("Number of people must be at least 1");
      return;
    }

    if (!fromTime || !toTime) {
      toast.error("Please select both start and end times");
      return;
    }

    if (new Date(fromTime) >= new Date(toTime)) {
      toast.error("End time must be after start time");
      return;
    }

    setLoading(true);
    try {
      const res = await recommendRooms({
        numberOfPeople: num,
        preferredFloor: floor || null,
        fromTime,
        toTime,
      });

      console.log(res);
      setCandidates(res);

      if (res.length === 0) {
        toast.error("No rooms available for the selected time");
      } else {
        toast.success(
          `Found ${res.length} available room${res.length > 1 ? "s" : ""}`
        );
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to fetch recommendations");
    } finally {
      setLoading(false);
    }
  };


  const book = async (candidate) => {
    if (!user?._id) {
      toast.error("You must be logged in to book a room");
      return;
    }

    if (!fromTime || !toTime) {
      toast.error("Please select both start and end times");
      return;
    }

    if (new Date(fromTime) >= new Date(toTime)) {
      toast.error("End time must be after start time");
      return;
    }

    const payload = {
      fromTime: fromTime || new Date().toISOString(),
      toTime: toTime || new Date(Date.now() + 60 * 60 * 1000).toISOString(),
      organizer: user._id,
      roomId: candidate._id,
    };

    try {
      await assignRoom(payload);
      toast.success(`Room ${candidate.roomNumber} booked successfully!`);
      setCandidates([]);
      setFromTime("");
      setToTime("");
      if (onAssigned) onAssigned();
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || "Failed to book room");
    }
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            People
          </label>
          <input
            type="number"
            min="1"
            value={num}
            onChange={(e) => setNum(Number(e.target.value))}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Floor (optional)
          </label>
          <input
            type="number"
            placeholder="Any floor"
            value={floor}
            onChange={(e) => setFloor(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            From
          </label>
          <input
            type="datetime-local"
            value={fromTime}
            onChange={(e) => setFromTime(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            To
          </label>
          <input
            type="datetime-local"
            value={toTime}
            onChange={(e) => setToTime(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
          />
        </div>
      </div>

      <button
        onClick={getRecommendations}
        disabled={loading}
        className="w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white font-medium py-2.5 px-4 rounded-lg transition-colors flex items-center justify-center"
      >
        {loading ? (
          <>
            <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2"></div>
            Finding Rooms...
          </>
        ) : (
          "Get Suggestions"
        )}
      </button>

      {candidates.length > 0 && (
        <div className="space-y-2">
          <h5 className="font-medium text-gray-700">Available Rooms:</h5>
          {candidates.map((c) => (
            <div
              key={c._id}
              className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200"
            >
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                  <span className="text-sm font-semibold text-blue-600">{c.roomNumber}</span>
                </div>
                <div>
                  <div className="text-sm font-medium text-gray-900">Room {c.roomNumber}</div>
                  <div className="text-xs text-gray-500">
                    Floor {c.floor} • {c.availableSeats} seats
                  </div>
                </div>
              </div>
              <button
                onClick={() => book(c)}
                className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium py-1.5 px-3 rounded-lg transition-colors"
              >
                Book
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}