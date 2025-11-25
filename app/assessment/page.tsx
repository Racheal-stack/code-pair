"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Clock, Code2, CheckCircle, Calendar, User } from "lucide-react"
import DashboardLayout from "@/components/dashboard/dashboard-layout"

interface Assessment {
  id: string
  title: string
  interviewerName: string
  date: string
  time: string
  challengeCount: number
  status: 'pending' | 'completed'
  completedAt?: string
}

export default function AssessmentsPage() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [assessments, setAssessments] = useState<Assessment[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const currentSession = localStorage.getItem('currentSession')
    const token = currentSession ? localStorage.getItem(`token_${currentSession}`) : null
    const userStr = currentSession ? localStorage.getItem(`user_${currentSession}`) : null
    
    if (!token || !userStr) {
      router.push("/login")
      return
    }

    try {
      const userData = JSON.parse(userStr)
      setUser(userData)
    } catch (error) {
      console.error('Error parsing user data:', error)
      router.push("/login")
    }
  }, [router])

  useEffect(() => {
    const fetchAssessments = async () => {
      if (!user?.email) return
      
      try {
        const res = await fetch(`/api/assessments?candidateEmail=${encodeURIComponent(user.email)}`)
        if (res.ok) {
          const data = await res.json()
          setAssessments(data.assessments || [])
        }
      } catch (error) {
        console.error('Failed to fetch assessments:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchAssessments()
  }, [user])

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-5 h-5 text-green-400" />
      case 'pending':
        return <Clock className="w-5 h-5 text-yellow-400" />
      default:
        return <Clock className="w-5 h-5 text-gray-400" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-500/20 text-green-400 border-green-500/50'
      case 'pending':
        return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/50'
      default:
        return 'bg-gray-500/20 text-gray-400 border-gray-500/50'
    }
  }

  if (!user) return null

  return (
    <DashboardLayout user={user}>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">My Assessments</h1>
          <p className="text-foreground/60 mt-2">
            Complete coding assessments sent by interviewers
          </p>
        </div>

        {loading ? (
          <div className="grid gap-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="bg-secondary/50 border border-border rounded-lg p-6 animate-pulse">
                <div className="h-6 bg-gray-300 rounded w-3/4 mb-4"></div>
                <div className="h-4 bg-gray-300 rounded w-1/2"></div>
              </div>
            ))}
          </div>
        ) : assessments.length === 0 ? (
          <div className="text-center py-12 bg-secondary/30 rounded-lg border border-border">
            <Code2 className="w-16 h-16 mx-auto mb-4 text-foreground/30" />
            <h3 className="text-xl font-semibold mb-2">No Assessments Yet</h3>
            <p className="text-foreground/60">
              You'll see coding assessments here when interviewers send them to you.
            </p>
          </div>
        ) : (
          <div className="grid gap-4">
            {assessments.map((assessment) => (
              <div
                key={assessment.id}
                className="bg-secondary/50 border border-border rounded-lg p-6 hover:bg-secondary/70 transition cursor-pointer"
                onClick={() => router.push(`/assessment/${assessment.id}`)}
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h3 className="text-xl font-semibold mb-2">{assessment.title}</h3>
                    <div className="flex items-center gap-4 text-sm text-foreground/60 mb-3">
                      <div className="flex items-center gap-2">
                        <User className="w-4 h-4" />
                        {assessment.interviewerName}
                      </div>
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4" />
                        {assessment.date} at {assessment.time}
                      </div>
                      <div className="flex items-center gap-2">
                        <Code2 className="w-4 h-4" />
                        {assessment.challengeCount} challenge{assessment.challengeCount > 1 ? 's' : ''}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex flex-col items-end gap-2">
                    <span className={`px-3 py-1 rounded-full text-sm border flex items-center gap-2 ${getStatusColor(assessment.status)}`}>
                      {getStatusIcon(assessment.status)}
                      {assessment.status === 'completed' ? 'Completed' : 'Pending'}
                    </span>
                    
                    {assessment.completedAt && (
                      <div className="text-xs text-foreground/60">
                        Submitted: {new Date(assessment.completedAt).toLocaleDateString()}
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div className="text-sm text-foreground/60">
                    {assessment.status === 'completed' 
                      ? 'Click to view your submission'
                      : 'Click to start assessment'
                    }
                  </div>
                  
                  <div className="flex items-center gap-2 text-primary">
                    {assessment.status === 'pending' ? (
                      <>
                        <span className="text-sm">Start Assessment</span>
                        <span>→</span>
                      </>
                    ) : (
                      <>
                        <span className="text-sm">View Submission</span>
                        <span>→</span>
                      </>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}