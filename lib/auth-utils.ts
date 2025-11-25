export function getCurrentSession() {
  return localStorage.getItem('currentSession')
}

export function getCurrentToken() {
  const currentSession = getCurrentSession()
  return currentSession ? localStorage.getItem(`token_${currentSession}`) : null
}

export function getCurrentUser() {
  const currentSession = getCurrentSession()
  if (!currentSession) return null
  
  const userStr = localStorage.getItem(`user_${currentSession}`)
  if (!userStr) return null
  
  try {
    return JSON.parse(userStr)
  } catch (error) {
    console.error('Error parsing user data:', error)
    return null
  }
}

export function clearCurrentSession() {
  const currentSession = getCurrentSession()
  if (currentSession) {
    localStorage.removeItem(`token_${currentSession}`)
    localStorage.removeItem(`user_${currentSession}`)
  }
  localStorage.removeItem('currentSession')
}

export function logout() {
  clearCurrentSession()
  if (typeof window !== 'undefined') {
    window.location.href = '/login'
  }
}

export function isAuthenticated() {
  return getCurrentToken() !== null && getCurrentUser() !== null
}