const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const http = require('http');
const { Server } = require('socket.io');
const authRoutes = require('./routes/auth');
const videoRoutes = require('./routes/videos');


dotenv.config();

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: '*', // Allow all for dev
        methods: ['GET', 'POST', 'DELETE', 'PUT']
    }
});

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/videos', videoRoutes);


// Serve static files (optional, for uploads testing locally)
app.use('/uploads', express.static('uploads'));

// Basic Route
app.get('/', (req, res) => {
    res.send('Pulse Video Platform API is Running 🚀');
});

// Socket.io Connection
io.on('connection', (socket) => {
    console.log('New client connected:', socket.id);

    socket.on('disconnect', () => {
        console.log('Client disconnected:', socket.id);
    });
});

// Make io accessible globally if needed (or pass to controllers)
app.set('io', io);

// Database Connection
const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI; // "mongodb://localhost:27017/pulse_video_db"

const startServer = async () => {
    try {
        if (!MONGO_URI) {
            console.warn("⚠️ MONGO_URI is missing in .env. Skipping DB connect for initial test.");
        } else {
            await mongoose.connect(MONGO_URI);
            console.log('✅ MongoDB Connected');
        }

        server.listen(PORT, () => {
            console.log(`✅ Server running on port ${PORT}`);
        });
    } catch (error) {
        console.error('❌ Server startup error:', error);
    }
};

startServer();
