import { NextResponse } from 'next/server'
import { WebClient } from '@slack/web-api'
import { prisma } from '@/lib/db'
import { Prisma } from '@prisma/client'

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
    // First check database connection
    try {
      await prisma.$connect()
      console.log('Successfully connected to database')
    } catch (error) {
      console.error('Database connection error:', error)
      return NextResponse.json(
        { error: 'Failed to connect to database. Please check DATABASE_URL in .env' },
        { status: 500 }
      )
    }

    const token = process.env.SLACK_BOT_TOKEN
    if (!token) {
      console.error('SLACK_BOT_TOKEN is not set')
      return NextResponse.json(
        { error: 'SLACK_BOT_TOKEN is not set in .env' },
        { status: 500 }
      )
    }

    const slack = new WebClient(token)
    console.log('Initialized Slack WebClient')
    
    // Get channels from database
    console.log('Fetching channels from database...')
    const channels = await prisma.channel.findMany({
      where: {},
      select: {
        id: true,
        name: true,
        purpose: true,
        lastUpdated: true
      }
    })
    
    console.log('Raw database response:', JSON.stringify(channels, null, 2))
    console.log(`Found ${channels.length} channels in database`)
    
    if (channels.length === 0) {
      // If no channels in DB, try to get them from Slack
      console.log('No channels in database, fetching from Slack...')
      const result = await slack.conversations.list({
        exclude_archived: true,
        types: 'public_channel,private_channel'
      })
      
      if (!result.ok || !result.channels) {
        console.error('Failed to fetch channels from Slack')
        return NextResponse.json(
          { error: 'No channels found and failed to fetch from Slack' },
          { status: 404 }
        )
      }
      
      // Store channels in database
      console.log(`Found ${result.channels.length} channels from Slack, storing in database...`)
      for (const channel of result.channels) {
        if (channel.id && channel.name) {
          await prisma.channel.upsert({
            where: { id: channel.id },
            create: {
              id: channel.id,
              name: channel.name,
              purpose: channel.purpose?.value || '',
            },
            update: {
              name: channel.name,
              purpose: channel.purpose?.value || '',
              lastUpdated: new Date(),
            },
          })
        }
      }
      
      // Fetch the newly stored channels
      return NextResponse.json(await prisma.channel.findMany({
        select: {
          id: true,
          name: true,
          purpose: true,
          lastUpdated: true
        }
      }))
    }

    // Get summaries for all channels
    console.log('Fetching channel summaries from Slack...')
    const channelSummaries = await Promise.all(
      channels.map(channel => getChannelSummary(slack, channel.id))
    )
    console.log('Successfully fetched channel summaries')

    return NextResponse.json(channelSummaries)
  } catch (error: any) {
    console.error('Error in /api/channels:', error)
    console.error('Error stack:', error.stack)
    
    // Handle Prisma errors specifically
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      return NextResponse.json(
        { error: 'Database error: ' + error.message },
        { status: 500 }
      )
    }
    
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  } finally {
    await prisma.$disconnect()
  }
}
