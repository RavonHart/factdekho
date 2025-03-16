'use client'
import React from 'react'
import ChatInterface from './components/ChatInterface'

export default function Home() {
  return (
    <main className="min-h-screen bg-white">
      <div className="container mx-auto py-8">
        <h1 className="text-4xl font-bold text-center mb-8">
          AI Fact-Checking Assistant
        </h1>
        <p className="text-center text-gray-600 mb-8">
          Enter any claim or statement to analyze its credibility and accuracy
        </p>
        <ChatInterface />
      </div>
    </main>
  )
} 