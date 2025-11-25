"use client"

import { useSearchParams } from "next/navigation"
import { useState, useEffect, Suspense } from "react"
import Link from "next/link"
import { Code2, Calendar, User } from "lucide-react"
import SignupForm from "@/components/auth/signup-form"

function SignupPageContent() {
  const searchParams = useSearchParams()
  const [invitationInfo, setInvitationInfo] = useState<any>(null)

  useEffect(() => {
    const invitationParam = searchParams.get('invitation')
    if (invitationParam) {
      try {
        const decoded = JSON.parse(decodeURIComponent(invitationParam))
        setInvitationInfo(decoded)
      } catch (error) {
        console.error('Error parsing invitation:', error)
      }
    }
  }, [searchParams])
  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-secondary flex flex-col">
      <div className="p-4">
        <Link href="/" className="flex items-center gap-2 text-primary hover:text-accent transition">
          <Code2 className="w-5 h-5" />
          <span className="font-semibold">CodePair</span>
        </Link>
      </div>

      <div className="flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          {invitationInfo && (
            <div className="bg-primary/10 border border-primary/30 rounded-lg p-4 mb-4">
              <div className="flex items-center gap-2 mb-2">
                <Calendar className="w-4 h-4 text-primary" />
                <span className="font-semibold text-primary">Interview Invitation</span>
              </div>
              <p className="text-sm text-foreground/80 mb-1">
                You've been invited to: <strong>{invitationInfo.interviewTitle}</strong>
              </p>
              <p className="text-xs text-foreground/60">
                Create your account to join the interview
              </p>
            </div>
          )}
          
          <div className="bg-secondary/50 backdrop-blur-sm border border-border rounded-lg p-8">
            <h1 className="text-2xl font-bold mb-2">
              {invitationInfo ? 'Join to Attend Interview' : 'Join CodePair'}
            </h1>
            <p className="text-foreground/60 mb-6">
              {invitationInfo 
                ? 'Create your account to access the interview environment'
                : 'Create your account to start interviewing'
              }
            </p>

            <SignupForm invitationInfo={invitationInfo} />

            <p className="mt-6 text-center text-foreground/60">
              Already have an account?{" "}
              <Link 
                href={invitationInfo ? `/login?invitation=${encodeURIComponent(JSON.stringify(invitationInfo))}` : "/login"} 
                className="text-primary hover:text-accent transition font-semibold"
              >
                Sign in
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function SignupPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <SignupPageContent />
    </Suspense>
  )
}
