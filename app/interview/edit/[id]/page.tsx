"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useParams } from "next/navigation"
import { getCurrentToken } from "@/lib/auth-utils"

export default function EditInterviewPage() {
  const router = useRouter()
  const params = useParams()
  const interviewId = params.id as string
  
  const [interview, setInterview] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [challenges, setChallenges] = useState<any[]>([])
  
  const [formData, setFormData] = useState({
    title: '',
    candidate: '',
    candidateEmail: '',
    date: '',
    time: '',
    type: 'technical',
    platform: 'platform',
    platformLink: '',
    description: '',
    selectedChallenges: [] as string[],
    assessmentMode: 'interview'
  })

  useEffect(() => {
    fetchInterview()
    fetchChallenges()
  }, [interviewId])

  const fetchInterview = async () => {
    try {
      const token = getCurrentToken()
      const res = await fetch(`/api/interviews/${interviewId}`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      
      if (res.ok) {
        const data = await res.json()
        setInterview(data.interview)
        setFormData({
          title: data.interview.title || '',
          candidate: data.interview.candidate || '',
          candidateEmail: data.interview.candidateEmail || '',
          date: data.interview.date || '',
          time: data.interview.time || '',
          type: data.interview.type || 'technical',
          platform: data.interview.platform || 'platform',
          platformLink: data.interview.platformLink || '',
          description: data.interview.description || '',
          selectedChallenges: data.interview.selectedChallenges || [],
          assessmentMode: data.interview.assessmentMode || 'interview'
        })
      }
    } catch (error) {
      console.error('Failed to fetch interview:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchChallenges = async () => {
    try {
      const res = await fetch('/api/challenges')
      if (res.ok) {
        const data = await res.json()
        setChallenges(data.challenges || [])
      }
    } catch (error) {
      console.error('Failed to fetch challenges:', error)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)

    try {
      const token = getCurrentToken()
      const res = await fetch(`/api/interviews/${interviewId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      })

      if (res.ok) {
        router.push('/dashboard?updated=true')
      } else {
        const errorData = await res.json()
        alert(errorData.error || 'Failed to update interview')
      }
    } catch (error) {
      console.error('Failed to update interview:', error)
      alert('Failed to update interview')
    } finally {
      setSaving(false)
    }
  }

  const toggleChallenge = (challengeId: string) => {
    setFormData(prev => ({
      ...prev,
      selectedChallenges: prev.selectedChallenges.includes(challengeId)
        ? prev.selectedChallenges.filter(id => id !== challengeId)
        : [...prev.selectedChallenges, challengeId]
    }))
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background text-foreground">
        <div className="max-w-4xl mx-auto p-6">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-300 rounded w-1/4 mb-6"></div>
            <div className="bg-secondary/50 border border-border rounded-lg p-6">
              <div className="space-y-4">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="h-10 bg-gray-300 rounded"></div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (!interview) {
    return (
      <div className="min-h-screen bg-background text-foreground">
        <div className="max-w-4xl mx-auto p-6">
          <div className="text-center py-12">
            <h1 className="text-2xl font-bold mb-4">Interview not found</h1>
            <button
              onClick={() => router.push('/dashboard')}
              className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/80 transition"
            >
              Back to Dashboard
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="max-w-4xl mx-auto p-6">
        <div className="flex items-center gap-4 mb-6">
          <button
            onClick={() => router.push('/dashboard')}
            className="px-3 py-1 bg-secondary border border-border rounded hover:bg-secondary/70 transition"
          >
            ← Back
          </button>
          <h1 className="text-2xl font-bold">Edit Interview</h1>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="bg-secondary/50 border border-border rounded-lg p-6">
            <h2 className="text-lg font-semibold mb-4">Interview Details</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Interview Title</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                  className="w-full px-3 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2">Interview Type</label>
                <select
                  value={formData.type}
                  onChange={(e) => setFormData(prev => ({ ...prev, type: e.target.value }))}
                  className="w-full px-3 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value="technical">Technical Interview</option>
                  <option value="behavioral">Behavioral Interview</option>
                  <option value="system-design">System Design</option>
                  <option value="coding">Coding Interview</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2">Candidate Name</label>
                <input
                  type="text"
                  value={formData.candidate}
                  onChange={(e) => setFormData(prev => ({ ...prev, candidate: e.target.value }))}
                  className="w-full px-3 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2">Candidate Email</label>
                <input
                  type="email"
                  value={formData.candidateEmail}
                  onChange={(e) => setFormData(prev => ({ ...prev, candidateEmail: e.target.value }))}
                  className="w-full px-3 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2">Date</label>
                <input
                  type="date"
                  value={formData.date}
                  onChange={(e) => setFormData(prev => ({ ...prev, date: e.target.value }))}
                  className="w-full px-3 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2">Time</label>
                <input
                  type="time"
                  value={formData.time}
                  onChange={(e) => setFormData(prev => ({ ...prev, time: e.target.value }))}
                  className="w-full px-3 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  required
                />
              </div>
            </div>
            
            <div className="mt-4">
              <label className="block text-sm font-medium mb-2">Description (Optional)</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                rows={3}
                className="w-full px-3 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="Additional notes about the interview..."
              />
            </div>
          </div>

          <div className="bg-secondary/50 border border-border rounded-lg p-6">
            <h2 className="text-lg font-semibold mb-4">Platform Settings</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Interview Platform</label>
                <select
                  value={formData.platform}
                  onChange={(e) => setFormData(prev => ({ ...prev, platform: e.target.value }))}
                  className="w-full px-3 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value="platform">This Platform (Built-in Editor)</option>
                  <option value="zoom">Zoom</option>
                  <option value="meet">Google Meet</option>
                  <option value="teams">Microsoft Teams</option>
                  <option value="other">Other</option>
                </select>
              </div>
              
              {formData.platform !== 'platform' && (
                <div>
                  <label className="block text-sm font-medium mb-2">Platform Link</label>
                  <input
                    type="url"
                    value={formData.platformLink}
                    onChange={(e) => setFormData(prev => ({ ...prev, platformLink: e.target.value }))}
                    className="w-full px-3 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                    placeholder="https://..."
                    required={formData.platform !== 'platform'}
                  />
                </div>
              )}
            </div>
          </div>

          <div className="bg-secondary/50 border border-border rounded-lg p-6">
            <h2 className="text-lg font-semibold mb-4">Assessment Configuration</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Assessment Mode</label>
                <select
                  value={formData.assessmentMode}
                  onChange={(e) => setFormData(prev => ({ ...prev, assessmentMode: e.target.value }))}
                  className="w-full px-3 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value="interview">Interview Only</option>
                  <option value="assessment">Pre-Assessment Only</option>
                  <option value="both">Pre-Assessment + Interview</option>
                </select>
              </div>
              
              {(formData.assessmentMode === 'assessment' || formData.assessmentMode === 'both') && (
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Select Challenges ({formData.selectedChallenges.length} selected)
                  </label>
                  <div className="max-h-48 overflow-y-auto border border-border rounded-lg p-3 space-y-2">
                    {challenges.map((challenge) => (
                      <div key={challenge.id} className="flex items-center gap-3">
                        <input
                          type="checkbox"
                          id={challenge.id}
                          checked={formData.selectedChallenges.includes(challenge.id)}
                          onChange={() => toggleChallenge(challenge.id)}
                          className="w-4 h-4 text-primary bg-background border-border rounded focus:ring-primary"
                        />
                        <label htmlFor={challenge.id} className="flex-1 cursor-pointer">
                          <div className="font-medium">{challenge.title}</div>
                          <div className="text-sm text-foreground/60">
                            {challenge.difficulty} • {challenge.language}
                          </div>
                        </label>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="flex gap-3 justify-end">
            <button
              type="button"
              onClick={() => router.push('/dashboard')}
              className="px-6 py-3 bg-secondary border border-border text-foreground rounded-lg hover:bg-secondary/70 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary/80 transition disabled:opacity-50"
            >
              {saving ? 'Updating...' : 'Update Interview'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}