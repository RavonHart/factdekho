import { NextResponse } from 'next/server'
import OpenAI from 'openai'
import { GoogleGenerativeAI } from '@google/generative-ai'
import { config } from '../../config/env'

// Initialize AI clients with validation
const openai = new OpenAI({
  apiKey: config.openai.apiKey
})

const genAI = new GoogleGenerativeAI(config.gemini.apiKey)
const geminiModel = genAI.getGenerativeModel({ model: 'gemini-pro' })

async function analyzeWithGPT(text: string) {
  const completion = await openai.chat.completions.create({
    messages: [
      {
        role: "system",
        content: "You are a fact-checking AI assistant. Analyze claims objectively and provide evidence-based responses."
      },
      {
        role: "user",
        content: getPrompt(text)
      }
    ],
    model: "gpt-3.5-turbo",
    response_format: { type: "json_object" }
  })

  const content = completion.choices[0].message.content
  if (!content) throw new Error('No response from OpenAI')
  return JSON.parse(content)
}

async function analyzeWithGemini(text: string) {
  try {
    const prompt = `You are a fact-checking AI assistant. ${getPrompt(text)}
    Important: Your response must be a valid JSON string that can be parsed.`

    const result = await geminiModel.generateContent(prompt)
    const response = await result.response
    const content = response.text()
    
    // Ensure we get valid JSON from Gemini
    try {
      return JSON.parse(content)
    } catch (parseError) {
      console.error('Invalid JSON from Gemini:', content)
      throw new Error('Invalid JSON response from Gemini')
    }
  } catch (error) {
    console.error('Gemini API error:', error)
    throw error
  }
}

function getPrompt(text: string) {
  return `Please fact-check the following statement and provide a detailed analysis. Statement: "${text}"

  Analyze the following aspects:
  1. Credibility score (0-100)
  2. Factual accuracy
  3. Supporting evidence or contradicting facts
  4. Potential corrections if needed
  5. Sources that verify or dispute the claim

  Format your response as a JSON object with the following structure:
  {
    "credibilityScore": number,
    "analysis": "detailed analysis",
    "sources": ["source1", "source2"],
    "correction": "correction if needed",
    "isTrue": boolean
  }`
}

