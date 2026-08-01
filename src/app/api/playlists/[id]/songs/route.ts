import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// POST /api/playlists/[id]/songs — Add a song to playlist
export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const playlistId = params.id;
    const { songId } = await request.json();

    if (!songId) {
      return NextResponse.json({ error: 'Song ID is required' }, { status: 400 });
    }

    // Get highest order value
    const lastItem = await prisma.playlistSong.findFirst({
      where: { playlistId },
      orderBy: { order: 'desc' },
    });

    const nextOrder = (lastItem?.order ?? 0) + 1;

    // Upsert or create playlistSong
    const playlistSong = await prisma.playlistSong.upsert({
      where: {
        playlistId_songId: {
          playlistId,
          songId,
        },
      },
      update: {},
      create: {
        playlistId,
        songId,
        order: nextOrder,
      },
    });

    return NextResponse.json({ success: true, playlistSong });
  } catch (error) {
    console.error('Error adding song to playlist:', error);
    return NextResponse.json({ error: 'Failed to add song to playlist' }, { status: 500 });
  }
}

// DELETE /api/playlists/[id]/songs — Remove a song from playlist
export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const playlistId = params.id;
    const { searchParams } = new URL(request.url);
    const songId = searchParams.get('songId');

    if (!songId) {
      return NextResponse.json({ error: 'Song ID parameter is required' }, { status: 400 });
    }

    await prisma.playlistSong.deleteMany({
      where: {
        playlistId,
        songId,
      },
    });

    return NextResponse.json({ success: true, message: 'Song removed from playlist' });
  } catch (error) {
    console.error('Error removing song from playlist:', error);
    return NextResponse.json({ error: 'Failed to remove song from playlist' }, { status: 500 });
  }
}
