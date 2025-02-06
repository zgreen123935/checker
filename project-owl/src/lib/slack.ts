import { WebClient } from '@slack/web-api'

if (!process.env.SLACK_BOT_TOKEN) {
  throw new Error('SLACK_BOT_TOKEN is not set in environment variables')
}

export const slack = new WebClient(process.env.SLACK_BOT_TOKEN)

export async function getChannelMessages(channelId: string): Promise<any[]> {
  try {
    // Get messages from the last 2 weeks
    const twoWeeksAgo = Math.floor((Date.now() - 14 * 24 * 60 * 60 * 1000) / 1000);
    console.log('Fetching messages since:', new Date(twoWeeksAgo * 1000).toISOString());
    
    const result = await slack.conversations.history({
      channel: channelId,
      limit: 200,
      oldest: twoWeeksAgo.toString(),
      inclusive: true
    });

    if (!result.messages?.length) {
      return [];
    }

    // Get unique user IDs from messages
    const userIds = new Set(result.messages.map(msg => msg.user).filter(Boolean));
    
    // Fetch user info for all users in parallel
    const userInfos = await Promise.all(
      Array.from(userIds).map(async userId => {
        try {
          const userResult = await slack.users.info({ user: userId });
          return userResult.user;
        } catch (error) {
          console.error(`Error fetching user info for ${userId}:`, error);
          return null;
        }
      })
    );

    // Create a map of user IDs to usernames
    const userMap = new Map(
      userInfos
        .filter(Boolean)
        .map(user => [user.id, user.profile.display_name || user.name])
    );

    // Enhance messages with user info
    const enhancedMessages = result.messages.map(msg => ({
      ...msg,
      username: msg.user ? userMap.get(msg.user) || msg.user : 'Unknown User'
    }));

    console.log('Retrieved', enhancedMessages.length, 'messages');
    if (enhancedMessages.length) {
      console.log('First message:', new Date(parseInt(enhancedMessages[0].ts) * 1000).toISOString());
      console.log('Last message:', new Date(parseInt(enhancedMessages[enhancedMessages.length - 1].ts) * 1000).toISOString());
    }

    return enhancedMessages;
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
