import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer } from 'http';
import { Server } from 'socket.io';

// Routes
import authRoutes from './routes/authRoutes.js';
import userRoutes from './routes/userRoutes.js';
import postRoutes from './routes/postRoutes.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: "*", // Adjust this in production
    methods: ["GET", "POST"]
  }
});

const port = 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Serve static storage folder
app.use('/storage', express.static(path.join(__dirname, '../storage')));

// Make io accessible in requests
app.use((req, res, next) => {
  req.io = io;
  next();
});

// API Routes
app.use('/api', authRoutes);
app.use('/api/usuarios', userRoutes);
app.use('/api/posts', postRoutes);

io.on('connection', (socket) => {
  console.log('User connected:', socket.id);
});

httpServer.listen(port, () => {
  console.log(`Server and Sockets running at http://localhost:${port}`);
});
