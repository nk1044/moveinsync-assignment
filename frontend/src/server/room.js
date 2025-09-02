import axios from "axios";

const base = import.meta.env.VITE_BACKEND_URI;

export const listRooms = async () => {
    try {
        const response = await axios.get(`${base}/api/rooms`);
        return response.data.rooms;
    } catch (error) {
        console.error("Error listing rooms:", error);
        throw error;
    }
};

export const createRoom = async (body) => {
    try {
        const response = await axios.post(`${base}/api/rooms`, body);
        return response.data;
    } catch (error) {
        console.error("Error creating room:", error);
        throw error;
    }
};

export const updateRoom = async (id, body, ifMatch) => {
    try {
        const config = {
            headers: ifMatch ? { "If-Match": ifMatch } : {}
        };
        const response = await axios.put(`${base}/api/rooms/${id}`, body, config);
        return response.data;
    } catch (error) {
        console.error(`Error updating room ${id}:`, error);
        throw error;
    }
};

export const deleteRoom = async (id) => {
    try {
        const response = await axios.delete(`${base}/api/rooms/${id}`);
        return response.data;
    } catch (error) {
        console.error(`Error deleting room ${id}:`, error);
        throw error;
    }
};

export const recommendRooms = async (payload) => {
    try {
        const response = await axios.post(`${base}/api/rooms/recommend`, payload);
        console.log(response.data);
        return response.data.candidates;
    } catch (error) {
        console.error("Error recommending rooms:", error);
        throw error;
    }
};

export const assignRoom = async (payload) => {
    try {
        const response = await axios.post(`${base}/api/rooms/get-free-room`, payload);
        return response.data;
    } catch (error) {
        console.error("Error assigning room:", error);
        throw error;
    }
};
