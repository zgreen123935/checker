import { NextResponse } from 'next/server'
import { WebClient } from '@slack/web-api'

// Cache for user info to avoid repeated API calls
const userCache = new Map<string, any>()

async function getUserInfo(slack: WebClient, userId: string | undefined) {
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

async function getChannelSummary(slack: WebClient, channelId: string) {
  try {
    // Get channel info
    const channelInfo = await slack.conversations.info({
      channel: channelId
    })

    // Get recent messages
    const result = await slack.conversations.history({
      channel: channelId,
      oldest: String((Date.now() - 24 * 60 * 60 * 1000) / 1000), // 24 hours ago
      inclusive: true
    })

    // Enrich messages with user info
    const messages = await Promise.all((result.messages || []).map(async (msg) => {
      const userInfo = await getUserInfo(slack, msg.user)
      return {
        ...msg,
        username: userInfo.name,
        real_name: userInfo.real_name
      }
    }))

    return {
      id: channelId,
      name: channelInfo.channel?.name || 'unknown',
      purpose: channelInfo.channel?.purpose?.value || '',
      messages
    }
  } catch (error: any) {
    console.error('Error getting channel summary:', error)
    return {
      id: channelId,
      name: 'unknown',
      purpose: '',
      messages: [],
      error: error.message || 'Failed to fetch channel data'
    }
  }
}

export async function GET() {
  try {
    const token = process.env.SLACK_BOT_TOKEN
    if (!token) {
      throw new Error('SLACK_BOT_TOKEN is not set')
    }

    const slack = new WebClient(token)
    const projectChannels = process.env.PROJECT_CHANNELS || ''
    
    // Parse project channels from env var
    const channelIds = projectChannels
      .split(',')
      .map(entry => entry.split('=')[1])
      .filter(Boolean)

    // Get summaries for all channels
    const channelSummaries = await Promise.all(
      channelIds.map(channelId => getChannelSummary(slack, channelId))
    )

    return NextResponse.json(channelSummaries)
  } catch (error: any) {
    console.error('Error in /api/channels:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}
