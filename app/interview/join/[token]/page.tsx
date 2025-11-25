"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { Calendar, Clock, Video, User, CheckCircle } from "lucide-react"

interface InvitationDetails {
  interviewId: string
  interviewTitle: string
  interviewDate: string
  interviewTime: string
  platform: string
  platformLink?: string
  interviewerName: string
  candidateEmail: string
}

export default function JoinInterviewPage() {
  const params = useParams()
  const router = useRouter()
  const [invitation, setInvitation] = useState<InvitationDetails | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  useEffect(() => {
    const token = params.token as string
    
    if (!token) {
      setError("Invalid invitation link")
      setLoading(false)
      return
    }

    const validateInvitation = async () => {
      try {
        const response = await fetch(`/api/invitations/validate/${token}`)
        
        if (!response.ok) {
          throw new Error("Invalid or expired invitation")
        }
        
        const data = await response.json()
        
        if (data.invitation) {
          const invitationDetails: InvitationDetails = {
            interviewId: data.invitation.interviewId,
            interviewTitle: data.invitation.interviewDetails.interviewTitle,
            interviewDate: data.invitation.interviewDetails.interviewDate,
            interviewTime: data.invitation.interviewDetails.interviewTime,
            platform: data.invitation.interviewDetails.platform,
            platformLink: data.invitation.interviewDetails.platformLink,
            interviewerName: data.invitation.interviewDetails.interviewerName,
            candidateEmail: data.invitation.candidateEmail
          }
          
          setInvitation(invitationDetails)
        } else {
          throw new Error("Invitation data not found")
        }
      } catch (err) {
        console.error('Invitation validation error:', err)
        setError(err instanceof Error ? err.message : "Invalid or expired invitation link")
      } finally {
        setLoading(false)
      }
    }

    validateInvitation()
  }, [params.token])

  const joinInterview = () => {
    if (invitation) {
      const currentSession = localStorage.getItem('currentSession')
      const token = currentSession ? localStorage.getItem(`token_${currentSession}`) : null
      const userStr = currentSession ? localStorage.getItem(`user_${currentSession}`) : null
      
      if (!token || !userStr) {
        const invitationInfo = encodeURIComponent(JSON.stringify({
          token: params.token,
          email: invitation.candidateEmail,
          interviewTitle: invitation.interviewTitle,
          interviewId: invitation.interviewId
        }))
        router.push(`/signup?invitation=${invitationInfo}`)
        return
      }
      
      router.push(`/interview/${invitation.interviewId}`)
    }
  }

  const openPlatformLink = () => {
    if (invitation?.platformLink) {
      window.open(invitation.platformLink, '_blank')
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-foreground/60">Loading invitation...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center max-w-md">
          <div className="w-16 h-16 mx-auto mb-4 bg-red-500/20 rounded-full flex items-center justify-center">
            <span className="text-red-400 text-2xl">⚠️</span>
          </div>
          <h1 className="text-xl font-semibold mb-2 text-red-400">Invalid Invitation</h1>
          <p className="text-foreground/60 mb-6">{error}</p>
          <button
            onClick={() => router.push('/login')}
            className="px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary-dark transition"
          >
            Go to Login
          </button>
        </div>
      </div>
    )
  }

  if (!invitation) return null

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-secondary flex items-center justify-center p-4">
      <div className="max-w-2xl w-full">
        <div className="bg-secondary/50 backdrop-blur-sm border border-border rounded-lg p-8 text-center">
          <div className="w-20 h-20 mx-auto mb-6 bg-primary/20 rounded-full flex items-center justify-center">
            <CheckCircle className="w-10 h-10 text-primary" />
          </div>
          
          <h1 className="text-3xl font-bold mb-2">You're Invited!</h1>
          <p className="text-foreground/60 mb-8">You've been invited to participate in a coding interview</p>

          <div className="bg-background/50 rounded-lg p-6 mb-8 text-left">
            <h2 className="text-xl font-semibold mb-4">{invitation.interviewTitle}</h2>
            
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <Calendar className="w-5 h-5 text-primary" />
                <span>{invitation.interviewDate}</span>
              </div>
              
              <div className="flex items-center gap-3">
                <Clock className="w-5 h-5 text-primary" />
                <span>{invitation.interviewTime}</span>
              </div>
              
              <div className="flex items-center gap-3">
                <Video className="w-5 h-5 text-primary" />
                <div className="flex items-center gap-2">
                  <span>{invitation.platform}</span>
                  {invitation.platformLink && (
                    <button
                      onClick={openPlatformLink}
                      className="text-primary hover:text-accent transition text-sm underline"
                    >
                      Open Link
                    </button>
                  )}
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                <User className="w-5 h-5 text-primary" />
                <span>Interviewer: {invitation.interviewerName}</span>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <button
              onClick={joinInterview}
              className="w-full px-6 py-4 bg-primary text-white rounded-lg hover:bg-primary-dark transition font-semibold text-lg"
            >
              Join Coding Environment
            </button>
            
            {invitation.platformLink && (
              <button
                onClick={openPlatformLink}
                className="w-full px-6 py-3 border border-border rounded-lg hover:bg-secondary transition"
              >
                Open {invitation.platform} Meeting
              </button>
            )}
            
            <div className="text-sm text-foreground/60">
              <p className="mb-2">What to expect:</p>
              <ul className="text-left space-y-1">
                <li>• You'll join a collaborative coding environment</li>
                <li>• Your interviewer will provide questions and guidance</li>
                <li>• You can write and run code in real-time</li>
                <li>• Use the {invitation.platform} link for video communication</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}