import { config } from 'dotenv'
import { WebClient } from '@slack/web-api'

// Load environment variables
config()

const token = process.env.SLACK_BOT_TOKEN
if (!token) {
  throw new Error('SLACK_BOT_TOKEN is not set')
}

const slack = new WebClient(token)

async function joinChannel(channelId: string) {
  try {
    const result = await slack.conversations.join({
      channel: channelId
    })
    console.log(`Successfully joined channel: ${result.channel?.name}`)
  } catch (error) {
    console.error('Error joining channel:', error)
  }
}

// Join the specified channel
joinChannel('C03UZTFMCBY')
