import { config } from 'dotenv'
import { WebClient } from '@slack/web-api'

// Load environment variables
config()

const token = process.env.SLACK_BOT_TOKEN
if (!token) {
  throw new Error('SLACK_BOT_TOKEN is not set')
}

const slack = new WebClient(token)

// Cache for user info to avoid repeated API calls
const userCache = new Map<string, any>()

async function getUserInfo(userId: string | undefined) {
  if (!userId) return { name: 'Unknown', real_name: 'Unknown' }
  
  // Check cache first
  if (userCache.has(userId)) {
    return userCache.get(userId)
  }

  try {
    const result = await slack.users.info({ user: userId })
    if (result.user) {
      userCache.set(userId, {
        name: result.user.name,
        real_name: result.user.real_name
      })
      return userCache.get(userId)
    }
  } catch (error) {
    console.error(`Error fetching user info for ${userId}:`, error)
  }
  return { name: 'Unknown', real_name: 'Unknown' }
}

async function getChannelSummary(channelId: string) {
  try {
    // Get channel info
    const channelInfo = await slack.conversations.info({
      channel: channelId
    })
    
    console.log(`Channel: ${channelInfo.channel?.name}`)
    console.log(`Purpose: ${channelInfo.channel?.purpose?.value || 'No purpose set'}`)
    console.log(`Members: ${channelInfo.channel?.num_members} members`)
    
    // Get recent messages with replies
    const result = await slack.conversations.history({
      channel: channelId,
      oldest: String((Date.now() - 24 * 60 * 60 * 1000) / 1000), // 24 hours ago in seconds
      inclusive: true
    })
    
    console.log('\nRecent Messages:')
    console.log('----------------')
    
    if (result.messages) {
      for (const msg of result.messages) {
        const ts = new Date(Number(msg.ts) * 1000)
        const userInfo = await getUserInfo(msg.user)
        
        console.log('\nMessage:')
        console.log(`Timestamp: ${ts.toLocaleString()}`)
        console.log(`Message ID (ts): ${msg.ts}`)
        console.log(`Sender ID: ${msg.user || 'Unknown'}`)
        console.log(`Sender Username: ${userInfo.name}`)
        console.log(`Sender Real Name: ${userInfo.real_name}`)
        console.log(`Thread?: ${msg.thread_ts ? 'Yes' : 'No'}`)
        if (msg.thread_ts && msg.thread_ts !== msg.ts) {
          console.log(`Parent Message: ${msg.thread_ts}`)
        }
        if (msg.reply_count) {
          console.log(`Reply Count: ${msg.reply_count}`)
        }
        console.log(`Content: ${msg.text}`)
      }
    }

  } catch (error) {
    console.error('Error getting channel summary:', error)
  }
}

// Get summary for the specified channel
getChannelSummary('C03UZTFMCBY')
