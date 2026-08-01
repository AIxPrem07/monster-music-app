import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const playlists = await prisma.playlist.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        songs: {
          include: {
            song: true,
          },
          orderBy: { order: 'asc' },
        },
      },
    });

    const formattedPlaylists = playlists.map((pl) => ({
      id: pl.id,
      name: pl.name,
      description: pl.description || '',
      userId: pl.userId,
      createdAt: pl.createdAt.toISOString(),
      songs: pl.songs.map((ps) => ({
        id: ps.song.id,
        title: ps.song.title,
        artist: ps.song.artist,
        duration: ps.song.duration,
        youtubeUrl: ps.song.youtubeUrl,
        youtubeId: ps.song.youtubeId || undefined,
        r2Url: ps.song.r2Url,
        thumbnailUrl: ps.song.thumbnailUrl,
        playsCount: ps.song.playsCount,
        createdAt: ps.song.createdAt.toISOString(),
      })),
    }));

    return NextResponse.json({ success: true, playlists: formattedPlaylists });
  } catch (error) {
    console.error('Error fetching playlists:', error);
    return NextResponse.json({ success: false, playlists: [] }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, description } = body;

    if (!name || !name.trim()) {
      return NextResponse.json({ error: 'Playlist name is required' }, { status: 400 });
    }

    let defaultUser = await prisma.user.findFirst();
    if (!defaultUser) {
      defaultUser = await prisma.user.create({
        data: {
          email: 'prem@monster.app',
          name: 'Prem Prajapati',
          googleId: 'google-10023491',
        },
      });
    }

    const playlist = await prisma.playlist.create({
      data: {
        name: name.trim(),
        description: description || '',
        userId: defaultUser.id,
      },
      include: {
        songs: true,
      },
    });

    return NextResponse.json({
      success: true,
      playlist: {
        id: playlist.id,
        name: playlist.name,
        description: playlist.description || '',
        userId: playlist.userId,
        songs: [],
        createdAt: playlist.createdAt.toISOString(),
      },
    });
  } catch (error) {
    console.error('Error creating playlist:', error);
    return NextResponse.json({ error: 'Failed to create playlist' }, { status: 500 });
  }
}
