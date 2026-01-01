FROM node:18-slim

# 1. Install FFmpeg
# We use the slim image and install ffmpeg via apt-get (Debian package manager)
RUN apt-get update && \
    apt-get install -y ffmpeg && \
    rm -rf /var/lib/apt/lists/*

# 2. Setup Work Directory
WORKDIR /app

# 3. Copy Dependencies
COPY package*.json ./
RUN npm install --production

# 4. Copy Source Code
COPY . .

# 5. Create uploads directory
RUN mkdir -p uploads

# 6. Expose Port
EXPOSE 5000

# 7. Start Command
CMD ["node", "index.js"]
