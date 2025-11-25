"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Clock, Code2, CheckCircle, ArrowLeft, ArrowRight, Play } from "lucide-react"

interface Challenge {
  id: string
  title: string
  description: string
  difficulty: string
  category: string
  starterCode?: string
  testCases?: Array<{
    input: string
    expectedOutput: string
    description?: string
  }>
}

interface Solution {
  challengeId: string
  code: string
  timeSpent: number
}

export default function AssessmentPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter()
  const [assessmentId, setAssessmentId] = useState<string>("")
  const [user, setUser] = useState<any>(null)
  const [interview, setInterview] = useState<any>(null)
  const [challenges, setChallenges] = useState<Challenge[]>([])
  const [currentChallengeIndex, setCurrentChallengeIndex] = useState(0)
  const [solutions, setSolutions] = useState<Record<string, Solution>>({})
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [isCompleted, setIsCompleted] = useState(false)
  const [startTime, setStartTime] = useState<number>(Date.now())
  const [timeSpent, setTimeSpent] = useState<Record<string, number>>({})

  useEffect(() => {
    const resolveParams = async () => {
      const resolvedParams = await params
      setAssessmentId(resolvedParams.id)
    }
    resolveParams()
  }, [params])

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
    const fetchAssessment = async () => {
      if (!user?.email || !assessmentId) return
      
      try {
        const res = await fetch(`/api/assessments?candidateEmail=${encodeURIComponent(user.email)}&interviewId=${assessmentId}`)
        if (res.ok) {
          const data = await res.json()
          setInterview(data.interview)
          setChallenges(data.challenges || [])
          setIsCompleted(data.isCompleted)
          
          // Initialize solutions with starter code
          const initialSolutions: Record<string, Solution> = {}
          const initialTimeSpent: Record<string, number> = {}
          
          data.challenges.forEach((challenge: Challenge) => {
            initialSolutions[challenge.id] = {
              challengeId: challenge.id,
              code: challenge.starterCode || '// Write your solution here',
              timeSpent: 0
            }
            initialTimeSpent[challenge.id] = 0
          })
          
          // If assessment is completed, load existing solutions
          if (data.assessment?.solutions) {
            data.assessment.solutions.forEach((sol: Solution) => {
              initialSolutions[sol.challengeId] = sol
              initialTimeSpent[sol.challengeId] = sol.timeSpent
            })
          }
          
          setSolutions(initialSolutions)
          setTimeSpent(initialTimeSpent)
        } else {
          router.push('/assessment')
        }
      } catch (error) {
        console.error('Failed to fetch assessment:', error)
        router.push('/assessment')
      } finally {
        setLoading(false)
      }
    }

    fetchAssessment()
  }, [user, assessmentId, router])

  useEffect(() => {
    // Track time spent on current challenge
    const interval = setInterval(() => {
      if (challenges.length > 0 && !isCompleted) {
        const currentChallenge = challenges[currentChallengeIndex]
        if (currentChallenge) {
          setTimeSpent(prev => ({
            ...prev,
            [currentChallenge.id]: (prev[currentChallenge.id] || 0) + 1
          }))
        }
      }
    }, 1000)

    return () => clearInterval(interval)
  }, [currentChallengeIndex, challenges, isCompleted])

  const handleCodeChange = (code: string) => {
    if (challenges.length === 0) return
    
    const currentChallenge = challenges[currentChallengeIndex]
    setSolutions(prev => ({
      ...prev,
      [currentChallenge.id]: {
        ...prev[currentChallenge.id],
        code,
        timeSpent: timeSpent[currentChallenge.id] || 0
      }
    }))
  }

  const handleSubmit = async () => {
    try {
      setSubmitting(true)
      
      const solutionsArray = Object.values(solutions).map(sol => ({
        ...sol,
        timeSpent: timeSpent[sol.challengeId] || 0
      }))
      
      const res = await fetch('/api/assessments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          interviewId: assessmentId,
          candidateEmail: user.email,
          solutions: solutionsArray
        })
      })
      
      if (res.ok) {
        setIsCompleted(true)
        alert('Assessment submitted successfully!')
        router.push('/assessment')
      } else {
        throw new Error('Failed to submit assessment')
      }
    } catch (error) {
      console.error('Error submitting assessment:', error)
      alert('Failed to submit assessment. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'Easy':
        return 'bg-green-900/30 text-green-300 border-green-500/30'
      case 'Medium':
        return 'bg-yellow-900/30 text-yellow-300 border-yellow-500/30'
      case 'Hard':
        return 'bg-red-900/30 text-red-300 border-red-500/30'
      default:
        return 'bg-secondary text-foreground'
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background p-8">
        <div className="max-w-6xl mx-auto">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-300 rounded w-1/3 mb-4"></div>
            <div className="h-4 bg-gray-300 rounded w-1/2 mb-8"></div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="h-96 bg-gray-300 rounded"></div>
              <div className="h-96 bg-gray-300 rounded"></div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (!interview || challenges.length === 0) {
    return (
      <div className="min-h-screen bg-background p-8">
        <div className="max-w-4xl mx-auto text-center py-12">
          <Code2 className="w-16 h-16 mx-auto mb-4 text-foreground/30" />
          <h1 className="text-2xl font-bold mb-4">Assessment Not Found</h1>
          <p className="text-foreground/60 mb-6">This assessment doesn't exist or you don't have access to it.</p>
          <button
            onClick={() => router.push('/assessment')}
            className="px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary-dark transition"
          >
            Back to Assessments
          </button>
        </div>
      </div>
    )
  }

  const currentChallenge = challenges[currentChallengeIndex]

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-border bg-secondary/50">
        <div className="max-w-7xl mx-auto p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => router.push('/assessment')}
                className="p-2 hover:bg-secondary rounded-lg transition"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div>
                <h1 className="text-xl font-bold">{interview.title}</h1>
                <p className="text-sm text-foreground/60">
                  Assessment by {interview.interviewerName} • {challenges.length} challenges
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              <div className="text-sm text-foreground/60">
                Challenge {currentChallengeIndex + 1} of {challenges.length}
              </div>
              
              {!isCompleted && (
                <div className="flex items-center gap-2 text-sm">
                  <Clock className="w-4 h-4" />
                  {formatTime(timeSpent[currentChallenge?.id] || 0)}
                </div>
              )}
              
              {isCompleted && (
                <div className="flex items-center gap-2 text-green-400">
                  <CheckCircle className="w-5 h-5" />
                  <span className="text-sm">Completed</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-4">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-[calc(100vh-200px)]">
          {/* Challenge Description */}
          <div className="bg-secondary/50 border border-border rounded-lg p-6 overflow-y-auto">
            <div className="mb-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-2xl font-bold">{currentChallenge.title}</h2>
                <span className={`px-3 py-1 rounded-full text-sm border ${getDifficultyColor(currentChallenge.difficulty)}`}>
                  {currentChallenge.difficulty}
                </span>
              </div>
              
              <div className="flex items-center gap-2 mb-4 text-sm text-foreground/60">
                <span className="px-2 py-1 bg-secondary rounded">{currentChallenge.category}</span>
              </div>
            </div>

            <div className="prose prose-invert max-w-none">
              <div className="whitespace-pre-wrap text-foreground/80 leading-relaxed">
                {currentChallenge.description}
              </div>
            </div>

            {currentChallenge.testCases && currentChallenge.testCases.length > 0 && (
              <div className="mt-6">
                <h3 className="text-lg font-semibold mb-3">Test Cases</h3>
                <div className="space-y-4">
                  {currentChallenge.testCases.map((testCase, index) => (
                    <div key={index} className="bg-background border border-border rounded-lg p-4">
                      {testCase.description && (
                        <div className="text-sm text-foreground/60 mb-2">{testCase.description}</div>
                      )}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                        <div>
                          <div className="font-medium text-foreground/80 mb-1">Input:</div>
                          <code className="bg-secondary/50 p-2 rounded block">{testCase.input}</code>
                        </div>
                        <div>
                          <div className="font-medium text-foreground/80 mb-1">Expected Output:</div>
                          <code className="bg-secondary/50 p-2 rounded block">{testCase.expectedOutput}</code>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Code Editor */}
          <div className="bg-secondary/50 border border-border rounded-lg overflow-hidden">
            <div className="border-b border-border p-4">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold">Code Editor</h3>
                {!isCompleted && (
                  <div className="flex items-center gap-2 text-sm text-foreground/60">
                    <Play className="w-4 h-4" />
                    Write your solution
                  </div>
                )}
              </div>
            </div>
            
            <div className="p-4 h-full">
              <textarea
                value={solutions[currentChallenge.id]?.code || ''}
                onChange={(e) => handleCodeChange(e.target.value)}
                disabled={isCompleted}
                className="w-full h-full bg-background border border-border rounded-lg p-4 font-mono text-sm resize-none focus:outline-none focus:border-primary transition"
                placeholder="Write your solution here..."
              />
            </div>
          </div>
        </div>

        {/* Navigation and Submit */}
        <div className="flex items-center justify-between mt-6 p-4 bg-secondary/50 border border-border rounded-lg">
          <div className="flex gap-2">
            <button
              onClick={() => setCurrentChallengeIndex(Math.max(0, currentChallengeIndex - 1))}
              disabled={currentChallengeIndex === 0}
              className="px-4 py-2 border border-border rounded-lg hover:bg-secondary transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Previous
            </button>
            
            <button
              onClick={() => setCurrentChallengeIndex(Math.min(challenges.length - 1, currentChallengeIndex + 1))}
              disabled={currentChallengeIndex === challenges.length - 1}
              className="px-4 py-2 border border-border rounded-lg hover:bg-secondary transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              Next
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>

          <div className="flex items-center gap-4">
            {challenges.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentChallengeIndex(index)}
                className={`w-8 h-8 rounded-full border text-sm transition ${
                  index === currentChallengeIndex
                    ? 'bg-primary text-white border-primary'
                    : 'border-border hover:bg-secondary'
                }`}
              >
                {index + 1}
              </button>
            ))}
          </div>

          <div>
            {!isCompleted ? (
              <button
                onClick={handleSubmit}
                disabled={submitting}
                className="px-6 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submitting ? 'Submitting...' : 'Submit Assessment'}
              </button>
            ) : (
              <div className="flex items-center gap-2 text-green-400">
                <CheckCircle className="w-5 h-5" />
                <span>Assessment Completed</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}