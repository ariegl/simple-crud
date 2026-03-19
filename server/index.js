import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';

// Routes
import authRoutes from './routes/authRoutes.js';
import userRoutes from './routes/userRoutes.js';
import postRoutes from './routes/postRoutes.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Serve static storage folder
app.use('/storage', express.static(path.join(__dirname, '../storage')));

// API Routes
app.use('/api', authRoutes);
app.use('/api/usuarios', userRoutes);
app.use('/api/posts', postRoutes);

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
