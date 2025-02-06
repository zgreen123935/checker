import { OpenAI } from 'openai'
import { WebClient } from '@slack/web-api'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

interface ChannelRecap {
  summary: string
  decisions: string[]
  progress: string[]
  questions: string[]
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

export async function generateDailyRecap(messages: any[]): Promise<ChannelRecap> {
  const messageContent = JSON.stringify(messages)
  const prompt = `Here are today's Slack messages from the channel. Please generate a summary that includes:
1. Key updates and progress
2. Important decisions made
3. Open questions or blockers
4. Action items (if any)

Messages:
${messageContent}`

  const completion = await openai.chat.completions.create({
    model: "o3-mini",
    messages: [
      {
        role: "system",
        content: "You are a helpful assistant that generates daily summaries from Slack messages. Focus on key updates, decisions, progress, and questions.",
      },
      {
        role: "user",
        content: prompt
      }
    ],
    functions: [
      {
        name: "create_recap",
        parameters: {
          type: "object",
          properties: {
            summary: { 
              type: "string",
              description: "A plain text summary of the day's activities"
            },
            decisions: { 
              type: "array", 
              items: { type: "string" },
              description: "List of key decisions made"
            },
            progress: { 
              type: "array", 
              items: { type: "string" },
              description: "List of progress updates"
            },
            questions: { 
              type: "array", 
              items: { type: "string" },
              description: "List of unresolved questions"
            }
          },
          required: ["summary", "decisions", "progress", "questions"]
        }
      }
    ],
    function_call: { name: "create_recap" }
  })

  const result = JSON.parse(completion.choices[0].message.function_call?.arguments || '{}')
  
  // Ensure the summary is a string
  if (typeof result.summary !== 'string') {
    result.summary = JSON.stringify(result.summary)
  }
  
  // Ensure arrays contain only strings
  result.decisions = (result.decisions || []).map(d => String(d))
  result.progress = (result.progress || []).map(p => String(p))
  result.questions = (result.questions || []).map(q => String(q))
  
  return result as ChannelRecap
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
