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
  const prompt = `Analyze these Slack messages and create a daily recap. Focus on:
1. Key decisions made
2. Progress updates
3. Unresolved questions or concerns

Provide a clear summary in plain text, and list out decisions, progress updates, and questions.

Messages: ${JSON.stringify(messages)}`

  const completion = await openai.chat.completions.create({
    model: "gpt-4",
    messages: [
      {
        role: "system",
        content: "You are a project management assistant analyzing Slack conversations. Be concise and factual. Always return a text summary and arrays of strings for decisions, progress, and questions."
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
  const prompt = `Analyze these Slack messages and extract action items. For each action item, identify:
1. The task description
2. Who it's assigned to
3. Due date (if mentioned)
4. Priority level based on context
Messages: ${JSON.stringify(messages)}`

  const completion = await openai.chat.completions.create({
    model: "gpt-4",
    messages: [
      {
        role: "system",
        content: "You are a project management assistant extracting action items from Slack conversations."
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
  const prompt = `Analyze these Slack messages and identify potential risks or blockers. Consider:
1. Missed or at-risk deadlines
2. Technical blockers
3. Unclear requirements
4. Resource constraints
5. Repeated concerns
Messages: ${JSON.stringify(messages)}`

  const completion = await openai.chat.completions.create({
    model: "gpt-4",
    messages: [
      {
        role: "system",
        content: "You are a project management assistant identifying risks and blockers in Slack conversations."
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
