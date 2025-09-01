import express from 'express';
import cors from 'cors';
import 'dotenv/config';
import { connectDB } from './config/db';


const app = express();
app.use(cors());
app.use(express.json());

const port = process.env.PORT || 9000;

app.get('/health-check', (req, res) => {
    res.send('Server is running healthy 👍');
});

app.get('/', (req, res) => {
    res.send('Unauthorized route');
});


connectDB()
    .then(async () => {

        app.listen(port, '0.0.0.0', () => {
            console.log(`Server is listening on port ${port}`);
        });
    })
    .catch((error) => {
        console.error(`Error: ${error.message}`);
        process.exit(1);
    });