import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const songs = await prisma.song.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        addedBy: {
          select: { name: true, email: true, avatarUrl: true },
        },
      },
    });

    const formattedSongs = songs.map((song) => ({
      id: song.id,
      title: song.title,
      artist: song.artist,
      duration: song.duration,
      youtubeUrl: song.youtubeUrl,
      youtubeId: song.youtubeId || undefined,
      r2Url: song.r2Url,
      thumbnailUrl: song.thumbnailUrl,
      playsCount: song.playsCount,
      addedByName: song.addedBy?.name || 'Monster User',
      createdAt: song.createdAt.toISOString(),
      isLiked: false,
    }));

    return NextResponse.json({ success: true, songs: formattedSongs });
  } catch (error) {
    console.error('Error fetching songs from Neon DB:', error);
    return NextResponse.json(
      { success: false, songs: [], message: 'Failed to fetch songs from database' },
      { status: 500 }
    );
  }
}
