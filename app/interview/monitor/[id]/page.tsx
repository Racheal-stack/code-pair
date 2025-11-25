"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { Users, Calendar, Clock, Video, Eye, MessageSquare } from "lucide-react"
import { getCurrentToken, getCurrentUser, isAuthenticated } from "@/lib/auth-utils"

interface InterviewMonitorProps {}

export default function InterviewMonitorPage({}: InterviewMonitorProps) {
  const params = useParams()
  const router = useRouter()
  const [interview, setInterview] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [participants, setParticipants] = useState<any[]>([])
  const [messages, setMessages] = useState<any[]>([])
  const [user, setUser] = useState<any>(null)

  useEffect(() => {
    if (!isAuthenticated()) {
      router.push("/login")
      return
    }

    const currentUser = getCurrentUser()
    setUser(currentUser)
    
    if (currentUser?.role !== 'INTERVIEWER') {
      router.push("/dashboard")
      return
    }

    fetchInterviewData()
  }, [router])

  const fetchInterviewData = async () => {
    try {
      const token = getCurrentToken()
      const interviewId = params.id as string
      
      // Fetch interview details
      const interviewRes = await fetch(`/api/interviews/${interviewId}`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      
      if (interviewRes.ok) {
        const interviewData = await interviewRes.json()
        setInterview(interviewData.interview)
        
        // Verify user is the interviewer
        if (interviewData.interview.interviewerEmail !== user?.email && 
            interviewData.interview.interviewer !== user?.name) {
          router.push("/dashboard")
          return
        }
      } else {
        console.error('Failed to fetch interview')
        router.push("/dashboard")
        return
      }
    } catch (error) {
      console.error('Error fetching interview:', error)
    } finally {
      setLoading(false)
    }
  }

  const startInterview = async () => {
    try {
      const token = getCurrentToken()
      const res = await fetch(`/api/interviews/${params.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          status: 'active'
        })
      })
      
      if (res.ok) {
        setInterview((prev: any) => ({ ...prev, status: 'active' }))
      }
    } catch (error) {
      console.error('Error starting interview:', error)
    }
  }

  const endInterview = async () => {
    if (!confirm('Are you sure you want to end this interview?')) {
      return
    }
    
    try {
      const token = getCurrentToken()
      const res = await fetch(`/api/interviews/${params.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          status: 'completed'
        })
      })
      
      if (res.ok) {
        setInterview((prev: any) => ({ ...prev, status: 'completed' }))
      }
    } catch (error) {
      console.error('Error ending interview:', error)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-foreground/60">Loading interview...</p>
        </div>
      </div>
    )
  }

  if (!interview) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-xl font-semibold mb-2">Interview Not Found</h1>
          <p className="text-foreground/60 mb-4">The interview you're looking for doesn't exist.</p>
          <button
            onClick={() => router.push('/dashboard')}
            className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-foreground">{interview.title}</h1>
            <p className="text-foreground/60">Interview Monitoring Dashboard</p>
          </div>
          <div className="flex items-center gap-4">
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${
              interview.status === 'active' ? 'bg-green-500/20 text-green-400' :
              interview.status === 'completed' ? 'bg-blue-500/20 text-blue-400' :
              'bg-yellow-500/20 text-yellow-400'
            }`}>
              {interview.status === 'active' ? '🔴 Live' : 
               interview.status === 'completed' ? '✅ Completed' : '⏰ Scheduled'}
            </span>
            <button
              onClick={() => router.push('/dashboard')}
              className="px-4 py-2 border border-border rounded-lg hover:bg-secondary transition"
            >
              Back to Dashboard
            </button>
          </div>
        </div>

        {/* Interview Details */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          <div className="lg:col-span-2 bg-card border border-border rounded-lg p-6">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Calendar className="w-5 h-5" />
              Interview Details
            </h2>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-foreground/70">Candidate</label>
                <p className="text-foreground">{interview.candidate || interview.candidateEmail}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-foreground/70">Date & Time</label>
                <p className="text-foreground">{interview.date} at {interview.time}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-foreground/70">Platform</label>
                <div className="flex items-center gap-2">
                  <p className="text-foreground">{interview.platform}</p>
                  {interview.platformLink && (
                    <a
                      href={interview.platformLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary hover:text-accent transition text-sm underline"
                    >
                      Open Link
                    </a>
                  )}
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-foreground/70">Duration</label>
                <p className="text-foreground">{interview.duration || 60} minutes</p>
              </div>
            </div>

            {interview.description && (
              <div className="mt-4">
                <label className="text-sm font-medium text-foreground/70">Description</label>
                <p className="text-foreground mt-1">{interview.description}</p>
              </div>
            )}
          </div>

          {/* Control Panel */}
          <div className="bg-card border border-border rounded-lg p-6">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Eye className="w-5 h-5" />
              Control Panel
            </h2>
            
            <div className="space-y-3">
              {interview.status === 'scheduled' && (
                <button
                  onClick={startInterview}
                  className="w-full px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition"
                >
                  Start Interview
                </button>
              )}
              
              {interview.status === 'active' && (
                <>
                  <button
                    onClick={() => window.open(interview.platformLink, '_blank')}
                    className="w-full px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition"
                    disabled={!interview.platformLink}
                  >
                    Join Video Call
                  </button>
                  
                  <button
                    onClick={endInterview}
                    className="w-full px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition"
                  >
                    End Interview
                  </button>
                </>
              )}
              
              <button
                onClick={() => router.push(`/interview/edit/${interview.id}`)}
                className="w-full px-4 py-2 border border-border rounded-lg hover:bg-secondary transition"
                disabled={interview.status === 'active'}
              >
                Edit Interview
              </button>
            </div>
            
            <div className="mt-6 pt-6 border-t border-border">
              <h3 className="font-medium mb-2">Quick Actions</h3>
              <div className="space-y-2 text-sm">
                <p className="text-foreground/60">
                  • Monitor candidate progress in real-time
                </p>
                <p className="text-foreground/60">
                  • Join video call when ready
                </p>
                <p className="text-foreground/60">
                  • End interview when complete
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Challenges and Questions */}
        {(interview.selectedChallenges?.length > 0 || interview.questions?.length > 0) && (
          <div className="bg-card border border-border rounded-lg p-6 mb-6">
            <h2 className="text-lg font-semibold mb-4">Interview Content</h2>
            
            {interview.selectedChallenges?.length > 0 && (
              <div className="mb-4">
                <h3 className="font-medium mb-2">Selected Challenges ({interview.selectedChallenges.length})</h3>
                <div className="text-sm text-foreground/60">
                  Coding challenges have been assigned to the candidate.
                </div>
              </div>
            )}
            
            {interview.questions?.length > 0 && (
              <div>
                <h3 className="font-medium mb-2">Interview Questions ({interview.questions.length})</h3>
                <div className="space-y-2">
                  {interview.questions.map((question: string, index: number) => (
                    <div key={index} className="text-sm text-foreground/80">
                      {index + 1}. {question}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Participant Status */}
        <div className="bg-card border border-border rounded-lg p-6">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Users className="w-5 h-5" />
            Participant Status
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 bg-secondary/30 rounded-lg">
              <h3 className="font-medium mb-2">Interviewer (You)</h3>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                <span className="text-sm text-foreground/80">{interview.interviewerName || 'You'}</span>
              </div>
            </div>
            
            <div className="p-4 bg-secondary/30 rounded-lg">
              <h3 className="font-medium mb-2">Candidate</h3>
              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${
                  interview.status === 'active' ? 'bg-green-400' : 'bg-gray-400'
                }`}></div>
                <span className="text-sm text-foreground/80">
                  {interview.candidate || interview.candidateEmail}
                </span>
              </div>
              {interview.status !== 'active' && (
                <p className="text-xs text-foreground/60 mt-1">
                  Waiting to join...
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}