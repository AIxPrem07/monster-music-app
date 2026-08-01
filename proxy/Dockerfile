FROM node:20-alpine

# Install Python 3, ffmpeg, curl (needed for yt-dlp)
RUN apk add --no-cache python3 py3-pip ffmpeg curl

# Install yt-dlp via pip (most reliable way on Alpine)
RUN pip3 install --break-system-packages yt-dlp || pip3 install yt-dlp

# Verify yt-dlp is installed
RUN yt-dlp --version

WORKDIR /app

COPY package.json ./
RUN npm install --production

COPY server.js ./

EXPOSE 3001

ENV PORT=3001

CMD ["node", "server.js"]
