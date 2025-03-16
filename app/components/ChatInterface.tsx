'use client'

import React, { useRef, useState } from 'react'
import ReactMarkdown from 'react-markdown'
import { useChat } from 'ai/react'

export default function ChatInterface() {
  const { messages, input, handleInputChange, handleSubmit } = useChat({
    api: '/api/chat',
  })
  const formRef = useRef<HTMLFormElement>(null)
  const [isAnalyzing, setIsAnalyzing] = useState(false)

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsAnalyzing(true)
    try {
      await handleSubmit(e)
    } finally {
      setIsAnalyzing(false)
    }
  }

  return (
    <div className="flex flex-col w-full max-w-2xl mx-auto p-4 space-y-4">
      <div className="flex flex-col space-y-4 mb-4">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${
              message.role === 'assistant'
                ? 'bg-blue-100 flex-row'
                : 'bg-gray-100 flex-row-reverse'
            } rounded-lg p-4`}
          >
            <div className="flex-shrink-0 w-8 h-8">
              {message.role === 'assistant' ? '🤖' : '👤'}
            </div>
            <div className="flex-grow px-4">
              <ReactMarkdown>{message.content}</ReactMarkdown>
            </div>
          </div>
        ))}
      </div>

      <form onSubmit={onSubmit} ref={formRef} className="flex flex-col space-y-4">
        <textarea
          className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="Enter text to analyze..."
          rows={4}
          value={input}
          onChange={handleInputChange}
        />
        <button
          type="submit"
          disabled={isAnalyzing || !input.trim()}
          className={`px-4 py-2 rounded-lg text-white ${
            isAnalyzing || !input.trim()
              ? 'bg-gray-400'
              : 'bg-blue-500 hover:bg-blue-600'
          }`}
        >
          {isAnalyzing ? 'Analyzing...' : 'Analyze'}
        </button>
      </form>
    </div>
  )
} 