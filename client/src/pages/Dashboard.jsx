import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';
import UploadModal from '../components/UploadModal';
import { useNavigate } from 'react-router-dom';
import { FaPlay, FaTrash, FaSignOutAlt, FaPlus } from 'react-icons/fa';
import { toast } from 'react-toastify';

const Dashboard = () => {
    const { user, logout } = useAuth();
    const [videos, setVideos] = useState([]);
    const [showUpload, setShowUpload] = useState(false);
    const navigate = useNavigate();

    const fetchVideos = async () => {
        try {
            const res = await api.get('/videos');
            setVideos(res.data);
        } catch (err) {
            console.error(err);
        }
    };

    useEffect(() => {
        fetchVideos();
    }, []);

    const handleDelete = async (e, id) => {
        e.stopPropagation();
        if (!window.confirm('Are you sure?')) return;
        try {
            await api.delete(`/videos/${id}`);
            setVideos(videos.filter(v => v._id !== id));
            toast.success('Video deleted');
        } catch (err) {
            toast.error('Could not delete');
        }
    };

    return (
        <div className="layout-grid">
            {/* Sidebar */}
            <aside className="sidebar">
                <h1 style={{ fontSize: '1.5rem', marginBottom: '2rem', color: 'var(--primary)' }}>Pulse Video</h1>

                <div style={{ marginBottom: 'auto' }}>
                    <p style={{ padding: '10px', color: 'var(--text-muted)' }}>Welcome, {user?.username}</p>
                    <div className="badge" style={{ display: 'inline-block', marginLeft: '10px', background: 'var(--bg-dark)' }}>
                        {user?.role.toUpperCase()}
                    </div>
                    <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '0.5rem', userSelect: 'all' }}>
                        Org: {user?.organizationId}
                    </p>
                </div>

                {/* Only Editors/Admins see Upload Button */}
                {['editor', 'admin'].includes(user?.role) && (
                    <button className="btn btn-primary" onClick={() => setShowUpload(true)} style={{ marginTop: '1rem', width: '100%' }}>
                        <FaPlus /> Upload Video
                    </button>
                )}

                <button className="btn btn-outline" onClick={logout} style={{ marginTop: '1rem', width: '100%' }}>
                    <FaSignOutAlt /> Logout
                </button>
            </aside>

            {/* Main Content */}
            <main style={{ padding: '2rem' }}>
                <h2 style={{ marginBottom: '1.5rem' }}>Your Library</h2>

                {videos.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '4rem', color: 'var(--text-muted)' }} className="glass-card">
                        No videos found. Upload one to get started!
                    </div>
                ) : (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '20px' }}>
                        {videos.map((vid) => (
                            <div key={vid._id} className="glass-card" style={{ overflow: 'hidden', cursor: 'pointer' }} onClick={() => navigate(`/player/${vid._id}`)}>
                                {/* Thumbnail Placeholder */}
                                <div style={{ height: '160px', background: '#000', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
                                    {vid.thumbnail ? (
                                        <img src={`http://localhost:5000${vid.thumbnail}`} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                    ) : (
                                        <FaPlay color="#fff" size={32} />
                                    )}

                                    {/* Status Overlay */}
                                    <div style={{ position: 'absolute', top: 10, right: 10 }}>
                                        <span className={`badge badge-${vid.sensitivity === 'pending' ? 'processing' : vid.sensitivity}`}>
                                            {vid.sensitivity}
                                        </span>
                                    </div>
                                </div>

                                <div style={{ padding: '15px' }}>
                                    <h4 style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{vid.title}</h4>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '10px', alignItems: 'center' }}>
                                        <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                                            {new Date(vid.createdAt).toLocaleDateString()}
                                        </span>

                                        {/* Delete Button for Admin/Owner */}
                                        {(user?.role === 'admin' || user?.id === vid.uploader?._id) && (
                                            <button
                                                className="btn btn-danger"
                                                style={{ padding: '5px 10px', fontSize: '0.8rem' }}
                                                onClick={(e) => handleDelete(e, vid._id)}
                                            >
                                                <FaTrash />
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                <UploadModal isOpen={showUpload} onClose={() => setShowUpload(false)} onUploadSuccess={fetchVideos} />
            </main>
        </div>
    );
};

export default Dashboard;
