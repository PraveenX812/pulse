const ffmpeg = require('fluent-ffmpeg');
const path = require('path');
const fs = require('fs');
const Video = require('../models/Video');
const axios = require('axios');
const FormData = require('form-data');

const customFfmpegPath = String.raw`C:\Users\lenovo\Downloads\ffmpeg-2025-12-31-git-38e89fe502-full_build\ffmpeg-2025-12-31-git-38e89fe502-full_build\bin\ffmpeg.exe`;
const customFfprobePath = String.raw`C:\Users\lenovo\Downloads\ffmpeg-2025-12-31-git-38e89fe502-full_build\ffmpeg-2025-12-31-git-38e89fe502-full_build\bin\ffprobe.exe`;

ffmpeg.setFfmpegPath(customFfmpegPath);
ffmpeg.setFfprobePath(customFfprobePath);

const getMetadata = (filePath) => {
    return new Promise((resolve, reject) => {
        ffmpeg.ffprobe(filePath, (err, metadata) => {
            if (err) return reject(err);
            resolve(metadata);
        });
    });
};

const takeScreenshot = (filePath, outputDir, filename) => {
    return new Promise((resolve, reject) => {
        ffmpeg(filePath)
            .screenshots({
                count: 1,
                folder: outputDir,
                filename: filename,
                size: '320x240'
            })
            .on('end', () => resolve())
            .on('error', (err) => reject(err));
    });
};

const checkContentSafety = async (imagePath) => {
    if (!process.env.SIGHTENGINE_USER || !process.env.SIGHTENGINE_SECRET) {
        console.warn("⚠️ Sightengine Keys missing. Skipping real AI check.");
        return 'safe';
    }

    try {
        const data = new FormData();
        data.append('media', fs.createReadStream(imagePath));
        data.append('models', 'nudity,wad,offensive,scam');
        data.append('api_user', process.env.SIGHTENGINE_USER);
        data.append('api_secret', process.env.SIGHTENGINE_SECRET);

        const response = await axios({
            method: 'post',
            url: 'https://api.sightengine.com/1.0/check.json',
            data: data,
            headers: data.getHeaders()
        });

        const result = response.data;
        console.log("[Sightengine Result]", JSON.stringify(result, null, 2));

        if (result.status === 'success') {
            if (result.nudity && (result.nudity.raw > 0.5 || result.nudity.partial > 0.6)) return 'flagged';
            if (result.weapon > 0.2) return 'flagged';
            if (result.alcohol > 0.4) return 'flagged';
            if (result.drugs > 0.4) return 'flagged';
            if (result.offensive && result.offensive.prob > 0.5) return 'flagged';

            return 'safe';
        }

        return 'safe';
    } catch (error) {
        console.error("Sightengine API Error:", error.message);
        return 'safe';
    }
};

exports.processVideo = async (videoId, filePath, originalFilename, io) => {
    console.log(`[Processor] Starting analysis for video ${videoId}`);

    try {
        const outputDir = path.dirname(filePath);
        const thumbnailFilename = `thumb_${path.basename(filePath, path.extname(filePath))}.png`;
        const thumbnailPath = path.join(outputDir, thumbnailFilename);

        let duration = 0;
        let sensitivity = 'safe';

        try {
            const metadata = await getMetadata(filePath);
            duration = metadata.format.duration;
            await takeScreenshot(filePath, outputDir, thumbnailFilename);

            await Video.findByIdAndUpdate(videoId, {
                duration: duration,
                thumbnail: `/uploads/${thumbnailFilename}`
            });

        } catch (ffmpegErr) {
            console.warn("[Processor] FFmpeg failed.", ffmpegErr.message);
        }

        let progress = 0;
        const interval = setInterval(async () => {
            progress += 20;
            if (io) io.emit('video_progress', { videoId, progress, status: 'processing' });

            if (progress >= 80) {
                clearInterval(interval);

                if (fs.existsSync(thumbnailPath)) {
                    console.log("[Processor] Sending frame to Sightengine AI...");
                    sensitivity = await checkContentSafety(thumbnailPath);
                } else {
                    if (originalFilename.toLowerCase().includes('unsafe')) sensitivity = 'flagged';
                }

                await Video.findByIdAndUpdate(videoId, {
                    status: 'ready',
                    sensitivity: sensitivity
                });

                if (io) {
                    io.emit('video_progress', {
                        videoId,
                        progress: 100,
                        status: 'ready',
                        sensitivity: sensitivity
                    });
                }
                console.log(`[Processor] Finished. Final Sensitivity: ${sensitivity}`);
            }
        }, 500);

    } catch (error) {
        console.error("[Processor] Critical Error:", error);
        await Video.findByIdAndUpdate(videoId, { status: 'error' });
    }
};
