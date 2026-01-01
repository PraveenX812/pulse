# Video Upload, Sensitivity Processing and Streaming Application

A full-stack video management system designed for secure video hosting, streaming, and analysis. It features real-time processing capabilities, role-based access control (RBAC), and multi-tenant data isolation.

## Key Features

- **Video Streaming**: Implements HTTP Range Requests (Status 206) for efficient, bandwidth-friendly video playback and scrubbing.
- **Content Moderation**: Integrates with Sightengine AI to detect inappropriate content (nudity, violence, etc.) in uploaded videos.
- **Real-Time Processing**: Uses Socket.io to provide live feedback on video processing status (Upload -> Analyzing -> Ready).
- **Multi-Tenancy**: Logical isolation of user data. Users can create their own organizations or join existing ones to collaborate.
- **Role-Based Access Control**:
  - **Viewer**: Read-only access to safe content.
  - **Editor**: Can upload and manage videos within their organization.
  - **Admin**: Full system access, including global video management and user administration.

## Technology Stack

- **Frontend**: React.js, Vite, Context API
- **Backend**: Node.js, Express.js
- **Database**: MongoDB (Mongoose ODM)
- **Real-Time**: Socket.io
- **File Processing**: FFmpeg, Multer
- **Styling**: CSS Modules / Vanilla CSS (Glassmorphism UI)

## Prerequisites

- Node.js (v14 or higher)
- MongoDB (Running locally or cloud instance)
- FFmpeg (Installed and added to system PATH)

## Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd pulse-video-platform
   ```

2. **Backend Setup**
   Navigate to the server directory and install dependencies:
   ```bash
   cd server
   npm install
   ```

   Create a `.env` file in the `server` directory with the following variables:
   ```env
   PORT=5000
   MONGO_URI=mongodb://localhost:27017/pulse_video_db
   JWT_SECRET=your_secure_jwt_secret
   SIGHTENGINE_USER=your_sightengine_api_user
   SIGHTENGINE_SECRET=your_sightengine_api_secret
   ```

   Start the backend server:
   ```bash
   npm run dev
   ```

3. **Frontend Setup**
   Open a new terminal, navigate to the client directory and install dependencies:
   ```bash
   cd client
   npm install
   ```

   Start the frontend application:
   ```bash
   npm run dev
   ```

## Usage Guide

1. **Registration**: Create an account. To join an existing team, paste their Organization ID during registration.
2. **Dashboard**: View your organization's video library. Status badges indicate if a video is processing, safe, or flagged.
3. **Upload**: (Editor/Admin only) Upload MP4 files via the dashboard. The progress bar reflects real-time server analysis.
4. **Streaming**: Click any video card to enter the player view.

## API Endpoints

**Authentication**
- `POST /api/auth/register` - Create new user account
- `POST /api/auth/login` - Authenticate user and receive token

**Videos**
- `GET /api/videos` - Retrieve list of videos (filtered by organization)
- `POST /api/videos/upload` - Upload video file (multipart/form-data)
- `GET /api/videos/:id` - Get video metadata
- `GET /api/videos/stream/:id` - Stream video content
- `DELETE /api/videos/:id` - Delete video

**Admin**
- `GET /api/auth/users` - List all system users
- `DELETE /api/auth/users/:id` - Remove a user
