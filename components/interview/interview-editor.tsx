"use client"

import { useEffect, useState, useCallback } from "react"
import { useRouter } from "next/navigation"
import CodeEditor from "./code-editor"
import UserPresence from "./user-presence"
import TestResults from "./test-results"
import { socketService } from "@/lib/socket-service"

interface InterviewEditorProps {
  sessionId: string
}

interface User {
  userId: string
  role: string
  email: string
  cursorPosition?: { line: number; column: number }
}

interface Message {
  sender: string
  message: string
  timestamp: Date
}

interface TestResult {
  name: string
  passed: boolean
  expected: string
  actual: string
  error?: string
}

export default function InterviewEditor({ sessionId }: InterviewEditorProps) {
  const router = useRouter()
  const [code, setCode] = useState("")
  const [language, setLanguage] = useState("javascript")
  const [messages, setMessages] = useState<Message[]>([])
  const [messageInput, setMessageInput] = useState("")
  const [users, setUsers] = useState<User[]>([])
  const [currentUserId, setCurrentUserId] = useState("")
  const [testResults, setTestResults] = useState<TestResult[]>([])
  const [isRunningTests, setIsRunningTests] = useState(false)
  const [error, setError] = useState("")
  const [interview, setInterview] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [challenges, setChallenges] = useState<any[]>([])
  const [selectedChallenge, setSelectedChallenge] = useState<any>(null)
  const [showChallenges, setShowChallenges] = useState(true)
  const [timeRemaining, setTimeRemaining] = useState<number>(0)
  const [timerActive, setTimerActive] = useState(false)
  const [interviewCompleted, setInterviewCompleted] = useState(false)
  const [timerInterval, setTimerInterval] = useState<NodeJS.Timeout | null>(null)

  const startTimer = (durationMinutes: number = 60) => {
    const totalSeconds = durationMinutes * 60
    setTimeRemaining(totalSeconds)
    setTimerActive(true)
    setInterviewCompleted(false)
    
    const interval = setInterval(() => {
      setTimeRemaining(prev => {
        if (prev <= 1) {
          completeInterview('time_expired')
          return 0
        }
        return prev - 1
      })
    }, 1000)
    
    setTimerInterval(interval)
  }
  
  const completeInterview = async (reason: 'time_expired' | 'manual_cancel' | 'manual_submit') => {
    if (timerInterval) {
      clearInterval(timerInterval)
      setTimerInterval(null)
    }
    
    setTimerActive(false)
    setInterviewCompleted(true)
    
    try {
      const completionData = {
        interviewId: sessionId,
        completionReason: reason,
        finalCode: code,
        selectedChallenge: selectedChallenge?.id || null,
        timeRemaining,
        completedAt: new Date().toISOString()
      }
      
      await fetch('/api/interviews/complete', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(completionData)
      })
      
      console.log(`Interview completed: ${reason}`)
    } catch (error) {
      console.error('Error completing interview:', error)
    }
  }
  
  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = seconds % 60
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`
  }
  
  const getTimerColor = () => {
    const percentage = (timeRemaining / (60 * 60)) * 100
    if (percentage > 50) return 'text-green-400'
    if (percentage > 20) return 'text-yellow-400'
    return 'text-red-400'
  }

  const handleSendMessage = () => {
    if (messageInput.trim()) {
      const message = {
        sender: currentUserId,
        message: messageInput.trim(),
        timestamp: new Date()
      }
      setMessages(prev => [...prev, message])
      setMessageInput('')
      socketService.emitMessage(sessionId, message)
    }
  }

  useEffect(() => {
    const currentSession = localStorage.getItem('currentSession')
    const token = currentSession ? localStorage.getItem(`token_${currentSession}`) : null
    if (!token) {
      router.push("/login")
      return
    }

    const fetchInterview = async () => {
      try {
        const response = await fetch(`/api/interviews/${sessionId}`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        })
        if (response.ok) {
          const data = await response.json()
          setInterview(data.interview)
          
          const challengesResponse = await fetch('/api/challenges', {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          })
          if (challengesResponse.ok) {
            const challengesData = await challengesResponse.json()
            
            if (data.interview?.selectedChallenges && data.interview.selectedChallenges.length > 0) {
              const interviewChallenges = challengesData.filter((challenge: any) => 
                data.interview.selectedChallenges.includes(challenge.id)
              )
              setChallenges(interviewChallenges)
              
              if (interviewChallenges.length > 0) {
                setSelectedChallenge(interviewChallenges[0])
                setCode(interviewChallenges[0].starterCode || "function solution() {\n    \n}\n")
              }
            } else {
              setChallenges(challengesData)
              
              if (challengesData.length > 0) {
                setSelectedChallenge(challengesData[0])
                setCode(challengesData[0].starterCode || "function solution() {\n    \n}\n")
              }
            }
          }
          
          if (!data.interview?.selectedChallenges && data.interview?.starterCode) {
            setCode(data.interview.starterCode)
          }
        } else {
          console.log('Interview not found, showing default challenges')
          const challengesResponse = await fetch('/api/challenges', {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          })
          if (challengesResponse.ok) {
            const challengesData = await challengesResponse.json()
            setChallenges(challengesData)
            
            if (challengesData.length > 0) {
              setSelectedChallenge(challengesData[0])
              setCode(challengesData[0].starterCode || "function solution() {\n    \n}\n")
            }
          }
        }
      } catch (error) {
        console.error('Error fetching interview:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchInterview()

    try {
      const currentSession = localStorage.getItem('currentSession')
      const userStr = currentSession ? localStorage.getItem(`user_${currentSession}`) : null
      const user = JSON.parse(userStr || "{}")
      setCurrentUserId(user.userId)

      const socket = socketService.connect(sessionId, user.userId, user.role)

      socketService.onCodeUpdate(({ code: updatedCode, language: updatedLanguage }) => {
        setCode(updatedCode)
        setLanguage(updatedLanguage)
      })

      socketService.onUserJoined(({ userId, role, email }) => {
        setUsers((prev) => [...prev, { userId, role, email }])
      })

      socketService.onUserLeft(({ userId }) => {
        setUsers((prev) => prev.filter((u) => u.userId !== userId))
      })

      socketService.onMessage(({ message, sender, timestamp }) => {
        setMessages((prev) => [...prev, { message, sender, timestamp }])
      })

      socketService.onTestResults(({ passed, failed, results }) => {
        setTestResults(results)
        setIsRunningTests(false)
      })

      socketService.onError((err) => {
        setError(err)
      })

      return () => {
        socketService.disconnect()
      }
    } catch (error) {
      router.push("/login")
    }
  }, [sessionId, router])

  useEffect(() => {
    if (interview && !timerActive && !interviewCompleted) {
      const durationMinutes = interview.duration || 60
      startTimer(durationMinutes)
    }
  }, [interview, timerActive, interviewCompleted])
  
  useEffect(() => {
    return () => {
      if (timerInterval) {
        clearInterval(timerInterval)
      }
    }
  }, [timerInterval])

  const handleCodeChange = useCallback(
    (newCode: string) => {
      setCode(newCode)
      socketService.emitCodeChange(sessionId, newCode, language)
    },
    [sessionId, language],
  )

  const handleLanguageChange = (newLanguage: string) => {
    setLanguage(newLanguage)
    socketService.emitCodeChange(sessionId, code, newLanguage)
  }

  const handleRunTests = async () => {
    if (!selectedChallenge || !selectedChallenge.testCases) {
      console.warn('No test cases available for the selected challenge')
      return
    }
    
    setIsRunningTests(true)
    setTestResults([])
    
    try {
      console.log('🧪 Running tests for challenge:', selectedChallenge.title)
      
      try {
        const response = await fetch('/api/run-code', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            code,
            language,
            testCases: selectedChallenge.testCases
          })
        })
        
        if (response.ok) {
          const results = await response.json()
          setTestResults(results)
          console.log('✅ API test execution completed:', results)
          
          socketService.emitRunTests(sessionId, code, language)
          return
        } else {
          console.warn('API endpoint failed, falling back to local execution')
        }
      } catch (apiError) {
        console.warn('API call failed, falling back to local execution:', apiError)
      }
      
      console.log('🔄 Running tests locally')
      const results: TestResult[] = []
      
      let testFunction: any = null
      
      try {
        const codeToEvaluate = `
          ${code}
          
          if (typeof twoSum !== 'undefined') {
            window.testFunction = twoSum
          } else if (typeof solution !== 'undefined') {
            window.testFunction = solution
          } else if (typeof isPalindrome !== 'undefined') {
            window.testFunction = isPalindrome
          } else if (typeof fizzBuzz !== 'undefined') {
            window.testFunction = fizzBuzz
          } else if (typeof reverseString !== 'undefined') {
            window.testFunction = reverseString
          } else {
            const functionMatch = \`${code}\`.match(/function\\s+(\\w+)\\s*\\(/)
            if (functionMatch) {
              window.testFunction = eval(functionMatch[1])
            }
          }
        `
        
        eval(codeToEvaluate)
        testFunction = (window as any).testFunction
        
        if (!testFunction) {
          throw new Error('No valid function found in code')
        }
      } catch (evalError) {
        console.error('Code evaluation failed:', evalError)
        setTestResults([{
          name: 'Code Compilation',
          passed: false,
          expected: 'Valid JavaScript function',
          actual: 'Syntax/Runtime Error',
          error: (evalError as Error).message
        }])
        return
      }
      for (let i = 0; i < selectedChallenge.testCases.length; i++) {
        const testCase = selectedChallenge.testCases[i]
        
        try {
          let actualResult
          let expectedResult
          
          if (testCase.input.includes('target:')) {
            const [arrayPart, targetPart] = testCase.input.split('target:')
            const nums = JSON.parse(arrayPart.trim())
            const target = parseInt(targetPart.trim())
            actualResult = testFunction(nums, target)
          } else if (testCase.input.startsWith('[')) {
            const inputArray = JSON.parse(testCase.input)
            actualResult = testFunction(inputArray)
          } else if (testCase.input.startsWith('"')) {
            const inputString = JSON.parse(testCase.input)
            actualResult = testFunction(inputString)
          } else if (testCase.input.includes(',')) {
            const inputs = testCase.input.split(',').map(i => {
              try {
                return JSON.parse(i.trim())
              } catch {
                return i.trim()
              }
            })
            actualResult = testFunction(...inputs)
          } else {
            try {
              const numericInput = parseFloat(testCase.input)
              actualResult = testFunction(isNaN(numericInput) ? testCase.input : numericInput)
            } catch {
              actualResult = testFunction(testCase.input)
            }
          }
          
          expectedResult = JSON.parse(testCase.expectedOutput)
          
          let passed = false
          if (Array.isArray(actualResult) && Array.isArray(expectedResult)) {
            if (actualResult.length === expectedResult.length) {
              const exactMatch = JSON.stringify(actualResult) === JSON.stringify(expectedResult)
              const sortedActual = [...actualResult].sort()
              const sortedExpected = [...expectedResult].sort()
              const sortedMatch = JSON.stringify(sortedActual) === JSON.stringify(sortedExpected)
              passed = exactMatch || sortedMatch
            }
          } else {
            passed = JSON.stringify(actualResult) === JSON.stringify(expectedResult)
          }
          
          results.push({
            name: testCase.description || `Test Case ${i + 1}`,
            passed,
            expected: JSON.stringify(expectedResult),
            actual: JSON.stringify(actualResult)
          })
          
        } catch (testError) {
          results.push({
            name: testCase.description || `Test Case ${i + 1}`,
            passed: false,
            expected: testCase.expectedOutput,
            actual: 'Runtime Error',
            error: (testError as Error).message
          })
        }
      }
      
      setTestResults(results)
      console.log('✅ Local test execution completed:', results)
      
      socketService.emitRunTests(sessionId, code, language)
      
    } catch (error) {
      console.error('❌ Error running tests:', error)
      setTestResults([{
        name: 'Test Execution',
        passed: false,
        expected: 'Successful test execution',
        actual: 'Failed',
        error: (error as Error).message
      }])
    } finally {
      setIsRunningTests(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-foreground/60">Loading interview...</p>
        </div>
      </div>
    )
  }
  
  if (interviewCompleted) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="text-center max-w-md p-8 bg-card border border-border rounded-lg">
          <div className="w-16 h-16 mx-auto mb-4 bg-green-500/20 rounded-full flex items-center justify-center">
            <span className="text-green-400 text-2xl">✓</span>
          </div>
          <h1 className="text-xl font-semibold mb-2">Interview Completed</h1>
          <p className="text-foreground/60 mb-4">
            Thank you for participating in the coding interview. Your responses have been saved.
          </p>
          <button
            onClick={() => router.push('/dashboard')}
            className="px-6 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition"
          >
            Return to Dashboard
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <div className="bg-background border-b border-border p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <h1 className="text-xl font-semibold">Interview Session</h1>
            <span className="text-sm text-foreground/60">ID: {sessionId}</span>
          </div>
          
          <div className="flex items-center gap-4">
            {timerActive && (
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-red-400 rounded-full animate-pulse"></div>
                <span className={`font-mono text-lg font-semibold ${getTimerColor()}`}>
                  {formatTime(timeRemaining)}
                </span>
              </div>
            )}
            
            <div className="flex gap-2">
              <button
                onClick={() => completeInterview('manual_submit')}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition text-sm"
                disabled={!timerActive}
              >
                Submit
              </button>
              <button
                onClick={() => {
                  if (confirm('Are you sure you want to cancel the interview? This will end the session.')) {
                    completeInterview('manual_cancel')
                  }
                }}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition text-sm"
                disabled={!timerActive}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
        {timerActive && timeRemaining <= 300 && timeRemaining > 60 && (
          <div className="bg-yellow-500/20 border border-yellow-500/50 rounded-lg p-3 mt-4">
            <p className="text-yellow-300 text-sm">
              ⚠️ <strong>5 minutes remaining!</strong> Please finalize your solution.
            </p>
          </div>
        )}
        
        {timerActive && timeRemaining <= 60 && timeRemaining > 0 && (
          <div className="bg-red-500/20 border border-red-500/50 rounded-lg p-3 mt-4">
            <p className="text-red-300 text-sm">
              🚨 <strong>1 minute remaining!</strong> The interview will end automatically.
            </p>
          </div>
        )}
      </div>
      
      <div className="flex-1 p-4 flex gap-4">
      {((interview && interview.questions && interview.questions.length > 0) || challenges.length > 0) && (
        <div className="w-96 flex flex-col gap-4">
          <div className="bg-secondary/30 border border-border rounded-lg overflow-hidden">
            {interview && (
              <div className="p-4 border-b border-border">
                <h2 className="text-lg font-semibold text-foreground mb-2">{interview.title}</h2>
                <div className="flex items-center gap-4 text-sm text-foreground/60">
                  <span>{interview.date}</span>
                  <span>{interview.time}</span>
                  <span className="px-2 py-1 bg-primary/20 text-primary rounded">{interview.platform}</span>
                </div>
              </div>
            )}
            {challenges.length > 0 && interview && interview.questions && interview.questions.length > 0 && (
              <div className="flex border-b border-border bg-secondary/20">
                <button
                  onClick={() => setShowChallenges(false)}
                  className={`flex-1 px-4 py-3 text-sm font-medium transition ${
                    !showChallenges 
                      ? 'bg-primary/20 text-primary border-b-2 border-primary' 
                      : 'text-foreground/60 hover:text-foreground hover:bg-secondary/50'
                  }`}
                >
                  📝 Questions ({interview.questions.length})
                </button>
                <button
                  onClick={() => setShowChallenges(true)}
                  className={`flex-1 px-4 py-3 text-sm font-medium transition ${
                    showChallenges 
                      ? 'bg-primary/20 text-primary border-b-2 border-primary' 
                      : 'text-foreground/60 hover:text-foreground hover:bg-secondary/50'
                  }`}
                >
                  🧩 Challenges ({challenges.length})
                </button>
              </div>
            )}
            
            <div className="p-4 max-h-96 overflow-y-auto">
              {(!showChallenges || challenges.length === 0) && interview && interview.questions && interview.questions.length > 0 && (
                <div className="space-y-3">
                  <h3 className="font-semibold text-foreground flex items-center gap-2 mb-4">
                    📝 Interview Questions
                  </h3>
                  {interview.questions.map((question: string, index: number) => (
                    <div key={index} className="bg-background/50 border border-border/50 rounded-lg p-3">
                      <div className="flex items-start gap-3">
                        <span className="shrink-0 w-6 h-6 bg-primary/20 text-primary rounded-full flex items-center justify-center text-xs font-semibold">
                          {index + 1}
                        </span>
                        <p className="text-sm text-foreground/80 leading-relaxed">{question}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              {(showChallenges || !interview?.questions?.length) && challenges.length > 0 && (
                <div className="space-y-3">
                  <h3 className="font-semibold text-foreground flex items-center gap-2 mb-4">
                    🧩 Coding Challenges
                  </h3>
                  {challenges.map((challenge: any, index: number) => (
                    <div 
                      key={challenge.id} 
                      className={`bg-background/50 border rounded-lg p-3 cursor-pointer transition ${
                        selectedChallenge?.id === challenge.id 
                          ? 'border-primary bg-primary/10' 
                          : 'border-border/50 hover:border-primary/50'
                      }`}
                      onClick={() => {
                        setSelectedChallenge(challenge)
                        setCode(challenge.starterCode || "")
                      }}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <h4 className="font-medium text-sm">{challenge.title}</h4>
                        <span className={`px-2 py-1 text-xs rounded-full border ${
                          challenge.difficulty === 'Easy' ? 'bg-green-900/30 text-green-300 border-green-500/30' :
                          challenge.difficulty === 'Medium' ? 'bg-yellow-900/30 text-yellow-300 border-yellow-500/30' :
                          'bg-red-900/30 text-red-300 border-red-500/30'
                        }`}>
                          {challenge.difficulty}
                        </span>
                      </div>
                      <p className="text-xs text-foreground/60 mb-2">{challenge.category}</p>
                      <p className="text-xs text-foreground/70 line-clamp-2">{challenge.description}</p>
                      {selectedChallenge?.id === challenge.id && (
                        <div className="mt-2 text-xs text-primary flex items-center gap-1">
                          ✓ Currently selected for coding
                        </div>
                      )}
                    </div>
                  ))}
                  
                  {selectedChallenge && (
                    <div className="mt-4 p-3 bg-primary/10 border border-primary/30 rounded-lg">
                      <h4 className="font-medium text-sm text-primary mb-2">Active Challenge</h4>
                      <p className="text-xs text-foreground/80 mb-2">{selectedChallenge.description}</p>
                      {selectedChallenge.testCases && selectedChallenge.testCases.length > 0 && (
                        <div className="text-xs text-foreground/60">
                          {selectedChallenge.testCases.length} test case{selectedChallenge.testCases.length > 1 ? 's' : ''} available
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <div className="flex-1 flex flex-col gap-4">
        <CodeEditor
          code={code}
          language={language}
          onCodeChange={handleCodeChange}
          onLanguageChange={handleLanguageChange}
          onRunTests={handleRunTests}
        />

        <TestResults results={testResults} isRunning={isRunningTests} />
      </div>

      <div className="w-80 flex flex-col gap-4">
        <div className="bg-secondary/30 border border-border rounded-lg p-4">
          <h3 className="font-semibold text-foreground mb-3">Participants ({users.length})</h3>
          <UserPresence users={users} currentUserId={currentUserId} />
        </div>
        <div className="flex-1 bg-secondary/30 border border-border rounded-lg flex flex-col overflow-hidden">
          <div className="p-4 border-b border-border">
            <h3 className="font-semibold text-foreground">Chat</h3>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {messages.length === 0 ? (
              <p className="text-sm text-foreground/60 text-center">No messages yet</p>
            ) : (
              messages.map((msg, idx) => (
                <div key={idx} className="text-sm">
                  <p className="text-accent font-semibold text-xs">{msg.sender}</p>
                  <p className="text-foreground/80 break-all">{msg.message}</p>
                  <p className="text-xs text-foreground/40 mt-1">{new Date(msg.timestamp).toLocaleTimeString()}</p>
                </div>
              ))
            )}
          </div>

          <div className="p-4 border-t border-border flex gap-2">
            <input
              type="text"
              value={messageInput}
              onChange={(e) => setMessageInput(e.target.value)}
              onKeyPress={(e) => e.key === "Enter" && handleSendMessage()}
              placeholder="Type message..."
              className="flex-1 px-3 py-2 bg-background border border-border rounded text-sm outline-none focus:border-primary transition"
            />
            <button
              onClick={handleSendMessage}
              className="px-3 py-2 bg-primary text-white rounded hover:bg-primary-dark transition text-sm font-semibold"
            >
              Send
            </button>
          </div>
        </div>

        {error && (
          <div className="p-3 bg-red-900/20 border border-red-500/30 rounded-lg text-sm text-red-200">{error}</div>
        )}
      </div>
    </div>
    </div>
  )
}
