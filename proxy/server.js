const express = require('express');
const cors = require('cors');
const { exec } = require('child_process');
const { promisify } = require('util');
const { readFile, rm, chmod, writeFile } = require('fs/promises');
const { existsSync } = require('fs');
const { join } = require('path');
const { tmpdir, platform } = require('os');

const execAsync = promisify(exec);
const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json({ limit: '100mb' }));

// Healthcheck
app.get('/', (req, res) => {
  res.json({ status: 'ok', service: 'Monster Audio Proxy', time: new Date().toISOString() });
});

// Cache yt-dlp path
let cachedYtdlpPath = null;

async function ensureYtDlp() {
  if (cachedYtdlpPath) return cachedYtdlpPath;

  // Try system yt-dlp first (fastest, Dockerfile installs it here)
  const systemPaths = ['/usr/local/bin/yt-dlp', '/usr/bin/yt-dlp', 'yt-dlp'];
  for (const p of systemPaths) {
    try {
      await execAsync(`${p} --version`);
      console.log(`Using system yt-dlp at: ${p}`);
      cachedYtdlpPath = p;
      return p;
    } catch { /* try next */ }
  }

  // Fallback: download yt-dlp binary to /tmp
  const ytdlpTmp = join(tmpdir(), 'yt-dlp');
  if (!existsSync(ytdlpTmp)) {
    console.log('Downloading yt-dlp binary to /tmp...');
    const downloadUrl = platform() === 'darwin'
      ? 'https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp_macos'
      : 'https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp';

    const res = await fetch(downloadUrl);
    if (!res.ok) throw new Error(`Failed to download yt-dlp binary: ${res.statusText}`);
    const buf = await res.arrayBuffer();
    await writeFile(ytdlpTmp, Buffer.from(buf));
    await chmod(ytdlpTmp, 0o775);
    console.log('yt-dlp downloaded successfully.');
  }
  cachedYtdlpPath = ytdlpTmp;
  return ytdlpTmp;
}

app.post('/', async (req, res) => {
  const { youtubeUrl } = req.body;
  if (!youtubeUrl) {
    return res.status(400).json({ error: 'youtubeUrl is required' });
  }

  const match = youtubeUrl.match(/^.*(youtu\.be\/|v\/|u\/\w\/|embed\/|shorts\/|watch\?v=|&v=)([^#&?]{11}).*/);
  const youtubeId = match ? match[2] : Date.now().toString();
  const outPath = join(tmpdir(), `proxy-${youtubeId}-${Date.now()}.m4a`);

  console.log(`[Proxy] Processing: ${youtubeId}`);

  try {
    const ytdlp = await ensureYtDlp();

    // Metadata and audio download in parallel
    let title = `YouTube Track (${youtubeId})`;
    let artist = 'YouTube Import';
    let duration = 240;
    let thumbnailUrl = `https://img.youtube.com/vi/${youtubeId}/hqdefault.jpg`;

    // Download audio (with cookies disabled, best audio format)
    const downloadCmd = `${ytdlp} -f "ba[ext=m4a]/ba/b" --no-playlist --no-warnings -o "${outPath}" "${youtubeUrl}"`;
    console.log(`[Proxy] Running: ${downloadCmd}`);
    await execAsync(downloadCmd, { timeout: 180000 });

    if (!existsSync(outPath)) {
      throw new Error('Audio file was not created by yt-dlp');
    }

    // Try to get metadata (non-fatal)
    try {
      const metaRes = await execAsync(`${ytdlp} --dump-json --no-playlist --no-warnings "${youtubeUrl}"`, { timeout: 30000 });
      const meta = JSON.parse(metaRes.stdout);
      if (meta.title) title = meta.title;
      if (meta.uploader || meta.channel) artist = meta.uploader || meta.channel;
      if (meta.duration) duration = meta.duration;
      if (meta.thumbnail) thumbnailUrl = meta.thumbnail;
    } catch (e) {
      console.warn('[Proxy] Metadata fetch skipped:', e.message);
    }

    const audioBuf = await readFile(outPath);
    await rm(outPath, { force: true }).catch(() => {});

    if (audioBuf.length < 50000) {
      throw new Error(`Downloaded audio too small: ${audioBuf.length} bytes`);
    }

    console.log(`[Proxy] Success: ${(audioBuf.length / 1024 / 1024).toFixed(2)} MB for ${youtubeId}`);
    return res.json({
      buffer: audioBuf.toString('base64'),
      title,
      artist,
      duration,
      thumbnailUrl
    });

  } catch (err) {
    await rm(outPath, { force: true }).catch(() => {});
    console.error('[Proxy] Extraction failed:', err.message);
    return res.status(500).json({ error: 'Proxy extraction failed', details: err.message });
  }
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Monster Audio Proxy running on port ${PORT}`);
});
