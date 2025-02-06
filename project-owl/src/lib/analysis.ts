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

function groupMessagesByDay(messages: any[]): Record<string, any[]> {
  const groupedMessages: Record<string, any[]> = {};
  
  messages.forEach(message => {
    const date = new Date(parseInt(message.ts) * 1000).toISOString().split('T')[0];
    if (!groupedMessages[date]) {
      groupedMessages[date] = [];
    }
    groupedMessages[date].push(message);
  });

  return groupedMessages;
}

export async function generateDailyRecap(messages: any[]): Promise<ChannelRecap> {
  try {
    const groupedMessages = groupMessagesByDay(messages);
    const dates = Object.keys(groupedMessages).sort().reverse(); // Sort in reverse chronological order
    
    const highlights: DailyHighlight[] = [];
    
    for (const date of dates) {
      const dayMessages = groupedMessages[date];
      const messageContent = JSON.stringify(dayMessages);
      
      const completion = await openai.chat.completions.create({
        messages: [
          {
            role: "system",
            content: `You are a helpful assistant that generates daily summaries from Slack messages. Focus on key updates, decisions, progress, and questions. Format the output as a JSON object with the following structure:
            {
              "summary": "Brief overview of the day's key points",
              "decisions": ["List of decisions made"],
              "progress": ["List of progress updates"],
              "questions": ["List of open questions"],
              "actionItems": ["List of action items"]
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
      let parsed;
      try {
        parsed = JSON.parse(content);
      } catch (e) {
        console.error('Error parsing OpenAI response:', e);
        continue;
      }

      highlights.push({
        date,
        summary: parsed.summary || '',
        decisions: parsed.decisions || [],
        progress: parsed.progress || [],
        questions: parsed.questions || [],
        actionItems: parsed.actionItems || [],
      });
    }

    return { highlights };
  } catch (error) {
    console.error('Error generating daily recap:', error);
    return {
      highlights: [],
      error: 'Failed to generate daily recap'
    };
  }
}

export async function extractActionItems(messages: any[]): Promise<ActionItem[]> {
  const messageContent = JSON.stringify(messages)
  const prompt = `Here are Slack messages. Please identify any action items, tasks, or to-dos mentioned:

${messageContent}

For each action item found, provide:
1. The task description
2. Who it's assigned to (if specified)
3. Due date (if specified)
4. Priority/urgency (if specified)`

  const completion = await openai.chat.completions.create({
    model: "o3-mini",
    messages: [
      {
        role: "system",
        content: "You are a helpful assistant that identifies action items from Slack messages.",
      },
      {
        role: "user",
        content: prompt
      }
    ],
    functions: [
      {
        name: "extract_actions",
        parameters: {
          type: "object",
          properties: {
            actions: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  description: { type: "string" },
                  assignee: { type: "string" },
                  dueDate: { type: "string", nullable: true },
                  priority: { type: "string", enum: ["high", "medium", "low"] },
                  status: { type: "string", enum: ["pending", "in_progress", "completed"] },
                  source: {
                    type: "object",
                    properties: {
                      messageTs: { type: "string" },
                      channelId: { type: "string" }
                    },
                    required: ["messageTs", "channelId"]
                  }
                },
                required: ["description", "assignee", "priority", "status", "source"]
              }
            }
          },
          required: ["actions"]
        }
      }
    ],
    function_call: { name: "extract_actions" }
  })

  const result = JSON.parse(completion.choices[0].message.function_call?.arguments || '{}')
  return result.actions
}

export async function detectRisks(messages: any[]): Promise<Risk[]> {
  const messageContent = JSON.stringify(messages)
  const prompt = `Here are Slack messages. Please identify any potential risks, concerns, or issues mentioned:

${messageContent}

For each risk found, provide:
1. Risk description
2. Potential impact
3. Suggested mitigation (if any was discussed)
4. Status (active/resolved)`

  const completion = await openai.chat.completions.create({
    model: "o3-mini",
    messages: [
      {
        role: "system",
        content: "You are a helpful assistant that identifies potential risks, concerns, or issues from Slack messages.",
      },
      {
        role: "user",
        content: prompt
      }
    ],
    functions: [
      {
        name: "detect_risks",
        parameters: {
          type: "object",
          properties: {
            risks: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  description: { type: "string" },
                  type: { type: "string", enum: ["deadline", "technical", "requirement", "resource", "other"] },
                  severity: { type: "string", enum: ["high", "medium", "low"] },
                  suggestedAction: { type: "string" },
                  relatedMessages: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        ts: { type: "string" },
                        channelId: { type: "string" }
                      },
                      required: ["ts", "channelId"]
                    }
                  }
                },
                required: ["description", "type", "severity", "suggestedAction", "relatedMessages"]
              }
            }
          },
          required: ["risks"]
        }
      }
    ],
    function_call: { name: "detect_risks" }
  })

  const result = JSON.parse(completion.choices[0].message.function_call?.arguments || '{}')
  return result.risks
}
