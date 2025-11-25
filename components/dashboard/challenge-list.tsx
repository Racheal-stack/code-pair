"use client"

import { useEffect, useState } from "react"
import { Code2 } from "lucide-react"
import { getCurrentToken } from "@/lib/auth-utils"

interface Challenge {
  id: string
  title: string
  description: string
  difficulty: string
  category: string
}

export default function ChallengeList() {
  const [challenges, setChallenges] = useState<Challenge[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchChallenges = async () => {
      try {
        const token = getCurrentToken()
        console.log('Challenge-list - Token available:', token ? 'Yes' : 'No')
        
        const res = await fetch('/api/challenges', {
          headers: { Authorization: `Bearer ${token}` },
        })
        
        console.log('Challenge-list - Response status:', res.status)
        
        if (!res.ok) {
          const errorText = await res.text()
          console.log('Challenge-list - Error response:', errorText)
          throw new Error(`HTTP error! status: ${res.status}, message: ${errorText}`)
        }
        
        const data = await res.json()
        console.log('Challenge-list - Data received:', data)
        setChallenges(data.challenges || data || [])
      } catch (error) {
        console.error("Failed to fetch challenges:", error)
        setChallenges([])
      } finally {
        setLoading(false)
      }
    }

    fetchChallenges()
  }, [])

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case "EASY":
        return "bg-green-900/30 text-green-300 border-green-500/30"
      case "MEDIUM":
        return "bg-yellow-900/30 text-yellow-300 border-yellow-500/30"
      case "HARD":
        return "bg-red-900/30 text-red-300 border-red-500/30"
      default:
        return "bg-secondary text-foreground"
    }
  }

  if (loading) {
    return <div className="text-center text-foreground/60">Loading challenges...</div>
  }

  return (
    <div className="space-y-4">
      {challenges.length === 0 ? (
        <div className="text-center py-12 text-foreground/60">
          <Code2 className="w-12 h-12 mx-auto mb-4 opacity-50" />
          <p>No challenges available yet</p>
        </div>
      ) : (
        challenges.map((challenge) => (
          <div
            key={challenge.id}
            className="p-6 border border-border rounded-lg bg-secondary/30 hover:bg-secondary/50 transition cursor-pointer group"
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <h3 className="text-lg font-semibold mb-2 group-hover:text-primary transition">{challenge.title}</h3>
                <p className="text-foreground/70 mb-4 line-clamp-2">{challenge.description}</p>
                <div className="flex gap-2 flex-wrap">
                  <span className={`px-3 py-1 rounded-full text-xs border ${getDifficultyColor(challenge.difficulty)}`}>
                    {challenge.difficulty}
                  </span>
                  <span className="px-3 py-1 rounded-full text-xs bg-accent/20 text-accent border border-accent/30">
                    {challenge.category}
                  </span>
                </div>
              </div>
            </div>
          </div>
        ))
      )}
    </div>
  )
}
