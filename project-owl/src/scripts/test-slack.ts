import { config } from 'dotenv'
import { WebClient } from '@slack/web-api'

// Load environment variables
config()

const token = process.env.SLACK_BOT_TOKEN
if (!token) {
  throw new Error('SLACK_BOT_TOKEN is not set')
}

const slack = new WebClient(token)

async function testSlackConnection() {
  try {
    // Test auth
    const auth = await slack.auth.test()
    console.log('Successfully connected to Slack!')
    console.log('Bot name:', auth.user)
    console.log('Team:', auth.team)

    // List channels
    const channelList = await slack.conversations.list({
      types: 'public_channel',
      limit: 10
    })

    console.log('\nAvailable channels:')
    channelList.channels?.forEach(channel => {
      console.log(`- ${channel.name} (ID: ${channel.id})`)
    })

  } catch (error) {
    console.error('Error testing Slack connection:', error)
  }
}

testSlackConnection()
