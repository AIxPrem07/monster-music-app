import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { S3Client, PutObjectCommand, HeadObjectCommand } from '@aws-sdk/client-s3';
import ytdl from '@distube/ytdl-core';
import play from 'play-dl';
import { exec } from 'child_process';
import { promisify } from 'util';
import { readdir, readFile, rm, mkdtemp, chmod } from 'fs/promises';
import { existsSync } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';

const execAsync = promisify(exec);

export const maxDuration = 60; // Allow Vercel functions up to 60 seconds (Hobby limit) to process downloads

const r2 = new S3Client({
  region: 'auto',
  endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID!,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
  },
});

const BUCKET = process.env.R2_BUCKET_NAME || 'monster-audio-bucket';
const DOMAIN = process.env.R2_PUBLIC_DOMAIN || 'https://pub-1e7255ac313f45119d225a16850a670e.r2.dev';

function extractYouTubeId(url: string): string | null {
  const m = url.match(/^.*(youtu\.be\/|v\/|u\/\w\/|embed\/|shorts\/|watch\?v=|&v=)([^#&?]{11}).*/);
  return m?.[2] ?? null;
}

function getYtDlpPath(): string | null {
  if (process.env.YTDLP_PATH && existsSync(process.env.YTDLP_PATH)) return process.env.YTDLP_PATH;
  const candidates = ['/opt/homebrew/bin/yt-dlp', '/usr/local/bin/yt-dlp', '/usr/bin/yt-dlp'];
  for (const c of candidates) {
    if (existsSync(c)) return c;
  }
  return null;
}

function getFFmpegDir(): string {
  if (process.env.FFMPEG_PATH && existsSync(process.env.FFMPEG_PATH)) return process.env.FFMPEG_PATH;
  const candidates = ['/opt/homebrew/bin', '/usr/local/bin', '/usr/bin'];
  for (const c of candidates) {
    if (existsSync(`${c}/ffmpeg`)) return c;
  }
  return '/usr/bin';
}

// ── Multi-Provider Cloud Audio Extractor (Piped -> Cobalt -> Invidious -> ytdl-core) ──
async function fetchCloudAudioStream(youtubeUrl: string, youtubeId: string): Promise<{
  buffer: Buffer;
  title?: string;
  artist?: string;
  duration?: number;
  thumbnailUrl?: string;
}> {
  // Provider 1: Piped Open-Source API Instances (High Speed Direct CDN Streams)
  const pipedInstances = [
    'https://pipedapi.kavin.rocks',
    'https://api.piped.yt',
    'https://pipedapi.tokhmi.xyz',
    'https://pipedapi.mha.fi',
    'https://piped-api.garudalinux.org',
  ];

  for (const inst of pipedInstances) {
    try {
      console.log(`[Monster] Trying Piped API: ${inst}...`);
      const res = await fetch(`${inst}/streams/${youtubeId}`, {
        headers: { 'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)' },
      });
      if (res.ok) {
        const data = await res.json();
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const audioStream = data.audioStreams?.find((s: any) => s.url && (s.mimeType?.includes('audio') || s.format === 'M4A' || s.format === 'WEBMA'));
        if (audioStream?.url) {
          const audioRes = await fetch(audioStream.url);
          if (audioRes.ok) {
            const arrayBuf = await audioRes.arrayBuffer();
            const buffer = Buffer.from(arrayBuf);
            if (buffer.length > 50_000) {
              console.log(`[Monster] ✓ Piped API (${inst}) succeeded: ${(buffer.length / 1024 / 1024).toFixed(2)} MB`);
              return {
                buffer,
                title: data.title,
                artist: data.uploader,
                duration: data.duration,
                thumbnailUrl: data.thumbnailUrl,
              };
            }
          }
        }
      }
    } catch (e) {
      console.warn(`[Monster] Piped API ${inst} error:`, e);
    }
  }

  // Provider 2: Cobalt API v10 Instances
  const cobaltEndpoints = [
    'https://co.wuk.sh/api/json',
    'https://api.cobalt.tools/api/json',
    'https://cobalt.api.scipy.tech/api/json',
  ];

  for (const endpoint of cobaltEndpoints) {
    try {
      console.log(`[Monster] Trying Cobalt API: ${endpoint}...`);
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
          'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)',
        },
        body: JSON.stringify({
          url: `https://www.youtube.com/watch?v=${youtubeId}`,
          downloadMode: 'audio',
          audioFormat: 'mp3',
        }),
      });

      if (res.ok) {
        const data = await res.json();
        const streamUrl = data.url || data.audio;
        if (streamUrl) {
          const audioRes = await fetch(streamUrl);
          if (audioRes.ok) {
            const arrayBuf = await audioRes.arrayBuffer();
            const buffer = Buffer.from(arrayBuf);
            if (buffer.length > 50_000) {
              console.log(`[Monster] ✓ Cobalt API succeeded: ${(buffer.length / 1024 / 1024).toFixed(2)} MB`);
              return { buffer };
            }
          }
        }
      }
    } catch (e) {
      console.warn(`[Monster] Cobalt API endpoint ${endpoint} error:`, e);
    }
  }

  // Provider 3: Invidious API Instances
  const invidiousInstances = [
    'https://inv.tux.pizza',
    'https://invidious.nerdvpn.de',
    'https://invidious.drgns.space',
  ];

  for (const inst of invidiousInstances) {
    try {
      console.log(`[Monster] Trying Invidious API: ${inst}...`);
      const res = await fetch(`${inst}/api/v1/videos/${youtubeId}`);
      if (res.ok) {
        const data = await res.json();
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const audioFormat = data.adaptiveFormats?.find((f: any) => f.type?.includes('audio') && f.url);
        if (audioFormat?.url) {
          const audioRes = await fetch(audioFormat.url);
          if (audioRes.ok) {
            const arrayBuf = await audioRes.arrayBuffer();
            const buffer = Buffer.from(arrayBuf);
            if (buffer.length > 50_000) {
              console.log(`[Monster] ✓ Invidious API succeeded: ${(buffer.length / 1024 / 1024).toFixed(2)} MB`);
              return {
                buffer,
                title: data.title,
                artist: data.author,
                duration: data.lengthSeconds,
                thumbnailUrl: data.videoThumbnails?.[0]?.url,
              };
            }
          }
        }
      }
    } catch (e) {
      console.warn(`[Monster] Invidious ${inst} error:`, e);
    }
  }

  // Provider 4: play-dl Fallback (Highly Reliable Node Native YouTube Scraper)
  try {
    console.log(`[Monster] Trying play-dl fallback...`);
    const streamInfo = await play.stream(youtubeUrl, { quality: 2 }); // quality 2 is highest audio
    const ytInfo = await play.video_info(youtubeUrl);
    const chunks: Buffer[] = [];
    for await (const chunk of streamInfo.stream) {
      chunks.push(Buffer.from(chunk));
    }
    const buffer = Buffer.concat(chunks);
    if (buffer.length > 50_000) {
      console.log(`[Monster] ✓ play-dl succeeded: ${(buffer.length / 1024 / 1024).toFixed(2)} MB`);
      return {
        buffer,
        title: ytInfo.video_details.title,
        artist: ytInfo.video_details.channel?.name,
        duration: ytInfo.video_details.durationInSec,
        thumbnailUrl: ytInfo.video_details.thumbnails?.[0]?.url,
      };
    }
  } catch (e) {
    console.warn('[Monster] play-dl error:', e);
  }

  // Provider 5: @distube/ytdl-core Fallback
  try {
    console.log(`[Monster] Trying ytdl-core fallback...`);
    const info = await ytdl.getInfo(youtubeUrl);
    const audioFormat = ytdl.chooseFormat(info.formats, { filter: 'audioonly', quality: 'highestaudio' });
    const stream = ytdl(youtubeUrl, { format: audioFormat });
    const chunks: Buffer[] = [];
    for await (const chunk of stream) {
      chunks.push(Buffer.from(chunk));
    }
    const buffer = Buffer.concat(chunks);
    if (buffer.length > 50_000) {
      console.log(`[Monster] ✓ ytdl-core succeeded: ${(buffer.length / 1024 / 1024).toFixed(2)} MB`);
      return {
        buffer,
        title: info.videoDetails?.title,
        artist: info.videoDetails?.author?.name,
        duration: parseInt(info.videoDetails?.lengthSeconds || '240', 10),
      };
    }
  } catch (e) {
    console.warn('[Monster] ytdl-core error:', e);
  }

  // Provider 6: Ultimate Serverless Native yt-dlp Fallback (Downloads Linux binary at runtime if not exists)
  try {
    console.log(`[Monster] Trying ultimate yt-dlp serverless fallback...`);
    const ytdlpPath = join(tmpdir(), 'yt-dlp');
    if (!existsSync(ytdlpPath)) {
      console.log('[Monster] Downloading yt-dlp binary to /tmp...');
      // Wait for download. yt-dlp is ~35MB, AWS Lambda connection is very fast.
      await execAsync(`curl -L https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp -o ${ytdlpPath}`);
      await chmod(ytdlpPath, 0o775);
    }
    console.log('[Monster] Extracting direct stream URL using local yt-dlp...');
    const { stdout } = await execAsync(`${ytdlpPath} --get-url -f 140 "${youtubeUrl}"`);
    const streamUrl = stdout.trim();
    
    if (streamUrl && streamUrl.startsWith('http')) {
      const audioRes = await fetch(streamUrl);
      if (audioRes.ok) {
         const arrayBuf = await audioRes.arrayBuffer();
         const buffer = Buffer.from(arrayBuf);
         if (buffer.length > 50_000) {
           console.log(`[Monster] ✓ Ultimate yt-dlp fallback succeeded: ${(buffer.length / 1024 / 1024).toFixed(2)} MB`);
           
           // Fetch metadata since we only got the URL
           try {
             const metaRes = await execAsync(`${ytdlpPath} --dump-json --no-playlist "${youtubeUrl}"`);
             const meta = JSON.parse(metaRes.stdout);
             return {
               buffer,
               title: meta.title,
               artist: meta.uploader,
               duration: meta.duration,
               thumbnailUrl: meta.thumbnail,
             };
           } catch {
             return { buffer };
           }
         }
      }
    }
  } catch (e) {
    console.warn('[Monster] Ultimate yt-dlp fallback error:', e);
  }

  throw new Error('All online cloud audio extractors (Piped, Cobalt, Invidious, play-dl, ytdl-core, standalone yt-dlp) failed to retrieve audio stream.');
}

