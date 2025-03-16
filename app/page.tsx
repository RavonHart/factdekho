'use client'
import React from 'react'
import FactChecker from './components/FactChecker'

export default function Home() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-8">
      <div className="max-w-4xl mx-auto">
        <header className="text-center mb-12">
          <h1 className="text-4xl font-bold text-indigo-900 mb-4">FachDekho</h1>
          <p className="text-lg text-gray-600">Your AI-Powered Fact-Checking Assistant</p>
        </header>

        <div className="bg-white rounded-lg shadow-xl p-6">
          <FactChecker />
        </div>

        <footer className="mt-8 text-center text-gray-500 text-sm">
          <p>Built with AI for accurate information verification</p>
        </footer>
      </div>
    </main>
  )
} 