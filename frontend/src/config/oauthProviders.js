const apiBase = import.meta.env.VITE_API_URL || 'http://localhost:5000/api'
const authBase = apiBase.replace(/\/api\/?$/, '')

export const oauthProviders = [
  {
    name: 'google',
    label: 'Continue with Google',
    authUrl: `${authBase}/auth/google`,
  },
]

export default oauthProviders

