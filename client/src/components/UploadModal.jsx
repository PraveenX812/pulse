import { useRef, useState, useContext, useEffect } from 'react';
import api from '../utils/api';
import SocketContext from '../context/SocketContext';
import { toast } from 'react-toastify';
import { FaCloudUploadAlt } from 'react-icons/fa';

const UploadModal = ({ isOpen, onClose, onUploadSuccess }) => {
    const [file, setFile] = useState(null);
    const [uploading, setUploading] = useState(false);
    const [progress, setProgress] = useState(0);
    const [status, setStatus] = useState('');

    const socket = useContext(SocketContext);
    const currentVideoId = useRef(null);

    useEffect(() => {
        if (!socket) return;

        const handleProgress = (data) => {
            if (data.videoId === currentVideoId.current) {
                setProgress(data.progress);
                setStatus(data.sensitivity || data.status);

                if (data.status === 'ready') {
                    setUploading(false);
                    toast.success(`Analysis Complete: ${data.sensitivity.toUpperCase()}`);
                    setTimeout(() => {
                        onUploadSuccess();
                        onClose();
                    }, 1000);
                }
            }
        };

        socket.on('video_progress', handleProgress);

        return () => {
            socket.off('video_progress', handleProgress);
        };
    }, [socket, onClose, onUploadSuccess]);

    const handleFileChange = (e) => {
        if (e.target.files[0]) setFile(e.target.files[0]);
    };

    const handleUpload = async () => {
        if (!file) return;

        const formData = new FormData();
        formData.append('video', file);
        formData.append('title', file.name);

        try {
            setUploading(true);
            const res = await api.post('/videos/upload', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });

            currentVideoId.current = res.data.video._id;
            toast.info('Upload started! Analyzing content...');

        } catch (error) {
            setUploading(false);
            toast.error('Upload failed');
        }
    };

    if (!isOpen) return null;

    return (
        <div style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000
        }}>
            <div className="glass-card" style={{ width: '500px', padding: '2rem' }}>
                <h3>Upload Video</h3>

                {!uploading ? (
                    <div style={{ margin: '2rem 0', textAlign: 'center', border: '2px dashed var(--glass-border)', padding: '2rem', borderRadius: '12px' }}>
                        <input type="file" accept="video/*" onChange={handleFileChange} style={{ display: 'none' }} id="file-upload" />
                        <label htmlFor="file-upload" style={{ cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
                            <FaCloudUploadAlt size={48} color="var(--primary)" />
                            <span>{file ? file.name : 'Click to select or drag video here'}</span>
                        </label>
                    </div>
                ) : (
                    <div style={{ margin: '2rem 0' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                            <span>Analyzing Content...</span>
                            <span>{progress}%</span>
                        </div>
                        <div style={{ width: '100%', height: '8px', background: '#333', borderRadius: '4px', overflow: 'hidden' }}>
                            <div style={{
                                width: `${progress}%`,
                                height: '100%',
                                background: 'var(--primary)',
                                transition: 'width 0.3s ease'
                            }}></div>
                        </div>
                        <p style={{ marginTop: '1rem', textAlign: 'center', fontSize: '0.9rem', color: 'var(--text-muted)' }}>
                            Checking for sensitive content...
                        </p>
                    </div>
                )}

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
                    <button className="btn btn-outline" onClick={onClose} disabled={uploading}>Cancel</button>
                    {!uploading && (
                        <button className="btn btn-primary" onClick={handleUpload} disabled={!file}>
                            Upload
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};

export default UploadModal;
