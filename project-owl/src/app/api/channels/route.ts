import { NextResponse } from 'next/server';
import { WebClient } from '@slack/web-api';
import { prisma } from '@/lib/db';
import { handleError } from '@/lib/errors/handler';
import { DatabaseError, SlackError, ConfigError, NotFoundError } from '@/lib/errors';

// Cache for user info to avoid repeated API calls
const userCache = new Map<string, any>();

async function getUserInfo(slack: WebClient, userId: string | undefined) {
  if (!userId) return { name: 'Unknown', real_name: 'Unknown' };
  
  // Check cache first
  if (userCache.has(userId)) {
    return userCache.get(userId);
  }

  try {
    const result = await slack.users.info({ user: userId });
    if (result.user) {
      userCache.set(userId, {
        name: result.user.name,
        real_name: result.user.real_name
      });
      return userCache.get(userId);
    }
    throw new SlackError(`Failed to fetch user info for ${userId}`);
  } catch (error) {
    console.error(`Error fetching user info for ${userId}:`, error);
    throw new SlackError(`Error fetching user info: ${error.message}`);
  }
}

async function getChannelSummary(slack: WebClient, channelId: string) {
  try {
    // Get channel info
    const channelInfo = await slack.conversations.info({
      channel: channelId
    });

    // Get recent messages
    const result = await slack.conversations.history({
      channel: channelId,
      oldest: String((Date.now() - 24 * 60 * 60 * 1000) / 1000), // 24 hours ago
      inclusive: true
    });

    if (!result.ok) {
      throw new SlackError('Failed to fetch channel history');
    }

    // Enrich messages with user info
    const messages = await Promise.all((result.messages || []).map(async (msg) => {
      const userInfo = await getUserInfo(slack, msg.user);
      return {
        ...msg,
        username: userInfo.name,
        real_name: userInfo.real_name
      };
    }));

    return {
      id: channelId,
      name: channelInfo.channel?.name || 'unknown',
      purpose: channelInfo.channel?.purpose?.value || '',
      messages
    };
  } catch (error) {
    console.error('Error getting channel summary:', error);
    throw error instanceof SlackError ? error : new SlackError('Failed to fetch channel data');
  }
}

export async function GET() {
  let prismaClient = prisma;
  
  try {
    // First check database connection
    try {
      await prismaClient.$connect();
      console.log('✅ Database connection successful');
    } catch (error) {
      console.error('Database connection error:', error);
      throw new DatabaseError('Failed to connect to database');
    }

    const token = process.env.SLACK_BOT_TOKEN;
    if (!token) {
      throw new ConfigError('SLACK_BOT_TOKEN is not set');
    }

    const slack = new WebClient(token);
    
    // Get channels from database
    console.log('Fetching channels from database...');
    const channels = await prismaClient.channel.findMany({
      where: {},
      select: {
        id: true,
        name: true,
        purpose: true,
        lastUpdated: true
      }
    });
    
    console.log(`Found ${channels.length} channels in database`);
    
    if (channels.length === 0) {
      // If no channels in DB, try to get them from Slack
      console.log('No channels in database, fetching from Slack...');
      try {
        const result = await slack.conversations.list({
          exclude_archived: true,
          types: 'public_channel,private_channel'
        });
        
        if (!result.ok || !result.channels) {
          throw new SlackError('Failed to fetch channels from Slack');
        }
        
        // Store channels in database
        console.log(`Found ${result.channels.length} channels from Slack, storing in database...`);
        const channelsToCreate = result.channels
          .filter(channel => channel.id && channel.name)
          .map(channel => ({
            id: channel.id!,
            name: channel.name!,
            purpose: channel.purpose?.value || '',
            lastUpdated: new Date()
          }));

        if (channelsToCreate.length === 0) {
          return NextResponse.json({ channels: [] });
        }

        // Batch insert channels
        await prismaClient.channel.createMany({
          data: channelsToCreate,
          skipDuplicates: true
        });
        
        return NextResponse.json({ channels: channelsToCreate });
      } catch (error) {
        console.error('Error fetching channels from Slack:', error);
        throw error instanceof SlackError ? error : new SlackError('Failed to fetch channels from Slack');
      }
    }

    // Return basic channel info without summaries
    return NextResponse.json({
      channels: channels.map(channel => ({
        id: channel.id,
        name: channel.name,
        purpose: channel.purpose,
        lastUpdated: channel.lastUpdated
      }))
    });
  } catch (error) {
    console.error('Error in channels endpoint:', error);
    return handleError(error);
  } finally {
    try {
      await prismaClient.$disconnect();
    } catch (error) {
      console.error('Error disconnecting from database:', error);
    }
  }
}
