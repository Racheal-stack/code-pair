"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Plus } from "lucide-react"
import DashboardLayout from "@/components/dashboard/dashboard-layout"
import ChallengeList from "@/components/dashboard/challenge-list"
import { getCurrentUser, isAuthenticated } from "@/lib/auth-utils"

export default function ChallengesPage() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [showSuccessMessage, setShowSuccessMessage] = useState(false)
  const [successMessage, setSuccessMessage] = useState("")

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search)
    const created = urlParams.get('created')
    
    if (created === 'true') {
      setSuccessMessage('Challenge created successfully!')
      setShowSuccessMessage(true)
      window.history.replaceState({}, '', '/challenges')
    }
  }, [])

  useEffect(() => {
    if (!isAuthenticated()) {
      console.log('Not authenticated, redirecting to login')
      router.push("/login")
      return
    }

    const userData = getCurrentUser()
    if (userData) {
      console.log('Challenges page loaded for user:', userData)
      setUser(userData)
    } else {
      router.push("/login")
    }
  }, [router])

  if (!user) return null

  return (
    <DashboardLayout user={user}>
      <div className="space-y-6">
        {showSuccessMessage && (
          <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-5 h-5 rounded-full bg-green-400 flex items-center justify-center text-black">
                ✓
              </div>
              <p className="font-semibold text-green-400">{successMessage}</p>
            </div>
            <button
              onClick={() => setShowSuccessMessage(false)}
              className="text-green-400/60 hover:text-green-400 transition"
            >
              ✕
            </button>
          </div>
        )}
        
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Challenges</h1>
            <p className="text-foreground/60 mt-2">
              {user.role === 'INTERVIEWER' 
                ? 'Create and manage coding challenges for interviews' 
                : 'Browse available coding challenges'}
            </p>
          </div>
          
          {user.role === 'INTERVIEWER' && (
            <button
              onClick={() => router.push('/challenges/create')}
              className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Create Challenge
            </button>
          )}
        </div>

        <ChallengeList />
      </div>
    </DashboardLayout>
  )
}