import { NextResponse } from 'next/server'
import { WebClient } from '@slack/web-api'
import { generateDailyRecap } from '@/lib/analysis'
import { getChannelMessages } from '@/lib/slack'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const channelId = searchParams.get('channelId');

  if (!channelId) {
    return NextResponse.json({ error: 'Missing channelId parameter' }, { status: 400 });
  }

  try {
    console.log('Fetching messages for channel:', channelId);
    const messages = await getChannelMessages(channelId);
    console.log('Retrieved messages count:', messages.length);

    console.log('Generating daily recap...');
    const recap = await generateDailyRecap(messages);
    console.log('Daily recap result:', JSON.stringify(recap, null, 2));

    // Check if we have action items in the highlights
    if (recap.highlights) {
      console.log('Action items in highlights:', recap.highlights.map(h => h.actionItems));
    }

    return NextResponse.json(recap);
  } catch (error) {
    console.error('Error in analysis route:', error);
    return NextResponse.json({ error: 'Failed to generate analysis' }, { status: 500 });
  }
}
