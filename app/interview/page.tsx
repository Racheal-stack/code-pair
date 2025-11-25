"use client"

import { useEffect, useState, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import { Plus, Calendar, Clock, Users, CheckCircle, X } from "lucide-react"
import DashboardLayout from "@/components/dashboard/dashboard-layout"
import { getCurrentToken, getCurrentUser, isAuthenticated } from "@/lib/auth-utils"

interface InterviewSession {
  id: string
  title: string
  type: string
  status: "scheduled" | "active" | "completed"
  date: string
  time: string
  candidate?: string
  interviewer?: string
}

function InterviewPageContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [user, setUser] = useState<any>(null)
  const [interviews, setInterviews] = useState<InterviewSession[]>([])
  const [loading, setLoading] = useState(true)
  const [showSuccessMessage, setShowSuccessMessage] = useState(false)

  useEffect(() => {
    if (searchParams.get('created') === 'true') {
      setShowSuccessMessage(true)
      const newUrl = window.location.pathname
      window.history.replaceState({}, '', newUrl)
    }
  }, [searchParams])

  useEffect(() => {
    if (!isAuthenticated()) {
      router.push("/login")
      return
    }

    const userData = getCurrentUser()
    if (userData) {
      setUser(userData)
      
      const fetchInterviews = async () => {
        try {
          const token = getCurrentToken()
          const res = await fetch('/api/interviews', {
            headers: { Authorization: `Bearer ${token}` }
          })
          
          if (res.ok) {
            const data = await res.json()
            setInterviews(data.interviews || [])
          }
        } catch (error) {
          console.error('Failed to fetch interviews:', error)
        } finally {
          setLoading(false)
        }
      }
      
      fetchInterviews()
    } else {
      router.push("/login")
    }
  }, [router])

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'scheduled': return 'bg-blue-500/20 text-blue-400 border-blue-500/50'
      case 'active': return 'bg-green-500/20 text-green-400 border-green-500/50'
      case 'completed': return 'bg-gray-500/20 text-gray-400 border-gray-500/50'
      default: return 'bg-gray-500/20 text-gray-400 border-gray-500/50'
    }
  }

  const createNewInterview = () => {
    router.push('/interview/create')
  }

  const filteredInterviews = interviews.filter(interview => {
    if (user.role === 'CANDIDATE') {
      return interview.candidate === user.name || interview.candidate === user.email
    } else if (user.role === 'INTERVIEWER') {
      return interview.interviewer === user.name || interview.interviewer === user.email
    }
    return false
  })

  if (loading || !user) return <div className="p-8">Loading...</div>

  const pageTitle = user.role === 'CANDIDATE' ? 'My Interviews' : 'Interview Sessions'
  const pageDescription = user.role === 'CANDIDATE' 
    ? 'View your assigned coding interviews and assessments'
    : 'Manage your coding interviews and assessments'

  return (
    <DashboardLayout user={user}>
      <div className="space-y-6">
        {showSuccessMessage && (
          <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <CheckCircle className="w-5 h-5 text-green-400" />
              <div>
                <p className="font-semibold text-green-400">Interview Created Successfully!</p>
                <p className="text-sm text-green-300/80">The invitation email has been sent to the candidate.</p>
              </div>
            </div>
            <button
              onClick={() => setShowSuccessMessage(false)}
              className="text-green-400/60 hover:text-green-400 transition"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}
        
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">{pageTitle}</h1>
            <p className="text-foreground/60 mt-2">{pageDescription}</p>
          </div>
          {user.role === 'INTERVIEWER' && (
            <button
              onClick={createNewInterview}
              className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              New Interview
            </button>
          )}
        </div>

        <div className="grid gap-4">
          {filteredInterviews.map((interview) => (
            <Link
              key={interview.id}
              href={`/interview/${interview.id}`}
              className="block p-6 bg-secondary/50 border border-border rounded-lg hover:bg-secondary/80 transition"
            >
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-xl font-semibold mb-2">{interview.title}</h3>
                  <p className="text-foreground/60">{interview.type}</p>
                </div>
                <span className={`px-3 py-1 rounded-full text-sm border ${getStatusColor(interview.status)}`}>
                  {interview.status.charAt(0).toUpperCase() + interview.status.slice(1)}
                </span>
              </div>
              
              <div className="flex items-center gap-6 text-sm text-foreground/60">
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  {interview.date}
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  {interview.time}
                </div>
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4" />
                  {interview.candidate} → {interview.interviewer}
                </div>
              </div>
            </Link>
          ))}
        </div>

        {filteredInterviews.length === 0 && (
          <div className="text-center py-12">
            <div className="w-24 h-24 mx-auto mb-4 bg-secondary rounded-full flex items-center justify-center">
              <Users className="w-12 h-12 text-foreground/40" />
            </div>
            {user.role === 'CANDIDATE' ? (
              <>
                <h3 className="text-xl font-semibold mb-2">No interviews assigned</h3>
                <p className="text-foreground/60 mb-6">You don't have any interviews assigned yet. Your interviewer will send you interview invitations.</p>
              </>
            ) : (
              <>
                <h3 className="text-xl font-semibold mb-2">No interviews yet</h3>
                <p className="text-foreground/60 mb-6">Create your first interview session to get started</p>
                <button
                  onClick={createNewInterview}
                  className="px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary-dark transition"
                >
                  Create Interview
                </button>
              </>
            )}
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}

export default function InterviewPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <InterviewPageContent />
    </Suspense>
  )
}