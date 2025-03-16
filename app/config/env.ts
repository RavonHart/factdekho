const getEnvVar = (key: string): string => {
  const value = process.env[key]
  if (!value) {
    if (process.env.NODE_ENV === 'production') {
      throw new Error(`Missing required environment variable: ${key}`)
    } else {
      console.warn(`Warning: Missing environment variable: ${key}`)
      return ''
    }
  }
  return value
}

export const config = {
  openai: {
    apiKey: getEnvVar('OPENAI_API_KEY'),
  },
  gemini: {
    apiKey: getEnvVar('GEMINI_API_KEY'),
  },
} as const 