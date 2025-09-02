import express from 'express';
import cors from 'cors';
import 'dotenv/config';
import { connectDB } from './config/db.js';
import cookieParser from "cookie-parser";



const app = express();

app.use(cookieParser());
app.use(express.json());
app.use(cors({
  origin: "http://localhost:5173",
  credentials: true,
}));

const port = process.env.PORT || 9000;

app.get('/health-check', (req, res) => {
    res.send('Server is running healthy 👍');
});

app.get('/', (req, res) => {
    res.send('Unauthorized route');
});

import authRouter from './routes/auth.route.js';
import roomRouter from './routes/room.route.js';
app.use('/api/users', authRouter);
app.use('/api/rooms', roomRouter);


connectDB()
    .then(async () => {
        app.listen(port, () => {
            console.log(`Server is listening on port ${port}`);
        });
    })
    .catch((error) => {
        console.error(`Error: ${error.message}`);
        process.exit(1);
    });