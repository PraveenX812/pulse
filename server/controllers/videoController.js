const Video = require('../models/Video');
const fs = require('fs');
const path = require('path');
const { processVideo } = require('../services/videoProcessor');

exports.uploadVideo = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ message: 'No video file uploaded' });
        }

        const { title } = req.body;

        const newVideo = new Video({
            title: title || req.file.originalname,
            filename: req.file.filename,
            path: req.file.path,
            mimetype: req.file.mimetype,
            size: req.file.size,
            uploader: req.user.userId,
            organizationId: req.user.organizationId,
            status: 'processing',
            sensitivity: 'pending'
        });

        await newVideo.save();

        const io = req.app.get('io');
        processVideo(newVideo._id, req.file.path, req.file.originalname, io);

        res.status(202).json({
            message: 'Upload started. Processing in background.',
            video: newVideo
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Upload failed' });
    }
};

exports.getVideos = async (req, res) => {
    try {
        const { role, organizationId } = req.user;

        let query = {};

        if (role !== 'admin') {
            query.organizationId = organizationId;
        }

        if (role === 'viewer') {
            query.sensitivity = 'safe';
        }

        const videos = await Video.find(query).sort({ createdAt: -1 }).populate('uploader', 'username');

        res.json(videos);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error fetching videos' });
    }
};

exports.getVideoById = async (req, res) => {
    try {
        const video = await Video.findById(req.params.id);
        if (!video) return res.status(404).json({ message: 'Video not found' });

        if (video.organizationId.toString() !== req.user.organizationId) {
            return res.status(403).json({ message: 'Access denied' });
        }

        res.json(video);
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
};

exports.streamVideo = async (req, res) => {
    try {
        const video = await Video.findById(req.params.id);
        if (!video) return res.status(404).send('Video not found');

        const filePath = video.path;
        const stat = fs.statSync(filePath);
        const fileSize = stat.size;
        const range = req.headers.range;

        if (range) {
            const parts = range.replace(/bytes=/, "").split("-");
            const start = parseInt(parts[0], 10);
            const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;

            const chunksize = (end - start) + 1;
            const file = fs.createReadStream(filePath, { start, end });
            const head = {
                'Content-Range': `bytes ${start}-${end}/${fileSize}`,
                'Accept-Ranges': 'bytes',
                'Content-Length': chunksize,
                'Content-Type': 'video/mp4',
            };

            res.writeHead(206, head);
            file.pipe(res);
        } else {
            const head = {
                'Content-Length': fileSize,
                'Content-Type': 'video/mp4',
            };
            res.writeHead(200, head);
            fs.createReadStream(filePath).pipe(res);
        }

    } catch (error) {
        console.error(error);
        res.status(500).send('Streaming error');
    }
};

exports.deleteVideo = async (req, res) => {
    try {
        const video = await Video.findById(req.params.id);
        if (!video) return res.status(404).json({ message: "Video not found" });

        if (req.user.role !== 'admin' && video.uploader.toString() !== req.user.userId) {
            return res.status(403).json({ message: "Unauthorized" });
        }

        if (fs.existsSync(video.path)) {
            fs.unlinkSync(video.path);
        }

        await Video.findByIdAndDelete(req.params.id);
        res.json({ message: "Video deleted" });
    } catch (err) {
        res.status(500).json({ message: "Server Error" });
    }
}
