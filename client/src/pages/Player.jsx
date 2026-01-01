
import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import api from '../utils/api';

const Player = () => {
    const { id } = useParams();
    const [video, setVideo] = useState(null);

    useEffect(() => {
        const fetchVideo = async () => {
            try {
                const res = await api.get(`/videos/${id}`);
                setVideo(res.data);
            } catch (err) {
                console.error(err);
            }
        };
        fetchVideo();
    }, [id]);

    if (!video) return <div style={{ padding: '2rem' }}>Loading Player...</div>;

    return (
        <div className="app-container" style={{ paddingTop: '2rem' }}>
            <div className="glass-card" style={{ padding: '20px', maxWidth: '900px', margin: '0 auto' }}>
                <h2 style={{ marginBottom: '1rem' }}>{video.title}</h2>
                <div style={{ position: 'relative', paddingTop: '56.25%', background: '#000', borderRadius: '8px', overflow: 'hidden' }}>
                    <video
                        controls
                        autoPlay
                        style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' }}
                        src={`http://localhost:5000/api/videos/stream/${id}`}
                    >
                        Your browser does not support the video tag.
                    </video>
                </div>
                <div style={{ marginTop: '1.5rem' }}>
                    <span className={`badge badge-${video.sensitivity}`}>
                        Content Status: {video.sensitivity.toUpperCase()}
                    </span>
                    <p style={{ marginTop: '1rem', color: 'var(--text-muted)' }}>
                        Uploaded by: {video.uploader?.username || 'Unknown'}
                    </p>
                </div>
            </div>
        </div>
    );
};

export default Player;
