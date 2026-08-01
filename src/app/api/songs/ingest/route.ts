import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { S3Client, PutObjectCommand, HeadObjectCommand } from '@aws-sdk/client-s3';
import ytdl from '@distube/ytdl-core';
import { exec } from 'child_process';
import { promisify } from 'util';
import { readdir, readFile, rm, mkdtemp } from 'fs/promises';
import { existsSync } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';

const execAsync = promisify(exec);

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
  const m = url.match(/^.*(youtu\.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]{11}).*/);
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

    // ── Approach 1: Pure Node.js Cloud Extraction using @distube/ytdl-core ─────
    try {
      console.log(`[Monster] Attempting cloud audio extraction via ytdl-core for ${youtubeId}...`);
      const info = await ytdl.getInfo(youtubeUrl);
      if (info.videoDetails) {
        if (info.videoDetails.title) title = info.videoDetails.title;
        if (info.videoDetails.author?.name) artist = info.videoDetails.author.name;
        if (info.videoDetails.lengthSeconds) {
          const sec = parseInt(info.videoDetails.lengthSeconds, 10);
          if (!isNaN(sec) && sec > 0) duration = sec;
        }
        const highestThumb = info.videoDetails.thumbnails?.pop()?.url;
        if (highestThumb) thumbnailUrl = highestThumb;
      }

      const audioFormat = ytdl.chooseFormat(info.formats, { filter: 'audioonly', quality: 'highestaudio' });
      const stream = ytdl(youtubeUrl, { format: audioFormat });

      const chunks: Buffer[] = [];
      for await (const chunk of stream) {
        chunks.push(Buffer.from(chunk));
      }
      audioBuffer = Buffer.concat(chunks);
      console.log(`[Monster] ✓ Cloud ytdl-core extracted ${(audioBuffer.length / 1024 / 1024).toFixed(2)} MB audio buffer.`);
    } catch (cloudErr) {
      console.warn('[Monster] Cloud ytdl-core extraction failed/throttled. Trying local yt-dlp binary fallback...', cloudErr);
    }

    // ── Approach 2: Fallback to local yt-dlp CLI binary if available ─────────
    if (!audioBuffer || audioBuffer.length === 0) {
      const ytDlpPath = getYtDlpPath();
      if (!ytDlpPath) {
        return NextResponse.json(
          {
            error: 'Cloud audio extraction failed and yt-dlp binary is not installed on host.',
            details: 'Could not extract YouTube audio stream via ytdl-core or local CLI.',
          },
          { status: 500 }
        );
      }

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

      console.log('[Monster] Running CLI fallback:', cmd);
      await execAsync(cmd, { timeout: 240_000, env: ENV });

      const files = await readdir(tempDir);
      const audioFile = files.find(f => f.endsWith('.mp3') || f.endsWith('.m4a') || f.endsWith('.opus') || f.endsWith('.webm'));
      if (!audioFile) {
        throw new Error('yt-dlp CLI ran but produced no output file');
      }

      audioBuffer = await readFile(join(tempDir, audioFile));
    }

    if (!audioBuffer || audioBuffer.length === 0) {
      return NextResponse.json({ error: 'Failed to obtain audio stream for this track.' }, { status: 500 });
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
