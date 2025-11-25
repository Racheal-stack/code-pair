"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { Users } from "lucide-react"

interface Session {
  id: string
  status: string
  scheduledAt: string
}

export default function SessionList() {
  const [sessions, setSessions] = useState<Session[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchSessions = async () => {
      try {
        const currentSession = localStorage.getItem('currentSession')
        const token = currentSession ? localStorage.getItem(`token_${currentSession}`) : null
        const res = await fetch('/api/sessions', {
          headers: { Authorization: `Bearer ${token}` },
        })
        const data = await res.json()
        setSessions(data)
      } catch (error) {
        console.error("Failed to fetch sessions")
      } finally {
        setLoading(false)
      }
    }

    fetchSessions()
  }, [])

  if (loading) {
    return <div className="text-center text-foreground/60">Loading sessions...</div>
  }

  return (
    <div className="space-y-4">
      {sessions.length === 0 ? (
        <div className="text-center py-12 text-foreground/60">
          <Users className="w-12 h-12 mx-auto mb-4 opacity-50" />
          <p>No interview sessions yet</p>
        </div>
      ) : (
        sessions.map((session) => (
          <Link
            key={session.id}
            href={`/interview/${session.id}`}
            className="block p-6 border border-border rounded-lg bg-secondary/30 hover:bg-secondary/50 transition group"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-foreground/60">Interview Session</p>
                <p className="font-semibold mt-1 group-hover:text-primary transition">
                  {new Date(session.scheduledAt).toLocaleString()}
                </p>
              </div>
              <span
                className={`px-3 py-1 rounded-full text-xs border ${
                  session.status === "ACTIVE"
                    ? "bg-green-900/30 text-green-300 border-green-500/30"
                    : session.status === "PENDING"
                      ? "bg-yellow-900/30 text-yellow-300 border-yellow-500/30"
                      : "bg-gray-900/30 text-gray-300 border-gray-500/30"
                }`}
              >
                {session.status}
              </span>
            </div>
          </Link>
        ))
      )}
    </div>
  )
}
