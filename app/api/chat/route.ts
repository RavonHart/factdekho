export async function POST(req: Request) {
  try {
    const { messages } = await req.json()

    // Format messages for Groq API
    const formattedMessages = messages.map((msg: any) => ({
      role: msg.role,
      content: msg.content
    }))

    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.GROQ_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messages: [
          {
            role: 'system',
            content: `You are a precise and thorough fact-checking assistant. For each claim, provide a structured analysis following this format:

### Claim Analysis
[Restate the claim being analyzed]

### Verdict
[Clear verdict: True, False, Partially True, Misleading, or Unverifiable]

### Evidence
- [List specific facts, data, or sources that support or contradict the claim]
- [Include dates, numbers, and specific details when available]
- [Cite reputable sources where possible]

### Context
[Provide important background or context that helps understand the full picture]

### Common Misconceptions
[If relevant, address any related misconceptions or frequent misunderstandings]

### Conclusion
[Summarize the analysis and explain the verdict]

Remember to:
- Be objective and avoid bias
- Use clear, precise language
- Indicate certainty levels when appropriate
- Highlight any limitations in available evidence
- Use markdown formatting for readability
- Address any potential misinformation directly

If a claim contains multiple parts, analyze each part separately.`
          },
          ...formattedMessages
        ],
        model: 'mixtral-8x7b-32768',
        stream: true,
        temperature: 0.3,
        max_tokens: 4096,
      }),
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      console.error('Groq API error:', {
        status: response.status,
        statusText: response.statusText,
        error: errorData
      })
      throw new Error(`Groq API error: ${response.statusText}`)
    }

    return new Response(response.body, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    })
  } catch (error) {
    console.error('API error:', error)
    return new Response(JSON.stringify({ 
      error: 'Failed to analyze content',
      details: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    })
  }
} 