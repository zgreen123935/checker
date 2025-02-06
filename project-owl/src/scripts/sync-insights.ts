import { prisma } from '../lib/db'
import { getChannelMessages, postMessage } from '../lib/slack'
import { generateInsights } from '../lib/openai'

async function syncInsights() {
  try {
    const projects = await prisma.project.findMany()

    for (const project of projects) {
      console.log(`Processing project: ${project.name}`)

      // Get the latest insight timestamp
      const latestInsight = await prisma.insight.findFirst({
        where: { projectId: project.id },
        orderBy: { lastMessage: 'desc' },
      })

      // Fetch new messages since last insight
      const messages = await getChannelMessages(
        project.channelId,
        latestInsight?.lastMessage.toISOString()
      )

      if (messages.length === 0) {
        console.log('No new messages to process')
        continue
      }

      // Generate insights from messages
      const insights = await generateInsights(messages)

      // Create new insight record
      const newInsight = await prisma.insight.create({
        data: {
          projectId: project.id,
          recap: insights.recap,
          risks: insights.risks,
          context: insights.context,
          lastMessage: new Date(
            Number(messages[0].ts) * 1000
          ),
        },
      })

      // Parse and create tasks
      const actionItems = insights.actionItems
        .split('\n')
        .filter(Boolean)
        .map((item) => {
          const match = item.match(/- (.+?) \((@\w+)(?:, due: (.+?))?\)/)
          if (!match) return null

          const [, description, assignee, dueDate] = match
          return {
            description,
            assignee: assignee.replace('@', ''),
            dueDate: dueDate ? new Date(dueDate) : null,
          }
        })
        .filter(Boolean)

      for (const item of actionItems) {
        await prisma.task.create({
          data: {
            projectId: project.id,
            description: item.description,
            assignee: item.assignee,
            dueDate: item.dueDate,
          },
        })
      }

      // Post summary to Slack
      const summary = `
*Daily Project Update*
${insights.recap}

*Risks & Blockers*
${insights.risks || 'No risks identified'}

*Action Items*
${insights.actionItems || 'No action items identified'}
`

      await postMessage(project.channelId, summary)
      console.log(`Processed ${messages.length} messages for ${project.name}`)
    }
  } catch (error) {
    console.error('Error in sync process:', error)
  } finally {
    await prisma.$disconnect()
  }
}

// Run the sync
syncInsights()