export async function POST(request: Request) {
  let tempDir: string | null = null;

  try {
    const { youtubeUrl } = await request.json();
    if (!youtubeUrl) return NextResponse.json({ error: 'YouTube URL is required' }, { status: 400 });

    const youtubeId = extractYouTubeId(youtubeUrl);
    if (!youtubeId) return NextResponse.json({ error: 'Invalid YouTube URL format' }, { status: 400 });

    const r2Key = `songs/${youtubeId}.mp3`;
    const r2Url = `${DOMAIN}/${r2Key}`;

    // ── Duplicate & R2 Existence Check ───────────────────────────────────────
    const existing = await prisma.song.findFirst({ where: { youtubeId } });
    if (existing) {
      let existsInR2 = false;
      try {
        await r2.send(new HeadObjectCommand({ Bucket: BUCKET, Key: r2Key }));
        existsInR2 = true;
      } catch {
        existsInR2 = false;
      }

      if (existsInR2) {
        console.log(`[Monster] Song ${youtubeId} already exists in DB and R2.`);
        return NextResponse.json({
          success: true,
          duplicate: true,
          message: 'Already in your library and ready to play!',
          song: shapeSong(existing),
        });
      }
      console.log(`[Monster] Song ${youtubeId} in DB but missing from R2 bucket. Processing audio extraction now...`);
    }

    let audioBuffer: Buffer | null = null;
    let title = `YouTube Track (${youtubeId})`;
    let artist = 'YouTube Import';
    let thumbnailUrl = `https://img.youtube.com/vi/${youtubeId}/hqdefault.jpg`;
    let duration = 240;

    // ── Step 1: Metadata (oEmbed) ──────────────────────────────────────────────
    try {
      const res = await fetch(
        `https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${youtubeId}&format=json`
      );
      if (res.ok) {
        const d = await res.json();
        if (d.title) title = d.title;
        if (d.author_name) artist = d.author_name;
        if (d.thumbnail_url) thumbnailUrl = d.thumbnail_url;
      }
    } catch { /* use defaults */ }

    // ── Step 2: Extract Audio (Online Cloud APIs First, then local yt-dlp) ─────
    try {
      const cloudResult = await fetchCloudAudioStream(youtubeUrl, youtubeId);
      audioBuffer = cloudResult.buffer;
      if (cloudResult.title) title = cloudResult.title;
      if (cloudResult.artist) artist = cloudResult.artist;
      if (cloudResult.duration) duration = cloudResult.duration;
      if (cloudResult.thumbnailUrl) thumbnailUrl = cloudResult.thumbnailUrl;
    } catch (cloudErr) {
      console.warn('[Monster] All cloud audio extractors failed. Trying local CLI fallback...', cloudErr);

      const ytDlpPath = getYtDlpPath();
      if (ytDlpPath) {
        const FFMPEG = getFFmpegDir();
        const ENV = { ...process.env, PATH: `/opt/homebrew/bin:/usr/local/bin:/usr/bin:/bin:${process.env.PATH || ''}` };

        tempDir = await mkdtemp(join(tmpdir(), 'monster-'));
        const outputTemplate = join(tempDir, '%(id)s.%(ext)s');

        const cmd = [
          ytDlpPath,
          '--extract-audio',
          '--audio-format', 'mp3',
          '--audio-quality', '0',
          '--ffmpeg-location', FFMPEG,
          '--output', `"${outputTemplate}"`,
          '--no-playlist',
          '--restrict-filenames',
          '--',
          `"https://www.youtube.com/watch?v=${youtubeId}"`,
        ].join(' ');

        console.log('[Monster] Running local yt-dlp CLI fallback:', cmd);
        await execAsync(cmd, { timeout: 240_000, env: ENV });

        const files = await readdir(tempDir);
        const audioFile = files.find(f => f.endsWith('.mp3') || f.endsWith('.m4a') || f.endsWith('.opus') || f.endsWith('.webm'));
        if (audioFile) {
          audioBuffer = await readFile(join(tempDir, audioFile));
        }
      }
    }

    if (!audioBuffer || audioBuffer.length === 0) {
      return NextResponse.json(
        { error: 'Online audio extraction failed for this YouTube URL.', details: 'Could not fetch audio stream via Piped, Cobalt, Invidious, or ytdl-core cloud services.' },
        { status: 500 }
      );
    }

    // ── Step 3: Upload Audio Buffer directly to Cloudflare R2 ────────────────
    try {
      await r2.send(new PutObjectCommand({
        Bucket: BUCKET,
        Key: r2Key,
        Body: audioBuffer,
        ContentType: 'audio/mpeg',
        CacheControl: 'public, max-age=31536000',
        Metadata: {
          title,
          artist,
          youtubeId,
        },
      }));
      console.log(`[Monster] ✓ Uploaded to R2: ${r2Key} (${BUCKET})`);
    } catch (r2Err: unknown) {
      const msg = r2Err instanceof Error ? r2Err.message : String(r2Err);
      console.error('[Monster] R2 upload error:', msg);
      return NextResponse.json(
        { error: 'Audio extracted but Cloudflare R2 upload failed.', details: msg },
        { status: 500 }
      );
    }

    // ── Step 4: Index Record in Neon DB ─────────────────────────────────────
    let defaultUser = await prisma.user.findFirst();
    if (!defaultUser) {
      defaultUser = await prisma.user.create({
        data: { email: 'prem@monster.app', name: 'Prem Prajapati', googleId: 'google-sys' },
      });
    }

    let song;
    if (existing) {
      song = await prisma.song.update({
        where: { id: existing.id },
        data: { title, artist, duration, r2Key, r2Url, thumbnailUrl },
        include: { addedBy: true },
      });
    } else {
      song = await prisma.song.create({
        data: {
          title, artist, duration, youtubeUrl, youtubeId,
          r2Key, r2Url, thumbnailUrl, addedById: defaultUser.id,
        },
        include: { addedBy: true },
      });
    }

    console.log(`[Monster] ✓ Saved to Neon DB: ${song.id}`);

    return NextResponse.json({
      success: true,
      message: 'Track imported and uploaded to Cloudflare R2!',
      song: shapeSong(song),
    });

  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    console.error('[Monster] Ingestion error:', errorMsg);
    return NextResponse.json(
      { error: 'YouTube audio extraction failed.', details: errorMsg },
      { status: 500 }
    );
  } finally {
    if (tempDir) {
      try { await rm(tempDir, { recursive: true, force: true }); } catch { /* ok */ }
    }
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function shapeSong(s: any) {
  return {
    id:          s.id,
    title:       s.title,
    artist:      s.artist,
    duration:    s.duration,
    youtubeUrl:  s.youtubeUrl,
    youtubeId:   s.youtubeId ?? undefined,
    r2Url:       s.r2Url,
    thumbnailUrl: s.thumbnailUrl,
    playsCount:  s.playsCount,
    addedByName: s.addedBy?.name ?? 'Monster User',
    createdAt:   s.createdAt?.toISOString?.() ?? new Date().toISOString(),
    genre:       'YouTube Ingestion',
  };
}
