import { NextResponse } from 'next/server';
import { postOwlEmoji } from '@/lib/slack';

export async function POST(request: Request) {
  const { channelId } = await request.json();

  if (!channelId) {
    return NextResponse.json({ error: 'Missing channelId parameter' }, { status: 400 });
  }

  try {
    await postOwlEmoji(channelId);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error posting owl emoji:', error);
    return NextResponse.json({ error: 'Failed to post owl emoji' }, { status: 500 });
  }
}
