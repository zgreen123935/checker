import { WebClient } from '@slack/web-api';
import { z } from 'zod';

// Validation schemas
const channelSchema = z.object({
  id: z.string(),
  name: z.string(),
  purpose: z.object({
    value: z.string().optional()
  }).optional(),
});

const messageSchema = z.object({
  ts: z.string(),
  text: z.string(),
  user: z.string(),
  thread_ts: z.string().optional(),
});

export class SlackService {
  private client: WebClient;
  private static instance: SlackService;

  private constructor() {
    const token = process.env.SLACK_BOT_TOKEN;
    if (!token) {
      throw new Error('SLACK_BOT_TOKEN is not configured');
    }
    this.client = new WebClient(token);
  }

  public static getInstance(): SlackService {
    if (!SlackService.instance) {
      SlackService.instance = new SlackService();
    }
    return SlackService.instance;
  }

  async listChannels() {
    try {
      const result = await this.client.conversations.list({
        exclude_archived: true,
        types: 'public_channel,private_channel'
      });

      if (!result.ok || !result.channels) {
        throw new Error('Failed to fetch channels from Slack');
      }

      // Validate channel data
      const channels = result.channels.map(channel => {
        const parsed = channelSchema.safeParse(channel);
        if (!parsed.success) {
          console.error('Invalid channel data:', channel, parsed.error);
          return null;
        }
        return parsed.data;
      }).filter(Boolean);

      return channels;
    } catch (error) {
      console.error('Error fetching channels:', error);
      throw new Error('Failed to fetch channels from Slack');
    }
  }

  async getChannelMessages(channelId: string, limit = 100) {
    try {
      const result = await this.client.conversations.history({
        channel: channelId,
        limit
      });

      if (!result.ok || !result.messages) {
        throw new Error('Failed to fetch messages from Slack');
      }

      // Validate message data
      const messages = result.messages.map(message => {
        const parsed = messageSchema.safeParse(message);
        if (!parsed.success) {
          console.error('Invalid message data:', message, parsed.error);
          return null;
        }
        return parsed.data;
      }).filter(Boolean);

      return messages;
    } catch (error) {
      console.error('Error fetching messages:', error);
      throw new Error('Failed to fetch messages from Slack');
    }
  }

  // Add retry mechanism for rate limits
  private async retryWithBackoff<T>(
    operation: () => Promise<T>,
    maxRetries = 3,
    initialDelay = 1000
  ): Promise<T> {
    let currentTry = 0;
    let delay = initialDelay;

    while (currentTry < maxRetries) {
      try {
        return await operation();
      } catch (error: any) {
        if (error?.data?.error === 'rate_limited') {
          currentTry++;
          if (currentTry === maxRetries) throw error;
          
          await new Promise(resolve => setTimeout(resolve, delay));
          delay *= 2; // Exponential backoff
          continue;
        }
        throw error;
      }
    }
    throw new Error('Max retries reached');
  }
}
