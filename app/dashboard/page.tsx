"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import DashboardLayout from "@/components/dashboard/dashboard-layout"
import { getCurrentToken, getCurrentUser, isAuthenticated } from "@/lib/auth-utils"

interface CandidateTasksProps {
  user: any
}

function CandidateTasks({ user }: CandidateTasksProps) {
  const router = useRouter()
  const [tasks, setTasks] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchTasks = async () => {
      if (!user?.email) return
      
      try {
        // Fetch interviews assigned to candidate
        const token = getCurrentToken()
        const interviewsRes = await fetch('/api/interviews', {
          headers: { Authorization: `Bearer ${token}` }
        })
        
        // Fetch assessments assigned to candidate
        const assessmentsRes = await fetch(`/api/assessments?candidateEmail=${encodeURIComponent(user.email)}`)
        
        const interviewsData = interviewsRes.ok ? await interviewsRes.json() : { interviews: [] }
        const assessmentsData = assessmentsRes.ok ? await assessmentsRes.json() : { assessments: [] }
        
        // Filter interviews for this candidate
        const candidateInterviews = (interviewsData.interviews || []).filter((interview: any) => 
          interview.candidateEmail === user.email || interview.candidate === user.email || interview.candidate === user.name
        )
        
        // Combine tasks from interviews and assessments
        const allTasks: any[] = []
        
        // Add interview tasks
        candidateInterviews.forEach((interview: any) => {
          // Add assessment task if interview has pre-assessment
          if (interview.selectedChallenges && interview.selectedChallenges.length > 0 && 
              (interview.assessmentMode === 'assessment' || interview.assessmentMode === 'both')) {
            const assessment = assessmentsData.assessments?.find((a: any) => a.id === interview.id)
            allTasks.push({
              id: `assessment-${interview.id}`,
              type: 'assessment',
              title: `${interview.title} - Assessment`,
              description: `Complete ${interview.selectedChallenges.length} coding challenge${interview.selectedChallenges.length > 1 ? 's' : ''} before the interview`,
              dueDate: interview.date,
              dueTime: interview.time,
              status: assessment?.status === 'completed' ? 'completed' : 'pending',
              interviewId: interview.id,
              interviewerName: interview.interviewerName,
              challengeCount: interview.selectedChallenges.length,
              priority: 'high'
            })
          }
          
          // Add interview session task
          allTasks.push({
            id: `interview-${interview.id}`,
            type: 'interview',
            title: interview.title,
            description: interview.description || `${interview.type} with ${interview.interviewerName}`,
            dueDate: interview.date,
            dueTime: interview.time,
            status: interview.status === 'completed' ? 'completed' : 
                   interview.status === 'active' ? 'active' : 
                   new Date(`${interview.date} ${interview.time}`) < new Date() ? 'missed' : 'scheduled',
            interviewId: interview.id,
            interviewerName: interview.interviewerName,
            platform: interview.platform,
            platformLink: interview.platformLink,
            priority: interview.status === 'active' ? 'urgent' : 
                     new Date(`${interview.date} ${interview.time}`) <= new Date(Date.now() + 24 * 60 * 60 * 1000) ? 'high' : 'medium'
          })
        })
        
        // Sort tasks by priority and date
        allTasks.sort((a: any, b: any) => {
          const priorityOrder: Record<string, number> = { urgent: 0, high: 1, medium: 2, low: 3 }
          if (priorityOrder[a.priority] !== priorityOrder[b.priority]) {
            return priorityOrder[a.priority] - priorityOrder[b.priority]
          }
          return new Date(`${a.dueDate} ${a.dueTime}`).getTime() - new Date(`${b.dueDate} ${b.dueTime}`).getTime()
        })
        
        setTasks(allTasks)
      } catch (error) {
        console.error('Failed to fetch tasks:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchTasks()
  }, [user])

  const handleTaskClick = (task: any) => {
    if (task.status === 'completed') return
    
    // Check user role to determine routing
    const isInterviewer = user?.role === 'INTERVIEWER' || user?.role === 'interviewer'
    const isCandidate = user?.role === 'CANDIDATE' || user?.role === 'candidate'
    
    if (task.type === 'assessment') {
      router.push(`/assessment/${task.interviewId}`)
    } else if (task.type === 'interview') {
      if (isInterviewer) {
        // Interviewers go to monitoring interface
        router.push(`/interview/monitor/${task.interviewId}`)
      } else if (isCandidate) {
        // Candidates go to code editor
        router.push(`/interview/${task.interviewId}`)
      } else {
        // Fallback for unknown roles
        console.warn('Unknown user role:', user?.role)
        router.push(`/interview/monitor/${task.interviewId}`)
      }
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-500/20 text-green-400 border-green-500/50'
      case 'active': return 'bg-blue-500/20 text-blue-400 border-blue-500/50 animate-pulse'
      case 'pending': case 'scheduled': return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/50'
      case 'missed': return 'bg-red-500/20 text-red-400 border-red-500/50'
      default: return 'bg-gray-500/20 text-gray-400 border-gray-500/50'
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'border-l-red-500 bg-red-500/5'
      case 'high': return 'border-l-orange-500 bg-orange-500/5'
      case 'medium': return 'border-l-blue-500 bg-blue-500/5'
      default: return 'border-l-gray-500 bg-gray-500/5'
    }
  }

  const getTaskIcon = (task: any) => {
    if (task.type === 'assessment') return '📝'
    if (task.status === 'active') return '🔴'
    return '🎤'
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold mb-2">My Tasks</h2>
          <p className="text-foreground/60">Your upcoming interviews and assessments</p>
        </div>
        
        <div className="grid gap-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="bg-secondary/50 border border-border rounded-lg p-6 animate-pulse">
              <div className="h-6 bg-gray-300 rounded w-3/4 mb-4"></div>
              <div className="h-4 bg-gray-300 rounded w-1/2"></div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  const pendingTasks = tasks.filter(t => t.status !== 'completed')
  const completedTasks = tasks.filter(t => t.status === 'completed')

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-2">My Tasks</h2>
        <p className="text-foreground/60">Your upcoming interviews and assessments</p>
      </div>
      
      {tasks.length === 0 ? (
        <div className="text-center py-12 bg-secondary/30 rounded-lg border border-border">
          <div className="text-6xl mb-4">📋</div>
          <h3 className="text-xl font-semibold mb-2">No tasks yet</h3>
          <p className="text-foreground/60">
            You'll see your interview invitations and assessments here when interviewers send them to you.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Pending Tasks */}
          {pendingTasks.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold mb-4 text-yellow-400">📌 Pending Tasks ({pendingTasks.length})</h3>
              <div className="grid gap-4">
                {pendingTasks.map((task) => (
                  <div
                    key={task.id}
                    onClick={() => handleTaskClick(task)}
                    className={`bg-secondary/50 border-l-4 border border-border rounded-lg p-6 cursor-pointer hover:bg-secondary/70 transition ${getPriorityColor(task.priority)}`}
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-start gap-3 flex-1">
                        <span className="text-2xl">{getTaskIcon(task)}</span>
                        <div className="flex-1">
                          <h4 className="text-lg font-semibold mb-1">{task.title}</h4>
                          <p className="text-sm text-foreground/70 mb-3">{task.description}</p>
                          
                          <div className="flex items-center gap-4 text-sm text-foreground/60">
                            <div className="flex items-center gap-1">
                              <span>👤</span>
                              <span>{task.interviewerName}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <span>📅</span>
                              <span>{task.dueDate} at {task.dueTime}</span>
                            </div>
                            {task.challengeCount && (
                              <div className="flex items-center gap-1">
                                <span>🧩</span>
                                <span>{task.challengeCount} challenge{task.challengeCount > 1 ? 's' : ''}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex flex-col items-end gap-2">
                        <span className={`px-3 py-1 rounded-full text-xs border ${getStatusColor(task.status)}`}>
                          {task.status === 'scheduled' ? 'Upcoming' : 
                           task.status === 'active' ? 'Live Now' :
                           task.status === 'pending' ? 'To Do' : 
                           task.status === 'missed' ? 'Missed' : task.status}
                        </span>
                        
                        {task.priority === 'urgent' && (
                          <span className="text-xs text-red-400 font-medium">🚨 Urgent</span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="text-sm text-foreground/60">
                        {task.type === 'assessment' ? 'Click to start assessment' : 
                         task.status === 'active' ? 'Click to join interview' : 
                         'Click to join when ready'}
                      </div>
                      
                      <div className="flex items-center gap-2 text-primary">
                        <span className="text-sm">
                          {task.type === 'assessment' ? 'Start Assessment' : 'Join Interview'}
                        </span>
                        <span>→</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Completed Tasks */}
          {completedTasks.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold mb-4 text-green-400">✅ Completed Tasks ({completedTasks.length})</h3>
              <div className="grid gap-3">
                {completedTasks.map((task) => (
                  <div
                    key={task.id}
                    className="bg-secondary/30 border border-border rounded-lg p-4 opacity-75"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className="text-xl">✅</span>
                        <div>
                          <h4 className="font-medium">{task.title}</h4>
                          <p className="text-sm text-foreground/60">{task.dueDate} at {task.dueTime}</p>
                        </div>
                      </div>
                      <span className={`px-3 py-1 rounded-full text-xs border ${getStatusColor(task.status)}`}>
                        Completed
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

interface InterviewStatsProps {
  user: any
}

function InterviewStats({ user }: InterviewStatsProps) {
  const router = useRouter()
  const [interviews, setInterviews] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)

  useEffect(() => {
    fetchInterviews()
  }, [user])

  const fetchInterviews = async () => {
    try {
      const token = getCurrentToken()
      const res = await fetch('/api/interviews', {
        headers: { Authorization: `Bearer ${token}` }
      })
      
      if (res.ok) {
        const data = await res.json()
        const allInterviews = data.interviews || []
        
        // Filter interviews created by this interviewer
        const userInterviews = allInterviews.filter((interview: any) => {
          return interview.interviewer === user.name || 
                 interview.interviewer === user.email || 
                 interview.interviewerEmail === user.email
        })
        
        setInterviews(userInterviews)
      }
    } catch (error) {
      console.error('Failed to fetch interviews:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleEdit = (interviewId: string) => {
    router.push(`/interview/edit/${interviewId}`)
  }

  const handleDelete = async (interviewId: string) => {
    try {
      const token = getCurrentToken()
      const res = await fetch(`/api/interviews/${interviewId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      })
      
      if (res.ok) {
        setInterviews(prev => prev.filter(i => i.id !== interviewId))
        setDeleteConfirm(null)
      } else {
        alert('Failed to delete interview')
      }
    } catch (error) {
      console.error('Failed to delete interview:', error)
      alert('Failed to delete interview')
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-500/20 text-green-400 border-green-500/50'
      case 'active': return 'bg-blue-500/20 text-blue-400 border-blue-500/50 animate-pulse'
      case 'scheduled': return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/50'
      default: return 'bg-gray-500/20 text-gray-400 border-gray-500/50'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return '✅'
      case 'active': return '🔴'
      case 'scheduled': return '📅'
      default: return '📋'
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold mb-2">My Interviews</h2>
          <p className="text-foreground/60">Manage your interview sessions</p>
        </div>
        
        <div className="grid gap-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="bg-secondary/50 border border-border rounded-lg p-6 animate-pulse">
              <div className="h-6 bg-gray-300 rounded w-3/4 mb-4"></div>
              <div className="h-4 bg-gray-300 rounded w-1/2"></div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  const pendingInterviews = interviews.filter(i => i.status !== 'completed')
  const completedInterviews = interviews.filter(i => i.status === 'completed')

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold mb-2">My Interviews</h2>
          <p className="text-foreground/60">Manage your interview sessions</p>
        </div>
        <button
          onClick={() => router.push('/interview/create')}
          className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/80 transition"
        >
          + Create Interview
        </button>
      </div>
      
      {interviews.length === 0 ? (
        <div className="text-center py-12 bg-secondary/30 rounded-lg border border-border">
          <div className="text-6xl mb-4">📋</div>
          <h3 className="text-xl font-semibold mb-2">No interviews yet</h3>
          <p className="text-foreground/60 mb-6">
            Create your first interview to get started
          </p>
          <button
            onClick={() => router.push('/interview/create')}
            className="px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary/80 transition"
          >
            Create Interview
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Pending/Active Interviews */}
          {pendingInterviews.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold mb-4 text-blue-400">📋 Active Interviews ({pendingInterviews.length})</h3>
              <div className="grid gap-4">
                {pendingInterviews.map((interview) => (
                  <div
                    key={interview.id}
                    className="bg-secondary/50 border border-border rounded-lg p-6 hover:bg-secondary/70 transition"
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-start gap-3 flex-1">
                        <span className="text-2xl">{getStatusIcon(interview.status)}</span>
                        <div className="flex-1">
                          <h4 className="text-lg font-semibold mb-1">{interview.title}</h4>
                          <p className="text-sm text-foreground/70 mb-3">
                            {interview.description || `${interview.type} session`}
                          </p>
                          
                          <div className="flex items-center gap-4 text-sm text-foreground/60">
                            <div className="flex items-center gap-1">
                              <span>👤</span>
                              <span>{interview.candidate || interview.candidateEmail}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <span>📅</span>
                              <span>{interview.date} at {interview.time}</span>
                            </div>
                            {interview.selectedChallenges && interview.selectedChallenges.length > 0 && (
                              <div className="flex items-center gap-1">
                                <span>🧩</span>
                                <span>{interview.selectedChallenges.length} challenge{interview.selectedChallenges.length > 1 ? 's' : ''}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex flex-col items-end gap-2">
                        <span className={`px-3 py-1 rounded-full text-xs border ${getStatusColor(interview.status)}`}>
                          {interview.status === 'scheduled' ? 'Scheduled' : 
                           interview.status === 'active' ? 'Active' : interview.status}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between border-t border-border pt-4">
                      <div className="text-sm text-foreground/60">
                        {interview.status === 'active' ? 'Interview is currently active' : 
                         interview.status === 'scheduled' ? 'Ready to start' : 
                         'Click to manage'}
                      </div>
                      
                      <div className="flex items-center gap-2">
                        {interview.status === 'active' ? (
                          <button
                            onClick={() => router.push(`/interview/monitor/${interview.id}`)}
                            className="px-3 py-1 bg-green-500 text-white text-sm rounded hover:bg-green-600 transition"
                          >
                            Monitor Session
                          </button>
                        ) : (
                          <>
                            <button
                              onClick={() => handleEdit(interview.id)}
                              className="px-3 py-1 bg-blue-500 text-white text-sm rounded hover:bg-blue-600 transition"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => setDeleteConfirm(interview.id)}
                              className="px-3 py-1 bg-red-500 text-white text-sm rounded hover:bg-red-600 transition"
                            >
                              Delete
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Completed Interviews */}
          {completedInterviews.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold mb-4 text-green-400">✅ Completed Interviews ({completedInterviews.length})</h3>
              <div className="grid gap-3">
                {completedInterviews.map((interview) => (
                  <div
                    key={interview.id}
                    className="bg-secondary/30 border border-border rounded-lg p-4 opacity-75"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className="text-xl">✅</span>
                        <div>
                          <h4 className="font-medium">{interview.title}</h4>
                          <p className="text-sm text-foreground/60">
                            {interview.candidate || interview.candidateEmail} • {interview.date} at {interview.time}
                          </p>
                        </div>
                      </div>
                      <span className={`px-3 py-1 rounded-full text-xs border ${getStatusColor(interview.status)}`}>
                        Completed
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-secondary border border-border rounded-lg p-6 max-w-md">
            <h3 className="text-lg font-semibold mb-2">Delete Interview</h3>
            <p className="text-foreground/70 mb-6">
              Are you sure you want to delete this interview? This action cannot be undone.
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setDeleteConfirm(null)}
                className="px-4 py-2 bg-secondary border border-border rounded hover:bg-secondary/70 transition"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDelete(deleteConfirm)}
                className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 transition"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default function DashboardPage() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)

  const [showSuccessMessage, setShowSuccessMessage] = useState(false)
  const [successMessage, setSuccessMessage] = useState("")



  useEffect(() => {
    if (!isAuthenticated()) {
      console.log('Not authenticated, redirecting to login')
      router.push("/login")
      return
    }

    const userData = getCurrentUser()
    if (userData) {
      console.log('Dashboard loaded for user:', userData)
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
        
        {user.role === 'CANDIDATE' ? (
          <CandidateTasks user={user} />
        ) : (
          <InterviewStats user={user} />
        )}
      </div>
    </DashboardLayout>
  )
}
