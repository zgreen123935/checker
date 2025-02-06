import { WebClient } from '@slack/web-api'

if (!process.env.SLACK_BOT_TOKEN) {
  throw new Error('SLACK_BOT_TOKEN is not set in environment variables')
}

export const slack = new WebClient(process.env.SLACK_BOT_TOKEN)

export async function getChannelMessages(channelId: string, oldest?: string) {
  try {
    const result = await slack.conversations.history({
      channel: channelId,
      limit: 100,
      oldest,
    })

    if (!result.ok) {
      throw new Error(`Failed to fetch messages: ${result.error}`)
    }

    return result.messages || []
  } catch (error) {
    console.error('Error fetching channel messages:', error)
    throw error
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
