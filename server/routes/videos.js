const express = require('express');
const router = express.Router();
const videoController = require('../controllers/videoController');
const { verifyToken, authorizeRoles } = require('../middleware/auth');
const upload = require('../middleware/upload');

router.post('/upload',
    verifyToken,
    authorizeRoles('editor', 'admin'),
    upload.single('video'),
    videoController.uploadVideo
);

router.get('/', verifyToken, videoController.getVideos);
router.get('/:id', verifyToken, videoController.getVideoById);
router.get('/stream/:id', videoController.streamVideo);
router.delete('/:id', verifyToken, videoController.deleteVideo);

module.exports = router;
