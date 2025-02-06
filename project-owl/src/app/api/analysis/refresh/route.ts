import { NextResponse } from 'next/server'
import { WebClient } from '@slack/web-api'
import { generateDailyRecap, extractActionItems, detectRisks } from '@/lib/analysis'

const slack = new WebClient(process.env.SLACK_BOT_TOKEN)

export async function POST(request: Request) {
  try {
    const { channelId } = await request.json()
    
    if (!channelId) {
      return NextResponse.json({ error: 'Channel ID is required' }, { status: 400 })
    }

    const yesterday = new Date()
    yesterday.setDate(yesterday.getDate() - 1)
    const startOfYesterday = new Date(yesterday.setHours(0, 0, 0, 0))

    const messagesResult = await slack.conversations.history({
      channel: channelId,
      oldest: String(startOfYesterday.getTime() / 1000),
      inclusive: true
    })

    if (!messagesResult.messages || messagesResult.messages.length === 0) {
      return NextResponse.json({
        channelId,
        summary: null,
        decisions: [],
        progress: [],
        questions: [],
        actionItems: [],
        risks: []
      })
    }

    const [summary, actionItems, risks] = await Promise.all([
      generateDailyRecap(messagesResult.messages),
      extractActionItems(messagesResult.messages),
      detectRisks(messagesResult.messages)
    ])

    const analysis = {
      channelId,
      summary,
      decisions: [],
      progress: [],
      questions: [],
      actionItems,
      risks
    }

    return NextResponse.json(analysis)
  } catch (error) {
    console.error('Error in refresh analysis API:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    )
  }
}
