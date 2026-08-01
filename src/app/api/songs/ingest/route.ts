import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { S3Client, PutObjectCommand, HeadObjectCommand } from '@aws-sdk/client-s3';
import { exec } from 'child_process';
import { promisify } from 'util';
import { readdir, readFile, rm, mkdtemp } from 'fs/promises';
import { existsSync } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';

const execAsync = promisify(exec);

// Dynamically locate yt-dlp and ffmpeg across macOS Homebrew, Linux, and PATH
function getYtDlpPath(): string {
  if (process.env.YTDLP_PATH && existsSync(process.env.YTDLP_PATH)) return process.env.YTDLP_PATH;
  const candidates = [
    '/opt/homebrew/bin/yt-dlp',
    '/usr/local/bin/yt-dlp',
    '/usr/bin/yt-dlp',
  ];
  for (const c of candidates) {
    if (existsSync(c)) return c;
  }
  return 'yt-dlp'; // fallback to shell PATH
}

function getFFmpegDir(): string {
  if (process.env.FFMPEG_PATH && existsSync(process.env.FFMPEG_PATH)) return process.env.FFMPEG_PATH;
  const candidates = [
    '/opt/homebrew/bin',
    '/usr/local/bin',
    '/usr/bin',
  ];
  for (const c of candidates) {
    if (existsSync(`${c}/ffmpeg`)) return c;
  }
  return '/usr/bin';
}

const YTDLP  = getYtDlpPath();
const FFMPEG = getFFmpegDir();
const ENV    = { ...process.env, PATH: `/opt/homebrew/bin:/usr/local/bin:/usr/bin:/bin:${process.env.PATH || ''}` };

const r2 = new S3Client({
  region: 'auto',
  endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID!,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
  },
});

const BUCKET = process.env.R2_BUCKET_NAME    || 'monster-audio-bucket';
const DOMAIN = process.env.R2_PUBLIC_DOMAIN  || 'https://pub-1e7255ac313f45119d225a16850a670e.r2.dev';

function extractYouTubeId(url: string): string | null {
  const m = url.match(/^.*(youtu\.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]{11}).*/);
  return m?.[2] ?? null;
}

export async function POST(request: Request) {
  let tempDir: string | null = null;

  try {
    const { youtubeUrl } = await request.json();
    if (!youtubeUrl) return NextResponse.json({ error: 'YouTube URL is required' }, { status: 400 });

    const youtubeId = extractYouTubeId(youtubeUrl);
    if (!youtubeId) return NextResponse.json({ error: 'Invalid YouTube URL format' }, { status: 400 });

    const r2Key = `songs/${youtubeId}.mp3`;

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
      console.log(`[Monster] Song ${youtubeId} in DB but missing from R2 bucket. Downloading & uploading now...`);
    }

    // ── Step 1: Metadata (oEmbed) ──────────────────────────────────────────────
    let title        = `YouTube Track (${youtubeId})`;
    let artist       = 'YouTube Import';
    let thumbnailUrl = `https://img.youtube.com/vi/${youtubeId}/hqdefault.jpg`;
    let duration     = 240;

    try {
      const res = await fetch(
        `https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${youtubeId}&format=json`
      );
      if (res.ok) {
        const d = await res.json();
        if (d.title)          title        = d.title;
        if (d.author_name)    artist       = d.author_name;
        if (d.thumbnail_url)  thumbnailUrl = d.thumbnail_url;
      }
    } catch { /* use defaults */ }

    // ── Step 2: Download with yt-dlp ──────────────────────────────────────────
    tempDir = await mkdtemp(join(tmpdir(), 'monster-'));
    const outputTemplate = join(tempDir, '%(id)s.%(ext)s');

    const cmd = [
      YTDLP,
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

    console.log('[Monster] Running:', cmd);

    try {
      await execAsync(cmd, { timeout: 240_000, env: ENV });
    } catch (e: unknown) {
      const err = e as { stderr?: string; message?: string };
      const ytdlpStderr = err.stderr || err.message || String(e);
      console.error('[Monster] yt-dlp failed:', ytdlpStderr);
      return NextResponse.json(
        {
          error: 'yt-dlp binary not found or failed on server.',
          details: `Executed command '${cmd}'. Result: ${ytdlpStderr.slice(0, 500)}. (Note: YouTube audio extraction requires yt-dlp + ffmpeg installed on the host environment).`
        },
        { status: 500 }
      );
    }

    const files     = await readdir(tempDir);
    const audioFile = files.find(f => f.endsWith('.mp3') || f.endsWith('.m4a') || f.endsWith('.opus') || f.endsWith('.webm'));
    if (!audioFile) {
      console.error('[Monster] No audio file found in temp dir. Contents:', files);
      return NextResponse.json(
        { error: 'yt-dlp ran but produced no audio file.', details: `Files in temp dir: ${files.join(', ') || '(empty)'}` },
        { status: 500 }
      );
    }

    const audioPath = join(tempDir, audioFile);
    const audioBuffer = await readFile(audioPath);
    console.log(`[Monster] Audio file read: ${audioFile} (${(audioBuffer.length / 1024 / 1024).toFixed(2)} MB)`);

    try {
      const { stdout } = await execAsync(
        `${YTDLP} --print duration "https://www.youtube.com/watch?v=${youtubeId}" --no-warnings`,
        { env: ENV }
      );
      const d = parseInt(stdout.trim(), 10);
      if (!isNaN(d) && d > 0) duration = d;
    } catch { /* use default */ }

    // ── Step 3: Upload to Cloudflare R2 ───────────────────────────────────────
    try {
      await r2.send(new PutObjectCommand({
        Bucket:       BUCKET,
        Key:          r2Key,
        Body:         audioBuffer,
        ContentType:  'audio/mpeg',
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
        { error: 'Audio downloaded but R2 upload failed.', details: msg },
        { status: 500 }
      );
    }

    // ── Step 4: Save or Update Neon DB Record ─────────────────────────────────
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
        data: { title, artist, duration, r2Key, r2Url: `${DOMAIN}/${r2Key}`, thumbnailUrl },
        include: { addedBy: true },
      });
    } else {
      song = await prisma.song.create({
        data: {
          title, artist, duration, youtubeUrl, youtubeId,
          r2Key, r2Url: `${DOMAIN}/${r2Key}`, thumbnailUrl, addedById: defaultUser.id,
        },
        include: { addedBy: true },
      });
    }

    console.log(`[Monster] ✓ Saved to DB: ${song.id}`);

    return NextResponse.json({ success: true, message: 'Track imported and uploaded to R2!', song: shapeSong(song) });

  } catch (err) {
    console.error('[Monster] Unexpected error:', err);
    return NextResponse.json(
      { error: 'Unexpected server error', details: String(err) },
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