// Enhanced fallback analysis
function getFallbackAnalysis(text: string) {
  // Advanced text analysis
  const hasExclamations = text.includes('!!!')
  const hasSensationalWords = /\b(SHOCKING|INCREDIBLE|AMAZING|MIRACLE|UNBELIEVABLE|REVOLUTIONARY|BREAKTHROUGH)\b/i.test(text)
  const hasUrls = /https?:\/\//.test(text)
  const wordCount = text.split(' ').length
  const hasNumbers = /\d/.test(text)
  const hasCitations = /\b(?:according to|researchers|study|studies|experts|scientists|published|journal|university|institute)\b/i.test(text)
  const hasStats = /\b\d+(?:\.\d+)?%|\b(?:increase|decrease|ratio|percentage|rate)\b/i.test(text)
  const hasQuotes = /"[^"]*"/g.test(text)
  const hasDateReferences = /\b(?:in \d{4}|yesterday|today|last \w+|this \w+|recent(?:ly)?)\b/i.test(text)
  const hasVagueClaims = /\b(?:many people|everyone knows|they say|some say|people are saying)\b/i.test(text)
  
  // Calculate detailed score
  let score = 50 // Start with neutral score
  
  // Content structure factors
  if (wordCount < 10) score -= 10 // Too short to be detailed
  if (wordCount > 20) score += 10 // More detailed explanation
  if (hasVagueClaims) score -= 15 // Vague attributions
  
  // Credibility indicators
  if (hasCitations) score += 15 // Academic/research references
  if (hasStats) score += 10 // Statistical data
  if (hasDateReferences) score += 5 // Temporal context
  if (hasQuotes) score += 5 // Direct quotations
  if (hasUrls) score += 10 // Links to sources
  
  // Red flags
  if (hasExclamations) score -= 20 // Sensational punctuation
  if (hasSensationalWords) score -= 25 // Hyperbolic language
  
  // Evidence factors
  if (hasNumbers && hasCitations) score += 10 // Quantified claims with sources
  
  // Clamp score between 0 and 100
  score = Math.max(0, Math.min(100, score))
  
  const isTrue = score > 60
  const confidenceLevel = score >= 80 ? "high" : score >= 60 ? "moderate" : "low"

  // Generate detailed analysis
  const redFlags: string[] = []
  if (hasExclamations) redFlags.push("Uses excessive exclamation marks, which is uncommon in factual reporting")
  if (hasSensationalWords) redFlags.push("Contains sensational or hyperbolic language")
  if (hasVagueClaims) redFlags.push("Uses vague or unattributed claims")
  if (wordCount < 10) redFlags.push("Lacks sufficient detail or context")

  const positiveIndicators: string[] = []
  if (hasCitations) positiveIndicators.push("References credible sources or experts")
  if (hasStats) positiveIndicators.push("Includes specific statistical data")
  if (hasDateReferences) positiveIndicators.push("Provides temporal context")
  if (hasUrls) positiveIndicators.push("Contains links to source material")

  const analysis = `Analysis confidence: ${confidenceLevel}. ${
    redFlags.length > 0 
      ? `Potential issues identified: ${redFlags.join("; ")}. `
      : ""
  }${
    positiveIndicators.length > 0
      ? `Credibility indicators: ${positiveIndicators.join("; ")}. `
      : ""
  }Overall credibility assessment: ${
    isTrue 
      ? "The statement demonstrates characteristics of credible information."
      : "The statement shows multiple signs of potential misinformation."
  }`

  return {
    credibilityScore: score,
    analysis: analysis,
    sources: isTrue 
      ? [
          "Linguistic pattern analysis indicates professional/academic writing style",
          "Content structure follows established fact-based reporting patterns",
          positiveIndicators.length > 0 ? `Positive indicators: ${positiveIndicators.join(", ")}` : "Limited but acceptable credibility markers"
        ]
      : [
          redFlags.length > 0 ? `Warning signs: ${redFlags.join(", ")}` : "Multiple credibility concerns detected",
          "Content structure deviates from fact-based reporting standards",
          "Lacks sufficient verification elements"
        ],
    correction: isTrue
      ? "While the core information appears credible, consider: " +
        "1. Adding specific citations to strengthen claims\n" +
        "2. Including more statistical data if available\n" +
        "3. Linking to primary sources"
      : "To improve credibility, consider: " +
        "1. Removing sensational language\n" +
        "2. Adding specific citations and sources\n" +
        "3. Including verifiable data and statistics\n" +
        "4. Using more measured and objective tone",
    isTrue: isTrue
  }
}

export async function POST(req: Request) {
  try {
    const { text } = await req.json()

    // Try each AI model in sequence
    try {
      console.log('Attempting OpenAI analysis...')
      const gptResult = await analyzeWithGPT(text)
      console.log('OpenAI analysis successful')
      return NextResponse.json({ ...gptResult, model: 'gpt' })
    } catch (gptError) {
      console.error('OpenAI Error Details:', {
        error: gptError.message,
        status: gptError.status,
        type: gptError.type
      })
      
      try {
        console.log('Attempting Gemini analysis...')
        const geminiResult = await analyzeWithGemini(text)
        console.log('Gemini analysis successful')
        return NextResponse.json({ ...geminiResult, model: 'gemini' })
      } catch (geminiError) {
        console.error('Gemini Error Details:', {
          error: geminiError.message,
          status: geminiError.status,
          type: geminiError.type
        })
        
        console.log('Using fallback analysis...')
        const fallbackResult = getFallbackAnalysis(text)
        return NextResponse.json({ ...fallbackResult, model: 'fallback' })
      }
    }
  } catch (error) {
    console.error('General Error:', error)
    return NextResponse.json(
      { error: 'Failed to analyze content', details: error.message },
      { status: 500 }
    )
  }
} 