import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import connectDB from './config/db';

import tagRoutes from './routes/tagRoutes';
import transactionRoutes from './routes/transactionRoutes';

dotenv.config();
connectDB();

const app = express();
app.use(cors());
app.use(express.json());

app.use('/api/tags', tagRoutes);
app.use('/api/transactions', transactionRoutes);

app.get('/', (_, res) => res.send('API is running'));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
