import 'dotenv/config'
import express, { Request, Response } from 'express';

const app = express();

const port = process.env.PORT || 3000;


app.use(express.json());

app.get('/', (req: Request, res: Response) => {
  res.send('Hello from Express + TypeScript Server!');
});

app.listen(port, () => {
  console.log(`✅ Server is running at PORT:${port}`);
});