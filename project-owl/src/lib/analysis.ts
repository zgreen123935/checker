import { OpenAI } from 'openai'
import { WebClient } from '@slack/web-api'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

interface ChannelRecap {
  highlights: DailyHighlight[];
  error?: string;
}

interface DailyHighlight {
  date: string;
  summary: string;
  decisions: string[];
  progress: string[];
  questions: string[];
  actionItems: string[];
  risks: string[];
}

interface ActionItem {
  description: string
  assignee: string
  dueDate: string | null
  priority: 'high' | 'medium' | 'low'
  status: 'pending' | 'in_progress' | 'completed'
  source: {
    messageTs: string
    channelId: string
  }
}

interface Risk {
  description: string
  type: 'deadline' | 'technical' | 'requirement' | 'resource' | 'other'
  severity: 'high' | 'medium' | 'low'
  suggestedAction: string
  relatedMessages: {
    ts: string
    channelId: string
  }[]
}

interface ProcessedMessage {
  text: string;
  username: string;
  timestamp: string;
}

function groupMessagesByDay(messages: any[]): Record<string, any[]> {
  const groupedMessages: Record<string, any[]> = {};
  
  messages.forEach(message => {
    const date = new Date(parseInt(message.ts) * 1000).toISOString().split('T')[0];
    if (!groupedMessages[date]) {
      groupedMessages[date] = [];
    }
    groupedMessages[date].push(message);
  });

  console.log('Grouped messages by day:', Object.keys(groupedMessages));
  return groupedMessages;
}

function preprocessMessages(messages: any[]): ProcessedMessage[] {
  return messages
    .filter(msg => msg.text && msg.text.trim()) // Remove empty messages
    .map(msg => {
      // Replace user IDs in text with usernames
      let processedText = msg.text;
      const userMentionRegex = /<@([A-Z0-9]+)>/g;
      processedText = processedText.replace(userMentionRegex, (match, userId) => {
        return `@${msg.username || 'unknown'}`;
      });

      return {
        text: processedText,
        username: msg.username || 'unknown',
        timestamp: new Date(parseInt(msg.ts) * 1000).toISOString()
      };
    });
}

export async function generateDailyRecap(messages: any[]): Promise<ChannelRecap> {
  try {
    console.log('Starting daily recap generation with', messages.length, 'messages');
    const groupedMessages = groupMessagesByDay(messages);
    const dates = Object.keys(groupedMessages).sort().reverse();
    console.log('Processing dates:', dates);
    
    const highlights: DailyHighlight[] = [];
    
    for (const date of dates) {
      const dayMessages = groupedMessages[date];
      console.log('Processing', dayMessages.length, 'messages for date:', date);
      
      // Preprocess messages to only include necessary information
      const processedMessages = preprocessMessages(dayMessages);
      const messageContent = JSON.stringify(processedMessages);

      const completion = await openai.chat.completions.create({
        messages: [
          {
            role: "system",
            content: `You are a helpful assistant that generates daily summaries from Slack messages. Focus on key updates, decisions, progress, and questions. When referring to users, always use their username (prefixed with @). Format the output as a JSON object with the following structure:
            {
              "summary": "Brief overview of the day's key points",
              "decisions": ["List of decisions made"],
              "progress": ["List of progress updates"],
              "questions": ["List of open questions"]
            }`,
          },
          {
            role: "user",
            content: `Here are Slack messages from ${date}. Please generate a summary that captures the key points of the day:

${messageContent}`,
          },
        ],
        model: "o3-mini",
      });

      const content = completion.choices[0].message.content || '';
      console.log('OpenAI response for date', date, ':', content);
      let parsed;
      try {
        parsed = JSON.parse(content);
      } catch (e) {
        console.error('Error parsing OpenAI response for date', date, ':', e);
        continue;
      }

      // Get action items and risks
      const [actionItems, risks] = await Promise.all([
        extractActionItems(processedMessages),
        detectRisks(processedMessages)
      ]);

      highlights.push({
        date,
        summary: parsed.summary || '',
        decisions: parsed.decisions || [],
        progress: parsed.progress || [],
        questions: parsed.questions || [],
        actionItems: actionItems || [],
        risks: risks || []
      });
    }

    console.log('Generated highlights:', highlights);
    return { highlights };
  } catch (error) {
    console.error('Error generating daily recap:', error);
    return {
      highlights: [],
      error: 'Failed to generate daily recap'
    };
  }
}

export async function extractActionItems(messages: ProcessedMessage[]): Promise<string[]> {
  try {
    console.log('Extracting action items from messages:', messages.length);
    const completion = await openai.chat.completions.create({
      messages: [
        {
          role: "system",
          content: `You are a helpful assistant that extracts action items and tasks from Slack messages. When referring to users, use their username (prefixed with @). Return the list as a JSON array of strings. Look for tasks that are assigned, mentioned, or implied in the conversation.`,
        },
        {
          role: "user",
          content: `Here are the Slack messages. Please extract any action items or tasks mentioned:

${JSON.stringify(messages)}`,
        },
      ],
      model: "o3-mini",
    });

    const content = completion.choices[0].message.content || '[]';
    console.log('OpenAI response for action items:', content);
    const actionItems = JSON.parse(content);
    console.log('Parsed action items:', actionItems);
    return actionItems;
  } catch (error) {
    console.error('Error extracting action items:', error);
    return [];
  }
}

export async function detectRisks(messages: ProcessedMessage[]): Promise<string[]> {
  try {
    const completion = await openai.chat.completions.create({
      messages: [
        {
          role: "system",
          content: `You are a helpful assistant that identifies potential risks, blockers, or concerns from Slack messages. When referring to users, use their username (prefixed with @). Return the list as a JSON array of strings.`,
        },
        {
          role: "user",
          content: `Here are the Slack messages. Please identify any potential risks, blockers, or concerns mentioned:

${JSON.stringify(messages)}`,
        },
      ],
      model: "o3-mini",
    });

    const content = completion.choices[0].message.content || '[]';
    return JSON.parse(content);
  } catch (error) {
    console.error('Error detecting risks:', error);
    return [];
  }
}
