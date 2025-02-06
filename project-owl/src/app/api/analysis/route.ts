import { NextResponse } from 'next/server'
import { WebClient } from '@slack/web-api'
import { generateDailyRecap, extractActionItems, detectRisks } from '@/lib/analysis'

const slack = new WebClient(process.env.SLACK_BOT_TOKEN)

export async function GET() {
  try {
    const projectChannels = process.env.PROJECT_CHANNELS || ''
    const channelIds = projectChannels
      .split(',')
      .map(entry => entry.split('=')[1])
      .filter(Boolean)

    const yesterday = new Date()
    yesterday.setDate(yesterday.getDate() - 1)
    const startOfYesterday = new Date(yesterday.setHours(0, 0, 0, 0))

    const results = await Promise.all(channelIds.map(async (channelId) => {
      try {
        const messagesResult = await slack.conversations.history({
          channel: channelId,
          oldest: String(startOfYesterday.getTime() / 1000),
          inclusive: true
        })

        if (!messagesResult.messages || messagesResult.messages.length === 0) {
          return {
            channelId,
            summary: null,
            decisions: [],
            progress: [],
            questions: [],
            actionItems: [],
            risks: []
          }
        }

        const [summary, actionItems, risks] = await Promise.all([
          generateDailyRecap(messagesResult.messages),
          extractActionItems(messagesResult.messages),
          detectRisks(messagesResult.messages)
        ])

        return {
          channelId,
          summary,
          decisions: [],
          progress: [],
          questions: [],
          actionItems,
          risks
        }
      } catch (error) {
        console.error(`Error analyzing channel ${channelId}:`, error)
        return {
          channelId,
          error: error instanceof Error ? error.message : 'Unknown error'
        }
      }
    }))

    return NextResponse.json(results)
  } catch (error) {
    console.error('Error in analysis API:', error)
    return NextResponse.json([], { status: 500 })
  }
}

// POST endpoint for manual analysis of specific channels and date ranges
export async function POST(req: Request) {
  try {
    const { channelIds, startTime, endTime } = await req.json()

    const results = await Promise.all(channelIds.map(async (channelId: string) => {
      try {
        const messagesResult = await slack.conversations.history({
          channel: channelId,
          oldest: String(startTime.getTime() / 1000),
          latest: String(endTime.getTime() / 1000),
          inclusive: true
        })

        if (!messagesResult.messages || messagesResult.messages.length === 0) {
          return {
            channelId,
            summary: null,
            decisions: [],
            progress: [],
            questions: [],
            actionItems: [],
            risks: []
          }
        }

        const [summary, actionItems, risks] = await Promise.all([
          generateDailyRecap(messagesResult.messages),
          extractActionItems(messagesResult.messages),
          detectRisks(messagesResult.messages)
        ])

        return {
          channelId,
          summary,
          decisions: [],
          progress: [],
          questions: [],
          actionItems,
          risks
        }
      } catch (error) {
        console.error(`Error analyzing channel ${channelId}:`, error)
        return {
          channelId,
          error: error instanceof Error ? error.message : 'Unknown error'
        }
      }
    }))

    return NextResponse.json(results)
  } catch (error) {
    console.error('Error in analysis API:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    )
  }
}
