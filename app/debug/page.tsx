"use client"

import { useEffect, useState } from "react"
import { getCurrentUser, getCurrentToken, getCurrentSession } from "@/lib/auth-utils"

export default function AuthDebugPage() {
  const [sessionInfo, setSessionInfo] = useState<any>(null)
  const [allSessions, setAllSessions] = useState<any[]>([])

  useEffect(() => {
    const updateSessionInfo = () => {
      const currentSession = getCurrentSession()
      const currentUser = getCurrentUser()
      const currentToken = getCurrentToken()
      
      setSessionInfo({
        currentSession,
        user: currentUser,
        hasToken: !!currentToken,
        tokenPreview: currentToken ? `${currentToken.substring(0, 20)}...` : null
      })

      const sessions = []
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i)
        if (key?.startsWith('user_')) {
          const sessionId = key.replace('user_', '')
          const userData = localStorage.getItem(key)
          const tokenKey = `token_${sessionId}`
          const hasToken = !!localStorage.getItem(tokenKey)
          
          try {
            const user = JSON.parse(userData || '{}')
            sessions.push({
              sessionId,
              user,
              hasToken,
              isCurrent: sessionId === currentSession
            })
          } catch (e) {
            console.error('Error parsing user data for session:', sessionId)
          }
        }
      }
      setAllSessions(sessions)
    }

    updateSessionInfo()
    
    const interval = setInterval(updateSessionInfo, 1000)
    return () => clearInterval(interval)
  }, [])

  const switchSession = (sessionId: string) => {
    localStorage.setItem('currentSession', sessionId)
    window.location.reload()
  }

  const clearSession = (sessionId: string) => {
    localStorage.removeItem(`token_${sessionId}`)
    localStorage.removeItem(`user_${sessionId}`)
    if (getCurrentSession() === sessionId) {
      localStorage.removeItem('currentSession')
    }
    window.location.reload()
  }

  return (
    <div className="min-h-screen bg-background text-foreground p-6">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">🔐 Multi-Tab Authentication Debug</h1>
        
        <div className="bg-secondary/50 border border-border rounded-lg p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4 text-blue-400">📍 Current Active Session</h2>
          {sessionInfo ? (
            <div className="space-y-2">
              <div><span className="font-medium">Session ID:</span> {sessionInfo.currentSession || 'None'}</div>
              <div><span className="font-medium">User:</span> {sessionInfo.user?.email || 'Not logged in'}</div>
              <div><span className="font-medium">Role:</span> {sessionInfo.user?.role || 'N/A'}</div>
              <div><span className="font-medium">Has Token:</span> {sessionInfo.hasToken ? '✅ Yes' : '❌ No'}</div>
              {sessionInfo.tokenPreview && (
                <div><span className="font-medium">Token Preview:</span> {sessionInfo.tokenPreview}</div>
              )}
            </div>
          ) : (
            <div className="text-foreground/60">Loading...</div>
          )}
        </div>

        <div className="bg-secondary/50 border border-border rounded-lg p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4 text-green-400">👥 All Sessions in LocalStorage</h2>
          {allSessions.length > 0 ? (
            <div className="space-y-4">
              {allSessions.map((session) => (
                <div 
                  key={session.sessionId}
                  className={`border rounded-lg p-4 ${
                    session.isCurrent 
                      ? 'border-blue-500 bg-blue-500/10' 
                      : 'border-border bg-secondary/30'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{session.user?.email || 'Unknown'}</span>
                        <span className={`px-2 py-1 rounded text-xs ${
                          session.user?.role === 'INTERVIEWER' 
                            ? 'bg-purple-500/20 text-purple-400' 
                            : 'bg-orange-500/20 text-orange-400'
                        }`}>
                          {session.user?.role || 'Unknown'}
                        </span>
                        {session.isCurrent && (
                          <span className="px-2 py-1 bg-blue-500/20 text-blue-400 rounded text-xs">
                            ACTIVE
                          </span>
                        )}
                      </div>
                      <div className="text-sm text-foreground/60 mt-1">
                        Session: {session.sessionId.substring(0, 16)}...
                      </div>
                      <div className="text-sm text-foreground/60">
                        Token: {session.hasToken ? '✅ Available' : '❌ Missing'}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      {!session.isCurrent && (
                        <button
                          onClick={() => switchSession(session.sessionId)}
                          className="px-3 py-1 bg-blue-500 text-white text-sm rounded hover:bg-blue-600 transition"
                        >
                          Switch To
                        </button>
                      )}
                      <button
                        onClick={() => clearSession(session.sessionId)}
                        className="px-3 py-1 bg-red-500 text-white text-sm rounded hover:bg-red-600 transition"
                      >
                        Clear
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-foreground/60">
              No active sessions found
            </div>
          )}
        </div>

        <div className="bg-secondary/50 border border-border rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4 text-yellow-400">📋 Multi-Tab Testing Instructions</h2>
          <div className="space-y-3 text-sm">
            <div>
              <strong>1. Open Multiple Tabs:</strong> Open this application in 2-3 different browser tabs
            </div>
            <div>
              <strong>2. Login Different Users:</strong> In each tab, login as different users (candidate vs interviewer)
            </div>
            <div>
              <strong>3. Check This Page:</strong> Visit /debug in each tab to see session information
            </div>
            <div>
              <strong>4. Navigate Around:</strong> Go to Dashboard, Interviews, Challenges in each tab
            </div>
            <div>
              <strong>5. Verify Independence:</strong> Each tab should maintain its own user session
            </div>
          </div>
          
          <div className="mt-6 p-4 bg-blue-500/10 border border-blue-500/30 rounded-lg">
            <div className="font-medium text-blue-400 mb-2">✅ Expected Behavior:</div>
            <ul className="text-sm space-y-1">
              <li>• Each tab shows different user information</li>
              <li>• Logging in one tab doesn't affect other tabs</li>
              <li>• Each session has unique session ID</li>
              <li>• Navigation works without logging out</li>
            </ul>
          </div>
        </div>

        <div className="mt-6 flex gap-4">
          <button
            onClick={() => window.location.href = '/login'}
            className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/80 transition"
          >
            Go to Login
          </button>
          <button
            onClick={() => window.location.href = '/dashboard'}
            className="px-4 py-2 bg-secondary border border-border rounded-lg hover:bg-secondary/70 transition"
          >
            Go to Dashboard
          </button>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-secondary border border-border rounded-lg hover:bg-secondary/70 transition"
          >
            Refresh
          </button>
        </div>
      </div>
    </div>
  )
}