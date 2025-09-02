# MoveInSync Assignment

A full-stack MERN (MongoDB, Express.js, React, Node.js) web application implementing email/password authentication with JWT, along with room recommendation and assignment features.

---

## Table of Contents

- [Features](#features)
- [Tech Stack](#tech-stack)
- [Getting Started](#getting-started)
  - [Prerequisites](#prerequisites)
  - [Environment Setup](#environment-setup)
  - [Installation](#installation)
  - [Running the Application](#running-the-application)
- [API Endpoints](#api-endpoints)
- [Frontend Usage](#frontend-usage)
- [Architecture Overview](#architecture-overview)
- [Environment Variables](#environment-variables)
- [License](#license)

---

## Features

- **User authentication** using JWT tokens (email/password login and registration)
- **Protected routes** on the backend secured via JWT middleware
- **Room recommendation** based on number of participants, floor preference, and availability
- **Room assignment (booking)** with conflict checking to prevent overlapping meetings
- **Consistent timezone handling** (UTC) for all time inputs and comparisons
- **Optimistic concurrency control** for updating room data safely

---

## Tech Stack

- **Frontend**
  - React (functional components, hooks)
  - State management with Zustand (persisted user store, JWT handling)
  - API calls handled by Axios
  - Notifications via `react-hot-toast`

- **Backend**
  - Node.js with Express.js
  - MongoDB via Mongoose ODM
  - JWT-based authentication
  - UTC time normalization
  - Business logic for room recommendation and booking

---

## Getting Started

### Prerequisites

Make sure you have the following installed:

- Node.js (v14 or higher)
- npm or yarn
- MongoDB (local or cloud)

### Environment Setup

Each of the `backend` and `frontend` directories should contain a `.env` file with these required variables:

#### Backend `.env`:
```
MONGODB_URI=your mongo connection string
ACCESS_TOKEN_SECRET=your accesstoken secret
REFRESH_TOKEN_SECRET=your refreshtoken secret
ACCESS_TOKEN_EXPIRY=your time
REFRESH_TOKEN_EXPIRY=your time
PORT=9000
```

#### Frontend `.env`:
```

VITE\_BACKEND\_URI=[http://localhost:5000](http://localhost:5000)

````

### Installation

Clone the repository and install dependencies:

```bash
git clone https://github.com/nk1044/moveinsync-assignment.git
cd moveinsync-assignment

# Install backend dependencies
cd backend
npm install

# Install frontend dependencies
cd ../frontend
npm install
````

### Running the Application

Open two terminals:

1. **Backend server**

   ```bash
   cd backend
   npm run dev
   ```

2. **Frontend client**

   ```bash
   cd frontend
   npm run dev
   ```

Visit your browser at `http://localhost:5173` (or as shown in your console) to explore the application.

---

## API Endpoints

### Auth

* `POST /api/auth/register` — Register with email/password. Returns JWT token.
* `POST /api/auth/login` — Login with email/password. Returns JWT token.

### Rooms

* `GET /api/rooms` — Retrieve all rooms (protected endpoint).
* `POST /api/rooms` — Create a room (protected).
* `PUT /api/rooms/:id` — Update room details with optimistic concurrency (protected).
* `DELETE /api/rooms/:id` — Delete a room (protected).

### Room Recommendations

* `POST /api/rooms/recommend` — Get rooms fitting participant count, optional floor, within specified time window.

  * Required: `numberOfPeople`, `fromTime`, `toTime`
  * Optional: `preferredFloor`

### Booking

* `POST /api/rooms/assign` — Book a specific room if it is free during the provided window.

  * Required: `roomId`, `fromTime`, `toTime`, `organizer`

---

## Frontend Usage

* **Authenticate** using the signup/login flow (JWT stored via Zustand).
* **View rooms**, create new ones, or edit/delete existing rooms safely.
* **Recommend rooms** by providing participant count, floor (optional), and meeting window.
* **Book rooms** — if the room is available, a meeting is created and room becomes momentarily unavailable for conflicting times.

---

## Architecture Overview

```
Frontend (React + Zustand)
        ↕ Axios (JWT in headers)
Backend (Express + Mongoose + JWT auth)
        ↔ MongoDB
```

Key details:

* **JWT middleware** secures backend routes by validating tokens.
* **Mongoose** ensures type consistency (e.g., `capacity`, `Date` in UTC).
* **Business logic**:

  * Converts all times to UTC on receipt.
  * Filters rooms based on availability (no overlapping meetings).
  * Checks conflicts on booking and handles concurrency safely.
* **Frontend** uses user’s JWT to access protected endpoints, handles offline behavior gracefully if implemented.

---

## Environment Variables

Here’s a summary of required environment variables:

| Variable           | Description                         | Example                      |
| ------------------ | ----------------------------------- | ---------------------------- |
| `MONGODB_URI`      | MongoDB connection string           | `mongodb://localhost:27017/` |
| `JWT_SECRET`       | Secret for signing JWT tokens       | `your_jwt_secret_here`       |
| `PORT`             | Backend server port (default: 5000) | `5000`                       |
| `VITE_BACKEND_URI` | Frontend environment for API calls  | `http://localhost:5000`      |

---

## License

This project is licensed under the **MIT License**.
