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
  groq: {
    apiKey: getEnvVar('GROQ_API_KEY'),
  },
} as const 