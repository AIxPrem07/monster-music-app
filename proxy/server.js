const express = require('express');
const cors = require('cors');
const { exec } = require('child_process');
const { promisify } = require('util');
const { readFile, rm, chmod, writeFile } = require('fs/promises');
const { existsSync } = require('fs');
const { join } = require('path');
const { tmpdir } = require('os');

const execAsync = promisify(exec);
const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// Healthcheck
app.get('/', (req, res) => {
  res.json({ status: 'ok', service: 'Monster Audio Proxy' });
});

async function ensureYtDlp() {
  // Check if system yt-dlp exists
  try {
    await execAsync('yt-dlp --version');
    return 'yt-dlp';
  } catch {
    // Fallback to local downloaded binary in tmp
    const ytdlpTmp = join(tmpdir(), 'yt-dlp');
    if (!existsSync(ytdlpTmp)) {
      console.log('Downloading yt-dlp binary to /tmp...');
      const dl = await fetch('https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp');
      if (!dl.ok) throw new Error('Failed to download yt-dlp binary');
      const buf = await dl.arrayBuffer();
      await writeFile(ytdlpTmp, Buffer.from(buf));
      await chmod(ytdlpTmp, 0o775);
    }
    return ytdlpTmp;
  }
}

app.post('/', async (req, res) => {
  const { youtubeUrl } = req.body;
  if (!youtubeUrl) {
    return res.status(400).json({ error: 'youtubeUrl is required' });
  }

  const match = youtubeUrl.match(/^.*(youtu\.be\/|v\/|u\/\w\/|embed\/|shorts\/|watch\?v=|&v=)([^#&?]{11}).*/);
  const youtubeId = match ? match[2] : Date.now().toString();
  const outPath = join(tmpdir(), `proxy-${youtubeId}-${Date.now()}.m4a`);

  try {
    const ytdlp = await ensureYtDlp();

    // 1. Fetch Metadata
    let title = `YouTube Track (${youtubeId})`;
    let artist = 'YouTube Import';
    let duration = 240;
    let thumbnailUrl = `https://img.youtube.com/vi/${youtubeId}/hqdefault.jpg`;

    try {
      const metaRes = await execAsync(`${ytdlp} --dump-json --no-playlist "${youtubeUrl}"`);
      const meta = JSON.parse(metaRes.stdout);
      if (meta.title) title = meta.title;
      if (meta.uploader) artist = meta.uploader;
      if (meta.duration) duration = meta.duration;
      if (meta.thumbnail) thumbnailUrl = meta.thumbnail;
    } catch (e) {
      console.warn('Metadata fetch error (non-fatal):', e.message);
    }

    // 2. Download Audio Stream
    console.log(`Downloading audio for ${youtubeUrl} via yt-dlp...`);
    await execAsync(`${ytdlp} -f "ba[ext=m4a]/ba/b" -o "${outPath}" "${youtubeUrl}"`, { timeout: 120000 });

    if (!existsSync(outPath)) {
      throw new Error('Audio file was not created by yt-dlp');
    }

    const audioBuf = await readFile(outPath);
    await rm(outPath, { force: true }).catch(() => {});

    if (audioBuf.length < 50000) {
      throw new Error(`Downloaded audio file is too small (${audioBuf.length} bytes)`);
    }

    console.log(`Successfully extracted ${audioBuf.length} bytes for ${youtubeId}`);
    return res.json({
      buffer: audioBuf.toString('base64'),
      title,
      artist,
      duration,
      thumbnailUrl
    });
  } catch (err) {
    await rm(outPath, { force: true }).catch(() => {});
    console.error('Proxy extraction failed:', err.message);
    return res.status(500).json({ error: 'Proxy extraction failed', details: err.message });
  }
});

app.listen(PORT, () => {
  console.log(`Monster Audio Proxy running on port ${PORT}`);
});
