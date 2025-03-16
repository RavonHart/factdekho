'use client'
import React, { useState } from 'react'
import { analyzeContent } from '../utils/factChecker'

interface AnalysisResult {
  credibilityScore: number
  analysis: string
  sources: string[]
  correction: string
  isTrue: boolean
}

export default function FactChecker() {
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<AnalysisResult | null>(null)

  const handleAnalyze = async () => {
    if (!input.trim()) return
    
    setLoading(true)
    try {
      const result = await analyzeContent(input)
      setResult(result)
    } catch (error) {
      console.error('Error analyzing content:', error)
      // You could add error handling UI here
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="mb-6">
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          className="w-full h-32 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
          placeholder="Enter the text you want to verify..."
        />
      </div>

      <div className="flex justify-center">
        <button
          onClick={handleAnalyze}
          disabled={loading || !input.trim()}
          className={`px-6 py-2 rounded-lg transition-colors ${
            loading || !input.trim()
              ? 'bg-gray-400 cursor-not-allowed'
              : 'bg-indigo-600 hover:bg-indigo-700 text-white'
          }`}
        >
          {loading ? 'Analyzing...' : 'Analyze'}
        </button>
      </div>

      {result && (
        <div className="mt-8">
          <div className="bg-gray-50 rounded-lg p-6">
            <div className="flex items-center mb-4">
              <div className={`w-16 h-16 rounded-full flex items-center justify-center ${
                result.isTrue ? 'bg-green-100' : 'bg-red-100'
              }`}>
                <span className="text-2xl">{result.isTrue ? '✓' : '✗'}</span>
              </div>
              <div className="ml-4">
                <h3 className="text-xl font-semibold">Credibility Score</h3>
                <div className={`text-3xl font-bold ${
                  result.credibilityScore > 70 ? 'text-green-600' : 'text-red-600'
                }`}>
                  {result.credibilityScore}%
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <h4 className="font-medium text-gray-700">Analysis</h4>
                <p className="text-gray-600">{result.analysis}</p>
              </div>

              <div>
                <h4 className="font-medium text-gray-700">Supporting Evidence</h4>
                <ul className="list-disc list-inside text-gray-600">
                  {result.sources.map((source, index) => (
                    <li key={index}>{source}</li>
                  ))}
                </ul>
              </div>

              <div>
                <h4 className="font-medium text-gray-700">Suggested Correction</h4>
                <p className="text-gray-600">{result.correction}</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
} 