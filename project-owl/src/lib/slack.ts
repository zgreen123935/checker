import { WebClient } from '@slack/web-api'

if (!process.env.SLACK_BOT_TOKEN) {
  throw new Error('SLACK_BOT_TOKEN is not set in environment variables')
}

export const slack = new WebClient(process.env.SLACK_BOT_TOKEN)

export async function getChannelMessages(channelId: string): Promise<any[]> {
  try {
    // Get messages from the last 7 days
    const oneWeekAgo = Math.floor((Date.now() - 7 * 24 * 60 * 60 * 1000) / 1000);
    
    const result = await slack.conversations.history({
      channel: channelId,
      limit: 100, // Increased limit to get more messages
      oldest: oneWeekAgo.toString(),
      inclusive: true
    });

    return result.messages || [];
  } catch (error) {
    console.error('Error fetching channel messages:', error);
    return [];
  }
}

export async function postMessage(channelId: string, text: string) {
  try {
    const result = await slack.chat.postMessage({
      channel: channelId,
      text,
    })

    if (!result.ok) {
      throw new Error(`Failed to post message: ${result.error}`)
    }

    return result
  } catch (error) {
    console.error('Error posting message:', error)
    throw error
  }
}
