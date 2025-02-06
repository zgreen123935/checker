import { NextResponse } from 'next/server'
import { WebClient } from '@slack/web-api'
import { analyzeChannelMessages, RawSlackMessage } from '@/lib/openai'
import prisma from '@/lib/prisma'

const slack = new WebClient(process.env.SLACK_BOT_TOKEN)

if (!process.env.SLACK_BOT_TOKEN) {
  throw new Error('SLACK_BOT_TOKEN is not set')
}

export async function POST(request: Request) {
  try {
    const { channelId } = await request.json()
    console.log(' [Refresh] Starting analysis refresh for channel:', channelId)

    if (!channelId) {
      return NextResponse.json({ error: 'Channel ID is required' }, { status: 400 })
    }

    // First, fetch channel info to get the name
    console.log(' [Slack] Fetching channel info:', channelId)
    const channelInfo = await slack.conversations.info({ channel: channelId })
    if (!channelInfo.ok || !channelInfo.channel) {
      throw new Error('Failed to fetch channel info')
    }

    console.log(' [Slack] Fetching messages for channel:', channelId)
    const result = await slack.conversations.history({
      channel: channelId,
      limit: 100,
    })

    if (!result.ok) {
      throw new Error('Failed to fetch messages from Slack')
    }

    if (!result.messages || result.messages.length === 0) {
      console.log(' [Slack] No messages found for channel:', channelId)
      return NextResponse.json({ error: 'No messages found' }, { status: 404 })
    }

    console.log(' [OpenAI] Starting analysis')
    const analysis = await analyzeChannelMessages(result.messages as RawSlackMessage[])
    console.log(' [OpenAI] Analysis completed, data:', analysis)

    // Create/update the channel first
    console.log(' [DB Save] Creating/updating channel')
    await prisma.channel.upsert({
      where: { id: channelId },
      create: { 
        id: channelId,
        name: channelInfo.channel.name || 'Unknown Channel',
      },
      update: {
        name: channelInfo.channel.name || 'Unknown Channel',
        lastUpdated: new Date(),
      },
    })

    console.log(' [DB Save] Storing analysis in database')
    const updatedAnalysis = await prisma.analysis.upsert({
      where: {
        channelId: channelId,
      },
      create: {
        channelId: channelId,
        summary: analysis.summary || '',
        actionItems: analysis.actionItems || [],
        risks: analysis.risks || [],
        decisions: analysis.decisions || [],
      },
      update: {
        summary: analysis.summary || '',
        actionItems: analysis.actionItems || [],
        risks: analysis.risks || [],
        decisions: analysis.decisions || [],
        lastUpdated: new Date(),
      },
    })

    console.log(' [DB Save] Analysis stored in database')
    return NextResponse.json(updatedAnalysis)

  } catch (error) {
    console.error(' [Error] Error in analysis refresh:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to refresh analysis' },
      { status: 500 }
    )
  }
}
