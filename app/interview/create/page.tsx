"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Calendar, Clock, Users, Video, MessageSquare, Code2 } from "lucide-react"
import DashboardLayout from "@/components/dashboard/dashboard-layout"

export default function CreateInterviewPage() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [formData, setFormData] = useState({
    title: "",
    type: "Technical Interview",
    candidateEmail: "",
    date: "",
    time: "",
    duration: "60", // Duration in minutes
    platform: "Google Meet",
    platformLink: "",
    description: "",
    questions: [""],
    selectedChallenges: [] as string[],
    assessmentMode: "live" // "live", "assessment", "both"
  })

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
  }

  const handleQuestionChange = (index: number, value: string) => {
    const newQuestions = [...formData.questions]
    newQuestions[index] = value
    setFormData({
      ...formData,
      questions: newQuestions
    })
  }

  const addQuestion = () => {
    setFormData({
      ...formData,
      questions: [...formData.questions, ""]
    })
  }

  const removeQuestion = (index: number) => {
    const newQuestions = formData.questions.filter((_, i) => i !== index)
    setFormData({
      ...formData,
      questions: newQuestions
    })
  }

  const handleChallengeSelection = (challengeId: string, selected: boolean) => {
    const newSelected = selected 
      ? [...formData.selectedChallenges, challengeId]
      : formData.selectedChallenges.filter(id => id !== challengeId)
    
    setFormData({
      ...formData,
      selectedChallenges: newSelected
    })
  }

  // Fetch challenges on component mount
  useEffect(() => {
    const fetchChallenges = async () => {
      try {
        const currentSession = localStorage.getItem('currentSession')
        const token = currentSession ? localStorage.getItem(`token_${currentSession}`) : null
        const res = await fetch('/api/challenges', {
          headers: { Authorization: `Bearer ${token}` }
        })
        if (res.ok) {
          const data = await res.json()
          setChallenges(data || [])
        }
      } catch (error) {
        console.error('Failed to fetch challenges:', error)
      }
    }
    fetchChallenges()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      setLoading(true)
      
      // Generate interview ID
      const interviewId = Date.now().toString()
      
      // Get user data
      const currentSession = localStorage.getItem('currentSession')
      const userStr = currentSession ? localStorage.getItem(`user_${currentSession}`) : null
      const userData = userStr ? JSON.parse(userStr) : null
      
      // Create interview in database
      const interviewData = {
        id: interviewId,
        title: formData.title,
        type: formData.type,
        date: formData.date,
        time: formData.time,
        candidateEmail: formData.candidateEmail,
        interviewerName: userData?.name || 'Anonymous Interviewer',
        interviewerEmail: userData?.email || '',
        platform: formData.platform,
        platformLink: formData.platformLink,
        description: formData.description,
        questions: formData.questions.filter(q => q.trim() !== ''),
        selectedChallenges: formData.selectedChallenges,
        assessmentMode: formData.assessmentMode,
        duration: parseInt(formData.duration) || 60,
        status: 'scheduled'
      }
      
      const currentSessionToken = currentSession ? localStorage.getItem(`token_${currentSession}`) : null
      const interviewResponse = await fetch('/api/interviews', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${currentSessionToken}`
        },
        body: JSON.stringify(interviewData)
      })
      
      if (!interviewResponse.ok) {
        throw new Error('Failed to create interview')
      }

      // Send invitation
      const invitationData = {
        interviewId,
        candidateEmail: formData.candidateEmail,
        interviewTitle: formData.title,
        interviewDate: formData.date,
        interviewTime: formData.time,
        platform: formData.platform,
        platformLink: formData.platformLink,
        interviewerName: userData?.name || 'Anonymous Interviewer',
        questions: formData.questions.filter(q => q.trim() !== ''),
        assessmentMode: formData.assessmentMode,
        selectedChallenges: formData.selectedChallenges
      }
      
      const response = await fetch('/api/invitations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(invitationData)
      })
      
      if (!response.ok) {
        throw new Error('Failed to send invitation')
      }
      
      const result = await response.json()
      console.log('📧 Invitation sent:', result)
      
      // Show invitation details instead of redirecting immediately
      setInvitationDetails(result)
      setInvitationSent(true)
      
    } catch (error) {
      console.error('Error creating interview:', error)
      alert('Failed to create interview. Please try again.')
    } finally {
      setLoading(false)
    }
  }
  
  const [loading, setLoading] = useState(false)
  const [invitationSent, setInvitationSent] = useState(false)
  const [invitationDetails, setInvitationDetails] = useState<any>(null)
  const [challenges, setChallenges] = useState<any[]>([])

  if (invitationSent && invitationDetails) {
    return (
      <div className="min-h-screen bg-background p-8">
        <div className="max-w-4xl mx-auto">
          <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-8 text-center">
            <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-6">
              <span className="text-2xl text-white">✓</span>
            </div>
            <h1 className="text-3xl font-bold mb-4 text-green-400">Interview Created Successfully!</h1>
            <p className="text-foreground/60 mb-8">The interview has been created and an invitation would normally be sent via email.</p>
            
            <div className="bg-secondary/50 border border-border rounded-lg p-6 mb-8 text-left">
              <h2 className="text-xl font-semibold mb-4">
                📧 Email {invitationDetails.emailResult?.development ? 'Preview (Development Mode)' : 'Sent Successfully'}
              </h2>
              <div className="space-y-4">
                <div>
                  <strong>To:</strong> {formData.candidateEmail}
                </div>
                <div>
                  <strong>Subject:</strong> {invitationDetails.emailContent?.subject}
                </div>
                
                {invitationDetails.emailResult?.development && (
                  <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4">
                    <p className="text-yellow-400 text-sm">
                      ⚠️ <strong>Development Mode:</strong> Email was not actually sent. 
                      To enable real emails, configure RESEND_API_KEY in your .env.local file.
                    </p>
                  </div>
                )}
                
                {!invitationDetails.emailResult?.development && (
                  <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-4">
                    <p className="text-green-400 text-sm">
                      ✅ <strong>Email sent successfully!</strong> The candidate will receive the invitation in their inbox.
                    </p>
                  </div>
                )}
              </div>
            </div>

            <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-6 mb-8">
              <h3 className="text-lg font-semibold mb-4 text-blue-400">🔗 Direct Invitation Link</h3>
              <p className="text-foreground/60 mb-4">Since email is not configured, share this link directly with the candidate:</p>
              <div className="bg-background border border-border rounded-lg p-4 mb-4">
                <code className="text-sm break-all">{invitationDetails.joinLink}</code>
              </div>
              <button
                onClick={() => navigator.clipboard.writeText(invitationDetails.joinLink)}
                className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition"
              >
                📋 Copy Link
              </button>
            </div>

            <div className="flex gap-4 justify-center">
              <button
                onClick={() => router.push('/interview')}
                className="px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary-dark transition"
              >
                View All Interviews
              </button>
              <button
                onClick={() => {
                  setInvitationSent(false)
                  setInvitationDetails(null)
                  setFormData({
                    title: "",
                    type: "Technical Interview",
                    candidateEmail: "",
                    date: "",
                    time: "",
                    duration: "60",
                    platform: "Google Meet",
                    platformLink: "",
                    description: "",
                    questions: [""],
                    selectedChallenges: [],
                    assessmentMode: "live"
                  })
                }}
                className="px-6 py-3 border border-border rounded-lg hover:bg-secondary transition"
              >
                Create Another Interview
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Create New Interview</h1>
          <p className="text-foreground/60">Set up a new coding interview session</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Basic Information */}
          <div className="bg-secondary/50 border border-border rounded-lg p-6">
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <MessageSquare className="w-5 h-5" />
              Basic Information
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Interview Title</label>
                <input
                  type="text"
                  name="title"
                  value={formData.title}
                  onChange={handleChange}
                  placeholder="Frontend Developer Interview"
                  className="w-full px-4 py-2 bg-background border border-border rounded-lg focus:outline-none focus:border-primary transition"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2">Interview Type</label>
                <select
                  name="type"
                  value={formData.type}
                  onChange={handleChange}
                  className="w-full px-4 py-2 bg-background border border-border rounded-lg focus:outline-none focus:border-primary transition"
                >
                  <option value="Technical Interview">Technical Interview</option>
                  <option value="Code Review">Code Review</option>
                  <option value="System Design">System Design</option>
                  <option value="Behavioral Interview">Behavioral Interview</option>
                  <option value="Pair Programming">Pair Programming</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2">Candidate Email</label>
                <input
                  type="email"
                  name="candidateEmail"
                  value={formData.candidateEmail}
                  onChange={handleChange}
                  placeholder="candidate@example.com"
                  className="w-full px-4 py-2 bg-background border border-border rounded-lg focus:outline-none focus:border-primary transition"
                  required
                />
              </div>
            </div>
            
            <div className="mt-4">
              <label className="block text-sm font-medium mb-2">Description</label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                placeholder="Brief description of the interview focus and expectations..."
                rows={3}
                className="w-full px-4 py-2 bg-background border border-border rounded-lg focus:outline-none focus:border-primary transition"
              />
            </div>
          </div>

          {/* Scheduling */}
          <div className="bg-secondary/50 border border-border rounded-lg p-6">
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <Calendar className="w-5 h-5" />
              Schedule
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Date</label>
                <input
                  type="date"
                  name="date"
                  value={formData.date}
                  onChange={handleChange}
                  className="w-full px-4 py-2 bg-background border border-border rounded-lg focus:outline-none focus:border-primary transition"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2">Time</label>
                <input
                  type="time"
                  name="time"
                  value={formData.time}
                  onChange={handleChange}
                  className="w-full px-4 py-2 bg-background border border-border rounded-lg focus:outline-none focus:border-primary transition"
                  required
                />
              </div>
            </div>
            
            <div className="mt-4">
              <label className="block text-sm font-medium mb-2">Duration (minutes)</label>
              <select
                name="duration"
                value={formData.duration}
                onChange={handleChange}
                className="w-full px-4 py-2 bg-background border border-border rounded-lg focus:outline-none focus:border-primary transition"
              >
                <option value="30">30 minutes</option>
                <option value="45">45 minutes</option>
                <option value="60">60 minutes</option>
                <option value="90">90 minutes</option>
                <option value="120">2 hours</option>
              </select>
            </div>
          </div>

          {/* Platform Selection */}
          <div className="bg-secondary/50 border border-border rounded-lg p-6">
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <Video className="w-5 h-5" />
              Video Platform
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Platform</label>
                <select
                  name="platform"
                  value={formData.platform}
                  onChange={handleChange}
                  className="w-full px-4 py-2 bg-background border border-border rounded-lg focus:outline-none focus:border-primary transition"
                >
                  <option value="Google Meet">Google Meet</option>
                  <option value="Microsoft Teams">Microsoft Teams</option>
                  <option value="Zoom">Zoom</option>
                  <option value="Discord">Discord</option>
                  <option value="Other">Other</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2">Meeting Link</label>
                <input
                  type="url"
                  name="platformLink"
                  value={formData.platformLink}
                  onChange={handleChange}
                  placeholder="https://meet.google.com/..."
                  className="w-full px-4 py-2 bg-background border border-border rounded-lg focus:outline-none focus:border-primary transition"
                />
              </div>
            </div>
          </div>

          {/* Questions */}
          <div className="bg-secondary/50 border border-border rounded-lg p-6">
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <MessageSquare className="w-5 h-5" />
              Interview Questions
            </h2>
            
            <div className="space-y-4">
              {formData.questions.map((question, index) => (
                <div key={index} className="flex gap-2">
                  <div className="flex-1">
                    <textarea
                      value={question}
                      onChange={(e) => handleQuestionChange(index, e.target.value)}
                      placeholder={`Question ${index + 1}: Describe the problem or task...`}
                      rows={3}
                      className="w-full px-4 py-2 bg-background border border-border rounded-lg focus:outline-none focus:border-primary transition"
                    />
                  </div>
                  {formData.questions.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeQuestion(index)}
                      className="px-3 py-2 text-red-400 hover:text-red-300 transition"
                    >
                      ✕
                    </button>
                  )}
                </div>
              ))}
              
              <button
                type="button"
                onClick={addQuestion}
                className="px-4 py-2 text-primary hover:text-accent transition border border-primary/30 rounded-lg"
              >
                + Add Question
              </button>
            </div>
          </div>

          {/* Assessment Mode */}
          <div className="bg-secondary/50 border border-border rounded-lg p-6">
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <MessageSquare className="w-5 h-5" />
              Assessment Mode
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <label className="flex items-center space-x-3 cursor-pointer">
                <input
                  type="radio"
                  name="assessmentMode"
                  value="live"
                  checked={formData.assessmentMode === "live"}
                  onChange={handleChange}
                  className="text-primary"
                />
                <div>
                  <div className="font-medium">Live Coding Only</div>
                  <div className="text-sm text-foreground/60">Real-time collaboration</div>
                </div>
              </label>
              
              <label className="flex items-center space-x-3 cursor-pointer">
                <input
                  type="radio"
                  name="assessmentMode"
                  value="assessment"
                  checked={formData.assessmentMode === "assessment"}
                  onChange={handleChange}
                  className="text-primary"
                />
                <div>
                  <div className="font-medium">Pre-Assessment</div>
                  <div className="text-sm text-foreground/60">Candidate completes before interview</div>
                </div>
              </label>
              
              <label className="flex items-center space-x-3 cursor-pointer">
                <input
                  type="radio"
                  name="assessmentMode"
                  value="both"
                  checked={formData.assessmentMode === "both"}
                  onChange={handleChange}
                  className="text-primary"
                />
                <div>
                  <div className="font-medium">Both</div>
                  <div className="text-sm text-foreground/60">Assessment + Live coding</div>
                </div>
              </label>
            </div>
          </div>

          {/* Challenge Selection */}
          {(formData.assessmentMode === "assessment" || formData.assessmentMode === "both") && (
            <div className="bg-secondary/50 border border-border rounded-lg p-6">
              <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                <Code2 className="w-5 h-5" />
                Select Challenges for Assessment
              </h2>
              
              {challenges.length === 0 ? (
                <div className="text-center py-8 text-foreground/60">
                  <Code2 className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p className="mb-4">No challenges available</p>
                  <button
                    type="button"
                    onClick={() => window.open('/challenges/create', '_blank')}
                    className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition"
                  >
                    Create Challenge
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {challenges.map((challenge) => (
                    <div
                      key={challenge.id}
                      className={`border rounded-lg p-4 cursor-pointer transition ${
                        formData.selectedChallenges.includes(challenge.id)
                          ? 'border-primary bg-primary/10'
                          : 'border-border hover:border-primary/50'
                      }`}
                      onClick={() => handleChallengeSelection(
                        challenge.id, 
                        !formData.selectedChallenges.includes(challenge.id)
                      )}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <h3 className="font-semibold">{challenge.title}</h3>
                        <input
                          type="checkbox"
                          checked={formData.selectedChallenges.includes(challenge.id)}
                          onChange={(e) => handleChallengeSelection(challenge.id, e.target.checked)}
                          className="text-primary"
                        />
                      </div>
                      <p className="text-sm text-foreground/60 mb-3">{challenge.description}</p>
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-1 text-xs rounded-full border ${
                          challenge.difficulty === 'Easy' ? 'bg-green-900/30 text-green-300 border-green-500/30' :
                          challenge.difficulty === 'Medium' ? 'bg-yellow-900/30 text-yellow-300 border-yellow-500/30' :
                          'bg-red-900/30 text-red-300 border-red-500/30'
                        }`}>
                          {challenge.difficulty}
                        </span>
                        <span className="text-xs text-foreground/60">{challenge.category}</span>
                        {challenge.estimatedTime && (
                          <span className="text-xs text-foreground/60">• {challenge.estimatedTime}</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          <div className="flex gap-4 justify-end">
            <button
              type="button"
              onClick={() => router.back()}
              className="px-6 py-3 border border-border rounded-lg hover:bg-secondary transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary-dark transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Sending Invitation...' : 'Create & Send Invitation'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}