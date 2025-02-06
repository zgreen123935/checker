import OpenAI from 'openai'

if (!process.env.OPENAI_API_KEY) {
  throw new Error('OPENAI_API_KEY is not set in environment variables')
}

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

export async function generateInsights(messages: any[]) {
  try {
    const messageText = messages
      .map((msg) => `${msg.user}: ${msg.text}`)
      .join('\n')

    const prompt = `Analyze the following Slack conversation and provide:
1. A concise recap of the key points discussed
2. Any identified risks or blockers
3. A list of action items with assignees (if mentioned)
4. Updated project context based on the discussion

Conversation:
${messageText}`

    const completion = await openai.chat.completions.create({
      messages: [
        {
          role: 'system',
          content: 'You are a helpful assistant.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      model: 'o3-mini',
    })

    const response = completion.choices[0].message.content

    // Parse the response into sections
    const sections = response.split('\n\n')
    return {
      recap: sections[0]?.replace('Recap:', '').trim() || '',
      risks: sections[1]?.replace('Risks:', '').trim() || '',
      actionItems: sections[2]?.replace('Action Items:', '').trim() || '',
      context: sections[3]?.replace('Project Context:', '').trim() || '',
    }
  } catch (error) {
    console.error('Error generating insights:', error)
    throw error
  }
}
